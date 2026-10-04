<?php

namespace App\Policies;

use App\Models\Cart;
use App\Models\User;

class CartPolicy
{
    /**
     * Determine whether the user can view the cart.
     * Enforces that students can only view their own cart.
     */
    public function view(User $user, Cart $cart): bool
    {
        return $user->isStudent() && $user->id === $cart->user_id;
    }

    /**
     * Determine whether the user can update the cart.
     */
    public function update(User $user, Cart $cart): bool
    {
        return $user->isStudent() && $user->id === $cart->user_id;
    }

    /**
     * Determine whether the user can clear or delete the cart.
     */
    public function delete(User $user, Cart $cart): bool
    {
        return $user->isStudent() && $user->id === $cart->user_id;
    }
}
