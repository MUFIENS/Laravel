# KOPDIG Marketplace & Product Discovery Implementation

Dokumentasi implementasi fitur katalog belanja digital dan penemuan produk siswa (*student marketplace discovery*) pada platform KOPDIG (Koperasi Digital SMK / Ruang Niaga Warga Sekolah) untuk Fase 6A.

---

## 1. Ringkasan Fitur & Batasan Lingkup (Scope Boundaries)

Fase 6A berfokus secara eksklusif pada **pengalaman penemuan produk (product discovery)** bagi siswa di lingkungan sekolah:
- **Tercakup dalam Fase 6A:**
  - Beranda katalog belanja (*marketplace home*) dengan data basis data nyata.
  - Penjelajahan berbasis kategori aktif (*category browsing & filtering*).
  - Pencarian produk terotomatisasi (*server-driven search*).
  - Penyajian sumber produk yang transparan (*product provenance: Koperasi vs Titipan Siswa*).
  - Status ketersediaan stok (*in_stock*, *low_stock*, *out_of_stock*).
  - Status penanganan khusus (*empty state*, *loading state*, penanganan gambar gagal).
  - Paginasi mobile yang ringan dan terukur (*paginated product catalog*).
- **Di Luar Lingkup (Strictly Out of Scope):**
  - Penyimpanan keranjang belanja (*cart persistence*).
  - Logika backend penambahan ke keranjang (*add-to-cart transactional logic*).
  - Proses *checkout*, pembuatan pesanan (*orders*), pembayaran (*payments*), dan integrasi antrean/QR *pickup*.
  - Aksi tombol "Tambah" pada kartu produk difungsikan secara murni sebagai **afirmasi visual pratinjau (visual placeholder)** dengan notifikasi transparan bahwa fitur pemesanan aktif pada fase berikutnya, tanpa merekam data transaksi palsu.

---

## 2. Struktur Rute Marketplace (Marketplace Route Structure)

Rute marketplace diintegrasikan langsung ke dalam arsitektur Laravel + Inertia pada file `routes/web.php`:

| Method | URI | Rute Nama | Pengendali | Aksesibilitas | Fungsi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `home` | `MarketplaceController@index` | Publik / Siswa / Koperasi | Beranda utama penemuan produk koperasi dan karya siswa. |
| `GET` | `/explore` | `explore` | `MarketplaceController@index` | Publik / Siswa / Koperasi | Rute alternatif eksplorasi katalog yang dipetakan pada dok navigasi bawah. |

---

## 3. Strategi Kueri & Optimasi Performa (Query Strategy)

Kueri katalog dirancang efisien guna menghindari masalah umum seperti kueri $N+1$ dan pemborosan memori pada perangkat seluler:

1. **Pemilihan Kolom Selektif (`select`):**
   Server hanya memuat kolom yang dibutuhkan untuk merender kartu dan grid produk:
   `id`, `category_id`, `owner_id`, `name`, `slug`, `description`, `image_path`, `source_type`, `selling_price`, `stock`, `status`, `is_featured`, `published_at`.
2. **Eager Loading Terbatas (`with`):**
   - `category:id,name,slug`: Memuat data kategori tanpa memuat kolom metadata atau deskripsi panjang.
   - `owner:id,name`: **Hanya memuat ID dan nama siswa.** Tidak pernah memuat email, password, nomor induk siswa (NISN), atau token sensitif.
3. **Penyortiran Terarah:**
   Produk diurutkan berdasarkan `is_featured` secara menurun (produk unggulan tampil di awal), kemudian `published_at` terbaru, dan `id` secara stabil.
4. **Paginasi Terukur:**
   Menggunakan `paginate(12)->withQueryString()`, membatasi beban muat browser pada 12 kartu per halaman seluler sekaligus mempertahankan parameter filter aktif di URL.

---

## 4. Aturan Visibilitas Produk Publik (Public Visibility Rules)

Server bertindak sebagai penjaga otoritas tunggal (*server-side gatekeeper*) atas produk yang layak tampil di katalog umum.

- **Aturan Ketat Status:**
  $$\text{Visible Produk} \iff \text{product.status} === \text{ProductStatus::Active}$$
- **Pengecualian Mutlak:**
  - Produk berstatus `draft` **TIDAK PERNAH** ditampilkan di katalog publik.
  - Produk berstatus `inactive` **TIDAK PERNAH** ditampilkan di katalog publik.
  - Produk berstatus `archived` **TIDAK PERNAH** ditampilkan di katalog publik.
  - Pengajuan produk siswa (`product_submissions`) yang belum disetujui koperasi tidak dapat diakses di marketplace publik.
