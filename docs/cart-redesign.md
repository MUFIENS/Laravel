# KOPDIG Cart Experience Redesign: Premium Commerce Cart

Dokumentasi rancangan arsitektur antarmuka, bahasa visual, interaksi transaksional, dan validasi kualitas untuk pengalaman keranjang belanja KOPDIG (`/cart`).

---

## 1. Design Direction & Core Intent

Halaman keranjang belanja (`/cart`) dirancang ulang dari antarmuka CRUD/tabel konvensional menjadi **pengalaman transaksional premium (*tactile, focused, and calm*)** yang menyatu dalam satu ekosistem estetika visual dengan halaman landing page (`welcome.tsx`) dan pasar sekolah (`explore.tsx`).

Prinsip utama:
- **Transactional Discipline**: Keranjang adalah alur transaksional yang berorientasi pada penyelesaian tugas (*task completion*), bukan halaman pemasaran atau hero storytelling berlebihan.
- **Visual Family Continuity**: Mengadopsi palet warna gelap premium KOPDIG (`#0A0A0A` canvas, `#141414` surface, `#262626` dividers, `#F5F2EB` off-white typography, dan aksen vermilion `#E34A27`).
- **Zero Emoji**: 100% menggunakan ikonografi semantik dari Lucide React (`ShoppingBag`, `Minus`, `Plus`, `Trash2`, `ArrowRight`, `ShieldCheck`, `AlertTriangle`, `Clock`, `Store`, `Package`, `CheckCircle2`).
- **Server Authority**: Seluruh kalkulasi harga, batas stok, ketersediaan, dan subtotal dikendalikan secara otoritatif oleh server (`CartController`). Frontend tidak memanipulasi atau membuat asumsi perhitungan lokal.

---

## 2. Visual Relationship to the Landing Page

| Dimensi Visual | KOPDIG Landing Page (`welcome.tsx`) | Redesigned Cart (`cart/index.tsx`) |
| :--- | :--- | :--- |
| **Color Atmosphere** | Canvas gelap `#0A0A0A`, permukaan `#141414`, garis pembatas `#262626` | Identik: latar belakang `#0A0A0A`, kartu `#141414`, bingkai `#262626` |
| **Typography** | Display heading Satoshi/Syne (`font-heading`), body sans, metadata font-mono | Heading tebal `font-heading font-bold text-[#F5F2EB]`, label kuantitas mono |
| **Accent & Highlight** | Signature Vermilion `#E34A27` dengan bayangan berpendar lembut | Tombol utama checkout, subtotal harga, dan pill kuantitas `#E34A27` |
| **Status Tokens** | Emerald (Koperasi/Tersedia), Amber (Karya Siswa/Warning), Rose (Error) | Konsisten: badge resmi koperasi hijau, titipan siswa kuning keemasan, peringatan merah |
| **Brand Emblem** | Square `K` mark (`#F5F2EB` latar putih teks hitam) | Logo emblem `K` ringkas pada header transaksional |

---

## 3. Cart Information Architecture

Antarmuka keranjang segera menjawab enam pertanyaan utama pengguna saat pertama kali memuat:
1. **Apa yang saya beli?** Thumbnail produk beresolusi tinggi, nama barang, kategori, serta badge sumber (*Resmi Koperasi* atau *Titipan Siswa*).
2. **Berapa jumlahnya?** Stepper kuantitas yang responsif dan ergonomis (`Minus`, angka kuantitas, `Plus`).
3. **Berapa harga satuannya?** Label harga satuan yang transparan dalam format Rupiah otoritatif.
4. **Apakah barang masih tersedia?** Indikator stok real-time (aktif, sisa stok, atau peringatan bila produk diarsipkan/habis).
5. **Berapa total yang harus saya bayar?** Rincian subtotal per baris dan ringkasan finansial menyeluruh tanpa biaya tersembunyi.
6. **Bagaimana cara melanjutkannya?** Tombol aksi utama `"Lanjut ke Checkout"` yang mencolok namun elegan, mengarahkan ke `/checkout`.

---

## 4. Desktop Composition (Two-Column Layout)

Pada layar lebar (`lg:grid-cols-12`):
- **Kolom Kiri (`lg:col-span-7 xl:col-span-8`)**:
  - Spanduk peringatan penyesuaian stok (*jika ada barang tidak tersedia*).
  - Header daftar belanja dengan jumlah variasi item dan akumulasi unit.
  - Kartu baris barang belanjaan dengan gambar, metadata, stepper kuantitas, subtotal per baris, dan tombol hapus.
  - Kartu informasi pengambilan di loket koperasi sekolah (*operational trust notice*).
