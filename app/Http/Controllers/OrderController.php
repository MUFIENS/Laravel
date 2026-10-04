<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\PickupCredentialService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the student's orders.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $orders = Order::query()
            ->where('user_id', $user->id)
            ->with(['pickupSession', 'items'])
            ->latest()
            ->paginate(10)
            ->through(function (Order $order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'subtotal' => $order->subtotal,
                    'total' => $order->total,
                    'order_status' => $order->order_status->value,
                    'order_status_label' => $order->order_status->label(),
                    'payment_status' => $order->payment_status->value,
                    'payment_status_label' => $order->payment_status->label(),
                    'created_at' => $order->created_at?->toIso8601String(),
                    'formatted_created_at' => $order->created_at?->translatedFormat('d M Y, H:i'),
                    'items_count' => $order->items->count(),
                    'total_quantity' => $order->items->sum('quantity'),
                    'pickup_session' => $order->pickupSession ? [
                        'id' => $order->pickupSession->id,
                        'name' => $order->pickupSession->name,
                        'pickup_date' => $order->pickupSession->pickup_date->toDateString(),
                        'starts_at' => substr($order->pickupSession->starts_at, 0, 5),
                        'ends_at' => substr($order->pickupSession->ends_at, 0, 5),
                        'formatted_time' => sprintf('%s - %s WIB', substr($order->pickupSession->starts_at, 0, 5), substr($order->pickupSession->ends_at, 0, 5)),
                        'formatted_date' => $order->pickupSession->pickup_date->translatedFormat('l, d F Y'),
                    ] : null,
                ];
            });

        return Inertia::render('orders/index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Display the specified order confirmation / details.
     */
    public function show(Order $order, PickupCredentialService $credentialService): Response
    {
        $this->authorize('view', $order);

        $order->load([
            'pickupSession',
            'pickupLog',
            'items' => function ($query) {
                $query->orderBy('id', 'asc');
            },
            'items.product:id,name,slug,image_path',
        ]);

        $pickupCredential = null;
        $qrPayload = null;

        // Only generate pickup credential and QR payload if order is ready for pickup or completed
        if ($order->isReadyForPickup() || $order->isCompleted()) {
            $pickupCredential = $credentialService->generateRawCredential($order);
            $qrPayload = $credentialService->buildQrPayload($order, $pickupCredential);
        }

        return Inertia::render('orders/show', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'queue_number' => $order->queue_number,
                'queue_code' => $order->queue_code,
                'pickup_credential' => $pickupCredential,
                'qr_payload' => $qrPayload,
                'subtotal' => $order->subtotal,
                'total' => $order->total,
                'order_status' => $order->order_status->value,
                'order_status_label' => $order->order_status->label(),
                'payment_status' => $order->payment_status->value,
                'payment_status_label' => $order->payment_status->label(),
                'paid_at' => $order->paid_at?->toIso8601String(),
                'ready_at' => $order->ready_at?->toIso8601String(),
                'completed_at' => $order->completed_at?->toIso8601String(),
                'created_at' => $order->created_at?->toIso8601String(),
                'formatted_created_at' => $order->created_at?->translatedFormat('d F Y, H:i \W\I\B'),
                'pickup_log' => $order->pickupLog ? [
                    'verified_at' => $order->pickupLog->verified_at->translatedFormat('d F Y, H:i \W\I\B'),
                    'method' => $order->pickupLog->method,
                ] : null,
                'pickup_session' => $order->pickupSession ? [
                    'id' => $order->pickupSession->id,
                    'name' => $order->pickupSession->name,
                    'pickup_date' => $order->pickupSession->pickup_date->toDateString(),
                    'starts_at' => substr($order->pickupSession->starts_at, 0, 5),
                    'ends_at' => substr($order->pickupSession->ends_at, 0, 5),
                    'queue_prefix' => $order->pickupSession->queue_prefix,
                    'status' => $order->pickupSession->status->value,
                    'status_label' => $order->pickupSession->status->label(),
                    'formatted_time' => sprintf('%s - %s WIB', substr($order->pickupSession->starts_at, 0, 5), substr($order->pickupSession->ends_at, 0, 5)),
                    'formatted_date' => $order->pickupSession->pickup_date->translatedFormat('l, d F Y'),
                ] : null,
                'items' => $order->items->map(function (OrderItem $item) {
                    return [
                        'id' => $item->id,
                        'order_id' => $item->order_id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product_name,
                        'unit_price' => $item->unit_price,
                        'quantity' => $item->quantity,
                        'subtotal' => $item->subtotal,
                        'product' => $item->product ? [
                            'id' => $item->product->id,
                            'name' => $item->product->name,
                            'slug' => $item->product->slug,
                            'image_path' => $item->product->image_path,
                        ] : null,
                    ];
                }),
            ],
            'midtrans_client_key' => (string) config('services.midtrans.client_key', ''),
            'snap_js_url' => (string) config('services.midtrans.snap_js_url', 'https://app.sandbox.midtrans.com/snap/snap.js'),
        ]);
    }
}
