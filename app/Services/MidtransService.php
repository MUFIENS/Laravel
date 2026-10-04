<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MidtransService
{
    protected string $serverKey;

    protected string $clientKey;

    protected bool $isProduction;

    protected string $snapUrl;

    protected string $snapJsUrl;

    public function __construct()
    {
        $this->serverKey = (string) config('services.midtrans.server_key', '');
        $this->clientKey = (string) config('services.midtrans.client_key', '');
        $this->isProduction = (bool) config('services.midtrans.is_production', false);
        $this->snapUrl = (string) config(
            'services.midtrans.snap_url',
            'https://app.sandbox.midtrans.com/snap/v1/transactions'
        );
        $this->snapJsUrl = (string) config(
            'services.midtrans.snap_js_url',
            'https://app.sandbox.midtrans.com/snap/snap.js'
        );

        $this->guardSandboxEnvironment();
    }

    /**
     * Enforce strict Sandbox-only isolation for KOPDIG school project.
     *
     * @throws RuntimeException
     */
    protected function guardSandboxEnvironment(): void
    {
        if ($this->isProduction) {
            throw new RuntimeException(
                'Midtrans Production mode is strictly prohibited in KOPDIG demo environment. Only Sandbox is supported.'
            );
        }

        if (empty($this->serverKey)) {
            throw new RuntimeException(
                'Midtrans Sandbox Server Key is not configured. Please set MIDTRANS_SERVER_KEY in your environment.'
            );
        }
    }

    /**
     * Request a Snap payment token and redirect URL for an eligible order.
     *
     * @return array{token: string, redirect_url: string, client_key: string, snap_js_url: string}
     *
     * @throws RuntimeException
     */
    public function createSnapTransaction(Order $order, string $providerOrderId): array
    {
        $this->guardSandboxEnvironment();

        $items = $order->items->map(function ($item) {
            return [
                'id' => (string) ($item->product_id ?? $item->id),
                'price' => (int) $item->unit_price,
                'quantity' => (int) $item->quantity,
                'name' => mb_strimwidth($item->product_name, 0, 50, ''),
            ];
        })->values()->toArray();

        $payload = [
            'transaction_details' => [
                'order_id' => $providerOrderId,
                'gross_amount' => (int) $order->total,
            ],
            'item_details' => $items,
            'customer_details' => [
                'first_name' => $order->user->name,
                'email' => $order->user->email,
            ],
        ];

        try {
            $response = Http::withBasicAuth($this->serverKey, '')
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->timeout(15)
                ->post($this->snapUrl, $payload);
        } catch (\Throwable $e) {
            Log::error('Failed to communicate with Midtrans Sandbox API', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            throw new RuntimeException('Tidak dapat menghubungi layanan pembayaran Midtrans Sandbox. Silakan coba lagi.');
        }

        if (! $response->successful()) {
            Log::error('Midtrans Sandbox API returned error', [
                'order_id' => $order->id,
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            $message = $response->json('error_messages.0') ?? 'Terjadi kesalahan saat memproses token pembayaran Midtrans.';

            throw new RuntimeException($message);
        }

        $token = (string) $response->json('token');
        $redirectUrl = (string) $response->json('redirect_url');

        if (empty($token)) {
            throw new RuntimeException('Midtrans Snap tidak mengembalikan token pembayaran yang valid.');
        }

        return [
            'token' => $token,
            'redirect_url' => $redirectUrl,
            'client_key' => $this->clientKey,
            'snap_js_url' => $this->snapJsUrl,
        ];
    }

    /**
     * Verify official Midtrans notification signature algorithm:
     * SHA512(order_id + status_code + gross_amount + ServerKey)
     */
    public function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool
    {
        $input = $orderId.$statusCode.$grossAmount.$this->serverKey;
        $expectedSignature = hash('sha512', $input);

        return hash_equals($expectedSignature, $signatureKey);
    }

    public function getClientKey(): string
    {
        return $this->clientKey;
    }

    public function getSnapJsUrl(): string
    {
        return $this->snapJsUrl;
    }

    public function isProduction(): bool
    {
        return false;
    }
}
