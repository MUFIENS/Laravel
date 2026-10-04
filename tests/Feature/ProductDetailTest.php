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

class ProductDetailTest extends TestCase
{
    use RefreshDatabase;

    protected Category $category;

    protected User $studentOwner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::factory()->create([
            'name' => 'Jajanan Tradisional',
            'slug' => 'jajanan-tradisional',
            'description' => 'Camilan khas dan olahan makanan siswa.',
            'is_active' => true,
        ]);

        $this->studentOwner = User::factory()->student()->create([
            'name' => 'Zahra Amelia',
            'email' => 'zahra.amelia@sekolah.sch.id',
            'student_identifier' => 'NISN-11223344',
        ]);
    }

    /**
     * Test 1: Active product can be viewed publicly.
     */
    public function test_active_product_can_be_viewed_publicly(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Kue Putu Ayu Lembut',
            'slug' => 'kue-putu-ayu-lembut',
            'description' => 'Kue putu ayu kukus kelapa gurih dibuat segar.',
            'selling_price' => 3500,
            'stock' => 12,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('products.show', $product));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('products/show')
            ->where('product.name', 'Kue Putu Ayu Lembut')
            ->where('product.slug', 'kue-putu-ayu-lembut')
            ->where('product.selling_price', 3500)
            ->where('product.stock', 12)
            ->where('product.stock_status', 'in_stock')
        );
    }

    /**
     * Test 2: Inactive product cannot be viewed publicly (returns 404).
     */
    public function test_inactive_product_cannot_be_viewed_publicly(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'slug' => 'produk-inaktif-test',
            'status' => ProductStatus::Inactive,
        ]);

        $response = $this->get(route('products.show', $product));

        $response->assertNotFound();
    }

    /**
     * Test 3: Archived product cannot be viewed publicly (returns 404).
     */
    public function test_archived_product_cannot_be_viewed_publicly(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'slug' => 'produk-arsip-test',
            'status' => ProductStatus::Archived,
        ]);

        $response = $this->get(route('products.show', $product));

        $response->assertNotFound();
    }

    /**
     * Test 4: Draft product cannot be viewed publicly (returns 404).
     */
    public function test_draft_product_cannot_be_viewed_publicly(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'slug' => 'produk-draft-test',
            'status' => ProductStatus::Draft,
        ]);

        $response = $this->get(route('products.show', $product));

        $response->assertNotFound();
    }

    /**
     * Test 5: Product source is correctly resolved for cooperative vs student products.
     */
    public function test_product_source_is_correctly_resolved(): void
    {
        // 1. Student consignment product
        $consignmentProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'owner_id' => $this->studentOwner->id,
            'name' => 'Brownies Zahra',
            'slug' => 'brownies-zahra',
            'source_type' => ProductSourceType::Student,
            'status' => ProductStatus::Active,
        ]);

        $responseStudent = $this->get(route('products.show', $consignmentProduct));
        $responseStudent->assertOk();
        $responseStudent->assertInertia(fn (Assert $page) => $page
            ->where('product.source_type', 'student')
            ->where('product.owner.name', 'Zahra Amelia')
        );

        // 2. Cooperative official product
        $cooperativeProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'owner_id' => null,
            'name' => 'Pulpen Koperasi Resmi',
            'slug' => 'pulpen-koperasi-resmi',
            'source_type' => ProductSourceType::Cooperative,
            'status' => ProductStatus::Active,
        ]);

        $responseCoop = $this->get(route('products.show', $cooperativeProduct));
        $responseCoop->assertOk();
        $responseCoop->assertInertia(fn (Assert $page) => $page
            ->where('product.source_type', 'cooperative')
            ->where('product.owner', null)
        );
    }

    /**
     * Test 6: Internal financial fields are not exposed to the client.
     */
    public function test_internal_financial_fields_are_not_exposed(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'owner_id' => $this->studentOwner->id,
            'slug' => 'rahasia-finansial',
            'base_price' => 2500,
            'cooperative_margin' => 1000,
            'selling_price' => 3500,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('products.show', $product));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('product.selling_price', 3500)
            ->missing('product.base_price')
            ->missing('product.cooperative_margin')
        );
    }

    /**
     * Test 7: Private owner information (email, student_identifier) is not exposed.
     */
    public function test_private_owner_information_is_not_exposed(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'owner_id' => $this->studentOwner->id,
            'slug' => 'privasi-siswa-detail',
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('products.show', $product));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('product.owner.name', 'Zahra Amelia')
            ->missing('product.owner.email')
            ->missing('product.owner.student_identifier')
            ->missing('product.owner.password')
        );
    }

    /**
     * Test 8: Out-of-stock state is handled correctly (stock === 0).
     */
    public function test_out_of_stock_state_is_handled(): void
    {
        $outOfStockProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Risoles Ludes',
            'slug' => 'risoles-ludes',
            'stock' => 0,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('products.show', $outOfStockProduct));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('product.stock', 0)
            ->where('product.stock_status', 'out_of_stock')
            ->where('product.stock_status_label', 'Habis')
        );
    }

    /**
     * Test 9: Missing product returns 404 response.
     */
    public function test_missing_product_returns_404(): void
    {
        $response = $this->get('/products/slug-produk-yang-tidak-pernah-ada');

        $response->assertNotFound();
    }

    /**
     * Test 10: Category context is correctly resolved on product detail page.
     */
    public function test_category_context_is_correctly_resolved(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'slug' => 'uji-kategori-konteks',
            'status' => ProductStatus::Active,
        ]);

        $response = $this->get(route('products.show', $product));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('product.category.name', 'Jajanan Tradisional')
            ->where('product.category.slug', 'jajanan-tradisional')
            ->has('relatedProducts')
        );
    }
}
