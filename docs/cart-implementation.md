# KOPDIG Shopping Cart & Cart Persistence Implementation

Dokumentasi implementasi teknis sistem keranjang belanja siswa (*persistent shopping cart*), validasi persediaan stok (*stock-aware validation*), otorisasi kepemilikan keranjang (*ownership authorization*), dan badge kuantitas terpadu pada platform KOPDIG (Koperasi Digital SMK / Ruang Niaga Warga Sekolah) untuk Fase 7.

---

## 1. Ringkasan & Batasan Lingkup (Scope Boundaries)

Fase 7 menghubungkan pengalaman eksplorasi produk dan halaman rincian produk ke sistem penyimpanan keranjang belanja permanen berbasis basis data:

- **Tercakup dalam Fase 7:**
  - Penambahan produk ke keranjang belanja dari halaman detail produk (`/products/{product}`) dan beranda marketplace (`/`).
  - Halaman antarmuka keranjang belanja mobile-first: `/cart` (`cart.index`).
  - Pembaruan kuantitas barang keranjang (`PATCH /cart/items/{cartItem}`).
  - Penghapusan barang dari keranjang (`DELETE /cart/items/{cartItem}`).
  - Validasi stok real-time otoritatif dari sisi server saat penambahan maupun perubahan kuantitas.
  - Perhitungan subtotal per baris dan subtotal keseluruhan keranjang secara dinamis berdasarkan harga jual resmi saat ini.
  - Penanganan status barang yang mengalami perubahan stok, habis, atau tidak aktif setelah masuk keranjang.
  - Sinkronisasi global badge keranjang belanja pada `BottomNavigation` (`cartCount`) yang mencerminkan total unit barang.
  - Tampilan keranjang kosong yang elegan dan ramah (*empty cart state*).
  - Fondasi tombol *checkout* informatif yang mengarahkan ke Fase 8 tanpa merekam data transaksi palsu.
- **Di Luar Lingkup (Strictly Out of Scope):**
  - Pembuatan pesanan (*order creation*).
  - Pembayaran gateway (Midtrans sandbox).
  - Penetapan nomor antrean loket (*queue allocation*).
  - Pembuatan token dan verifikasi kode QR pengambilan (*QR pickup verification*).
  - Pemrosesan pesanan oleh pengurus koperasi.

---

## 2. Struktur Rute & Pengendali (Route Architecture)

Rute keranjang belanja dikonfigurasikan pada `routes/web.php` dan dilindungi oleh *middleware* otentikasi serta verifikasi peran siswa (`['auth', 'role:student']`):

