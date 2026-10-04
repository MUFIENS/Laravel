<?php

use App\Enums\ProductSubmissionStatus;
use App\Models\Category;
use App\Models\ProductSubmission;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function createValidImageFile(string $filename = 'test.jpg', int $sizeKb = 10): UploadedFile
{
    // Real valid 1x1 JPEG binary so fileinfo correctly identifies it as image/jpeg without requiring GD extension
    $minimalJpeg = base64_decode(
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    );

    if ($sizeKb * 1024 > strlen($minimalJpeg)) {
        // Embed comment block or padding before SOI / in valid container
        $padding = str_repeat("\x00", ($sizeKb * 1024) - strlen($minimalJpeg));
        $content = substr($minimalJpeg, 0, 4).$padding.substr($minimalJpeg, 4);
    } else {
        $content = $minimalJpeg;
    }

    return UploadedFile::fake()->createWithContent($filename, $content);
}

function createValidPngFile(string $filename = 'test.png', int $sizeKb = 10): UploadedFile
{
    // Real valid 1x1 PNG binary
    $minimalPng = base64_decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );

    if ($sizeKb * 1024 > strlen($minimalPng)) {
        $padding = str_repeat('X', ($sizeKb * 1024) - strlen($minimalPng));
        $content = $minimalPng.$padding;
    } else {
        $content = $minimalPng;
    }

    return UploadedFile::fake()->createWithContent($filename, $content);
}

beforeEach(function () {
    Storage::fake('public');

    $this->category = Category::factory()->create([
        'name' => 'Karya Seni & Kerajinan',
        'slug' => 'karya-seni-kerajinan',
        'is_active' => true,
    ]);

    $this->student = User::factory()->student()->create();
});

test('1. student can submit consignment with a valid image', function () {
    $file = createValidImageFile('gantungan-kunci.jpg', 20);

    $response = $this->actingAs($this->student)->post(route('student.consignments.store'), [
        'name' => 'Gantungan Kunci Kulit Sintetis',
        'category_id' => $this->category->id,
        'description' => 'Kerajinan tangan gantungan kunci berbahan kulit sintetis premium.',
        'base_price' => 15000,
        'proposed_stock' => 20,
        'image' => $file,
    ]);

    $this->assertDatabaseHas('product_submissions', [
        'student_id' => $this->student->id,
        'name' => 'Gantungan Kunci Kulit Sintetis',
        'base_price' => 15000,
        'proposed_stock' => 20,
        'status' => ProductSubmissionStatus::Submitted->value,
    ]);

    $submission = ProductSubmission::where('name', 'Gantungan Kunci Kulit Sintetis')->firstOrFail();

    $response->assertRedirect(route('student.consignments.show', $submission));
    expect($submission->image_path)->not->toBeEmpty();
    Storage::disk('public')->assertExists($submission->image_path);
});

test('2. image path is safely stored in database as relative reference', function () {
    $file = createValidPngFile('produk-anyaman.png', 15);

    $this->actingAs($this->student)->post(route('student.consignments.store'), [
        'name' => 'Kotak Tisu Anyaman Bambu',
        'category_id' => $this->category->id,
        'description' => 'Anyaman bambu alami yang dihaluskan rapi dan ramah lingkungan.',
        'base_price' => 25000,
        'proposed_stock' => 10,
        'image' => $file,
    ]);

    $submission = ProductSubmission::where('name', 'Kotak Tisu Anyaman Bambu')->firstOrFail();

    // Verify it is a string path, not base64, not binary
    expect($submission->image_path)->toBeString()
        ->and($submission->image_path)->toStartWith('submissions/')
        ->and($submission->image_path)->not->toContain('data:image')
        ->and($submission->image_path)->not->toContain('<?php');

    Storage::disk('public')->assertExists($submission->image_path);
});

