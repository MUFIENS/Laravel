<?php

namespace App\Http\Controllers\Cooperative;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PickupLog;
use App\Models\PickupSession;
use App\Services\PickupCredentialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PickupVerificationController extends Controller
{
    /**
     * Display the cooperative mobile-first pickup verification & scanner console.
     */
    public function index(Request $request): Response
    {
        $activeSessions = PickupSession::query()
            ->active()
            ->orderBy('pickup_date')
            ->orderBy('starts_at')
            ->get(['id', 'name', 'pickup_date', 'starts_at', 'ends_at', 'queue_prefix'])
            ->map(function (PickupSession $session) {
                return [
                    'id' => $session->id,
                    'name' => $session->name,
                    'pickup_date' => $session->pickup_date->toDateString(),
                    'starts_at' => substr($session->starts_at, 0, 5),
                    'ends_at' => substr($session->ends_at, 0, 5),
                    'queue_prefix' => $session->queue_prefix,
                ];
            });

        // Summary of recent pickups today for operator context
        $recentPickups = PickupLog::query()
            ->with(['order:id,order_number,queue_code,queue_number,total,user_id', 'order.user:id,name', 'verifiedBy:id,name'])
            ->whereDate('verified_at', now()->toDateString())
            ->latest('verified_at')
            ->limit(8)
            ->get()
            ->map(function (PickupLog $log) {
                return [
                    'id' => $log->id,
                    'order_id' => $log->order_id,
                    'order_number' => $log->order?->order_number,
                    'queue_code' => $log->order?->queue_code,
                    'student_name' => $log->order?->user?->name,
                    'total' => $log->order?->total,
                    'method' => $log->method,
                    'verified_at' => $log->verified_at->translatedFormat('H:i \W\I\B'),
                    'verified_by_name' => $log->verifiedBy?->name,
                ];
            });

        return Inertia::render('cooperative/pickup/index', [
            'active_sessions' => $activeSessions,
            'recent_pickups' => $recentPickups,
        ]);
    }

    /**
     * Look up and verify an order via scanned QR payload or manual credential input.
     */
    public function verify(Request $request, PickupCredentialService $credentialService): JsonResponse
    {
        $validated = $request->validate([
            'credential' => ['required', 'string', 'max:500'],
            'order_number' => ['nullable', 'string', 'max:64'],
        ]);

        $rawInput = (string) $validated['credential'];
        $parsed = $credentialService->parseScannedInput($rawInput);

        if (isset($parsed['error'])) {
            return response()->json([
                'message' => $parsed['message'] ?? 'Kredensial pengambilan tidak valid.',
                'error_type' => $parsed['error'],
            ], 422);
        }

        $orderNumber = $validated['order_number'] ?? $parsed['order_number'];
        $candidateCredential = $parsed['credential'];

        if (empty($candidateCredential)) {
            return response()->json([
                'message' => 'Kredensial pengambilan tidak boleh kosong.',
            ], 422);
        }

        $candidateHash = $credentialService->hashCredential($candidateCredential);

        // Lookup order by hash or by explicit order number + credential verification
        $query = Order::query()
            ->with(['user:id,name', 'pickupSession', 'items'])
            ->where('pickup_token_hash', $candidateHash);

        if (! empty($orderNumber)) {
            $query->where('order_number', trim($orderNumber));
        }

        /** @var Order|null $order */
        $order = $query->first();

        // If not found by direct hash, fallback lookup by order number and verify
        if (! $order && ! empty($orderNumber)) {
            /** @var Order|null $fallbackOrder */
            $fallbackOrder = Order::with(['user:id,name', 'pickupSession', 'items'])
                ->where('order_number', trim($orderNumber))
                ->first();

            if ($fallbackOrder && $credentialService->verify($fallbackOrder, $candidateCredential)) {
                $order = $fallbackOrder;
            }
        }

        if (! $order) {
            return response()->json([
                'message' => 'Kredensial pengambilan tidak valid atau pesanan tidak ditemukan.',
            ], 404);
        }

        // 1. Verify Payment Status
        if ($order->payment_status !== PaymentStatus::Paid) {
            return response()->json([
                'message' => 'Pesanan belum dibayar atau pembayaran belum terverifikasi.',
                'order_number' => $order->order_number,
                'status' => $order->order_status->value,
            ], 422);
        }

        // 2. Double Pickup Protection: Check if already completed or has pickup log
        if ($order->isCompleted() || $order->pickupLog()->exists()) {
            return response()->json([
                'message' => 'Pesanan ini sudah diambil sebelumnya.',
                'already_picked_up' => true,
                'order_number' => $order->order_number,
                'queue_code' => $order->queue_code,
                'completed_at' => $order->completed_at?->translatedFormat('d M Y, H:i \W\I\B'),
            ], 422);
        }

        // 3. Verify Order Status is ReadyForPickup
        if ($order->order_status !== OrderStatus::ReadyForPickup) {
            return response()->json([
                'message' => "Pesanan belum siap untuk diambil (status saat ini: {$order->order_status->label()}).",
                'order_number' => $order->order_number,
                'status' => $order->order_status->value,
            ], 422);
        }

        // Return verified operational data (privacy-safe: only student display name, no emails or sensitive data)
        return response()->json([
            'status' => 'verified',
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'queue_code' => $order->queue_code,
                'queue_number' => $order->queue_number,
                'student_name' => $order->user->name,
                'subtotal' => $order->subtotal,
                'total' => $order->total,
                'order_status' => $order->order_status->value,
                'order_status_label' => $order->order_status->label(),
                'payment_status' => $order->payment_status->value,
                'payment_status_label' => $order->payment_status->label(),
                'pickup_session' => $order->pickupSession ? [
                    'name' => $order->pickupSession->name,
                    'pickup_date' => $order->pickupSession->pickup_date->translatedFormat('d M Y'),
                    'formatted_time' => sprintf(
                        '%s - %s WIB',
                        substr($order->pickupSession->starts_at, 0, 5),
                        substr($order->pickupSession->ends_at, 0, 5)
                    ),
                ] : null,
                'items' => $order->items->map(function (OrderItem $item) {
                    return [
                        'id' => $item->id,
                        'product_name' => $item->product_name,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'subtotal' => $item->subtotal,
                    ];
                }),
            ],
            'credential_token' => $candidateCredential,
        ]);
    }

    /**
     * Atomically confirm and complete physical order pickup.
     */
    public function complete(Request $request, PickupCredentialService $credentialService): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer'],
            'credential' => ['required', 'string', 'max:500'],
            'method' => ['nullable', 'string', 'in:qr,manual'],
        ]);

        $orderId = (int) $validated['order_id'];
        $rawCredential = (string) $validated['credential'];
        $method = $validated['method'] ?? 'qr';

        return DB::transaction(function () use ($orderId, $rawCredential, $method, $credentialService) {
            /** @var Order|null $order */
            $order = Order::where('id', $orderId)->lockForUpdate()->first();

            if (! $order) {
                return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
            }

            // 1. Authoritative verification of pickup credential
            if (! $credentialService->verify($order, $rawCredential)) {
                Log::warning('Unauthorized pickup attempt: invalid credential', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ]);

                return response()->json(['message' => 'Kredensial pengambilan tidak valid.'], 422);
            }

            // 2. Strict status check
            if ($order->payment_status !== PaymentStatus::Paid) {
                return response()->json(['message' => 'Pesanan belum dibayar.'], 422);
            }

            // 3. Double pickup protection
            if ($order->isCompleted() || PickupLog::where('order_id', $order->id)->exists()) {
                return response()->json([
                    'message' => 'Pesanan ini sudah diambil.',
                    'already_picked_up' => true,
                ], 422);
            }

            if ($order->order_status !== OrderStatus::ReadyForPickup) {
                return response()->json([
                    'message' => "Pesanan belum siap untuk diambil (status saat ini: {$order->order_status->label()}).",
                ], 422);
            }

            $now = now();

            // 4. Create immutable PickupLog record (database UNIQUE(order_id) constraint guarantees no duplicates)
            $log = PickupLog::create([
                'order_id' => $order->id,
                'verified_by' => auth()->id(),
                'verified_at' => $now,
                'method' => $method,
                'metadata' => [
                    'operator_name' => auth()->user()?->name,
                    'completed_at' => $now->toIso8601String(),
                ],
            ]);

            // 5. Final order completion state transition
            $order->update([
                'order_status' => OrderStatus::Completed,
                'completed_at' => $now,
            ]);

            Log::info('Order successfully picked up and completed', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'pickup_log_id' => $log->id,
                'operator_id' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Pengambilan pesanan #{$order->order_number} berhasil diselesaikan.",
                'order_number' => $order->order_number,
                'queue_code' => $order->queue_code,
                'completed_at' => $now->translatedFormat('d M Y, H:i \W\I\B'),
            ]);
        });
    }
}
