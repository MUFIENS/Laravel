<?php

namespace App\Policies;

use App\Models\CartItem;
use App\Models\User;

class CartItemPolicy
{
    /**
     * Determine whether the user can update the cart item.
     * Enforces role, cart existence, and ownership to prevent IDOR attacks.
     */
    public function update(User $user, CartItem $cartItem): bool
    {
        return $user->isStudent()
            && $cartItem->cart !== null
            && $cartItem->cart->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the cart item.
     * Enforces role, cart existence, and ownership to prevent IDOR attacks.
     */
    public function delete(User $user, CartItem $cartItem): bool
    {
        return $user->isStudent()
            && $cartItem->cart !== null
            && $cartItem->cart->user_id === $user->id;
    }
}
