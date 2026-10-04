<?php

namespace App\Enums;

enum PickupSessionStatus: string
{
    case Scheduled = 'scheduled';
    case Active = 'active';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Terjadwal',
            self::Active => 'Aktif',
            self::Closed => 'Ditutup',
        };
    }

    public function isOpen(): bool
    {
        return $this === self::Active;
    }
}