- **Penyaringan di Sisi Server:**
  Penyaringan visibilitas diterapkan langsung pada klausa SQL `where('status', ProductStatus::Active)`, bukan dengan memuat semua data lalu menyembunyikannya menggunakan JavaScript di browser.

---

## 5. Perilaku Pencarian & Penyaringan Kategori

### 5.1 Pencarian Terstandarisasi (*Normalized Search*)
- Pengguna dapat mencari berdasarkan nama maupun deskripsi produk.
- Input string dinormalisasi di server (pemangkasan spasi *whitespace* dan pembatasan panjang maksimum 100 karakter).
- Kueri dijalankan menggunakan parameter aman binding Eloquent untuk mencegah *SQL Injection*:
  ```php
  $query->where(function ($q) use ($normalizedSearch) {
      $q->where('name', 'like', '%'.$normalizedSearch.'%')
        ->orWhere('description', 'like', '%'.$normalizedSearch.'%');
  });
  ```

### 5.2 Penyaringan Kategori Dinamis (*Category Filtering*)
- Kategori aktif diambil langsung dari tabel `categories` yang terdaftar di basis data, diurutkan menurut kolom `display_order`.
- Chip navigasi kategori ("Semua", "Jajanan", "Minuman", "ATK & Buku", "Atribut Sekolah", "Karya Siswa") ditampilkan dalam bar gulir horizontal seluler.
- Memilih kategori memperbarui parameter URL `?category={slug}` melalui permintaan Inertia parsial dengan opsi `preserveScroll: true`.

### 5.3 Filter Tambahan (Provenans & Ketersediaan Stok)
- **Sumber Produk (`source`):** Mendukung filter cepat `cooperative` (Produk Koperasi) atau `student` (Karya Titipan Siswa).
- **Ketersediaan (`availability`):** Pilihan `in_stock` memfilter produk yang memiliki `stock > 0`.

---

## 6. Penyajian Sumber Produk & Privasi Siswa (Provenance & Privacy)

Sistem membedakan dua sumber kepemilikan produk secara visual pada kartu produk:

| Sumber Produk (`source_type`) | Format Tampilan Label | Aturan Privasi Siswa |
| :--- | :--- | :--- |
| `cooperative` | **Koperasi** (Badge Hijau Forest dengan ikon Toko) | Barang pengadaan resmi koperasi sekolah; tidak memerlukan nama pemilik personal. |
| `student` | **Dititipkan oleh {Nama Siswa}** (Badge Gold dengan ikon Verifikasi) | Menampilkan nama siswa pembuat karya untuk menumbuhkan apresiasi wirausaha. |

### Keputusan Privasi Krusial (*Privacy Decisions*):
- Kolom sensitif siswa seperti `email`, `student_identifier` (NISN), nomor telepon, dan data profil privat **dikecualikan dari muatan API publik**.
- Data finansial internal koperasi, seperti harga modal siswa (`base_price`) dan margin laba koperasi (`cooperative_margin`), **dikecualikan dari kartu katalog publik**. Pembeli umum hanya melihat harga jual resmi (`selling_price`).

---

## 7. Status Ketersediaan Stok (Stock Awareness)

Sistem menyajikan status inventaris yang mudah dimengerti siswa tanpa membuka log audit pergudangan internal:

| Kondisi Stok | Status Teknis | Label Antarmuka | Indikator & Perilaku Kartu |
| :--- | :--- | :--- | :--- |
| `stock > 5` | `in_stock` | *Tersedia* | Tombol "Tambah" aktif dengan warna tema Forest Green. |
| `1 <= stock <= 5` | `low_stock` | *Sisa {n}* | Badge penanda kuning tembaga ("Sisa 3") untuk mengingatkan kuota terbatas sebelum jam istirahat. |
| `stock === 0` | `out_of_stock` | *Habis* | Badge merah penanda "Habis", saturasi gambar diturunkan, dan tombol aksi dinonaktifkan (`disabled`) dengan teks "Stok Habis". |

---

## 8. Penanganan Gambar & Kondisi Khusus (Images & Edge States)

