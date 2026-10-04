<?php

namespace App\Enums;

enum UserRole: string
{
    case Student = 'student';
    case Cooperative = 'cooperative';

    public function label(): string
    {
        return match ($this) {
            self::Student => 'Siswa',
            self::Cooperative => 'Koperasi',
        };
    }
}
