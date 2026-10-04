<?php

namespace App\Http\Controllers;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MarketplaceController extends Controller
{
    /**
     * Display the student marketplace discovery homepage.
     */
    public function index(Request $request): Response
    {
        $selectedCategory = $request->query('category', 'all');
        $search = trim((string) $request->query('search', ''));
        $source = $request->query('source', 'all');
        $availability = $request->query('availability', 'all');

        // 1. Fetch active categories for discovery chips
        $categories = Category::query()
            ->active()
            ->orderBy('display_order')
            ->get(['id', 'name', 'slug', 'description']);

        // 2. Build public marketplace query
        // STRICT RULE: Only products with status 'active' are visible to the public
        $query = Product::query()
            ->where('status', ProductStatus::Active)
            ->with([
                'category:id,name,slug',
                'owner:id,name', // Privacy rule: only id and name, NEVER email or student_identifier
            ])
            ->select([
                'id',
                'category_id',
                'owner_id',
                'name',
                'slug',
                'description',
                'image_path',
                'source_type',
                'selling_price',
                'stock',
                'status',
                'is_featured',
                'published_at',
            ]);

        // Category filter (by category slug)
        if ($selectedCategory !== 'all' && ! empty($selectedCategory)) {
            $query->whereHas('category', function ($catQuery) use ($selectedCategory) {
                $catQuery->where('slug', $selectedCategory);
            });
        }

        // Search filter (normalized on name and description)
        if (! empty($search)) {
            $normalizedSearch = mb_substr($search, 0, 100);
            $query->where(function ($q) use ($normalizedSearch) {
                $q->where('name', 'like', '%'.$normalizedSearch.'%')
                    ->orWhere('description', 'like', '%'.$normalizedSearch.'%');
            });
        }

        // Source filter (cooperative vs student)
        if (in_array($source, ['cooperative', 'student'], true)) {
            $query->where('source_type', $source);
        }

        // Availability filter
        if ($availability === 'in_stock') {
            $query->where('stock', '>', 0);
        }

        // Sort: featured first, then newest published
        $query->orderByDesc('is_featured')->orderByDesc('published_at')->orderByDesc('id');

        // Mobile-friendly pagination (12 products per page)
        $paginated = $query->paginate(12)->withQueryString();

        // Transform collection to ensure safe payload & stock presentation labels
        $paginated->getCollection()->transform(function (Product $product) {
            $stock = $product->stock;
            $stockStatus = 'in_stock';
            $stockStatusLabel = 'Tersedia';

            if ($stock <= 0) {
                $stockStatus = 'out_of_stock';
                $stockStatusLabel = 'Habis';
            } elseif ($stock <= 5) {
                $stockStatus = 'low_stock';
                $stockStatusLabel = 'Sisa '.$stock;
            }

            return [
                'id' => $product->id,
                'category_id' => $product->category_id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'image_path' => $product->image_path,
                'source_type' => $product->source_type->value,
                'selling_price' => $product->selling_price,
                'stock' => $stock,
                'stock_status' => $stockStatus,
                'stock_status_label' => $stockStatusLabel,
                'is_featured' => $product->is_featured,
                'category' => $product->category ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ] : null,
                'owner' => $product->owner ? [
                    'id' => $product->owner->id,
                    'name' => $product->owner->name,
                ] : null,
            ];
        });

        // 3. Featured discovery products for home banner (when not searching/filtering)
        $featuredProducts = [];
        if ($selectedCategory === 'all' && empty($search) && $paginated->currentPage() === 1) {
            $featuredProducts = Product::query()
                ->where('status', ProductStatus::Active)
                ->where('is_featured', true)
                ->where('stock', '>', 0)
                ->with(['category:id,name,slug', 'owner:id,name'])
                ->select([
                    'id',
                    'category_id',
                    'owner_id',
                    'name',
                    'slug',
                    'description',
                    'image_path',
                    'source_type',
                    'selling_price',
                    'stock',
                    'status',
                    'is_featured',
                ])
                ->take(4)
                ->get()
                ->map(fn (Product $p) => [
                    'id' => $p->id,
                    'category_id' => $p->category_id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'description' => $p->description,
                    'image_path' => $p->image_path,
                    'source_type' => $p->source_type->value,
                    'selling_price' => $p->selling_price,
                    'stock' => $p->stock,
                    'stock_status' => $p->stock <= 5 ? 'low_stock' : 'in_stock',
                    'stock_status_label' => $p->stock <= 5 ? 'Sisa '.$p->stock : 'Tersedia',
                    'is_featured' => true,
                    'category' => $p->category ? [
                        'id' => $p->category->id,
                        'name' => $p->category->name,
                        'slug' => $p->category->slug,
                    ] : null,
                    'owner' => $p->owner ? [
                        'id' => $p->owner->id,
                        'name' => $p->owner->name,
                    ] : null,
                ]);
        }

        $component = $request->routeIs('explore') ? 'explore' : 'welcome';

        return Inertia::render($component, [
            'products' => $paginated,
            'featuredProducts' => $featuredProducts,
            'categories' => $categories,
            'filters' => [
                'category' => $selectedCategory,
                'search' => $search,
                'source' => $source,
                'availability' => $availability,
            ],
        ]);
    }
}
