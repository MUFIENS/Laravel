<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Jajanan',
                'slug' => 'jajanan',
                'description' => 'Aneka camilan, roti, dan makanan ringan buatan kantin dan titipan siswa.',
                'image_path' => null,
                'is_active' => true,
                'display_order' => 1,
            ],
            [
                'name' => 'Minuman',
                'slug' => 'minuman',
                'description' => 'Minuman segar, susu, dan teh kemasan resmi koperasi.',
                'image_path' => null,
                'is_active' => true,
                'display_order' => 2,
            ],
            [
                'name' => 'ATK & Buku',
                'slug' => 'atk-buku',
                'description' => 'Perlengkapan alat tulis kantor, buku tulis, dan map tugas.',
                'image_path' => null,
                'is_active' => true,
                'display_order' => 3,
            ],
            [
                'name' => 'Atribut Sekolah',
                'slug' => 'atribut-sekolah',
                'description' => 'Dasi OSIS, sabuk, topi upacara, kaos kaki, dan badge sekolah resmi.',
                'image_path' => null,
                'is_active' => true,
                'display_order' => 4,
            ],
            [
                'name' => 'Karya Siswa',
                'slug' => 'karya-siswa',
                'description' => 'Produk kreatif, kriya, stiker desain, dan karya wirausaha siswa mandiri.',
                'image_path' => null,
                'is_active' => true,
                'display_order' => 5,
            ],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
