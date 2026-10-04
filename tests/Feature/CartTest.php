<?php

namespace Tests\Feature;

use App\Enums\ProductStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    protected User $student;

    protected User $otherStudent;

    protected Category $category;

    protected Product $activeProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::factory()->student()->create([
            'name' => 'Fajar Pratama',
            'email' => 'fajar@sekolah.sch.id',
        ]);

        $this->otherStudent = User::factory()->student()->create([
            'name' => 'Rina Marlina',
            'email' => 'rina@sekolah.sch.id',
        ]);

        $this->category = Category::factory()->create([
            'name' => 'Jajanan',
            'slug' => 'jajanan',
            'is_active' => true,
        ]);

        $this->activeProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Risol Mayo Lumer',
            'slug' => 'risol-mayo-lumer',
            'selling_price' => 3000,
            'stock' => 10,
            'status' => ProductStatus::Active,
        ]);
    }

    /**
     * Test 1: Guest cannot access cart.
     */
    public function test_guest_cannot_access_cart(): void
    {
        $this->get('/cart')->assertRedirect('/login');
        $this->post('/cart/items', ['product_id' => $this->activeProduct->id, 'quantity' => 1])->assertRedirect('/login');
        $this->patch('/cart/items/1', ['quantity' => 2])->assertRedirect('/login');
        $this->delete('/cart/items/1')->assertRedirect('/login');
    }

    /**
     * Test 2: Student can view own cart.
     */
    public function test_student_can_view_own_cart(): void
    {
        $response = $this->actingAs($this->student)->get('/cart');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cart/index')
            ->has('cart.items')
            ->where('cart.total_quantity', 0)
            ->where('cart.subtotal', 0)
            ->where('cart.can_checkout', false)
        );
    }

    /**
     * Test 3: Student cannot access another student's cart.
     */
    public function test_student_cannot_access_another_students_cart(): void
    {
        $otherCart = Cart::factory()->create(['user_id' => $this->otherStudent->id]);
        $otherItem = CartItem::factory()->create([
            'cart_id' => $otherCart->id,
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);

        // Student tries to update other student's cart item -> 403 Forbidden
        $this->actingAs($this->student)
            ->patch("/cart/items/{$otherItem->id}", ['quantity' => 3])
            ->assertForbidden();

        // Student tries to delete other student's cart item -> 403 Forbidden
        $this->actingAs($this->student)
            ->delete("/cart/items/{$otherItem->id}")
            ->assertForbidden();
    }

    /**
     * Test 4: Student can add an active product.
     */
    public function test_student_can_add_an_active_product(): void
    {
        $response = $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);
    }

    /**
     * Test 5: Inactive product cannot be added.
     */
    public function test_inactive_product_cannot_be_added(): void
    {
        $inactiveProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'status' => ProductStatus::Inactive,
            'stock' => 10,
        ]);

        $response = $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $inactiveProduct->id,
            'quantity' => 1,
        ]);

        $response->assertSessionHasErrors('product_id');
        $this->assertDatabaseMissing('cart_items', ['product_id' => $inactiveProduct->id]);
    }

    /**
     * Test 6: Archived product cannot be added.
     */
    public function test_archived_product_cannot_be_added(): void
    {
        $archivedProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'status' => ProductStatus::Archived,
            'stock' => 10,
        ]);

        $response = $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $archivedProduct->id,
            'quantity' => 1,
        ]);

        $response->assertSessionHasErrors('product_id');
        $this->assertDatabaseMissing('cart_items', ['product_id' => $archivedProduct->id]);
    }

    /**
     * Test 7: Out-of-stock product cannot be added.
     */
    public function test_out_of_stock_product_cannot_be_added(): void
    {
        $outOfStockProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'status' => ProductStatus::Active,
            'stock' => 0,
        ]);

        $response = $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $outOfStockProduct->id,
            'quantity' => 1,
        ]);

        $response->assertSessionHasErrors('product_id');
        $this->assertDatabaseMissing('cart_items', ['product_id' => $outOfStockProduct->id]);
    }

    /**
     * Test 8: Adding an existing product increments quantity.
     */
    public function test_adding_an_existing_product_increments_quantity(): void
    {
        // Add 2 units
        $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);

        // Add 3 more units
        $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 3,
        ]);

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 5,
        ]);
    }

    /**
     * Test 9: Duplicate cart rows are not created.
     */
    public function test_duplicate_cart_rows_are_not_created(): void
    {
        $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 1,
        ]);

        $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);

        $cart = $this->student->cart;
        $this->assertNotNull($cart);
        $this->assertEquals(1, $cart->items()->where('product_id', $this->activeProduct->id)->count());
    }

    /**
     * Test 10: Quantity cannot exceed stock.
     */
    public function test_quantity_cannot_exceed_stock(): void
    {
        // Product has stock = 10, try adding 15
        $response = $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 15,
        ]);

        $response->assertSessionHasErrors('quantity');

        // Add 8 units (valid)
        $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 8,
        ]);

        // Try adding 3 more (8 + 3 = 11 > 10)
        $responseSecond = $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 3,
        ]);

        $responseSecond->assertSessionHasErrors('quantity');
    }

    /**
     * Test 11: Quantity cannot be below 1.
     */
    public function test_quantity_cannot_be_below_1(): void
    {
        $response = $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 0,
        ]);

        $response->assertSessionHasErrors('quantity');
    }

    /**
     * Test 12: Student can update own cart item.
     */
    public function test_student_can_update_own_cart_item(): void
    {
        $cart = Cart::factory()->create(['user_id' => $this->student->id]);
        $item = CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($this->student)->patch("/cart/items/{$item->id}", [
            'quantity' => 4,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('cart_items', [
            'id' => $item->id,
            'quantity' => 4,
        ]);
    }

    /**
     * Test 13: Student cannot update another student's cart item.
     */
    public function test_student_cannot_update_another_students_cart_item(): void
    {
        $otherCart = Cart::factory()->create(['user_id' => $this->otherStudent->id]);
        $item = CartItem::factory()->create([
            'cart_id' => $otherCart->id,
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);

        $this->actingAs($this->student)
            ->patch("/cart/items/{$item->id}", ['quantity' => 3])
            ->assertForbidden();
    }

    /**
     * Test 14: Student can remove own cart item.
     */
    public function test_student_can_remove_own_cart_item(): void
    {
        $cart = Cart::factory()->create(['user_id' => $this->student->id]);
        $item = CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($this->student)->delete("/cart/items/{$item->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('cart_items', ['id' => $item->id]);
    }

    /**
     * Test 15: Student cannot remove another student's cart item.
     */
    public function test_student_cannot_remove_another_students_cart_item(): void
    {
        $otherCart = Cart::factory()->create(['user_id' => $this->otherStudent->id]);
        $item = CartItem::factory()->create([
            'cart_id' => $otherCart->id,
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);

        $this->actingAs($this->student)
            ->delete("/cart/items/{$item->id}")
            ->assertForbidden();
    }

    /**
     * Test 16: Subtotal calculation is correct.
     */
    public function test_subtotal_calculation_is_correct(): void
    {
        $secondProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Es Teh Segar',
            'selling_price' => 2500,
            'stock' => 15,
            'status' => ProductStatus::Active,
        ]);

        $cart = Cart::factory()->create(['user_id' => $this->student->id]);
        // 2 x 3000 = 6000
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->activeProduct->id,
            'quantity' => 2,
        ]);
        // 3 x 2500 = 7500
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $secondProduct->id,
            'quantity' => 3,
        ]);

        // Expected total = 6000 + 7500 = 13500
        $response = $this->actingAs($this->student)->get('/cart');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('cart.subtotal', 13500)
            ->where('cart.total_quantity', 5)
        );
    }

    /**
     * Test 17: Total quantity is correct.
     */
    public function test_total_quantity_is_correct(): void
    {
        $cart = Cart::factory()->create(['user_id' => $this->student->id]);
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->activeProduct->id,
            'quantity' => 4,
        ]);

        $response = $this->actingAs($this->student)->get('/cart');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('cart.total_quantity', 4)
        );
    }

    /**
     * Test 18: Cart badge reflects server cart state.
     */
    public function test_cart_badge_reflects_server_cart_state(): void
    {
        // Initially 0
        $responseEmpty = $this->actingAs($this->student)->get('/');
        $responseEmpty->assertOk();
        $responseEmpty->assertInertia(fn (Assert $page) => $page
            ->where('cartCount', 0)
        );

        // Add 3 units
        $this->actingAs($this->student)->post('/cart/items', [
            'product_id' => $this->activeProduct->id,
            'quantity' => 3,
        ]);

        // Now cartCount should be 3
        $responseWithItems = $this->actingAs($this->student)->get('/');
        $responseWithItems->assertOk();
        $responseWithItems->assertInertia(fn (Assert $page) => $page
            ->where('cartCount', 3)
        );
    }

    /**
     * Test 19: Stock conflicts are handled safely.
     */
    public function test_stock_conflicts_are_handled_safely(): void
    {
        $cart = Cart::factory()->create(['user_id' => $this->student->id]);
        $item = CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->activeProduct->id,
            'quantity' => 8,
        ]);

        // Later, stock drops to 3 in database
        $this->activeProduct->update(['stock' => 3]);

        $response = $this->actingAs($this->student)->get('/cart');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('cart.has_unavailable_items', true)
            ->where('cart.can_checkout', false)
            ->where('cart.items.0.has_insufficient_stock', true)
            ->where('cart.items.0.max_available_quantity', 3)
        );

        // Trying to increase quantity fails validation
        $updateResponse = $this->actingAs($this->student)->patch("/cart/items/{$item->id}", [
            'quantity' => 9,
        ]);
        $updateResponse->assertSessionHasErrors('quantity');
    }
}
