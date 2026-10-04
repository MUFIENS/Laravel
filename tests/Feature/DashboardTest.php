<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_students_are_redirected_to_explore_from_dashboard()
    {
        $user = User::factory()->create(['role' => UserRole::Student]);
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('explore'));
    }

    public function test_authenticated_cooperative_users_are_redirected_to_portal_from_dashboard()
    {
        $user = User::factory()->create(['role' => UserRole::Cooperative]);
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('cooperative.index'));
    }
}