| Method | URI | Nama Rute | Pengendali & Aksi | Aksesibilitas |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/cart` | `cart.index` | `CartController@index` | Hanya Siswa Terotentikasi |
| `POST` | `/cart/items` | `cart.items.store` | `CartController@store` | Hanya Siswa Terotentikasi |
| `PATCH` | `/cart/items/{cartItem}` | `cart.items.update` | `CartController@update` | Pemilik Item Keranjang |
| `DELETE` | `/cart/items/{cartItem}` | `cart.items.destroy` | `CartController@destroy` | Pemilik Item Keranjang |

Tamu umum (*guest*) yang berupaya mengakses rute keranjang akan dialihkan secara otomatis ke halaman masuk (`/login`). Pengurus koperasi (*cooperative*) dibatasi dari area belanja siswa dengan respon 403 Forbidden.

---

## 3. Model Kepemilikan & Strategi Otorisasi (Cart Ownership & IDOR Protection)

Sistem menerapkan prinsip *Zero-Trust Client Identity* untuk menjamin integritas data keranjang siswa:

1. **Resolusi Pemilik dari Sesi Server:**
   - Server tidak pernah memercayai `cart_id` atau `user_id` dari muatan permintaan klien peramban.
   - Keranjang diselesaikan langsung melalui relasi pengguna yang sedang masuk:
     `$cart = $request->user()->cart()->firstOrCreate([]);`
2. **Kebijakan Akses Berbasis Kebijakan (Policies):**
   - Diimplementasikan `CartPolicy` dan `CartItemPolicy`.
   - `CartItemPolicy::update` dan `CartItemPolicy::delete` memverifikasi bahwa:
     - Pengguna memiliki peran `student`.
     - Relasi `$cartItem->cart` valid dan `$cartItem->cart->user_id === $user->id`.
   - Jika siswa A mencoba memodifikasi atau menghapus item keranjang milik siswa B, sistem memutus permintaan dengan respon 403 Forbidden.

---

## 4. Perilaku Operasi Keranjang Belanja

### A. Tambah Produk ke Keranjang (`POST /cart/items`)
Tahapan eksekusi di sisi server:
1. Validasi input: `product_id` (wajib, integer, terdaftar di tabel `products`) dan `quantity` (opsional, integer, minimal 1).
2. Pengecekan visibilitas produk: Produk harus berstatus `ProductStatus::Active`. Jika produk berstatus `draft`, `inactive`, atau `archived`, server melempar `ValidationException` dengan pesan ramah.
3. Pengecekan ketersediaan stok: Produk harus memiliki stok $> 0$.
4. Pencarian baris yang sudah ada: Sistem mencari item dengan `product_id` yang sama pada keranjang siswa.
5. Pencegahan duplikasi baris: Jika produk sudah ada di keranjang, kuantitas dijumlahkan (`existing_quantity + requested_quantity`). Sesuai batasan unik basis data `UNIQUE(cart_id, product_id)`, sistem tidak membuat baris baru.
6. Validasi kuantitas gabungan terhadap stok: Jika total kuantitas baru melebihi stok yang tersedia, permintaan ditolak dengan pesan kesalahan yang menyebutkan sisa stok yang ada.

### B. Perbarui Kuantitas Item (`PATCH /cart/items/{cartItem}`)
1. Otorisasi kepemilikan item melalui `$this->authorize('update', $cartItem)`.
2. Validasi input: `quantity` wajib integer dengan batas minimal 1.
3. Pemeriksaan ulang ketersediaan produk dan batas stok fisik saat ini. Jika kuantitas yang diminta melebihi stok terkini, permintaan ditolak.
4. Nilai kuantitas diperbarui di basis data.

### C. Hapus Item Keranjang (`DELETE /cart/items/{cartItem}`)
1. Otorisasi kepemilikan item melalui `$this->authorize('delete', $cartItem)`.
2. Menghapus baris item dari tabel `cart_items`.

---

## 5. Validasi Stok & Penanganan Perubahan Produk (Stock Awareness)

Produk di keranjang bersifat dinamis dan dapat mengalami perubahan status sebelum pembeli melakukan *checkout*:

- **Perubahan Harga Jual:**
  - Sesuai prinsip *cart is not an immutable snapshot*, perhitungan subtotal keranjang selalu menggunakan harga jual resmi terkini (`product.selling_price`).
  - Nilai modal dasar (`base_price`) dan margin koperasi (`cooperative_margin`) tetap terlindungi dan tidak diekspos ke klien.
- **Deteksi Ketidaktersediaan Produk:**
  - `is_available`: Produk aktif, stok $> 0$, dan kuantitas keranjang $\le$ stok produk.
  - `is_inactive`: Produk dinonaktifkan atau diarsipkan oleh pengurus koperasi.
  - `is_out_of_stock`: Stok produk habis terjual ($0$).
  - `has_insufficient_stock`: Kuantitas dalam keranjang melebihi sisa stok fisik saat ini.
- **Pemberitahuan UI & Pemulihan:**
  - Halaman keranjang menampilkan spanduk peringatan merah jika terdapat barang bermasalah (`has_unavailable_items = true`).
  - Tombol *Pesan Sekarang* dinonaktifkan secara otomatis hingga pengguna menyesuaikan jumlah atau menghapus produk yang tidak tersedia.

---

## 6. Sinkronisasi Badge Keranjang Global (Cart Badge Behavior)

Badge navigasi bawah pada `BottomNavigation` menyajikan informasi jumlah unit yang akurat dan konsisten:

- **Definisi Standar:**
  - `cartCount` merepresentasikan **total akumulasi kuantitas unit barang** (`sum('quantity')`) di dalam keranjang aktif siswa, bukan sekadar jumlah variasi produk.
- **Distribusi Data Melalui Inertia Shared Props:**
  - `HandleInertiaRequests::share` memuat `cartCount` secara langsung melalui kueri agregat cepat:
    ```php
    'cartCount' => function () use ($request) {
        $user = $request->user();
        if (! $user || ! $user->isStudent()) {
            return 0;
        }

        $cartId = $user->cart()->value('id');

        return $cartId ? (int) CartItem::where('cart_id', $cartId)->sum('quantity') : 0;
    },
    ```
  - Komponen `AppShell` membaca properti `cartCount` global dari `usePage().props.cartCount`, sehingga badge di seluruh halaman aplikasi (Beranda, Rincian Produk, Jelajah) terperbarui secara instan pasca-mutasi keranjang tanpa perlu memuat ulang peramban.

---

## 7. Desain Antarmuka Mobile-First & Aksesibilitas (UI & A11y)

Antarmuka keranjang belanja dibangun di `resources/js/pages/cart/index.tsx` dengan mematuhi bahasa visual KOPDIG:

- **Palet Warna:** Warm Canvas (`#F7F6F1`), White Surface (`#FFFFFF`), Forest Green (`#183C32`), dan Taksiran Emas (`#D5A84C`).
- **Kartu Produk Kompak:** Menampilkan thumbnail gambar dengan penanganan *image fallback*, lencana asal (*Koperasi* vs *Titipan Siswa*), harga satuan resmi, serta kontrol stepper kuantitas yang ergonomis.
- **Area Sentuh Ramah Jempol:** Tombol minus, plus, dan hapus memiliki area sentuh $\ge 44\text{px}$ dengan label semantik (`aria-label`) untuk pembaca layar (*screen reader*).
- **Status Tindakan (Loading States):** Menampilkan ikon pemutar animasi (`Loader2`) saat proses tambah, ubah kuantitas, atau hapus sedang berlangsung guna mencegah klik ganda.
- **Bilah Ringkasan Bawah Mengambang (*Sticky Bottom Bar*):** Memperlihatkan ringkasan total unit dan total Rupiah dengan tombol aksi utama yang mencolok.

