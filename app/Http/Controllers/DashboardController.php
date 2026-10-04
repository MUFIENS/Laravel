<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Route authenticated users to their role-appropriate entry point.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user && $user->isCooperative()) {
            return redirect()->route('cooperative.index');
        }

        return redirect()->route('explore');
    }
}
