<?php

namespace App\Policies;

use App\Enums\ProductSubmissionStatus;
use App\Models\ProductSubmission;
use App\Models\User;

class ProductSubmissionPolicy
{
    /**
     * Determine whether the user can view any submissions.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific submission.
     */
    public function view(User $user, ProductSubmission $submission): bool
    {
        if ($user->isCooperative()) {
            return true;
        }

        return $user->id === $submission->student_id;
    }

    /**
     * Determine whether the user can create a product submission.
     */
    public function create(User $user): bool
    {
        return $user->isStudent();
    }

    /**
     * Determine whether the user can update the submission.
     * Enforces Role + Ownership + Resource State.
     */
    public function update(User $user, ProductSubmission $submission): bool
    {
        // Only student owner may edit, and only while status is still 'submitted' (unlocked)
        return $user->id === $submission->student_id
            && $submission->status === ProductSubmissionStatus::Submitted;
    }

    /**
     * Determine whether the user can delete the submission.
     */
    public function delete(User $user, ProductSubmission $submission): bool
    {
        return $user->id === $submission->student_id
            && $submission->status === ProductSubmissionStatus::Submitted;
    }

    /**
     * Determine whether the user can review the submission.
     */
    public function review(User $user, ProductSubmission $submission): bool
    {
        return $user->isCooperative();
    }

    /**
     * Determine whether the user can approve the submission.
     */
    public function approve(User $user, ProductSubmission $submission): bool
    {
        return $user->isCooperative()
            && ! in_array($submission->status, [ProductSubmissionStatus::Approved, ProductSubmissionStatus::Rejected], true);
    }

    /**
     * Determine whether the user can reject the submission.
     */
    public function reject(User $user, ProductSubmission $submission): bool
    {
        return $user->isCooperative()
            && ! in_array($submission->status, [ProductSubmissionStatus::Approved, ProductSubmissionStatus::Rejected], true);
    }
}
