<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PendingPayment = 'pending_payment';
    case PaymentFailed = 'payment_failed';
    case Paid = 'paid';
    case Processing = 'processing';
    case ReadyForPickup = 'ready_for_pickup';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PendingPayment => 'Menunggu Pembayaran',
            self::PaymentFailed => 'Pembayaran Gagal',
            self::Paid => 'Sudah Dibayar',
            self::Processing => 'Sedang Disiapkan',
            self::ReadyForPickup => 'Siap Diambil',
            self::Completed => 'Selesai',
            self::Cancelled => 'Dibatalkan',
        };
    }

    public function canBePickedUp(): bool
    {
        return $this === self::ReadyForPickup;
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::Completed, self::Cancelled], true);
    }
}
