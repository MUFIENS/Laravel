<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ProductSubmissionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Order;
use App\Models\ProductSubmission;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's personal account hub / profile page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $recentOrders = $user->orders()
            ->with(['items', 'pickupSession'])
            ->latest()
            ->take(3)
            ->get()
            ->map(function (Order $order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'queue_code' => $order->queue_code,
                    'subtotal' => $order->subtotal,
                    'total' => $order->total,
                    'order_status' => $order->order_status->value,
                    'order_status_label' => $order->order_status->label(),
                    'payment_status' => $order->payment_status->value,
                    'payment_status_label' => $order->payment_status->label(),
                    'created_at' => $order->created_at?->toIso8601String(),
                    'formatted_created_at' => $order->created_at?->translatedFormat('d M Y, H:i'),
                    'items_count' => $order->items->count(),
                    'total_quantity' => (int) $order->items->sum('quantity'),
                    'first_item_name' => $order->items->first() ? $order->items->first()->product_name : 'Pesanan KOPDIG',
                    'pickup_session' => $order->pickupSession ? [
                        'id' => $order->pickupSession->id,
                        'name' => $order->pickupSession->name,
                        'formatted_time' => sprintf('%s - %s WIB', substr($order->pickupSession->starts_at, 0, 5), substr($order->pickupSession->ends_at, 0, 5)),
                        'formatted_date' => $order->pickupSession->pickup_date->translatedFormat('d M Y'),
                    ] : null,
                ];
            });

        $totalOrdersCount = $user->orders()->count();

        $recentSubmissions = $user->productSubmissions()
            ->with(['category:id,name,slug', 'product:id,name,slug'])
            ->latest()
            ->take(4)
            ->get()
            ->map(function (ProductSubmission $sub) {
                return [
                    'id' => $sub->id,
                    'name' => $sub->name,
                    'category_name' => $sub->category ? $sub->category->name : 'Kategori',
                    'base_price' => $sub->base_price,
                    'proposed_stock' => $sub->proposed_stock,
                    'status' => $sub->status->value,
                    'status_label' => $sub->status->label(),
                    'rejection_reason' => $sub->status === ProductSubmissionStatus::Rejected ? $sub->rejection_reason : null,
                    'created_at' => $sub->created_at?->toIso8601String(),
                    'formatted_created_at' => $sub->created_at?->translatedFormat('d M Y'),
                    'product_slug' => $sub->product?->slug,
                ];
            });

        $totalSubmissionsCount = $user->productSubmissions()->count();

        $userProfile = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'student_identifier' => $user->student_identifier,
            'avatar_path' => $user->avatar_path,
            'role' => $user->role->value,
            'role_label' => $user->isCooperative() ? 'Pengurus Koperasi' : 'Siswa / Anggota Koperasi',
            'joined_at' => $user->created_at?->translatedFormat('F Y'),
            'email_verified' => $user->hasVerifiedEmail(),
        ];

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => true,
            'status' => $request->session()->get('status'),
            'userProfile' => $userProfile,
            'recentOrders' => $recentOrders,
            'totalOrdersCount' => $totalOrdersCount,
            'recentSubmissions' => $recentSubmissions,
            'totalSubmissionsCount' => $totalSubmissionsCount,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
