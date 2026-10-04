# KOPDIG Product Detail & Product Decision Experience Implementation

Dokumentasi implementasi teknis halaman rincian produk (*product detail page*) dan pengalaman pengambilan keputusan belanja siswa (*product decision experience*) pada platform KOPDIG (Koperasi Digital SMK / Ruang Niaga Warga Sekolah) untuk Fase 6B.

---

## 1. Ringkasan & Batasan Lingkup (Scope Boundaries)

Fase 6B berfokus pada penyediaan informasi produk yang komprehensif, transparan, dan terpercaya agar siswa dapat memahami kualitas, sumber, harga resmi, dan ketersediaan stok sebelum memutuskan untuk membeli:

- **Tercakup dalam Fase 6B:**
  - Rute rincian produk publik: `/products/{product}` dengan pencarian berbasis *slug* atau *ID*.
  - Penyajian citra produk (*aspect-square* dengan penanganan *fallback* anggun).
  - Tampilan asal produk (*provenance: Koperasi vs Titipan Siswa*).
  - Harga resmi dalam format Rupiah integer (`PriceDisplay`).
  - Penegasan ketersediaan stok (*in_stock*, *low_stock*, *out_of_stock*).
  - Rincian deskripsi produk berjenjang dengan penanganan teks kosong.
  - Tautan kontekstual kategori yang terhubung kembali ke filter marketplace.
  - Fondasi interaksi jumlah pesanan (*quantity stepper*) dan tombol aksi *"Tambah ke Keranjang"*.
  - Bagian produk rekomendasi sejenis dari kategori yang sama (*related products*).
- **Di Luar Lingkup (Strictly Out of Scope):**
  - Mutasi basis data keranjang (*cart persistence / cart_items mutation*).
  - Alur transaksi *checkout*, pembuatan pesanan (*orders*), pembayaran Midtrans, dan pemindaian QR *pickup*.
  - Aksi *"Tambah ke Keranjang"* berfungsi sebagai **fondasi interaksi visual pratinjau (visual placeholder)** dengan notifikasi transparan bahwa keranjang dan pemesanan aktif pada fase berikutnya, tanpa merekam data transaksi palsu.

---

## 2. Struktur Rute & Pengikatan Model (Route Architecture)

Rute rincian produk diintegrasikan pada `routes/web.php`:

