<?php

namespace App\Enums;

enum ProductStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Inactive = 'inactive';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Active => 'Aktif',
            self::Inactive => 'Tidak Aktif',
            self::Archived => 'Diarsipkan',
        };
    }

    public function isPurchasable(): bool
    {
        return $this === self::Active;
    }
}
