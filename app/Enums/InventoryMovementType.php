<?php

namespace App\Enums;

enum InventoryMovementType: string
{
    case Restock = 'restock';
    case Sale = 'sale';
    case Restore = 'restore';
    case Adjustment = 'adjustment';

    public function label(): string
    {
        return match ($this) {
            self::Restock => 'Restock',
            self::Sale => 'Penjualan',
            self::Restore => 'Pengembalian Pesanan',
            self::Adjustment => 'Penyesuaian Manual',
        };
    }
}