- **Kolom Kanan (`lg:col-span-5 xl:col-span-4`)**:
  - Kartu ringkasan pesanan yang tersemat (*sticky top-24*).
  - Breakdown otoritatif: Total unit barang, subtotal produk, dan biaya layanan gratis loket koperasi.
  - Total pembayaran tebal beraksen vermilion.
  - Tombol CTA utama `"Lanjut ke Checkout"` dengan transisi hover anak panah.

---

## 5. Mobile Strategy (First-Class Responsive UX)

- **Layout Hierarkis Mengalir**: Header ringkas $\rightarrow$ Banner status $\rightarrow$ Daftar kartu produk $\rightarrow$ Informasi loket.
- **Fixed Bottom Checkout Bar**: Bilah aksi mengambang di bagian bawah peramban (`fixed bottom-0 z-40 lg:hidden`) yang menyajikan total pembayaran instan dan tombol checkout cepat.
- **Safe Area Inset Protection**: Menggunakan `pb-[max(0.75rem,env(safe-area-inset-bottom))]` dan padding bawah kontainer utama `pb-36 lg:pb-16` guna menjamin barang terbawah tidak tertutup bilah navigasi.
- **Ukuran Tap Ramah Sentuhan**: Stepper kuantitas dan tombol hapus memiliki area sentuh minimum $\ge 32\text{px}$ hingga $44\text{px}$ dengan *active scale feedback*.

---

## 6. Cart Item Component & Interactions

Setiap baris produk (`<article>`) memadukan elemen informasi esensial:
1. **Product Visual Container**: Rasio persegi (`size-20 sm:size-24`) dengan `object-cover`, transisi hover scale halus (`group-hover:scale-105`), dan fallback otomatis ke ikon `Package` jika gambar gagal dimuat (`onError`).
2. **Metadata & Provenance**:
   - Produk Koperasi: Badge hijau emerald dengan ikon `Store`.
   - Produk Titipan Siswa: Badge kuning amber dengan ikon `UserCheck` dan nama penitip yang dipotong rapi (`truncate`).
3. **Quantity Stepper Controls**:
   - Tombol minus dinonaktifkan jika jumlah $= 1$.
   - Tombol plus dinonaktifkan jika jumlah mencapai batas sisa stok fisik.
   - Status pembaruan menampilkan pemutar animasi `Loader2` saat permintaan `PATCH /cart/items/{id}` berlangsung.
4. **Line Subtotal**: Nilai subtotal yang disinkronisasi langsung dari respon server.
5. **Penghapusan Barang**: Tombol tempat sampah (`Trash2`) dengan hover warna merah muda lembut dan transisi opasitas baris sebelum dihapus dari DOM.

---

## 7. State Handling: Empty, Loading, and Validation

- **Empty Cart State**:
  - Wadah tengah dengan ikon `ShoppingBag` berlingkar cincin halus.
  - Pesan ramah: *"Keranjangmu Masih Kosong"*.
  - Tombol aksi: `"Jelajahi Produk Pasar Sekolah"` menuju `/explore`.
- **Validation Warnings**:
  - `is_inactive`: Lencana peringatan merah *"Produk ini sudah tidak aktif di katalog koperasi."*
  - `is_out_of_stock`: Lencana peringatan merah *"Stok produk ini sedang habis terjual."*
  - `has_insufficient_stock`: Lencana peringatan amber *"Stok tersisa hanya X unit. Mohon kurangi jumlah."*
  - Tombol checkout otomatis dinonaktifkan dengan pesan bantuan yang jelas jika `!cart.can_checkout`.
- **Toast Notifications**: Menggunakan `sonner` untuk pesan sukses ubah jumlah, sukses hapus barang, dan penanganan error dari server.

---

## 8. Quality Gates & Test Suite Verification

Seluruh tahapan verifikasi kualitas dijalankan dan lolos tanpa catatan:

| Verifikasi | Alat / Perintah | Hasil |
| :--- | :--- | :--- |
| **Code Style** | `vendor/bin/pint --test` | **Passed (0 violations)** |
| **Static Analysis** | `vendor/bin/phpstan --configuration=phpstan.neon` | **Passed (Level 5, 0 errors)** |
| **Backend Test Suite** | `php artisan test` | **Passed (251 passed, 1,738 assertions)** |
| **Cart Feature Tests** | `php artisan test --filter=CartTest` | **Passed (19 passed, 107 assertions)** |
| **TypeScript Typecheck** | `npm run types:check` (`tsc --noEmit`) | **Passed (0 errors)** |
| **Vite Plus Linter & Format** | `npm run check` (`vp check`) | **Passed (115 files formatted, 0 warnings)** |
| **Vite Production Build** | `npm run build` | **Passed (`cart` bundle 21.41 kB / gzip: 5.71 kB)** |
