<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Cooperative Operator Account
        User::updateOrCreate(
            ['email' => 'koperasi@kopdig.id'],
            [
                'name' => 'Pengurus Koperasi Sekolah',
                'password' => Hash::make('password'),
                'role' => UserRole::Cooperative,
                'student_identifier' => null,
                'avatar_path' => null,
            ]
        );

        // 2. Student Accounts (Fictional demo data)
        User::updateOrCreate(
            ['email' => 'budi@kopdig.id'],
            [
                'name' => 'Budi Pratama (XII RPL 1)',
                'password' => Hash::make('password'),
                'role' => UserRole::Student,
                'student_identifier' => 'NISN-2026001',
                'avatar_path' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'siti@kopdig.id'],
            [
                'name' => 'Siti Nurhaliza (XI Tata Boga 2)',
                'password' => Hash::make('password'),
                'role' => UserRole::Student,
                'student_identifier' => 'NISN-2026002',
                'avatar_path' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'fajar@kopdig.id'],
            [
                'name' => 'Fajar Nugraha (X DKV 3)',
                'password' => Hash::make('password'),
                'role' => UserRole::Student,
                'student_identifier' => 'NISN-2026003',
                'avatar_path' => null,
            ]
        );
    }
}
