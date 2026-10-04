<?php

namespace App\Services;

use App\Models\Order;
use JsonException;

class PickupCredentialService
{
    /**
     * Generate the unguessable raw pickup credential for an order.
     * Uses HMAC-SHA256 with the application secret key so that:
     * 1. It cannot be derived without app.key.
     * 2. It does not depend on sequential numbers alone.
     * 3. It can be safely deterministically reconstructed for an authenticated order owner.
     */
    public function generateRawCredential(Order $order): string
    {
        $payload = sprintf(
            'KOPDIG_PICKUP|ORDER_ID:%d|ORDER_NUM:%s|USER:%d|PAID_AT:%s',
            $order->id,
            $order->order_number,
            $order->user_id,
            $order->paid_at?->toISOString() ?? $order->created_at?->toISOString() ?? 'PENDING'
        );

        $hmac = hash_hmac('sha256', $payload, (string) config('app.key'));

        // 16-character alphanumeric uppercase token formatted in 4-character chunks: "7F9B-2E4A-8C1D-5F03"
        $raw = strtoupper(substr($hmac, 0, 16));

        return sprintf('%s-%s-%s-%s', substr($raw, 0, 4), substr($raw, 4, 4), substr($raw, 8, 4), substr($raw, 12, 4));
    }

    /**
     * Compute the SHA-256 hash of a raw credential to store in orders.pickup_token_hash.
     */
    public function hashCredential(string $rawCredential): string
    {
        $normalized = $this->normalizeCredential($rawCredential);

        return hash('sha256', $normalized);
    }

    /**
     * Normalize credential by stripping whitespace and dashes, converted to uppercase.
     */
    public function normalizeCredential(string $credential): string
    {
        return strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', trim($credential)));
    }

    /**
     * Verify whether a candidate raw credential matches the order's stored pickup_token_hash.
     */
    public function verify(Order $order, string $candidateCredential): bool
    {
        if (empty($order->pickup_token_hash)) {
            return false;
        }

        $candidateHash = $this->hashCredential($candidateCredential);

        return hash_equals($order->pickup_token_hash, $candidateHash);
    }

    /**
     * Build the minimal, safe QR payload for student presentation.
     * Encodes only the order number and pickup credential.
     */
    public function buildQrPayload(Order $order, string $rawCredential): string
    {
        try {
            return json_encode([
                'order_number' => $order->order_number,
                'credential' => $rawCredential,
            ], JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return sprintf('{"order_number":"%s","credential":"%s"}', $order->order_number, $rawCredential);
        }
    }

    /**
     * Parse scanned input from the cooperative interface.
     * Handles both raw token string and JSON QR payload.
     *
     * @return array{order_number: string|null, credential: string}
     */
    public function parseScannedInput(string $input): array
    {
        $input = trim($input);

        // Attempt JSON decode
        if (str_starts_with($input, '{') && str_ends_with($input, '}')) {
            try {
                $decoded = json_decode($input, true, 512, JSON_THROW_ON_ERROR);
                if (is_array($decoded) && ! empty($decoded['credential'])) {
                    return [
                        'order_number' => isset($decoded['order_number']) ? (string) $decoded['order_number'] : null,
                        'credential' => (string) $decoded['credential'],
                    ];
                }
            } catch (JsonException) {
                // Fall back to treating as raw string
            }
        }

        return [
            'order_number' => null,
            'credential' => $input,
        ];
    }
}
