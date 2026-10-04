<?php

namespace App\Http\Controllers\Cooperative;

use App\Enums\InventoryMovementType;
use App\Enums\ProductSourceType;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of inventory stock and recent movements for the cooperative workspace.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $source = $request->query('source');
        $categoryId = $request->query('category');
        $stockStatus = $request->query('stock_status');
        $search = trim((string) $request->query('search', ''));

        $query = Product::query()
            ->with([
                'category:id,name,slug',
                'owner:id,name,student_identifier',
                'latestInventoryMovement.creator:id,name',
            ])
            ->latest('updated_at');

        // Server-side search across name, description, category, and student owner
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

        // Filter by Source (Cooperative vs Student Consignment)
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

        // Filter by Stock Status based on established project thresholds:
        // out_of_stock: stock <= 0
        // low_stock: stock between 1 and 5
        // in_stock: stock > 5
        if ($stockStatus === 'out_of_stock') {
            $query->where('stock', '<=', 0);
        } elseif ($stockStatus === 'low_stock') {
            $query->whereBetween('stock', [1, 5]);
        } elseif ($stockStatus === 'in_stock') {
            $query->where('stock', '>', 5);
        }

        $paginator = $query->paginate(15)->withQueryString();

        // Transform paginated collection
        /** @var LengthAwarePaginator<int, array<string, mixed>> $products */
        $products = $paginator->through(function (Product $product) {
            $latest = $product->latestInventoryMovement;

            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'image_path' => $product->image_path,
                'source_type' => $product->source_type->value,
                'stock' => $product->stock,
                'stock_status' => $product->stock_status,
                'stock_status_label' => $product->stock_status_label,
                'selling_price' => $product->selling_price,
                'base_price' => $product->base_price,
                'cooperative_margin' => $product->cooperative_margin,
                'status' => $product->status->value,
                'category' => $product->category ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ] : null,
                'owner' => $product->owner ? [
                    'id' => $product->owner->id,
                    'name' => $product->owner->name,
                    'student_identifier' => $product->owner->student_identifier,
                ] : null,
                'latest_movement' => $latest ? [
                    'id' => $latest->id,
                    'type' => $latest->type->value,
                    'type_label' => $latest->type->label(),
                    'quantity' => $latest->quantity,
                    'reason' => $latest->reason,
                    'created_at' => $latest->created_at?->toIso8601String(),
                    'creator_name' => $latest->creator?->name,
                ] : null,
                'updated_at' => $product->updated_at?->toIso8601String(),
            ];
        });

        // Real Database-Backed Stats (no fake metrics)
        $stats = [
            'total_products' => Product::count(),
            'in_stock' => Product::where('stock', '>', 5)->count(),
            'low_stock' => Product::whereBetween('stock', [1, 5])->count(),
            'out_of_stock' => Product::where('stock', '<=', 0)->count(),
            'total_units' => (int) Product::sum('stock'),
        ];

        $categories = Category::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('cooperative/inventory/index', [
            'products' => $products,
            'stats' => $stats,
            'categories' => $categories,
            'filters' => [
                'source' => $source ?? 'all',
                'category' => $categoryId ?? 'all',
                'stock_status' => $stockStatus ?? 'all',
                'search' => $search,
            ],
            'activeNav' => 'inventory',
        ]);
    }

    /**
     * Display the specified product inventory detail with complete stock movement ledger.
     */
    public function show(Request $request, Product $product): Response
    {
        $this->authorize('view', $product);

        $product->load([
            'category:id,name,slug',
            'owner:id,name,student_identifier',
        ]);

        $paginator = $product->inventoryMovements()
            ->with('creator:id,name')
            ->latest('created_at')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        /** @var LengthAwarePaginator<int, array<string, mixed>> $movements */
        $movements = $paginator->through(function (InventoryMovement $movement) {
            return [
                'id' => $movement->id,
                'type' => $movement->type->value,
                'type_label' => $movement->type->label(),
                'quantity' => $movement->quantity,
                'reference_type' => $movement->reference_type,
                'reference_id' => $movement->reference_id,
                'reason' => $movement->reason,
                'created_by' => $movement->created_by,
                'creator_name' => $movement->creator ? $movement->creator->name : 'Sistem / Otomatis',
                'created_at' => $movement->created_at?->toIso8601String(),
            ];
        });

        $productData = [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'image_path' => $product->image_path,
            'source_type' => $product->source_type->value,
            'base_price' => $product->base_price,
            'cooperative_margin' => $product->cooperative_margin,
            'selling_price' => $product->selling_price,
            'stock' => $product->stock,
            'stock_status' => $product->stock_status,
            'stock_status_label' => $product->stock_status_label,
            'status' => $product->status->value,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
            ] : null,
            'owner' => $product->owner ? [
                'id' => $product->owner->id,
                'name' => $product->owner->name,
                'student_identifier' => $product->owner->student_identifier,
            ] : null,
            'created_at' => $product->created_at?->toIso8601String(),
            'updated_at' => $product->updated_at?->toIso8601String(),
        ];

        return Inertia::render('cooperative/inventory/show', [
            'product' => $productData,
            'movements' => $movements,
            'activeNav' => 'inventory',
        ]);
    }

    /**
     * Record a manual stock operation (restock or adjustment) with atomic locking.
     */
    public function adjust(Request $request, Product $product): RedirectResponse
    {
        $this->authorize('manageInventory', $product);

        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(['restock', 'adjustment'])],
            'adjustment_direction' => ['required_if:type,adjustment', 'nullable', 'string', Rule::in(['addition', 'subtraction'])],
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'reason' => ['required', 'string', 'min:3', 'max:255'],
        ], [
            'type.required' => 'Jenis operasi stok wajib dipilih.',
            'type.in' => 'Jenis operasi stok tidak valid.',
            'adjustment_direction.required_if' => 'Arah penyesuaian (penambahan / pengurangan) wajib ditentukan.',
            'quantity.required' => 'Jumlah stok wajib diisi.',
            'quantity.integer' => 'Jumlah stok harus berupa bilangan bulat.',
            'quantity.min' => 'Jumlah stok minimal adalah 1.',
            'quantity.max' => 'Jumlah stok maksimal dalam satu mutasi adalah 100.000.',
            'reason.required' => 'Keterangan / alasan mutasi stok wajib diisi.',
            'reason.min' => 'Keterangan minimal 3 karakter.',
            'reason.max' => 'Keterangan maksimal 255 karakter.',
        ]);

        /** @var string $type */
        $type = $validated['type'];
        /** @var int $quantity */
        $quantity = (int) $validated['quantity'];
        /** @var string $reason */
        $reason = trim((string) $validated['reason']);

        $newStock = DB::transaction(function () use ($request, $product, $type, $quantity, $reason, $validated) {
            /** @var Product|null $lockedProduct */
            $lockedProduct = Product::where('id', $product->id)->lockForUpdate()->first();

            if (! $lockedProduct) {
                throw ValidationException::withMessages(['product' => 'Produk tidak ditemukan.']);
            }

            if ($type === 'restock') {
                $delta = $quantity;
                $movementType = InventoryMovementType::Restock;
            } else {
                $direction = $validated['adjustment_direction'] ?? 'addition';
                $movementType = InventoryMovementType::Adjustment;

                if ($direction === 'subtraction') {
                    if ($lockedProduct->stock < $quantity) {
                        throw ValidationException::withMessages([
                            'quantity' => "Pengurangan stok ({$quantity}) melebihi stok yang tersedia saat ini ({$lockedProduct->stock}).",
                        ]);
                    }
                    $delta = -$quantity;
                } else {
                    $delta = $quantity;
                }
            }

            $computedStock = $lockedProduct->stock + $delta;

            if ($computedStock < 0) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stok produk tidak boleh bernilai negatif.',
                ]);
            }

            $lockedProduct->stock = $computedStock;
            $lockedProduct->save();

            InventoryMovement::create([
                'product_id' => $lockedProduct->id,
                'type' => $movementType,
                'quantity' => $delta,
                'reference_type' => 'manual_cooperative',
                'reference_id' => $request->user()?->id,
                'reason' => $reason,
                'created_by' => $request->user()?->id,
            ]);

            return $computedStock;
        });

        $actionLabel = $type === 'restock' ? 'Restock' : 'Penyesuaian stok';

        return redirect()
            ->route('cooperative.inventory.show', $product)
            ->with('success', "{$actionLabel} berhasil dicatat. Stok terkini: {$newStock} unit.");
    }
}
