<?php

namespace App\Http\Controllers\Cooperative;

use App\Enums\InventoryMovementType;
use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Enums\ProductSubmissionStatus;
use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductSubmission;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ConsignmentReviewController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display listing of student consignment submissions for review.
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $search = trim((string) $request->query('search', ''));

        $query = ProductSubmission::query()
            ->with(['student:id,name,student_identifier', 'category:id,name,slug'])
            ->latest();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('student_identifier', 'like', "%{$search}%");
                    })
                    ->orWhereHas('category', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status === 'submitted' || $status === 'pending') {
            $query->whereIn('status', [
                ProductSubmissionStatus::Submitted,
                ProductSubmissionStatus::UnderReview,
            ]);
        } elseif ($status === 'approved') {
            $query->where('status', ProductSubmissionStatus::Approved);
        } elseif ($status === 'rejected') {
            $query->where('status', ProductSubmissionStatus::Rejected);
        }

        $submissions = $query->paginate(15)->withQueryString();

        $stats = [
            'total' => ProductSubmission::count(),
            'pending' => ProductSubmission::whereIn('status', [
                ProductSubmissionStatus::Submitted,
                ProductSubmissionStatus::UnderReview,
            ])->count(),
            'approved' => ProductSubmission::where('status', ProductSubmissionStatus::Approved)->count(),
            'rejected' => ProductSubmission::where('status', ProductSubmissionStatus::Rejected)->count(),
        ];

        return Inertia::render('cooperative/consignments/index', [
            'submissions' => $submissions,
            'stats' => $stats,
            'currentFilter' => $status ?? 'all',
            'search' => $search,
        ]);
    }

    /**
     * Display a specific submission for operator review.
     */
    public function show(ProductSubmission $submission): Response
    {
        $this->authorize('review', $submission);

        $submission->load(['student:id,name,student_identifier', 'category', 'product', 'reviewer:id,name']);

        return Inertia::render('cooperative/consignments/show', [
            'submission' => $submission,
        ]);
    }

    /**
     * Approve a student submission and publish it to the marketplace catalog.
     */
    public function approve(Request $request, ProductSubmission $submission): RedirectResponse
    {
        $this->authorize('approve', $submission);

        $validated = $request->validate([
            'cooperative_margin' => ['required', 'integer', 'min:0', 'max:5000000'],
        ]);

        $margin = $validated['cooperative_margin'];

        DB::transaction(function () use ($request, $submission, $margin) {
            $locked = ProductSubmission::where('id', $submission->id)->lockForUpdate()->firstOrFail();

            if (in_array($locked->status, [ProductSubmissionStatus::Approved, ProductSubmissionStatus::Rejected], true)) {
                abort(422, 'Pengajuan ini telah diproses sebelumnya dan statusnya terkunci.');
            }

            $sellingPrice = $locked->base_price + $margin;
            $slug = Str::slug($locked->name).'-'.date('YmdHis').'-'.Str::random(4);

            $product = Product::create([
                'category_id' => $locked->category_id,
                'owner_id' => $locked->student_id,
                'name' => $locked->name,
                'slug' => $slug,
                'description' => $locked->description,
                'image_path' => $locked->image_path,
                'source_type' => ProductSourceType::Student,
                'base_price' => $locked->base_price,
                'cooperative_margin' => $margin,
                'selling_price' => $sellingPrice,
                'stock' => $locked->proposed_stock,
                'status' => ProductStatus::Active,
                'is_featured' => false,
                'published_at' => now(),
            ]);

            $locked->update([
                'product_id' => $product->id,
                'cooperative_margin' => $margin,
                'proposed_selling_price' => $sellingPrice,
                'status' => ProductSubmissionStatus::Approved,
                'rejection_reason' => null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            InventoryMovement::create([
                'product_id' => $product->id,
                'type' => InventoryMovementType::Restock,
                'quantity' => $locked->proposed_stock,
                'reference_type' => 'product_submission',
                'reference_id' => $locked->id,
                'reason' => 'Stok awal persetujuan titipan siswa #'.$locked->id,
                'created_by' => $request->user()->id,
            ]);
        });

        return redirect()
            ->route('cooperative.consignments.index')
            ->with('success', 'Pengajuan berhasil disetujui dan telah dipublikasikan ke katalog produk koperasi.');
    }

    /**
     * Reject a student submission with a required feedback explanation.
     */
    public function reject(Request $request, ProductSubmission $submission): RedirectResponse
    {
        $this->authorize('reject', $submission);

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        DB::transaction(function () use ($request, $submission, $validated) {
            $locked = ProductSubmission::where('id', $submission->id)->lockForUpdate()->firstOrFail();

            if (in_array($locked->status, [ProductSubmissionStatus::Approved, ProductSubmissionStatus::Rejected], true)) {
                abort(422, 'Pengajuan ini telah diproses sebelumnya dan statusnya terkunci.');
            }

            $locked->update([
                'status' => ProductSubmissionStatus::Rejected,
                'rejection_reason' => $validated['rejection_reason'],
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        return redirect()
            ->route('cooperative.consignments.index')
            ->with('success', 'Pengajuan titipan telah ditolak dengan catatan feedback kepada siswa.');
    }
}
