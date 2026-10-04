# Implementasi Ruang Kerja Review Konsinyasi Koperasi (Phase 11B)

Dokumen ini mendokumentasikan implementasi lengkap antarmuka dan alur kerja kurasi pengajuan produk titipan siswa (*student consignment review workspace*) untuk operator Koperasi Siswa KOPDIG ("Ruang Niaga Warga Sekolah").

---

## 1. Antrean Review (Review Queue)

Antrean review dirancang sebagai pusat kendali operasional operator koperasi untuk memeriksa produk titipan yang diajukan oleh siswa.

- **Lokasi Kode Halaman**: [resources/js/pages/cooperative/consignments/index.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/pages/cooperative/consignments/index.tsx)
- **Rute Web**: `GET /cooperative/consignments`
- **Shell Navigasi**: Terintegrasi penuh dengan `CooperativeShell` dengan navigasi aktif `consignments` dan rekam jejak remah roti (*breadcrumbs*): `Koperasi → Titipan Siswa`.
- **Indikator Metrik Nyata (Database-Backed)**:
  - Total Pengajuan: Seluruh pengajuan siswa yang pernah masuk ke database.
  - Perlu Ditinjau: Pengajuan berstatus `submitted` atau `under_review`.
  - Disetujui: Pengajuan berstatus `approved`.
  - Ditolak: Pengajuan berstatus `rejected`.
  *Seluruh angka dihitung dari query database nyata (`ProductSubmission::count()`, dll.) tanpa nilai tiruan (no fake metrics).*
- **Tampilan Responsif Adaptif**:
  - **Desktop / Tablet (>= 768px)**: Tabel data terstruktur dengan kolom Produk & Kategori, Siswa Pengusul (nama & NIS), Harga Dasar (dengan komponen monospaced `PriceDisplay`), Rencana Stok, Lencana Status Semantik, dan tombol aksi "Tinjau".
  - **Mobile (< 768px)**: Kartu terakumulasi (*stacked cards*) dengan informasi padat, target ketuk minimal 44px (`min-h-[44px]`), dan tanpa kebocoran horizontal (*no horizontal overflow*).
  - **Paginasi Asli**: Mendukung tautan paginasi standar Laravel Inertia dengan mempertahankan query pencarian dan filter aktif.

---

## 2. Pencarian & Filter Sisi Server (Search & Filters)

Seluruh logika pencarian dan penyaringan dieksekusi secara otoritatif di sisi server melalui Laravel Controller:

