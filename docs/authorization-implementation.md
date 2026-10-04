# KOPDIG Authentication, Authorization & Consignment Access Control

Dokumentasi implementasi otentikasi, otorisasi berbasis peran (RBAC), otorisasi kepemilikan (ownership-based), otorisasi status sumber daya (state-based), dan kontrol akses titipan konsinyasi produk siswa pada platform KOPDIG (Koperasi Digital SMK / Ruang Niaga Warga Sekolah).

---

## 1. Definisi Peran (Role Definitions)

Sistem KOPDIG secara ketat hanya memiliki **dua peran resmi**:

| Peran | Enum (`UserRole`) | Deskripsi & Konteks Bisnis |
| :--- | :--- | :--- |
| **Siswa** | `student` | Akun siswa terverifikasi di sekolah. Siswa dapat bertindak dalam dua konteks bisnis: (1) sebagai pembeli di marketplace, dan (2) sebagai pemilik produk titipan (consignor). **Tidak ada peran `seller` atau `consignor` terpisah.** Hak mengajukan produk bersumber langsung dari akun siswa yang terotentikasi. |
| **Pengurus Koperasi** | `cooperative` | Pengelola resmi koperasi sekolah. Memegang kewenangan administratif penuh atas kurasi katalog, penetapan margin koperasi, persetujuan/penolakan titipan siswa, pengawasan inventaris, dan verifikasi operasional. |

> [!IMPORTANT]
> **Prinsip Bebas Peran Ganda:**
> KOPDIG **tidak** membuat peran terpisah untuk "penjual", "toko", atau "vendor". Kemampuan siswa mengajukan titipan barang merupakan kapabilitas bawaan akun siswa berdasarkan aturan bisnis koperasi sekolah.

---

## 2. Matriks Hak Akses & Kewenangan (Permissions Matrix)

### 2.1 Hak Akses Siswa (`student`)

Siswa yang terotentikasi memiliki kewenangan berikut:

- **Akun & Profil:**
  - Melihat profil pribadi (`name`, `email`, `student_identifier`, `avatar_path`).
  - Memperbarui data profil yang diizinkan dan mengubah kata sandi.
  - Melakukan sesi *logout*.
- **Katalog & Belanja (Buyer Context):**
  - Menjelajahi katalog produk aktif koperasi.
  - Mencari produk dan memfilter berdasarkan kategori.
  - Melihat rincian produk aktif.
  - Mengelola keranjang belanja pribadi (*cart*).
  - Melakukan *checkout* dan membuat pesanan pribadi (*order*).
  - Melihat nomor antrean, sesi pengambilan, dan kode QR *pickup* milik sendiri.
- **Konsinyasi Produk (Consignor Context):**
  - Mengakses halaman "Titipan Saya" (`/student/consignments`).
  - Membuat pengajuan titipan produk baru (`ProductSubmission`).
  - Mengisi formulir harga modal/pokok siswa, usulan kuota stok, deskripsi, dan kategori.
  - Melihat daftar pengajuan titipan miliknya beserta riwayat status verifikasi.
  - Melihat rincian pengajuan titipan miliknya (termasuk catatan/alasan penolakan dari koperasi jika ditolak).
  - Mengubah (*edit*) data pengajuan miliknya **hanya selama status pengajuan masih `submitted`** (belum dikunci untuk ditinjau atau diputuskan oleh koperasi).
  - Membatalkan/menghapus pengajuan miliknya **hanya selama status pengajuan masih `submitted`**.
  - Melihat daftar produk konsinyasi miliknya yang telah disetujui dan aktif di marketplace koperasi.

**Batasan Ketat Siswa (Siswa DILARANG):**
- Mengubah status persetujuan titipan secara mandiri.
- Mengesahkan atau mempublikasikan produk langsung ke katalog marketplace.
- Menentukan atau memodifikasi margin keuntungan koperasi (`cooperative_margin`).
- Mengakses atau memanipulasi pengajuan milik siswa lain (*anti-IDOR*).
- Meninjau data audit internal koperasi atau mengelola katalog produk koperasi secara global.
- Mengubah peran akun menjadi `cooperative`.

