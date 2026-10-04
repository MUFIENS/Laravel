<?php

namespace App\Enums;

enum ProductSourceType: string
{
    case Cooperative = 'cooperative';
    case Student = 'student';

    public function label(): string
    {
        return match ($this) {
            self::Cooperative => 'Koperasi',
            self::Student => 'Titipan Siswa',
        };
    }
}