### 8.1 Penanganan Gambar Produk (Graceful Image Fallback)
- Rasio aspek gambar ditetapkan seragam 1:1 (`aspect-square`).
- Gambar dimuat secara bertahap menggunakan atribut HTML native `loading="lazy"`.
- Jika URL gambar bernilai `null` atau gagal dimuat (*HTTP 404/broken*), komponen mendeteksi kejadian `onError` dan secara instan mengganti wadah gambar dengan ilustrasi placeholder elegan bersiluet ikon paket dan label kategori produk pada latar `surface-subtle`. Kerusakan satu aset gambar tidak akan merusak tata letak kartu.

### 8.2 Kondisi Kosong (*Empty States*)
- **Pencarian Tanpa Hasil:** Menampilkan ilustrasi pencarian kosong, teks penjelas interaktif, dan tombol langsung untuk **"Hapus Pencarian"**.
- **Kategori Belum Memiliki Produk:** Menampilkan ilustrasi kantong belanja kosong dan tombol **"Lihat Semua Kategori"**.
- **Katalog Kosong Total:** Menampilkan pesan informatif bahwa koperasi sedang mempersiapkan stok barang untuk sesi istirahat berjalan.

---

## 9. Desain Responsif & Aksesibilitas (Responsive & A11y)

- **Target Lebar Layar Seluler:** Diuji optimal pada resolusi 320px, 375px, 390px, dan 430px.
- **Kisi Produk Adaptif:** Menggunakan 2 kolom pada ponsel (`grid-cols-2`), 3 kolom pada tablet (`sm:grid-cols-3`), dan 4 kolom pada desktop (`md:grid-cols-4`).
- **Sentuhan Interaktif:** Semua tombol interaktif (tombol tambah, chip kategori, navigasi halaman) mematuhi batas minimum area sentuh 40–44px.
- **Semantik Dokumen:** Menggunakan tag semantik `<article>`, `<section>`, `<nav>`, `<form>`, `<input type="search">`, serta atribut pendukung pembaca layar (`aria-label`, `aria-current`, `role="status"`).

---

## 10. Pengujian Fitur Otomatis (Automated Tests)

Pengujian fitur diimplementasikan pada `tests/Feature/MarketplaceTest.php` dengan 10 skenario pengujian berbasis basis data nyata:

1. `test_user_can_access_marketplace_homepage`: Memverifikasi akses publik ke beranda marketplace dan keberadaan prop Inertia (`products`, `categories`, `filters`).
2. `test_inactive_products_are_not_publicly_returned`: Memverifikasi produk berstatus `inactive` disaring keluar dari katalog.
3. `test_archived_products_are_not_publicly_returned`: Memverifikasi produk berstatus `archived` tidak tampil.
4. `test_draft_products_are_not_publicly_returned`: Memverifikasi produk `draft` tertahan di sisi server.
5. `test_category_filtering_works`: Memverifikasi filter kueri `?category=jajanan` hanya mengembalikan produk dari kategori terkait.
6. `test_search_works_on_name_and_description`: Memverifikasi pencarian nama produk dan pencarian kata kunci di deskripsi.
7. `test_pagination_works`: Memverifikasi paginasi 12 item per halaman beserta nomor halaman dan total rekaman.
8. `test_product_source_data_is_correctly_resolved`: Memverifikasi resolusi identitas sumber koperasi (`owner = null`) dan titipan siswa (`owner.name = 'Budi Santoso'`).
9. `test_unauthorized_internal_fields_are_not_exposed`: Memverifikasi `base_price` dan `cooperative_margin` tidak bocor ke publik, serta melindungi `email` dan `student_identifier` milik siswa.
10. `test_empty_search_result_behaves_correctly`: Memverifikasi respon pencarian nihil tanpa menyebabkan galat server.

---

## 11. Hasil Validasi Mutu Kode

Semua pengujian dan perangkat verifikasi dijalankan dengan hasil bersih:

- **Laravel Pint (Linting):** `composer run lint:check` $\to$ **PASSED**
- **PHPStan Static Analysis (Level 5):** `composer run types:check` $\to$ **PASSED (0 errors)**
- **Pest / PHPUnit Test Suite:** `php artisan test` $\to$ **76 tests PASSED, 380 assertions (0 failures)**
- **Biome / VitePress Check:** `npm run check` $\to$ **PASSED (86 files formatted, 0 warnings, 0 errors)**
- **TypeScript Static Types:** `npm run types:check` $\to$ **PASSED (0 type errors)**
- **Vite Production Asset Build:** `npm run build` $\to$ **PASSED (Compiled in 5.38s)**