test('3. invalid file type is rejected by server-side validation', function () {
    $fakePdf = UploadedFile::fake()->create('dokumen.pdf', 200, 'application/pdf');

    $response = $this->actingAs($this->student)->from(route('student.consignments.create'))->post(route('student.consignments.store'), [
        'name' => 'Produk Invalid File',
        'category_id' => $this->category->id,
        'description' => 'Percobaan mengunggah file non-gambar.',
        'base_price' => 10000,
        'proposed_stock' => 5,
        'image' => $fakePdf,
    ]);

    $response->assertSessionHasErrors('image');
    $this->assertDatabaseMissing('product_submissions', [
        'name' => 'Produk Invalid File',
    ]);
});

test('4. oversized file is rejected by server-side validation', function () {
    // 2.5 MB file exceeds the 2 MB limit (2048 KB)
    $largeImage = createValidImageFile('foto-besar.jpg', 2600);

    $response = $this->actingAs($this->student)->from(route('student.consignments.create'))->post(route('student.consignments.store'), [
        'name' => 'Produk File Raksasa',
        'category_id' => $this->category->id,
        'description' => 'Percobaan mengunggah gambar berukuran lebih dari 2MB.',
        'base_price' => 10000,
        'proposed_stock' => 5,
        'image' => $largeImage,
    ]);

    $response->assertSessionHasErrors('image');
    $this->assertDatabaseMissing('product_submissions', [
        'name' => 'Produk File Raksasa',
    ]);
});

test('5. student cannot manipulate submission ownership during store, update, or delete', function () {
    $otherStudent = User::factory()->student()->create();
    $file = createValidImageFile('karya-asli.jpg', 10);

    // Attempt to inject another student's ID during store
    $this->actingAs($this->student)->post(route('student.consignments.store'), [
        'student_id' => $otherStudent->id,
        'name' => 'Karya Mandiri Siswa A',
        'category_id' => $this->category->id,
        'description' => 'Deskripsi karya siswa.',
        'base_price' => 12000,
        'proposed_stock' => 10,
        'image' => $file,
    ]);

    $submission = ProductSubmission::where('name', 'Karya Mandiri Siswa A')->firstOrFail();
    expect($submission->student_id)->toBe($this->student->id)
        ->and($submission->student_id)->not->toBe($otherStudent->id);

    // Other student cannot update this submission (IDOR defense)
    $updateResponse = $this->actingAs($otherStudent)->put(route('student.consignments.update', $submission), [
        'name' => 'Bajak Nama Produk',
        'category_id' => $this->category->id,
        'description' => 'Deskripsi dibajak.',
        'base_price' => 10000,
        'proposed_stock' => 5,
    ]);
    $updateResponse->assertForbidden();

    // Other student cannot delete this submission
    $deleteResponse = $this->actingAs($otherStudent)->delete(route('student.consignments.destroy', $submission));
    $deleteResponse->assertForbidden();
});

test('6. cooperative review can read submission details with image path', function () {
    $cooperative = User::factory()->cooperative()->create();

    $submission = ProductSubmission::factory()->create([
        'student_id' => $this->student->id,
        'category_id' => $this->category->id,
        'name' => 'Stiker Hologram Komunitas',
        'image_path' => 'submissions/stiker-hologram.jpg',
        'base_price' => 5000,
        'proposed_stock' => 50,
        'status' => ProductSubmissionStatus::Submitted,
    ]);

    $response = $this->actingAs($cooperative)->get(route('cooperative.consignments.show', $submission));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cooperative/consignments/show')
            ->has('submission', fn ($sub) => $sub
                ->where('id', $submission->id)
                ->where('image_path', 'submissions/stiker-hologram.jpg')
                ->where('name', 'Stiker Hologram Komunitas')
                ->etc()
            )
        );
});