---

### 2.2 Hak Akses Pengurus Koperasi (`cooperative`)

Pengurus koperasi yang terotentikasi memiliki kewenangan berikut:

- **Kurasi Konsinyasi & Persetujuan:**
  - Mengakses portal peninjauan konsinyasi (`/cooperative/consignments`).
  - Meninjau seluruh pengajuan produk siswa dari semua kelas/jurusan.
  - Memfilter pengajuan berdasarkan status (`submitted`, `under_review`, `approved`, `rejected`).
  - Memeriksa kelayakan deskripsi, harga pokok siswa, usulan stok, dan identitas pengaju.
  - **Menyetujui Pengajuan (`approve`):** Menentukan margin keuntungan koperasi (`cooperative_margin`), menghitung harga jual katalog (`selling_price = base_price + margin`), menerbitkan produk aktif ke katalog (`Product`), serta mencatat mutasi restok inventaris awal (`InventoryMovement`).
  - **Menolak Pengajuan (`reject`):** Mewajibkan pengisian alasan penolakan (`rejection_reason`) sebagai umpan balik edukatif dan transparan kepada siswa.
- **Katalog & Inventaris Marketplace:**
  - Mengelola ketersediaan produk, stok koperasi, dan status produk (aktif/nonaktif).
  - Mengawasi arus pergerakan inventaris (*inventory audit logs*).
- **Operasional Pesanan & Pengambilan:**
  - Mengawasi seluruh pesanan operasional.
  - Mengelola sesi antrean *pickup* barang.
  - Memindai dan memverifikasi token QR pengambilan pesanan.
  - Menerbitkan laporan margin koperasi dan penjualan produk titipan siswa.

**Batasan Ketat Pengurus Koperasi (Koperasi DILARANG):**
- Mengubah riwayat transaksi snapshot finansial yang bersifat *immutable*.
- Mengakui produk titipan siswa sebagai milik koperasi (sistem secara mutlak mempertahankan `owner_id = student.id` dan `source_type = student`).
- Menghapus audit log pergerakan stok atau riwayat pembayaran yang sah.

---

## 3. Pembedaan Mutlak: "Pengajuan Siswa" vs "Persetujuan Koperasi"

Aturan bisnis inti KOPDIG menegaskan pemisahan konsep antara **Pengajuan (`ProductSubmission`)** dan **Produk Katalog (`Product`)**:

```
[ Siswa Terotentikasi ]
         |
         |  1. Mengirim Formulir Usulan
         v
+------------------------+
|   ProductSubmission    |  <--- Status: 'submitted' (Belum Masuk Katalog Marketplace)
+------------------------+
         |
         |  2. Ditinjau Pengurus Koperasi
         v
+------------------------+
|  Peninjauan Koperasi   |
+------------------------+
       /        \
      /          \
  (Setuju)     (Tolak + Alasan)
    /              \
   v                v
+-----------------+  +-------------------------------+
|     Product     |  | ProductSubmission: 'rejected' |
| (Katalog Aktif) |  | Alasan Edukatif Tersimpan     |
+-----------------+  +-------------------------------+
```

1. **Siswa Hanya Berwenang Mengajukan (`student may submit`):**
   - Siswa mengirimkan permohonan keikutsertaan produk ke koperasi (`ProductSubmission`).
   - Usulan mencakup harga pokok modal yang diinginkan siswa (`base_price`) dan jumlah barang yang disiapkan (`proposed_stock`).
   - Pengajuan yang dikirim **belum** menjadi produk marketplace dan **tidak dapat dibeli** oleh siapa pun.
2. **Koperasi Merupakan Otoritas Tunggal Persetujuan (`cooperative may approve`):**
   - Keputusan apakah barang diizinkan beredar di lingkungan sekolah berada sepenuhnya di tangan pengurus koperasi.
   - Pengurus koperasi menetapkan margin koperasi (`cooperative_margin`) yang adil dan wajar sesuai kebijakan koperasi sekolah.
   - Saat disetujui, sistem secara otomatis menerbitkan rekaman baru di tabel `products` dengan relasi kepemilikan siswa tetap terjaga (`owner_id = student.id`).
   - Produk hasil persetujuan titipan ditandai dengan `source_type = student` guna membedakannya dari barang dagangan pengadaan mandiri koperasi (`source_type = cooperative`).

