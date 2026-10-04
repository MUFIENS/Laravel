<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use JsonException;

class CashPaymentService
{
    /**
     * Generate an unguessable raw cash payment verification token for an order.
     * Uses HMAC-SHA256 with the application secret key so that:
     * 1. It cannot be derived without app.key.
     * 2. It is bound to the order identity and timestamp.
     * 3. It can be safely deterministically reconstructed for an authenticated order owner.
     */
    public function generateRawToken(Order $order): string
    {
        $payload = sprintf(
            'KOPDIG_CASH_PAY|ORDER_ID:%d|ORDER_NUM:%s|USER:%d|CREATED_AT:%s',
            $order->id,
            $order->order_number,
            $order->user_id,
            $order->created_at?->toISOString() ?? 'PENDING'
        );

        $hmac = hash_hmac('sha256', $payload, (string) config('app.key'));

        // 16-character alphanumeric uppercase token formatted in 4-character chunks: "A1B2-C3D4-E5F6-7890"
        $raw = strtoupper(substr($hmac, 0, 16));

        return sprintf('%s-%s-%s-%s', substr($raw, 0, 4), substr($raw, 4, 4), substr($raw, 8, 4), substr($raw, 12, 4));
    }

    /**
     * Compute the SHA-256 hash of a raw token to store in payments.payment_token_hash.
     */
    public function hashToken(string $rawToken): string
    {
        $normalized = $this->normalizeToken($rawToken);

        return hash('sha256', $normalized);
    }

    /**
     * Normalize token by stripping whitespace and dashes, converted to uppercase.
     */
    public function normalizeToken(string $token): string
    {
        return strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', trim($token)));
    }

    /**
     * Verify whether a candidate raw token matches the payment's stored payment_token_hash.
     */
    public function verifyToken(Payment $payment, string $candidateToken): bool
    {
        if (empty($payment->payment_token_hash)) {
            return false;
        }

        $candidateHash = $this->hashToken($candidateToken);

        return hash_equals($payment->payment_token_hash, $candidateHash);
    }

    /**
     * Build the minimal, safe Cash Payment QR payload for student presentation.
     * Contains only version, order number, and one-time payment verification token.
     * Contains NO student private data, email, password, prices, or secrets.
     */
    public function buildPaymentQrPayload(Order $order, string $rawToken): string
    {
        try {
            return json_encode([
                'v' => 1,
                'o' => $order->order_number,
                't' => $rawToken,
            ], JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return sprintf('{"v":1,"o":"%s","t":"%s"}', $order->order_number, $rawToken);
        }
    }

    /**
     * Parse scanned input from the cooperative interface.
     * Handles both raw token string and JSON payment QR payload.
     * Rejects Pickup QR payloads with a distinct error message.
     *
     * @return array{version: int, order_number: string|null, token: string, error?: string, message?: string}
     */
    public function parsePaymentQrInput(string $input): array
    {
        $input = trim($input);

        // Attempt JSON decode
        if (str_starts_with($input, '{') || str_ends_with($input, '}')) {
            try {
                $decoded = json_decode($input, true, 512, JSON_THROW_ON_ERROR);
                if (is_array($decoded)) {
                    // Check if a Pickup QR was scanned instead of Payment QR
                    if (isset($decoded['credential'])) {
                        return [
                            'version' => 1,
                            'order_number' => isset($decoded['order_number']) ? (string) $decoded['order_number'] : null,
                            'token' => '',
                            'error' => 'pickup_qr_detected',
                            'message' => 'QR yang dipindai adalah QR Pengambilan Pesanan, bukan QR Pembayaran.',
                        ];
                    }

                    // Check for unsupported QR version
                    if (isset($decoded['v']) && (int) $decoded['v'] !== 1) {
                        return [
                            'version' => (int) $decoded['v'],
                            'order_number' => null,
                            'token' => '',
                            'error' => 'unsupported_version',
                            'message' => 'Versi QR pembayaran tidak didukung.',
                        ];
                    }

                    if (! empty($decoded['t'])) {
                        return [
                            'version' => isset($decoded['v']) ? (int) $decoded['v'] : 1,
                            'order_number' => isset($decoded['o']) ? (string) $decoded['o'] : null,
                            'token' => (string) $decoded['t'],
                        ];
                    }

                    return [
                        'version' => 1,
                        'order_number' => null,
                        'token' => '',
                        'error' => 'invalid_qr_structure',
                        'message' => 'Format QR pembayaran tidak dikenali.',
                    ];
                }
            } catch (JsonException) {
                return [
                    'version' => 1,
                    'order_number' => null,
                    'token' => '',
                    'error' => 'malformed_payload',
                    'message' => 'Format payload QR tidak valid atau rusak.',
                ];
            }
        }

        return [
            'version' => 1,
            'order_number' => null,
            'token' => $input,
        ];
    }
}