---

## 8. Pengujian Fitur Otomatis (Automated Feature Tests)

Pengujian komprehensif diimplementasikan pada `tests/Feature/CartTest.php` dengan 19 skenario pengujian:

1. `test_guest_cannot_access_cart`: Tamu tanpa login dialihkan ke rute `/login`.
2. `test_student_can_view_own_cart`: Siswa dapat membuka keranjang miliknya (HTTP 200, komponen `cart/index`).
3. `test_student_cannot_access_another_students_cart`: Siswa ditolak dengan status 403 Forbidden saat berupaya memodifikasi atau menghapus item keranjang siswa lain.
4. `test_student_can_add_an_active_product`: Siswa berhasil menambahkan produk aktif ke keranjang.
5. `test_inactive_product_cannot_be_added`: Produk tidak aktif ditolak saat ditambahkan ke keranjang.
6. `test_archived_product_cannot_be_added`: Produk arsip ditolak saat ditambahkan ke keranjang.
7. `test_out_of_stock_product_cannot_be_added`: Produk bersisa stok 0 ditolak saat ditambahkan ke keranjang.
8. `test_adding_an_existing_product_increments_quantity`: Menambahkan produk yang sudah ada di keranjang mengakumulasikan kuantitasnya.
9. `test_duplicate_cart_rows_are_not_created`: Menghormati batasan unik basis data sehingga tidak ada baris ganda untuk produk yang sama.
10. `test_quantity_cannot_exceed_stock`: Permintaan kuantitas yang melebihi stok yang tersedia ditolak oleh validasi server.
11. `test_quantity_cannot_be_below_1`: Kuantitas 0 atau negatif ditolak oleh validasi.
12. `test_student_can_update_own_cart_item`: Siswa dapat memperbarui kuantitas item miliknya.
13. `test_student_cannot_update_another_students_cart_item`: Percobaan pembaruan item milik siswa lain menghasilkan respon 403.
14. `test_student_can_remove_own_cart_item`: Siswa dapat menghapus barang dari keranjangnya.
15. `test_student_cannot_remove_another_students_cart_item`: Percobaan penghapusan item milik siswa lain menghasilkan respon 403.
16. `test_subtotal_calculation_is_correct`: Perhitungan subtotal keranjang akurat sesuai jumlah dan harga satuan terkini.
17. `test_total_quantity_is_correct`: Perhitungan total unit barang di keranjang akurat.
18. `test_cart_badge_reflects_server_cart_state`: Nilai `cartCount` pada data bersama Inertia mencerminkan jumlah unit di keranjang secara real-time.
19. `test_stock_conflicts_are_handled_safely`: Konflik akibat penurunan stok mendadak dideteksi secara tepat dan mencegah proses pemesanan.

---

## 9. Hasil Validasi Mutu Kode

Semua pemeriksa kualitas kode dijalankan secara berurutan dan menghasilkan status bersih:

- **Laravel Pint (Code Style):** `composer run lint:check` $\to$ **PASSED (0 style issues)**
- **PHPStan Static Analysis (Level 5):** `composer run types:check` $\to$ **PASSED (0 errors)**
- **Pest / PHPUnit Test Suite:** `php artisan test` $\to$ **105 tests PASSED, 579 assertions (0 failures)**
  - *Cart Tests:* 19 passed
  - *Product Detail Tests:* 10 passed
  - *Marketplace Tests:* 10 passed
  - *Authorization Tests:* 17 passed
  - *Database Integrity Tests:* 31 passed
  - *Auth & Feature Tests:* 18 passed
- **Biome / VitePress Check:** `npm run check` $\to$ **PASSED (89 files formatted, 0 warnings, 0 lint errors)**
- **TypeScript Static Types:** `npm run types:check` $\to$ **PASSED (0 type errors)**
- **Vite Production Asset Build:** `npm run build` $\to$ **PASSED (Compiled in 38.58s)**

---

## 10. Keterampilan yang Digunakan (Skills Used)

- `modern-web-guidance`: Penerapan tata letak mobile-first, penanganan fallback citra produk, pencegahan *layout shift*, dan interaksi mikro pada tombol kuantitas.
- Pemeriksa format dan tipe bawaan proyek: Pint, PHPStan Level 5, Biome, TypeScript Compiler (`tsc --noEmit`), dan Vite Compiler.