---

## 4. Model Otorisasi Tiga Lapis (Three-Layer Authorization Model)

KOPDIG menerapkan evaluasi otorisasi di sisi server dengan tiga lapis validasi berurutan:

$$\text{Akses Diizinkan} \iff \text{ROLE} \land \text{OWNERSHIP} \land \text{RESOURCE STATE}$$

### 4.1 Lapis 1: Peran (Role Gate)
- Rute-rute aplikasi dilindungi oleh middleware `role:student` atau `role:cooperative`.
- Upaya akses antar-peran (misal siswa mengakses rute koperasi, atau koperasi mengakses formulir pengajuan konsinyasi siswa) langsung ditolak dengan status HTTP 403 Forbidden.

### 4.2 Lapis 2: Kepemilikan (Ownership Gate)
- Melindungi dari serangan IDOR (*Insecure Direct Object Reference*).
- Setiap tindakan pada rekaman spesifik (seperti membaca detail pengajuan pada `student.consignments.show` atau memperbarui pada `student.consignments.update`) wajib memverifikasi:
  $$\text{submission.student\_id} === \text{authenticated\_user.id}$$
- Siswa A tidak dapat membaca atau memanipulasi pengajuan milik Siswa B, meskipun parameter URL diubah secara manual.

### 4.3 Lapis 3: Status Sumber Daya (State Gate)
- Hak akses dipengaruhi oleh siklus hidup (*lifecycle*) sumber daya:
  - **Status `submitted`:** Siswa diizinkan mengedit atau membatalkan pengajuannya.
  - **Status `under_review`, `approved`, atau `rejected`:** Pengajuan dikunci (*immutable* bagi siswa). Siswa tidak dapat mengedit atau menghapus rekaman tersebut karena telah masuk tahap kurasi atau telah menghasilkan produk katalog aktif.

---

## 5. Implementasi Kebijakan & Middleware (Policies & Middleware)

### 5.1 Middleware Peran: `EnsureUserHasRole`
File: `app/Http/Middleware/EnsureUserHasRole.php`

- Didaftarkan sebagai alias `'role'` di `bootstrap/app.php`.
- Memeriksa apakah pengguna terotentikasi dan memiliki nilai `UserRole` yang sesuai dengan parameter rute.
- Jika pengguna belum login, dialihkan ke halaman login. Jika peran tidak cocok, melempar HTTP 403 Forbidden.

```php
if ($user->role !== $roleEnum) {
    abort(403, 'Akses tidak diizinkan untuk peran akun Anda.');
}
```

### 5.2 Kebijakan Pengajuan Produk: `ProductSubmissionPolicy`
File: `app/Policies/ProductSubmissionPolicy.php`

- `view(User $user, ProductSubmission $submission)`:
  - Diizinkan jika `$user->isCooperative()`.
  - Diizinkan jika `$user->isStudent()` dan `$user->id === $submission->student_id`.
- `create(User $user)`:
  - Hanya diizinkan jika `$user->isStudent()`.
- `update(User $user, ProductSubmission $submission)`:
  - Wajib memenuhi: `$user->id === $submission->student_id` **dan** `$submission->status === ProductSubmissionStatus::Submitted`.
- `delete(User $user, ProductSubmission $submission)`:
  - Wajib memenuhi: `$user->id === $submission->student_id` **dan** `$submission->status === ProductSubmissionStatus::Submitted`.
- `review(User $user, ProductSubmission $submission)`:
  - Hanya diizinkan jika `$user->isCooperative()`.
- `approve(User $user, ProductSubmission $submission)`:
  - Wajib memenuhi: `$user->isCooperative()` **dan** `$submission->status !== ProductSubmissionStatus::Approved`.
- `reject(User $user, ProductSubmission $submission)`:
  - Wajib memenuhi: `$user->isCooperative()` **dan** `$submission->status !== ProductSubmissionStatus::Approved`.