- **Pengendali**: [app/Http/Controllers/Cooperative/ConsignmentReviewController.php](file:///c:/Users/asepm/Downloads/Laravel/app/Http/Controllers/Cooperative/ConsignmentReviewController.php)
- **Pencarian Sisi Server (`search`)**:
  - Mencari pada nama produk (`name`).
  - Mencari pada nama siswa pengusul (`student.name`).
  - Mencari pada nomor identitas/NIS siswa (`student.student_identifier`).
  - Mencari pada nama kategori (`category.name`).
  - Normalisasi input menggunakan pemangkasan whitespace (`trim()`).
- **Penyaringan Status (`status`)**:
  - `all`: Menampilkan semua pengajuan.
  - `submitted` / `pending`: Menampilkan pengajuan berstatus `submitted` dan `under_review`.
  - `approved`: Menampilkan pengajuan berstatus `approved`.
  - `rejected`: Menampilkan pengajuan berstatus `rejected`.
- **Sinkronisasi Antarmuka**: Tab status menampilkan jumlah lencana riil per filter dan mempertahankan kata kunci pencarian saat beralih tab. Tombol pembersih pencarian disediakan untuk kenyamanan operator.

---

## 3. Detail Pengajuan (Submission Detail)

Halaman inspeksi komprehensif untuk memeriksa kelayakan sampel fisik dan kelengkapan spesifikasi produk sebelum keputusan diterbitkan.

- **Lokasi Kode Halaman**: [resources/js/pages/cooperative/consignments/show.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/pages/cooperative/consignments/show.tsx)
- **Rute Web**: `GET /cooperative/consignments/{submission}`
- **Informasi yang Ditampilkan**:
  - Gambar produk dengan fallback SVG placeholder jika berkas gambar belum diunggah atau rusak.
  - Nama produk dan ID Pengajuan.
  - Kategori produk.
  - Deskripsi dan spesifikasi produk.
  - Harga pokok / modal siswa (`base_price`).
  - Rencana kuantitas stok awal (`proposed_stock`).
  - Lencana status semantik terkini (`StatusBadge`).
  - Tanggal dan waktu pengajuan dalam format Indonesia lokal.
  - Informasi peninjau (`reviewed_by`) dan waktu tinjau (`reviewed_at`) jika telah selesai diproses.
  - Catatan evaluasi penolakan (`rejection_reason`) jika berstatus ditolak.
  - Tautan menuju etalase katalog publik jika berstatus disetujui (`/products/{slug}`).

---

## 4. Alur Penetapan Margin Koperasi (Margin Workflow)

Koperasi memiliki wewenang kurasi dan penetapan harga jual resmi KOPDIG berdasarkan margin nominal tetap:

- **Formula Hubungan Keuangan**:
  $$\text{Harga Dasar Siswa} + \text{Margin Koperasi} = \text{Harga Jual KOPDIG}$$
  *Contoh*: Modal Siswa Rp 8.000 + Margin Koperasi Rp 1.000 = Harga Jual Katalog Rp 9.000.
- **Validasi Sisi Server**:
  - Input `cooperative_margin` divalidasi `required|integer|min:0|max:5000000`.
  - Server menghitung ulang `selling_price = $locked->base_price + $margin`.
- **Interaktivitas Frontend**:
  - Field input numerik dengan format Rupiah.
  - Tombol prasetel cepat (+Rp 500, +Rp 1.000, +Rp 1.500, +Rp 2.000, +Rp 3.000).
  - Kalkulasi pratinjau reaktif langsung di antarmuka untuk memudahkan operator menimbang daya beli siswa.
  - Kotak pratinjau hasil rilis sebelum konfirmasi persetujuan ditekan.

---

## 5. Alur Persetujuan (Approval Flow)

Persetujuan pengajuan titipan siswa memicu mutasi data atomik yang menerbitkan produk ke marketplace koperasi:

1. **Verifikasi Otorisasi**: Kebijakan `ProductSubmissionPolicy::approve()` memastikan hanya pengguna dengan peran `cooperative` yang dapat menyetujui, dan pengajuan belum berstatus final (`approved` atau `rejected`).
2. **Kunci Baris Transaksional**: Penggunaan `ProductSubmission::where('id', $submission->id)->lockForUpdate()->firstOrFail()` di dalam `DB::transaction()` untuk mencegah modifikasi konkuren.
3. **Penerbitan Produk Marketplace (`products`)**:
   - `owner_id`: Diisi ID siswa (`$locked->student_id`), **bukan** ID operator koperasi.
   - `source_type`: `ProductSourceType::Student` (karya titipan siswa).
   - `base_price`: Menggunakan harga dasar siswa.
   - `cooperative_margin`: Menggunakan margin yang ditentukan operator.
   - `selling_price`: Hasil penjumlahan modal siswa dan margin.
   - `stock`: Menggunakan usulan stok awal dari siswa.
   - `status`: `ProductStatus::Active` (langsung tayang di etalase).
   - `published_at`: Waktu saat ini.
4. **Pembaruan Pengajuan (`product_submissions`)**:
   - `status`: `ProductSubmissionStatus::Approved`.
   - `product_id`: Menghubungkan ID produk yang baru dibuat.
   - `reviewed_by`: ID operator yang sedang login.
   - `reviewed_at`: Waktu persetujuan.
5. **Pencatatan Mutasi Stok (`inventory_movements`)**:
   - `type`: `InventoryMovementType::Restock`.
   - `quantity`: Sesuai rencana stok awal siswa.
   - `reference_type`: `'product_submission'`.
   - `reference_id`: ID pengajuan.
   - `created_by`: ID operator koperasi.
6. **Umpan Balik**: Dialihkan ke indeks pengajuan dengan pesan kilat (*flash success*) bahwa produk telah terbit.

---

## 6. Alur Penolakan (Rejection Flow)

Koperasi berhak menolak produk yang belum memenuhi standar mutu atau kapasitas etalase sekolah:

1. **Kewajiban Alasan Penolakan**:
   - Field `rejection_reason` wajib diisi (`required|string|min:5|max:1000`).
   - Mencegah penolakan tanpa dasar atau kosong.
2. **Bantuan Template Masukan Konstruktif**:
   Antarmuka menyediakan tombol pintas umpan balik yang dapat diklik untuk menyisipkan catatan operasional yang jelas, misalnya:
   - "Kemasan produk belum higienis / belum kedap udara."
   - "Informasi tanggal kedaluwarsa atau komposisi wajib dicantumkan pada kemasan."
   - "Harga dasar yang diajukan terlalu tinggi dibanding daya beli warga sekolah."
   - "Kapasitas etalase pendingin / display koperasi saat ini sedang penuh."
3. **Pembaruan Status Atomik**:
   - Status diperbarui menjadi `rejected`.
   - `rejection_reason` tersimpan di database.
   - `reviewed_by` dan `reviewed_at` tercatat untuk riwayat audit.
   - Pengajuan tidak dihapus sehingga riwayat kurasi tetap terpelihara bagi evaluasi siswa.

---

## 7. Model Kepemilikan Data (Ownership Model)

Sesuai prinsip keadilan ekonomi syariah dan model konsinyasi KOPDIG:

- **Siswa Tetap Pemilik Sah (`products.owner_id = student_id`)**:
  Persetujuan produk tidak pernah memindahkan kepemilikan aset produk kepada koperasi.
- **Koperasi Sebagai Operator & Kurator**:
  Koperasi bertindak sebagai penyedia sarana fisik, kasir terpusat, pengelola inventaris fisik, dan penjamin standar kelayakan etalase.
- **Tampilan Kepemilikan Transparan**:
  Halaman detail pengajuan secara tegas menampilkan kartu 3 pilar:
  1. *Pemilik Sah Produk*: Siswa pengusul.
  2. *Operator & Kurator*: Koperasi Sekolah (KOPDIG).
  3. *Klasifikasi Sumber*: Karya Titipan Siswa.

---

## 8. Otorisasi & Keamanan (Authorization & Security)

- **Kebijakan Akses Berbasis Peran**:
  - `ProductSubmissionPolicy::review()`: Khusus peran `cooperative`. Siswa menerima HTTP 403 Forbidden jika mencoba mengakses URL review operator.
  - `ProductSubmissionPolicy::approve()`: Khusus peran `cooperative`. Menolak pengajuan yang telah disetujui atau ditolak sebelumnya.
  - `ProductSubmissionPolicy::reject()`: Khusus peran `cooperative`. Menolak pengajuan yang telah disetujui atau ditolak sebelumnya.
- **Mitigasi IDOR & Forgery Payload**:
  - Identitas peninjau (`reviewed_by`) diambil langsung dari sesi autentikasi `$request->user()->id`. Payload `reviewed_by` dari browser diabaikan.
  - Harga jual (`selling_price`) dihitung langsung di server dari `base_price` database ditambah margin yang divalidasi. Manipulasi harga jual dari klien tidak dimungkinkan.
  - `owner_id` produk selalu diset ke `student_id` pengajuan asli.
- **Penguncian Status (State Locking)**:
  Pengajuan berstatus `approved` atau `rejected` tidak menampilkan form aksi persetujuan/penolakan, melainkan menampilkan panel ringkasan status terkunci. Upaya POST paksa terhadap pengajuan yang sudah final akan ditolak oleh Policy (403) atau Controller lock check (422).

---

## 9. Penanganan Konkurensi & Status Usang (Concurrency Handling)

Jika dua operator membuka pengajuan yang sama secara bersamaan:

- Pengendali menggunakan `DB::transaction()` dengan `ProductSubmission::where('id', $submission->id)->lockForUpdate()->firstOrFail()`.
- Operator pertama yang menyelesaikan aksinya akan mengubah status ke `approved` atau `rejected`.
- Ketika transaksi operator kedua memperoleh kunci baris, dilakukan pengecekan:
  `if (in_array($locked->status, [ProductSubmissionStatus::Approved, ProductSubmissionStatus::Rejected], true))`
  dan transaksi segera digagalkan dengan HTTP 422 ("Pengajuan ini telah diproses sebelumnya dan statusnya terkunci"), mencegah korupsi data atau pembuatan produk ganda.

---

## 10. Privasi Siswa (Privacy Protection)

- Endpoint review dan query controller secara eksplisit membatasi kolom siswa ke `student:id,name,student_identifier`.
- Tidak ada data sensitif (seperti alamat email pribadi, kata sandi, token autentikasi, atau data profil yang tidak relevan) yang dikirim ke antarmuka review koperasi.

---

## 11. Pengujian & Cakupan Uji (Tests)

Pengujian fitur diimplementasikan pada [tests/Feature/CooperativeConsignmentReviewTest.php](file:///c:/Users/asepm/Downloads/Laravel/tests/Feature/CooperativeConsignmentReviewTest.php) dan mencakup seluruh 18 skenario wajib:

1. `test_1_cooperative_can_access_submission_list`: Akses operator ke daftar pengajuan (HTTP 200).
2. `test_2_student_cannot_access_cooperative_review_routes`: Akses siswa ditolak ke rute review (HTTP 403).
3. `test_3_search_works_across_product_name_student_name_and_category`: Pencarian nama produk, siswa, dan kategori di sisi server.
4. `test_4_status_filter_works_for_all_pending_approved_and_rejected`: Penyaringan status (`all`, `submitted`, `approved`, `rejected`).
5. `test_5_cooperative_can_view_a_submission`: Operator dapat melihat detail pengajuan.
6. `test_6_student_cannot_view_cooperative_review_data`: Siswa tidak dapat mengakses detail pengajuan melalui rute review koperasi.
7. `test_7_approval_requires_valid_margin`: Validasi margin wajib numerik dan non-negatif.
8. `test_8_approval_creates_and_activates_product_correctly`: Pembuatan model `Product` berstatus `Active` dengan `published_at`.
9. `test_9_approved_product_preserves_student_ownership`: Produk mempertahankan kepemilikan siswa (`owner_id === student_id`).
10. `test_10_approval_creates_correct_selling_price`: Kalkulasi harga jual server-side (`base_price + margin`).
11. `test_11_approval_creates_required_inventory_record`: Pembuatan catatan `InventoryMovement` bertipe `Restock`.
12. `test_12_rejection_requires_a_reason`: Validasi catatan alasan penolakan (wajib, minimal 5 karakter).
13. `test_13_rejection_stores_the_reason`: Penyimpanan alasan penolakan dan transisi status `Rejected`.
14. `test_14_finalized_submissions_cannot_be_reapproved`: Pengajuan yang telah disetujui tidak dapat disetujui ulang.
15. `test_15_finalized_submissions_cannot_be_rerejected`: Pengajuan yang telah ditolak tidak dapat ditolak ulang.
16. `test_16_unauthorized_user_cannot_forge_reviewer_identity`: Pencegahan pemalsuan identitas peninjau via payload.
17. `test_17_forged_margin_and_selling_price_payload_is_ignored`: Pengabaian manipulasi harga jual dan pemilik dari browser.
18. `test_18_concurrent_stale_review_cannot_corrupt_state`: Pencegahan korupsi data pada skenario konkurensi status usang.

---

## 12. Validasi & Gerbang Kualitas (Quality Gates)

Semua pemeriksaan mutu kode telah dijalankan dan lulus tanpa kesalahan:

- `npm run types:check`: Berhasil (TypeScript tanpa kompilasi galat).
- `npm run check`: Berhasil (Formatting & ESLint lulus 100% pada 104 file).
- `npm run build`: Berhasil (Bundle aset Vite frontend terbangun sukses dalam 1m 56s).
- `vendor/bin/pint`: Berhasil (Format kode PHP PSR-12).
- `vendor/bin/phpstan`: Berhasil (Static analysis level 5 lulus dengan 0 kesalahan).
- `composer test`: Berhasil (Seluruh 197 tes fitur dan unit lulus dengan 1.091 assertions).

---

## 13. Keterbatasan & Batasan Ruang Lingkup (Known Limitations & Scope)

- **Ruang Lingkup Terjaga**: Fase 11B secara ketat hanya mencakup antarmuka review pengajuan titipan siswa, pencarian, filter, inspeksi detail, penetapan margin, persetujuan, dan penolakan.
- **Tidak Termasuk**:
  - CRUD produk umum koperasi (non-titipan).
  - Antarmuka manajemen stok harian / opname fisik.
  - Antarmuka manajemen pesanan pelanggan.
  - Laporan keuangan, analitik, dan bagi hasil laba.
  - Notifikasi email / push otomatis ke siswa.