test('7. submission without image is rejected when image field is required', function () {
    $response = $this->actingAs($this->student)->from(route('student.consignments.create'))->post(route('student.consignments.store'), [
        'name' => 'Produk Tanpa Foto',
        'category_id' => $this->category->id,
        'description' => 'Pengajuan tanpa berkas foto produk.',
        'base_price' => 8000,
        'proposed_stock' => 10,
    ]);

    $response->assertSessionHasErrors('image');
    $this->assertDatabaseMissing('product_submissions', [
        'name' => 'Produk Tanpa Foto',
    ]);
});

test('8. file upload cannot be executed as script (executable files rejected)', function () {
    // Attempt uploading a php script
    $phpScript = UploadedFile::fake()->create('exploit.php', 30, 'application/x-php');

    $response = $this->actingAs($this->student)->from(route('student.consignments.create'))->post(route('student.consignments.store'), [
        'name' => 'Script Injeksi',
        'category_id' => $this->category->id,
        'description' => 'Mencoba mengunggah script PHP.',
        'base_price' => 10000,
        'proposed_stock' => 5,
        'image' => $phpScript,
    ]);

    $response->assertSessionHasErrors('image');
    $this->assertDatabaseMissing('product_submissions', [
        'name' => 'Script Injeksi',
    ]);

    // Attempt uploading shell script disguised as jpg
    $shScript = UploadedFile::fake()->create('script.sh', 30, 'text/x-shellscript');

    $shResponse = $this->actingAs($this->student)->from(route('student.consignments.create'))->post(route('student.consignments.store'), [
        'name' => 'Script Shell',
        'category_id' => $this->category->id,
        'description' => 'Mencoba mengunggah script shell.',
        'base_price' => 10000,
        'proposed_stock' => 5,
        'image' => $shScript,
    ]);

    $shResponse->assertSessionHasErrors('image');
    $this->assertDatabaseMissing('product_submissions', [
        'name' => 'Script Shell',
    ]);
});

test('9. image file is cleaned up when student cancels and deletes unreviewed submission', function () {
    $file = createValidImageFile('produk-batal.jpg', 15);

    $this->actingAs($this->student)->post(route('student.consignments.store'), [
        'name' => 'Produk Dibatalkan',
        'category_id' => $this->category->id,
        'description' => 'Produk yang akan dibatalkan.',
        'base_price' => 10000,
        'proposed_stock' => 5,
        'image' => $file,
    ]);

    $submission = ProductSubmission::where('name', 'Produk Dibatalkan')->firstOrFail();
    $imagePath = $submission->image_path;

    Storage::disk('public')->assertExists($imagePath);

    // Cancel / delete submission
    $response = $this->actingAs($this->student)->delete(route('student.consignments.destroy', $submission));
    $response->assertRedirect(route('student.consignments.index'));

    $this->assertDatabaseMissing('product_submissions', ['id' => $submission->id]);
    Storage::disk('public')->assertMissing($imagePath);
});

test('10. student can update submission and replace image with old image cleaned up', function () {
    $file1 = createValidImageFile('foto-lama.jpg', 12);

    $this->actingAs($this->student)->post(route('student.consignments.store'), [
        'name' => 'Produk Mau Update',
        'category_id' => $this->category->id,
        'description' => 'Deskripsi sebelum update.',
        'base_price' => 10000,
        'proposed_stock' => 5,
        'image' => $file1,
    ]);

    $submission = ProductSubmission::where('name', 'Produk Mau Update')->firstOrFail();
    $oldPath = $submission->image_path;
    Storage::disk('public')->assertExists($oldPath);

    // Update with new image
    $file2 = createValidPngFile('foto-baru.png', 18);
    $response = $this->actingAs($this->student)->put(route('student.consignments.update', $submission), [
        'name' => 'Produk Telah Diupdate',
        'category_id' => $this->category->id,
        'description' => 'Deskripsi setelah update.',
        'base_price' => 12000,
        'proposed_stock' => 8,
        'image' => $file2,
    ]);

    $response->assertRedirect(route('student.consignments.show', $submission));

    $submission->refresh();
    expect($submission->image_path)->not->toBe($oldPath);
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($submission->image_path);
});
