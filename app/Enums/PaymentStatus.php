<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu Pembayaran',
            self::Paid => 'Lunas',
            self::Failed => 'Gagal',
            self::Cancelled => 'Dibatalkan',
            self::Expired => 'Kedaluwarsa',
        };
    }

    public function isSuccessful(): bool
    {
        return $this === self::Paid;
    }
}
