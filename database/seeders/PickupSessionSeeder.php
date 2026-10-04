<?php

namespace Database\Seeders;

use App\Enums\PickupSessionStatus;
use App\Models\PickupSession;
use Illuminate\Database\Seeder;

class PickupSessionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        PickupSession::updateOrCreate(
            ['name' => 'Istirahat 1 (09:45 - 10:15)', 'pickup_date' => now()->toDateString()],
            [
                'starts_at' => '09:45:00',
                'ends_at' => '10:15:00',
                'queue_prefix' => 'A',
                'status' => PickupSessionStatus::Active,
            ]
        );

        PickupSession::updateOrCreate(
            ['name' => 'Istirahat 2 (12:00 - 12:45)', 'pickup_date' => now()->toDateString()],
            [
                'starts_at' => '12:00:00',
                'ends_at' => '12:45:00',
                'queue_prefix' => 'B',
                'status' => PickupSessionStatus::Scheduled,
            ]
        );
    }
}