### 5.3 Kebijakan Produk: `ProductPolicy`
File: `app/Policies/ProductPolicy.php`

- `manage(User $user, Product $product)`: Hanya koperasi yang berhak mengedit data inventaris katalog publik.
- `viewConsignmentSales(User $user, Product $product)`: Siswa pemilik produk (`$user->id === $product->owner_id`) dapat melihat data penjualan dan sisa stok konsinyasi miliknya.

### 5.4 Kebijakan Pesanan: `OrderPolicy`
File: `app/Policies/OrderPolicy.php`

- `view(User $user, Order $order)`: Pengurus koperasi dapat melihat seluruh pesanan untuk kepentingan operasional; siswa hanya dapat melihat pesanan dengan `$order->user_id === $user->id`.
- `create(User $user)`: Hanya siswa yang dapat membuat pesanan belanja di marketplace.

---

## 6. Strategi Rute & Alur Masuk (Route Strategy & Entry Flow)

### 6.1 Alur Masuk Cerdas Berbasis Peran (`/dashboard`)
File: `app/Http/Controllers/DashboardController.php`

Rute default Fortify pasca-login (`/dashboard`) dialihkan secara dinamis sesuai peran pengguna:
- **Pengurus Koperasi (`cooperative`):** Dialihkan ke portal kurasi konsinyasi: `route('cooperative.consignments.index')`.
- **Siswa (`student`):** Dialihkan ke beranda marketplace: `route('home')`.

### 6.2 Pembagian Rute Terproteksi
File: `routes/web.php`

| URI Prefix | Middleware | Controller | Deskripsi Fungsional |
| :--- | :--- | :--- | :--- |
| `/student/consignments` | `auth`, `role:student` | `Student\ConsignmentController` | Ruang kerja siswa: melihat titipan, mengajukan barang baru, mengedit/membatalkan usulan yang belum direview. |
| `/cooperative/consignments` | `auth`, `role:cooperative` | `Cooperative\ConsignmentReviewController` | Ruang kerja koperasi: meninjau daftar pengajuan, verifikasi kelayakan, persetujuan bersyarat margin, penolakan edukatif. |

---

## 7. Perlindungan Keamanan (Security Protections)

1. **Pencegahan Eskalasi Peran Publik (Role Escalation Prevention):**
   - Registrasi publik (`CreateNewUser.php`) secara mutlak menetapkan `'role' => UserRole::Student`.
   - Parameter `role` apa pun yang dikirimkan oleh klien diabaikan secara tegas oleh server. Akun koperasi wajib diprovisi melalui seeder resmi atau mekanisme administratif terkontrol.
2. **Pencegahan Mass Assignment:**
   - Formulir pembaharuan titipan siswa (`update`) memvalidasi input hanya untuk data deskriptif produk. Nilai `status`, `cooperative_margin`, `reviewed_by`, dan `product_id` diabaikan dan tidak dapat dimanipulasi siswa.
3. **Pencegahan IDOR (Insecure Direct Object Reference):**
   - Pengambilan rincian pengajuan diverifikasi melalui `ProductSubmissionPolicy::view`. Akses siswa terhadap ID pengajuan milik siswa lain menghasilkan respon HTTP 403 Forbidden.
4. **Transaksi Basis Data Atomik:**
   - Proses persetujuan konsinyasi oleh koperasi dibungkus dalam `DB::transaction`. Pembuatan record `Product`, pembaruan record `ProductSubmission`, dan pencatatan awal mutasi stok di `InventoryMovement` dieksekusi secara serentak, mencegah inkonsistensi data jika terjadi gangguan di tengah proses.
5. **Keamanan Sesi & CSRF:**
   - Semua rute mutasi state (`POST`, `PUT`, `DELETE`) dilindungi token CSRF Laravel dan validasi session aktif. Pemanggilan logout mematikan otentikasi sesi secara tuntas.

---

## 8. Verifikasi Uji Otomatis (Automated Authorization Tests)

Pengujian fitur otorisasi diimplementasikan di `tests/Feature/AuthorizationTest.php` dengan 17 skenario teruji:

