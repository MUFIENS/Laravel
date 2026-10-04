<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /**
     * Determine whether the user can view any products.
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific product.
     */
    public function view(?User $user, Product $product): bool
    {
        if ($product->isAvailable()) {
            return true;
        }

        if (! $user) {
            return false;
        }

        if ($user->isCooperative()) {
            return true;
        }

        // Student can view their own consigned product even if inactive/out of stock
        return $user->id === $product->owner_id;
    }

    /**
     * Determine whether the user can create products directly in catalog.
     */
    public function create(User $user): bool
    {
        return $user->isCooperative();
    }

    /**
     * Determine whether the user can update the product.
     */
    public function update(User $user, Product $product): bool
    {
        return $user->isCooperative();
    }

    /**
     * Determine whether the user can delete the product.
     */
    public function delete(User $user, Product $product): bool
    {
        return $user->isCooperative();
    }

    /**
     * Determine whether the user can manage inventory and record stock movements.
     */
    public function manageInventory(User $user, Product $product): bool
    {
        return $user->isCooperative();
    }
}
