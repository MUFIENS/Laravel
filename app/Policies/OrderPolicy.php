<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Determine whether the user can view any orders.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific order.
     * Enforces strict customer privacy against IDOR.
     */
    public function view(User $user, Order $order): bool
    {
        if ($user->isCooperative()) {
            return true;
        }

        return $user->id === $order->user_id;
    }

    /**
     * Determine whether the user can create orders.
     */
    public function create(User $user): bool
    {
        return $user->isStudent();
    }

    /**
     * Determine whether the user can cancel the order.
     */
    public function cancel(User $user, Order $order): bool
    {
        if ($order->isFinal()) {
            return false;
        }

        if ($user->isCooperative()) {
            return true;
        }

        return $user->id === $order->user_id && $order->order_status->value === 'pending_payment';
    }

    /**
     * Determine whether the user can access cooperative pickup verification.
     */
    public function verifyPickup(User $user): bool
    {
        return $user->isCooperative();
    }

    /**
     * Determine whether the user can complete pickup for the specific order.
     */
    public function completePickup(User $user, Order $order): bool
    {
        return $user->isCooperative() && $order->canBePickedUp();
    }
}