| No | Nama Skenario Uji | Kondisi yang Diverifikasi | Status |
| :---: | :--- | :--- | :---: |
| 1 | `test_guest_cannot_access_student_routes` | Tamu (belum login) dialihkan ke `/login` saat mengakses `/student/consignments`. | PASSED |
| 2 | `test_guest_cannot_access_cooperative_routes` | Tamu dialihkan ke `/login` saat mengakses rute `/cooperative/consignments`. | PASSED |
| 3 | `test_student_can_access_student_routes` | Siswa terotentikasi mendapat respon 200 OK pada area kerja siswa. | PASSED |
| 4 | `test_cooperative_can_access_cooperative_routes` | Koperasi terotentikasi mendapat respon 200 OK pada portal peninjauan. | PASSED |
| 5 | `test_student_cannot_access_cooperative_routes` | Siswa mendapat HTTP 403 saat mencoba membuka portal peninjauan koperasi. | PASSED |
| 6 | `test_cooperative_cannot_access_student_only_routes` | Koperasi mendapat HTTP 403 saat mencoba mengakses formulir pengajuan konsinyasi siswa. | PASSED |
| 7 | `test_student_can_create_a_consignment_submission` | Siswa berhasil mengirim pengajuan baru dengan status otomatis `submitted` dan `student_id` sesuai sesi. | PASSED |
| 8 | `test_student_can_only_read_own_submission` | Siswa berhasil melihat pengajuan miliknya sendiri (200 OK). | PASSED |
| 9 | `test_student_cannot_read_another_students_submission` | Siswa mendapat HTTP 403 Forbidden saat membuka pengajuan milik siswa lain (IDOR protection). | PASSED |
| 10 | `test_student_cannot_approve_a_submission` | Siswa mendapat HTTP 403 saat mengirim request POST ke endpoint persetujuan. | PASSED |
| 11 | `test_student_cannot_change_approval_status_or_margins` | Siswa yang mencoba mengirimkan payload perubahan `status` atau `cooperative_margin` tidak dapat mengubah status dari `submitted`. | PASSED |
| 12 | `test_cooperative_can_review_any_student_submission` | Pengurus koperasi dapat membuka dan memeriksa pengajuan siswa manapun (200 OK). | PASSED |
| 13 | `test_cooperative_can_approve_a_submission` | Persetujuan koperasi menerbitkan rekaman `Product` (dengan `owner_id` siswa dan `source_type = student`), mencatat margin, dan membuat log mutasi restok. | PASSED |
| 14 | `test_cooperative_can_reject_a_submission` | Penolakan koperasi mewajibkan alasan penolakan dan mengunci pengajuan dengan status `rejected`. | PASSED |
| 15 | `test_student_cannot_modify_an_approval_locked_submission` | Siswa dilarang mengedit atau menghapus pengajuan yang telah berstatus `approved` atau `rejected` (403 Forbidden). | PASSED |
| 16 | `test_public_registration_cannot_create_a_cooperative_account` | Payload registrasi publik dengan `role: cooperative` tetap dipaksa menjadi `role: student`. | PASSED |
| 17 | `test_logout_invalidates_the_authenticated_session` | Logout menghapus sesi otentikasi; panggilan berikutnya ditolak ke `/login`. | PASSED |

---

## 9. Hasil Validasi Suite Lengkap

Semua tahapan validasi kode dijalankan dan dinyatakan 100% bersih tanpa peringatan atau eror:

- **PHP Code Style:** `vendor/bin/pint --parallel --test` $\to$ **PASSED**
- **Static Analysis:** `vendor/bin/phpstan analyse --memory-limit=512M` (PHPStan Level 5) $\to$ **PASSED (0 errors)**
- **Automated Tests:** `php artisan test` $\to$ **66 tests PASSED, 233 assertions** (termasuk integritas relasi basis data dan otorisasi fitur)
- **Frontend Linter & Formatter:** `npm run check` $\to$ **PASSED (All 85 files clean, 0 warnings, 0 errors)**
- **TypeScript Type Checker:** `npm run types:check` $\to$ **PASSED (0 type errors)**
- **Production Asset Build:** `npm run build` $\to$ **PASSED (Compiled in 5.60s)**
