<?php

namespace Database\Seeders;

use App\Enums\InventoryMovementType;
use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Enums\ProductSubmissionStatus;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductSubmission;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $coopUser = User::where('email', 'koperasi@kopdig.id')->firstOrFail();
        $budi = User::where('email', 'budi@kopdig.id')->firstOrFail();
        $siti = User::where('email', 'siti@kopdig.id')->firstOrFail();
        $fajar = User::where('email', 'fajar@kopdig.id')->firstOrFail();

        $catAtk = Category::where('slug', 'atk-buku')->firstOrFail();
        $catAtribut = Category::where('slug', 'atribut-sekolah')->firstOrFail();
        $catMinuman = Category::where('slug', 'minuman')->firstOrFail();
        $catJajanan = Category::where('slug', 'jajanan')->firstOrFail();
        $catKarya = Category::where('slug', 'karya-siswa')->firstOrFail();

        // 1. Official Cooperative Products
        $cooperativeProducts = [
            [
                'category_id' => $catAtk->id,
                'owner_id' => null,
                'name' => 'Pulpen Standard Gel 0.5mm Hitam',
                'slug' => 'pulpen-standard-gel-05mm-hitam',
                'description' => 'Pulpen gel hitam pekat ukuran mata pena 0.5mm, nyaman untuk mencatat ujian.',
                'image_path' => '/images/products/pulpen-gel.jpg',
                'source_type' => ProductSourceType::Cooperative,
                'base_price' => 3500,
                'cooperative_margin' => 0,
                'selling_price' => 3500,
                'stock' => 45,
                'status' => ProductStatus::Active,
                'is_featured' => false,
                'published_at' => now(),
            ],
            [
                'category_id' => $catAtk->id,
                'owner_id' => null,
                'name' => 'Buku Tulis Bintang Obor 38 Lembar',
                'slug' => 'buku-tulis-bintang-obor-38-lembar',
                'description' => 'Buku tulis garis tebal berkualitas tinggi isi 38 lembar standar sekolah.',
                'image_path' => '/images/products/buku-tulis.jpg',
                'source_type' => ProductSourceType::Cooperative,
                'base_price' => 4500,
                'cooperative_margin' => 0,
                'selling_price' => 4500,
                'stock' => 30,
                'status' => ProductStatus::Active,
                'is_featured' => false,
                'published_at' => now(),
            ],
            [
                'category_id' => $catAtribut->id,
                'owner_id' => null,
                'name' => 'Dasi OSIS SMA Bordir Resmi',
                'slug' => 'dasi-osis-sma-bordir-resmi',
                'description' => 'Dasi abu-abu bordir logo OSIS resmi bahan drill halus berkualitas.',
                'image_path' => '/images/products/dasi-osis.jpg',
                'source_type' => ProductSourceType::Cooperative,
                'base_price' => 15000,
                'cooperative_margin' => 0,
                'selling_price' => 15000,
                'stock' => 25,
                'status' => ProductStatus::Active,
                'is_featured' => true,
                'published_at' => now(),
            ],
            [
                'category_id' => $catMinuman->id,
                'owner_id' => null,
                'name' => 'Teh Kotak Sosro Melati 200ml',
                'slug' => 'teh-kotak-sosro-melati-200ml',
                'description' => 'Minuman teh melati asli kemasan kotak higienis dingin.',
                'image_path' => '/images/products/teh-kotak.jpg',
                'source_type' => ProductSourceType::Cooperative,
                'base_price' => 4000,
                'cooperative_margin' => 0,
                'selling_price' => 4000,
                'stock' => 35,
                'status' => ProductStatus::Active,
                'is_featured' => false,
                'published_at' => now(),
            ],
        ];

        foreach ($cooperativeProducts as $prodData) {
            $product = Product::updateOrCreate(['slug' => $prodData['slug']], $prodData);
            InventoryMovement::firstOrCreate(
                [
                    'product_id' => $product->id,
                    'type' => InventoryMovementType::Restock,
                    'quantity' => $product->stock,
                ],
                [
                    'reason' => 'Stok awal koperasi resmi',
                    'created_by' => $coopUser->id,
                ]
            );
        }

        // 2. Student Consignment Products
        $consignmentProducts = [
            [
                'category_id' => $catJajanan->id,
                'owner_id' => $siti->id,
                'name' => 'Risol Mayo Keju Lumer Homemade',
                'slug' => 'risol-mayo-keju-lumer-homemade',
                'description' => 'Risol isi telur rebus, mayones spesial, daging asap, dan keju lumer. Dibuat segar tiap pagi oleh Siti (Tata Boga).',
                'image_path' => '/images/products/risol-mayo.jpg',
                'source_type' => ProductSourceType::Student,
                'base_price' => 4000,
                'cooperative_margin' => 1000,
                'selling_price' => 5000,
                'stock' => 15,
                'status' => ProductStatus::Active,
                'is_featured' => true,
                'published_at' => now(),
            ],
            [
                'category_id' => $catJajanan->id,
                'owner_id' => $budi->id,
                'name' => 'Cookies Cokelat Crispy Renyah',
                'slug' => 'cookies-cokelat-crispy-renyah',
                'description' => 'Cookies biskuit cokelat renyah dengan choco chips melimpah kemasan pouch.',
                'image_path' => '/images/products/cookies-cokelat.jpg',
                'source_type' => ProductSourceType::Student,
                'base_price' => 6500,
                'cooperative_margin' => 1500,
                'selling_price' => 8000,
                'stock' => 10,
                'status' => ProductStatus::Active,
                'is_featured' => true,
                'published_at' => now(),
            ],
            [
                'category_id' => $catKarya->id,
                'owner_id' => $siti->id,
                'name' => 'Gantungan Kunci Rajut Bunga Handmade',
                'slug' => 'gantungan-kunci-rajut-bunga-handmade',
                'description' => 'Karya rajut benang katun halus bentuk bunga aesthetic untuk tas sekolah.',
                'image_path' => '/images/products/gantungan-kunci.jpg',
                'source_type' => ProductSourceType::Student,
                'base_price' => 10000,
                'cooperative_margin' => 2000,
                'selling_price' => 12000,
                'stock' => 6,
                'status' => ProductStatus::Active,
                'is_featured' => false,
                'published_at' => now(),
            ],
            [
                'category_id' => $catJajanan->id,
                'owner_id' => $fajar->id,
                'name' => 'Keripik Singkong Balado Pedas Manis',
                'slug' => 'keripik-singkong-balado-pedas-manis',
                'description' => 'Keripik singkong renyah bumbu balado asli tanpa pengawet.',
                'image_path' => '/images/products/keripik-singkong.jpg',
                'source_type' => ProductSourceType::Student,
                'base_price' => 5000,
                'cooperative_margin' => 1000,
                'selling_price' => 6000,
                'stock' => 0, // Habis untuk demonstrasi out of stock
                'status' => ProductStatus::Active,
                'is_featured' => false,
                'published_at' => now(),
            ],
        ];

        foreach ($consignmentProducts as $prodData) {
            $product = Product::updateOrCreate(['slug' => $prodData['slug']], $prodData);
            if ($product->stock > 0) {
                InventoryMovement::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'type' => InventoryMovementType::Restock,
                        'quantity' => $product->stock,
                    ],
                    [
                        'reason' => 'Penerimaan titipan siswa dari pengajuan',
                        'created_by' => $coopUser->id,
                    ]
                );
            }
        }

        // 3. Product Submissions (Workflow demo)
        $approvedProduct = Product::where('slug', 'risol-mayo-keju-lumer-homemade')->first();

        // 3a. Approved Submission
        ProductSubmission::updateOrCreate(
            ['name' => 'Risol Mayo Keju Lumer Homemade', 'student_id' => $siti->id],
            [
                'category_id' => $catJajanan->id,
                'product_id' => $approvedProduct?->id,
                'description' => 'Risol isi telur rebus, mayones spesial, daging asap, dan keju lumer.',
                'image_path' => 'submissions/risol-mayo.jpg',
                'base_price' => 4000,
                'proposed_stock' => 15,
                'cooperative_margin' => 1000,
                'proposed_selling_price' => 5000,
                'status' => ProductSubmissionStatus::Approved,
                'rejection_reason' => null,
                'reviewed_by' => $coopUser->id,
                'reviewed_at' => now()->subDays(2),
            ]
        );

        // 3b. Submitted (Awaiting review)
        ProductSubmission::updateOrCreate(
            ['name' => 'Keripik Pisang Cokelat Lumer', 'student_id' => $fajar->id],
            [
                'category_id' => $catJajanan->id,
                'product_id' => null,
                'description' => 'Keripik pisang kepok gurih disiram lelehan dark chocolate tebal.',
                'image_path' => 'submissions/keripik-pisang.jpg',
                'base_price' => 7000,
                'proposed_stock' => 12,
                'cooperative_margin' => null,
                'proposed_selling_price' => null,
                'status' => ProductSubmissionStatus::Submitted,
                'rejection_reason' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]
        );

        // 3c. Under Review
        ProductSubmission::updateOrCreate(
            ['name' => 'Paket Stiker Hologram Jurusan DKV', 'student_id' => $budi->id],
            [
                'category_id' => $catKarya->id,
                'product_id' => null,
                'description' => 'Die-cut vinyl sticker pack waterproof anti gores bertema desain kreatif.',
                'image_path' => 'submissions/stiker-dkv.jpg',
                'base_price' => 3000,
                'proposed_stock' => 20,
                'cooperative_margin' => 1000,
                'proposed_selling_price' => 4000,
                'status' => ProductSubmissionStatus::UnderReview,
                'rejection_reason' => null,
                'reviewed_by' => $coopUser->id,
                'reviewed_at' => now()->subHours(3),
            ]
        );

        // 3d. Rejected
        ProductSubmission::updateOrCreate(
            ['name' => 'Minuman Sirup Melon Rumahan', 'student_id' => $fajar->id],
            [
                'category_id' => $catMinuman->id,
                'product_id' => null,
                'description' => 'Minuman es sirup melon botol plastik biasa.',
                'image_path' => 'submissions/sirup-melon.jpg',
                'base_price' => 3000,
                'proposed_stock' => 15,
                'cooperative_margin' => null,
                'proposed_selling_price' => null,
                'status' => ProductSubmissionStatus::Rejected,
                'rejection_reason' => 'Kemasan botol belum memiliki segel kedap udara standar koperasi sekolah.',
                'reviewed_by' => $coopUser->id,
                'reviewed_at' => now()->subDay(),
            ]
        );
    }
}
