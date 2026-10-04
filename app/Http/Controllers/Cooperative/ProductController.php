<?php

namespace App\Http\Controllers\Cooperative;

use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of catalog products for the cooperative workspace.
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $source = $request->query('source');
        $categoryId = $request->query('category');
        $search = trim((string) $request->query('search', ''));

        $query = Product::query()
            ->with(['category:id,name,slug', 'owner:id,name,student_identifier'])
            ->latest('updated_at');

        // Server-side search across name, description, category, and owner
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('owner', function ($oq) use ($search) {
                        $oq->where('name', 'like', "%{$search}%")
                            ->orWhere('student_identifier', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by Status
        if ($status === 'active') {
            $query->where('status', ProductStatus::Active);
        } elseif ($status === 'inactive') {
            $query->where('status', ProductStatus::Inactive);
        } elseif ($status === 'archived') {
            $query->where('status', ProductStatus::Archived);
        } elseif ($status === 'draft') {
            $query->where('status', ProductStatus::Draft);
        }

        // Filter by Source Type
        if ($source === 'cooperative') {
            $query->where('source_type', ProductSourceType::Cooperative);
        } elseif ($source === 'student') {
            $query->where('source_type', ProductSourceType::Student);
        }

        // Filter by Category
        if ($categoryId && $categoryId !== 'all') {
            if (is_numeric($categoryId)) {
                $query->where('category_id', (int) $categoryId);
            } else {
                $query->whereHas('category', fn ($cq) => $cq->where('slug', $categoryId));
            }
        }

        $products = $query->paginate(15)->withQueryString();

        // Real Database-Backed Stats
        $stats = [
            'total' => Product::count(),
            'active' => Product::where('status', ProductStatus::Active)->count(),
            'inactive' => Product::whereIn('status', [ProductStatus::Inactive, ProductStatus::Archived, ProductStatus::Draft])->count(),
            'cooperative' => Product::where('source_type', ProductSourceType::Cooperative)->count(),
            'consignment' => Product::where('source_type', ProductSourceType::Student)->count(),
        ];

        $categories = Category::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('cooperative/products/index', [
            'products' => $products,
            'stats' => $stats,
            'categories' => $categories,
            'filters' => [
                'status' => $status ?? 'all',
                'source' => $source ?? 'all',
                'category' => $categoryId ?? 'all',
                'search' => $search,
            ],
            'activeNav' => 'products',
        ]);
    }

    /**
     * Display the specified product detail for cooperative management.
     */
    public function show(Product $product): Response
    {
        $this->authorize('view', $product);

        $product->load([
            'category:id,name,slug',
            'owner:id,name,student_identifier',
            'submissions' => fn ($q) => $q->latest(),
        ]);

        return Inertia::render('cooperative/products/show', [
            'product' => $product,
            'activeNav' => 'products',
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        $product->load([
            'category:id,name,slug',
            'owner:id,name,student_identifier',
        ]);

        $categories = Category::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('cooperative/products/edit', [
            'product' => $product,
            'categories' => $categories,
            'activeNav' => 'products',
        ]);
    }

    /**
     * Update the specified product in catalog.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        if ($product->isConsignment()) {
            // Student Consignment Product Rules:
            // - Student owner_id and source_type are strictly LOCKED and cannot be modified.
            // - base_price is agreed upon in submission and LOCKED against arbitrary edit.
            // - Cooperative can adjust cooperative_margin, category, name, description, status, and is_featured.
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'category_id' => ['required', 'integer', 'exists:categories,id'],
                'description' => ['required', 'string', 'max:2000'],
                'cooperative_margin' => ['required', 'integer', 'min:0', 'max:5000000'],
                'status' => ['required', Rule::enum(ProductStatus::class)],
                'is_featured' => ['boolean'],
            ]);

            $margin = (int) $validated['cooperative_margin'];
            $sellingPrice = $product->base_price + $margin;

            DB::transaction(function () use ($product, $validated, $margin, $sellingPrice) {
                $product->update([
                    'name' => $validated['name'],
                    'category_id' => $validated['category_id'],
                    'description' => $validated['description'],
                    'cooperative_margin' => $margin,
                    'selling_price' => $sellingPrice,
                    'status' => $validated['status'],
                    'is_featured' => (bool) ($validated['is_featured'] ?? false),
                ]);
            });
        } else {
            // Cooperative Owned Product Rules:
            // - Cooperative sets both base_price and cooperative_margin.
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'category_id' => ['required', 'integer', 'exists:categories,id'],
                'description' => ['required', 'string', 'max:2000'],
                'base_price' => ['required', 'integer', 'min:0', 'max:10000000'],
                'cooperative_margin' => ['required', 'integer', 'min:0', 'max:5000000'],
                'status' => ['required', Rule::enum(ProductStatus::class)],
                'is_featured' => ['boolean'],
            ]);

            $basePrice = (int) $validated['base_price'];
            $margin = (int) $validated['cooperative_margin'];
            $sellingPrice = $basePrice + $margin;

            DB::transaction(function () use ($product, $validated, $basePrice, $margin, $sellingPrice) {
                $product->update([
                    'name' => $validated['name'],
                    'category_id' => $validated['category_id'],
                    'description' => $validated['description'],
                    'base_price' => $basePrice,
                    'cooperative_margin' => $margin,
                    'selling_price' => $sellingPrice,
                    'status' => $validated['status'],
                    'is_featured' => (bool) ($validated['is_featured'] ?? false),
                ]);
            });
        }

        return redirect()
            ->route('cooperative.products.show', $product)
            ->with('success', 'Produk katalog berhasil diperbarui.');
    }
}
