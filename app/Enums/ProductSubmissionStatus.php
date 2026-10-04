<?php

namespace App\Enums;

enum ProductSubmissionStatus: string
{
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Diajukan',
            self::UnderReview => 'Sedang Ditinjau',
            self::Approved => 'Disetujui',
            self::Rejected => 'Ditolak',
        };
    }
}
