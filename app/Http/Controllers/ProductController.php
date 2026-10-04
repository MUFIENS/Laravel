<?php

namespace App\Http\Controllers;

use App\Enums\ProductStatus;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display the specified publicly accessible marketplace product.
     */
    public function show(Product $product): Response
    {
        // STRICT PUBLIC VISIBILITY RULE:
        // Only active products are visible. Draft, inactive, and archived products return 404.
        if ($product->status !== ProductStatus::Active) {
            abort(404, 'Produk tidak ditemukan atau tidak tersedia.');
        }

        // Eager load only necessary relationships with privacy projection
        $product->load([
            'category:id,name,slug,description',
            'owner:id,name', // Privacy rule: strictly id and name, NEVER email or student_identifier
        ]);

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

        // Safely projected product payload
        $productData = [
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
            'published_at' => $product->published_at?->toIso8601String(),
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
                'description' => $product->category->description,
            ] : null,
            'owner' => $product->owner ? [
                'id' => $product->owner->id,
                'name' => $product->owner->name,
            ] : null,
        ];

        // Related discovery products from the same category
        $relatedProducts = Product::query()
            ->where('status', ProductStatus::Active)
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
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
            ->map(function (Product $p) {
                $pStock = $p->stock;
                $pStatus = 'in_stock';
                $pLabel = 'Tersedia';

                if ($pStock <= 0) {
                    $pStatus = 'out_of_stock';
                    $pLabel = 'Habis';
                } elseif ($pStock <= 5) {
                    $pStatus = 'low_stock';
                    $pLabel = 'Sisa '.$pStock;
                }

                return [
                    'id' => $p->id,
                    'category_id' => $p->category_id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'description' => $p->description,
                    'image_path' => $p->image_path,
                    'source_type' => $p->source_type->value,
                    'selling_price' => $p->selling_price,
                    'stock' => $pStock,
                    'stock_status' => $pStatus,
                    'stock_status_label' => $pLabel,
                    'is_featured' => $p->is_featured,
                    'category' => $p->category ? [
                        'id' => $p->category->id,
                        'name' => $p->category->name,
                        'slug' => $p->category->slug,
                    ] : null,
                    'owner' => $p->owner ? [
                        'id' => $p->owner->id,
                        'name' => $p->owner->name,
                    ] : null,
                ];
            });

        return Inertia::render('products/show', [
            'product' => $productData,
            'relatedProducts' => $relatedProducts,
        ]);
    }
}
