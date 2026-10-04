<?php

namespace App\Models;

use App\Enums\ProductSubmissionStatus;
use Database\Factories\ProductSubmissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_id
 * @property int|null $product_id
 * @property int $category_id
 * @property string $name
 * @property string $description
 * @property string $image_path
 * @property int $base_price
 * @property int $proposed_stock
 * @property int|null $cooperative_margin
 * @property int|null $proposed_selling_price
 * @property ProductSubmissionStatus $status
 * @property string|null $rejection_reason
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'student_id',
    'product_id',
    'category_id',
    'name',
    'description',
    'image_path',
    'base_price',
    'proposed_stock',
    'cooperative_margin',
    'proposed_selling_price',
    'status',
    'rejection_reason',
    'reviewed_by',
    'reviewed_at',
])]
class ProductSubmission extends Model
{
    /** @use HasFactory<ProductSubmissionFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ProductSubmissionStatus::class,
            'base_price' => 'integer',
            'proposed_stock' => 'integer',
            'cooperative_margin' => 'integer',
            'proposed_selling_price' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function isApproved(): bool
    {
        return $this->status === ProductSubmissionStatus::Approved;
    }

    public function isRejected(): bool
    {
        return $this->status === ProductSubmissionStatus::Rejected;
    }

    public function isPending(): bool
    {
        return in_array($this->status, [ProductSubmissionStatus::Submitted, ProductSubmissionStatus::UnderReview], true);
    }

    /**
     * Scope a query to only include pending submissions awaiting review.
     *
     * @param  Builder<self>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query->whereIn('status', [ProductSubmissionStatus::Submitted, ProductSubmissionStatus::UnderReview]);
    }

    /**
     * Scope a query to only include approved submissions.
     *
     * @param  Builder<self>  $query
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where('status', ProductSubmissionStatus::Approved);
    }

    /**
     * Student who created this submission.
     *
     * @return BelongsTo<User, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Associated public product once approved.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Category for this submission.
     *
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Cooperative user who reviewed this submission.
     *
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
