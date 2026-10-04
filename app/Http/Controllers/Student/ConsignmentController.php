<?php

namespace App\Http\Controllers\Student;

use App\Enums\ProductSubmissionStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ProductSubmission;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsignmentController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display student's own consignment submissions and approved products.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $submissions = $user->productSubmissions()
            ->with(['category', 'product'])
            ->latest()
            ->get();

        $approvedProducts = $user->products()
            ->with('category')
            ->latest()
            ->get();

        return Inertia::render('student/consignments/index', [
            'submissions' => $submissions,
            'approvedProducts' => $approvedProducts,
        ]);
    }

    /**
     * Show the consignment submission form.
     */
    public function create(): Response
    {
        $this->authorize('create', ProductSubmission::class);

        $categories = Category::query()
            ->active()
            ->orderBy('display_order')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('student/consignments/create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created consignment submission.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', ProductSubmission::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['required', 'string', 'max:2000'],
            'base_price' => ['required', 'integer', 'min:500', 'max:10000000'],
            'proposed_stock' => ['required', 'integer', 'min:1', 'max:500'],
            'image_path' => ['nullable', 'string', 'max:255'],
        ]);

        $submission = $request->user()->productSubmissions()->create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'description' => $validated['description'],
            'image_path' => $validated['image_path'] ?? 'submissions/default-product.jpg',
            'base_price' => $validated['base_price'],
            'proposed_stock' => $validated['proposed_stock'],
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        return redirect()
            ->route('student.consignments.show', $submission)
            ->with('success', 'Pengajuan titipan produk berhasil dikirim. Menunggu verifikasi pengurus koperasi.');
    }

    /**
     * Display a specific submission.
     */
    public function show(ProductSubmission $submission): Response
    {
        $this->authorize('view', $submission);

        $submission->load(['category', 'product', 'reviewer:id,name']);

        return Inertia::render('student/consignments/show', [
            'submission' => $submission,
        ]);
    }

    /**
     * Show edit form for an unreviewed submission.
     */
    public function edit(ProductSubmission $submission): Response
    {
        $this->authorize('update', $submission);

        $categories = Category::query()
            ->active()
            ->orderBy('display_order')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('student/consignments/edit', [
            'submission' => $submission,
            'categories' => $categories,
        ]);
    }

    /**
     * Update an eligible submission.
     */
    public function update(Request $request, ProductSubmission $submission): RedirectResponse
    {
        $this->authorize('update', $submission);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['required', 'string', 'max:2000'],
            'base_price' => ['required', 'integer', 'min:500', 'max:10000000'],
            'proposed_stock' => ['required', 'integer', 'min:1', 'max:500'],
            'image_path' => ['nullable', 'string', 'max:255'],
        ]);

        $submission->update($validated);

        return redirect()
            ->route('student.consignments.show', $submission)
            ->with('success', 'Pengajuan titipan produk berhasil diperbarui.');
    }

    /**
     * Delete an eligible submission.
     */
    public function destroy(ProductSubmission $submission): RedirectResponse
    {
        $this->authorize('delete', $submission);

        $submission->delete();

        return redirect()
            ->route('student.consignments.index')
            ->with('success', 'Pengajuan titipan berhasil dibatalkan.');
    }
}
