<?php

namespace Tests\Feature;

use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MarketplaceTest extends TestCase
{
    use RefreshDatabase;

    protected Category $categoryJajanan;

    protected Category $categoryAtk;

    protected User $studentOwner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->categoryJajanan = Category::factory()->create([
            'name' => 'Jajanan',
            'slug' => 'jajanan',
            'is_active' => true,
            'display_order' => 1,
        ]);

        $this->categoryAtk = Category::factory()->create([
            'name' => 'ATK & Buku',
            'slug' => 'atk-buku',
            'is_active' => true,
            'display_order' => 2,
        ]);

        $this->studentOwner = User::factory()->student()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi.privacy@sekolah.sch.id',
            'student_identifier' => 'NISN-99887766',
        ]);
    }

    /**
     * Test 1: Student and guest can access the marketplace homepage.
     */
    public function test_user_can_access_marketplace_homepage(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Lemper Ayam Hangat',
            'selling_price' => 3500,
            'status' => ProductStatus::Active,
            'stock' => 10,
        ]);

        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('products.data')
            ->has('categories')
            ->has('filters')
        );
    }

    /**
     * Test 2: Inactive products are not publicly returned.
     */
    public function test_inactive_products_are_not_publicly_returned(): void
    {
        Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Kue Lumpur Inaktif',
            'status' => ProductStatus::Inactive,
        ]);

        $activeProduct = Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Pastel Sayur Aktif',
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Pastel Sayur Aktif')
        );
    }

    /**
     * Test 3: Archived products are not publicly returned.
     */
    public function test_archived_products_are_not_publicly_returned(): void
    {
        Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Roti Bakar Arsip',
            'status' => ProductStatus::Archived,
        ]);

        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 0)
        );
    }

    /**
     * Test 4: Draft products are not publicly returned.
     */
    public function test_draft_products_are_not_publicly_returned(): void
    {
        Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Donat Coklat Draft',
            'status' => ProductStatus::Draft,
        ]);

        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 0)
        );
    }

    /**
     * Test 5: Category filtering works correctly via query string.
     */
    public function test_category_filtering_works(): void
    {
        Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Bakwan Jagung Renyah',
            'status' => ProductStatus::Active,
        ]);

        Product::factory()->create([
            'category_id' => $this->categoryAtk->id,
            'name' => 'Buku Tulis Sinar Dunia',
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('home', ['category' => 'jajanan']));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Bakwan Jagung Renyah')
            ->where('filters.category', 'jajanan')
        );
    }

    /**
     * Test 6: Search works on product name and description.
     */
    public function test_search_works_on_name_and_description(): void
    {
        Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Risoles Daging Mayo',
            'description' => 'Camilan gurih isi daging asap dan keju lembut.',
            'status' => ProductStatus::Active,
        ]);

        Product::factory()->create([
            'category_id' => $this->categoryAtk->id,
            'name' => 'Pensil 2B Ujian Komputer',
            'description' => 'Pensil grafit khusus formulir ujian standar.',
            'status' => ProductStatus::Active,
        ]);

        // Search by keyword in name
        $responseName = $this->get(route('home', ['search' => 'Risoles']));
        $responseName->assertOk();
        $responseName->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Risoles Daging Mayo')
        );

        // Search by keyword in description
        $responseDesc = $this->get(route('home', ['search' => 'grafit']));
        $responseDesc->assertOk();
        $responseDesc->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Pensil 2B Ujian Komputer')
        );
    }

    /**
     * Test 7: Pagination works as documented (12 items per page).
     */
    public function test_pagination_works(): void
    {
        Product::factory()->count(15)->create([
            'category_id' => $this->categoryJajanan->id,
            'status' => ProductStatus::Active,
        ]);

        $responsePage1 = $this->get(route('home'));
        $responsePage1->assertOk();
        $responsePage1->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 12)
            ->where('products.total', 15)
            ->where('products.current_page', 1)
            ->where('products.last_page', 2)
        );

        $responsePage2 = $this->get(route('home', ['page' => 2]));
        $responsePage2->assertOk();
        $responsePage2->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 3)
            ->where('products.current_page', 2)
        );
    }

    /**
     * Test 8: Product source data is correctly resolved for cooperative and student products.
     */
    public function test_product_source_data_is_correctly_resolved(): void
    {
        // 1. Cooperative product
        Product::factory()->create([
            'category_id' => $this->categoryAtk->id,
            'owner_id' => null,
            'name' => 'Spidol Whiteboard Koperasi',
            'source_type' => ProductSourceType::Cooperative,
            'status' => ProductStatus::Active,
        ]);

        // 2. Student consignment product
        Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'owner_id' => $this->studentOwner->id,
            'name' => 'Brownies Siswa Budi',
            'source_type' => ProductSourceType::Student,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 2)
            ->where('products.data.0.source_type', fn ($val) => in_array($val, ['cooperative', 'student'], true))
            ->where('products.data', function ($items) {
                $collection = collect($items);
                $coop = $collection->firstWhere('source_type', 'cooperative');
                $student = $collection->firstWhere('source_type', 'student');

                return $coop !== null
                    && $coop['owner'] === null
                    && $student !== null
                    && $student['owner']['name'] === 'Budi Santoso';
            })
        );
    }

    /**
     * Test 9: Unauthorized internal product fields and student private fields are not exposed.
     */
    public function test_unauthorized_internal_fields_are_not_exposed(): void
    {
        Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'owner_id' => $this->studentOwner->id,
            'name' => 'Produk Uji Privasi',
            'base_price' => 3000,
            'cooperative_margin' => 1000,
            'selling_price' => 4000,
            'source_type' => ProductSourceType::Student,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('products.data.0', function (Assert $json) {
                $json->where('name', 'Produk Uji Privasi')
                    ->where('selling_price', 4000)
                    ->missing('base_price') // Internal financial calculation
                    ->missing('cooperative_margin') // Internal cooperative margin
                    ->where('owner.name', 'Budi Santoso')
                    ->missing('owner.email') // Student privacy
                    ->missing('owner.student_identifier') // Student NISN/ID privacy
                    ->etc();
            })
        );
    }

    /**
     * Test 10: Empty search result behaves correctly without errors.
     */
    public function test_empty_search_result_behaves_correctly(): void
    {
        Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Cireng Krispi',
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('home', ['search' => 'KataKunciYangTidakAda']));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 0)
            ->where('products.total', 0)
            ->where('filters.search', 'KataKunciYangTidakAda')
        );
    }

    /**
     * Test 11: Product with storage-backed image_path resolves to public storage URL.
     */
    public function test_product_with_storage_image_path_renders_correct_storage_url(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Kue Sus Fla Vanila',
            'image_path' => 'submissions/example.jpg',
            'status' => ProductStatus::Active,
        ]);

        // Model accessor check
        $this->assertSame('/storage/submissions/example.jpg', $product->image_url);

        // Marketplace homepage ('welcome')
        $responseHome = $this->get(route('home'));
        $responseHome->assertOk();
        $responseHome->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Kue Sus Fla Vanila')
            ->where('products.data.0.image_path', '/storage/submissions/example.jpg')
            ->where('products.data.0.image_url', '/storage/submissions/example.jpg')
        );

        // Discovery marketplace ('explore')
        $responseExplore = $this->get(route('explore'));
        $responseExplore->assertOk();
        $responseExplore->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Kue Sus Fla Vanila')
            ->where('products.data.0.image_path', '/storage/submissions/example.jpg')
            ->where('products.data.0.image_url', '/storage/submissions/example.jpg')
        );

        // Product detail page
        $responseDetail = $this->get(route('products.show', $product));
        $responseDetail->assertOk();
        $responseDetail->assertInertia(fn (Assert $page) => $page
            ->where('product.name', 'Kue Sus Fla Vanila')
            ->where('product.image_path', '/storage/submissions/example.jpg')
            ->where('product.image_url', '/storage/submissions/example.jpg')
        );
    }

    /**
     * Test 12: External URLs and absolute paths are preserved without prepending storage.
     */
    public function test_external_and_absolute_image_paths_are_preserved(): void
    {
        $externalProduct = Product::factory()->create([
            'category_id' => $this->categoryJajanan->id,
            'name' => 'Brownies Kukus Premium',
            'image_path' => 'https://images.unsplash.com/photo-example.jpg',
            'status' => ProductStatus::Active,
        ]);

        $localProduct = Product::factory()->create([
            'category_id' => $this->categoryAtk->id,
            'name' => 'Pulpen Gel KOPDIG',
            'image_path' => '/images/products/pulpen-gel.jpg',
            'status' => ProductStatus::Active,
        ]);

        $this->assertSame('https://images.unsplash.com/photo-example.jpg', $externalProduct->image_url);
        $this->assertSame('/images/products/pulpen-gel.jpg', $localProduct->image_url);

        $response = $this->get(route('home'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 2)
            ->where('products.data', function ($items) {
                $collection = collect($items);
                $ext = $collection->firstWhere('name', 'Brownies Kukus Premium');
                $loc = $collection->firstWhere('name', 'Pulpen Gel KOPDIG');

                return $ext['image_path'] === 'https://images.unsplash.com/photo-example.jpg'
                    && $ext['image_url'] === 'https://images.unsplash.com/photo-example.jpg'
                    && $loc['image_path'] === '/images/products/pulpen-gel.jpg'
                    && $loc['image_url'] === '/images/products/pulpen-gel.jpg';
            })
        );
    }
}