| Method | URI | Nama Rute | Pengendali | Aksesibilitas |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/products/{product}` | `products.show` | `ProductController@show` | Publik / Siswa / Pengurus Koperasi |

### Mekanisme Pengikatan Rute (Route Model Binding):
- Model `Product` mengimplementasikan `getRouteKeyName(): string` yang mengembalikan `'slug'`. Dengan demikian, pemanggilan `route('products.show', $product)` menghasilkan URL ramah SEO, misalnya `/products/risol-mayo-keju-lumer-homemade`.
- Model juga mengimplementasikan `resolveRouteBinding($value, $field = null)` kustom: jika `$value` berupa angka numerik, sistem mencocokkan kolom `id`; jika berupa string, sistem mencocokkan kolom `slug`. Hal ini menjamin fleksibilitas tautan dari berbagai antarmuka.

---

## 3. Aturan Visibilitas Publik di Sisi Server (Server-Side Visibility)

Server memegang kendali otoritatif mutlak terhadap produk yang diizinkan untuk dibuka:

$$\text{Akses Halaman Rincian Diizinkan} \iff \text{product.status} === \text{ProductStatus::Active}$$

- **Penegakan 404 HttpNotFound:**
  Jika produk berstatus `draft`, `inactive`, atau `archived`, `ProductController::show` secara langsung memutus permintaan dengan:
  ```php
  if ($product->status !== ProductStatus::Active) {
      abort(404, 'Produk tidak ditemukan atau tidak tersedia.');
  }
  ```
- Sistem **tidak mengandalkan pengalihan sisi klien (*client-side redirects*)**, sehingga mencegah kebocoran data produk internal ke inspeksi jaringan peramban.

---

## 4. Strategi Pengambilan Data & Privasi Siswa (Data Retrieval & Privacy)

Pengambilan data dioptimasi secara ketat untuk melindungi privasi siswa dan kerahasiaan kalkulasi internal koperasi:

1. **Pemilihan Kolom Eksplisit:**
   Server hanya memproyeksikan kolom-kolom publik:
   `id`, `category_id`, `name`, `slug`, `description`, `image_path`, `source_type`, `selling_price`, `stock`, `status`, `is_featured`, `published_at`.
2. **Perlindungan Finansial Internal Koperasi:**
   - Kolom harga pokok modal siswa (`base_price`) dan margin keuntungan koperasi (`cooperative_margin`) **TIDAK PERNAH DIEKSPOS** ke muatan halaman publik. Pembeli umum hanya melihat harga jual resmi (`selling_price`).
3. **Perlindungan Privasi Siswa Pemilik Titipan:**
   - Relasi pemilik dimuat menggunakan `owner:id,name`.
   - Kolom sensitif siswa seperti `email`, `student_identifier` (NISN), `password`, dan token keamanan **secara mutlak disaring dan tidak dimuat**.
4. **Produk Rekomendasi Terkait (*Related Products*):**
   - Mengambil maksimal 4 produk sejenis berstatus aktif dari `category_id` yang sama, mengecualikan produk yang sedang dibuka (`where('id', '!=', $product->id)`).

---

## 5. Tampilan Asal Produk (Product Source Presentation)

Label asal produk menguatkan identitas brand KOPDIG sebagai *"Ruang Niaga Warga Sekolah"*:

- **Produk Koperasi Sekolah (`cooperative`):**
  - Ditampilkan dengan badge hijau Forest bertuliskan *"Koperasi"* berikon toko.
  - Kartu penjamin mutu menegaskan bahwa produk merupakan pengadaan resmi koperasi dengan jaminan standar kualitas sekolah.
- **Karya Titipan Siswa (`student`):**
  - Ditampilkan dengan badge tembaga bertuliskan *"Dititipkan oleh {Nama Siswa}"* berikon verifikasi.
  - Kartu informasi menjelaskan bahwa produk merupakan karya siswa yang telah melalui proses kurasi, pemeriksaan higienitas, dan persetujuan oleh pengurus koperasi.

---

## 6. Status Ketersediaan Stok (Stock Awareness)

Halaman rincian menyajikan pesan status persediaan yang transparan dan ramah:

| Kondisi Stok | Status Teknis | Spanduk Tampilan | Perilaku Kontrol Pembelian |
| :--- | :--- | :--- | :--- |
| `stock > 5` | `in_stock` | **Stok Tersedia ({n} unit)**<br>Barang siap diambil di loket saat jam istirahat. | Stepper kuantitas aktif (1 hingga min(stock, 10)); tombol tambah aktif. |
| `1 <= stock <= 5` | `low_stock` | **Stok Terbatas (Tersisa {n} unit)**<br>Persediaan menipis sebelum jam istirahat. | Stepper kuantitas dibatasi maksimal sisa stok; tombol tambah aktif. |
| `stock === 0` | `out_of_stock` | **Stok Sedang Habis**<br>Produk belum tersedia untuk dipesan. | Stepper kuantitas bernilai 0 dan terkunci; tombol aksi berubah menjadi *"Stok Habis"* (dinonaktifkan / `disabled`). |

---

## 7. Struktur Antarmuka Mobile-First & Aksesibilitas (UI Structure & A11y)

Komponen rincian produk diimplementasikan di `resources/js/pages/products/show.tsx`:

- **Navigasi Atas:**
  - Tombol kembali (*Back Button*) dengan area sentuh $\ge 44\text{px}$ dan dukungan `window.history.back()` dengan fallback ke `/`.
  - Chip tautan kategori yang dapat diklik untuk kembali ke filter kategori di beranda (`/?category={slug}`).
  - Tombol bagikan (*Share Button*) yang memanfaatkan Web Share API native pada ponsel cerdas, dengan cadangan salin tautan ke papan klip (*clipboard fallback*).
- **Panggung Visual Produk:**
  - Wadah gambar bujur sangkar 1:1 (`aspect-square`) dengan pencegah pergeseran tata letak (*layout shift*).
  - Penanganan citra gagal (*graceful image fallback*): Menampilkan latar `surface-subtle` dan ikon paket yang elegan jika berkas gambar tidak ditemukan atau gagal dimuat (`onError`).
- **Tata Letak Konten:**
  - Tipografi judul menggunakan Satoshi Bold.
  - Harga satuan ditampilkan mencolok menggunakan `PriceDisplay` berukuran `xl`.
  - Blok deskripsi dengan pemisahan baris paragraf yang rapi dan penanganan teks deskripsi kosong.
- **Bilah Aksi Mengambang di Bawah (*Sticky Bottom Action Bar*):**
  - Mengambang di bagian bawah layar peramban dengan latar semitransparan blur (`backdrop-blur-md`).
  - Menampilkan pengatur jumlah (*stepper*) dengan tombol minus/plus yang memiliki label aksesibel (`aria-label`).
  - Menampilkan kalkulasi total harga otomatis (`selling_price * quantity`) tanpa perlu memuat ulang halaman.
  - Tombol *"Tambah ke Keranjang"* berukuran sentuh penuh dengan ikon tas belanja.

---

## 8. Fondasi Interaksi Keranjang Pratinjau (Temporary Cart Interaction)

Sesuai aturan batas lingkup (*Scope Control*):
- Menekan tombol *"Tambah ke Keranjang"* memunculkan notifikasi mengambang yang ramah:
  > *"{n}x '{Nama Produk}' ditandai. Fitur keranjang & pemesanan aktif pada fase berikutnya."*
- **Tidak ada data keranjang yang disimpan ke basis data atau penyimpanan lokal.**
- Sistem tidak memalsukan transaksi pesanan.

---

## 9. Pengujian Fitur Otomatis (Automated Tests)

Pengujian komprehensif diimplementasikan pada `tests/Feature/ProductDetailTest.php` dengan 10 skenario pengujian:

1. `test_active_product_can_be_viewed_publicly`: Memverifikasi produk aktif dapat diakses publik dengan status 200 OK dan memuat komponen Inertia `products/show`.
2. `test_inactive_product_cannot_be_viewed_publicly`: Memverifikasi produk `inactive` menghasilkan respon 404 Not Found.
3. `test_archived_product_cannot_be_viewed_publicly`: Memverifikasi produk `archived` menghasilkan respon 404 Not Found.
4. `test_draft_product_cannot_be_viewed_publicly`: Memverifikasi produk `draft` menghasilkan respon 404 Not Found.
5. `test_product_source_is_correctly_resolved`: Memverifikasi resolusi identitas produk koperasi (`owner = null`) dan titipan siswa (`owner.name = 'Zahra Amelia'`).
6. `test_internal_financial_fields_are_not_exposed`: Memverifikasi `base_price` dan `cooperative_margin` tidak bocor ke muatan halaman klien.
7. `test_private_owner_information_is_not_exposed`: Memverifikasi perlindungan privasi siswa (`email`, `student_identifier`, `password` tidak dimuat).
8. `test_out_of_stock_state_is_handled`: Memverifikasi penanganan status persediaan kosong (`stock = 0`, label 'Habis').
9. `test_missing_product_returns_404`: Memverifikasi slug yang tidak terdaftar menghasilkan respon 404.
10. `test_category_context_is_correctly_resolved`: Memverifikasi informasi kategori dan keberadaan daftar `relatedProducts`.

---

## 10. Hasil Validasi Mutu Kode

Seluruh rangkaian pengujian dan pemeriksa mutu kode dijalankan dengan hasil bersih:

- **Laravel Pint (Code Style):** `composer run lint:check` $\to$ **PASSED**
- **PHPStan Static Analysis (Level 5):** `composer run types:check` $\to$ **PASSED (0 errors)**
- **Pest / PHPUnit Test Suite:** `php artisan test` $\to$ **86 tests PASSED, 472 assertions (0 failures)**
  - *Product Detail Tests:* 10 passed
  - *Marketplace Tests:* 10 passed
  - *Authorization Tests:* 17 passed
  - *Database Integrity Tests:* 31 passed
  - *Auth & Feature Tests:* 18 passed
- **Biome / VitePress Check:** `npm run check` $\to$ **PASSED (87 files formatted, 0 warnings, 0 errors)**
- **TypeScript Static Types:** `npm run types:check` $\to$ **PASSED (0 type errors)**
- **Vite Production Asset Build:** `npm run build` $\to$ **PASSED (Compiled in 5.08s)**
