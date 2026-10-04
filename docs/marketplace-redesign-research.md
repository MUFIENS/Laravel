# KOPDIG — Marketplace Experience Rebuild Research
**Document: docs/marketplace-redesign-research.md**
**Scope: Authenticated / Public Marketplace Discovery (`/explore`)**

---

## 1. Executive Summary

Riset ini merumuskan perancangan ulang antarmuka katalog belanja KOPDIG (`/explore`) dengan menggabungkan:
1. **Arsitektur Informasi & Disiplin Usabilitas Marketplace Terkemuka (seperti Tokopedia)**: Pencarian kuat, penjelajahan kategori cepat, hierarki harga yang dominan, transparansi sumber produk, navigasi mobile 2-kolom, dan akses keranjang yang mulus.
2. **Pola Merchandising dari Video Referensi / UI Reference Board**: Rel produk horizontal (*horizontal product rails*), kartu produk persegi 1:1, ritme bagian editorial, dan dok navigasi jempol (*floating bottom dock*).
3. **Bahasa Desain Asli KOPDIG (dari Landing Page & Auth Split Layout)**: Kanvas gelap `#0A0A0A`, permukaan `#141414`, aksen vermilion `#E34A27`, tipografi industrial **Satoshi** & **General Sans**, label metadata monospace (`[ FIG. COMMERCE-01 ]`), dan 100% ikon Lucide React (bebas emoji).

---

## 2. Analisis Pola Usabilitas Marketplace (Tokopedia & E-Commerce Modern)

Berdasarkan studi empiris terhadap arsitektur e-commerce terkemuka:

### 2.1 Pencarian sebagai Instrumen Navigasi Utama (*Search-First Architecture*)
- **Penempatan Strategis**: Kolom pencarian harus berada di bagian atas dan persisten, dengan ikon pencarian, tombol *clear* cepat, dan status fokus cincin yang jelas.
- **Konsistensi Sisi Server**: Pencarian harus tetap terhubung ke backend Eloquent (`name` dan `description`) dengan mempertahankan parameter URL `?search={query}` secara persisten.

### 2.2 Penjelajahan Kategori Efisien (*Category Discovery*)
- Rel kategori horizontal berbasis chip interaktif yang dapat digulir (*touch-scrollable category rail*) pada perangkat seluler.
- Status aktif instan dengan pergantian parameter `?category={slug}` menggunakan Inertia `preserveScroll: true` tanpa *page reload*.

### 2.3 Hierarki Komersial Kartu Produk (*Product Card Hierarchy*)
- **Gambar Dominan**: Foto produk menempati bobot visual terbesar dalam bingkai persegi 1:1 (`aspect-square`).
- **Provenans Transparan**: Identitas sumber ("Koperasi" vs "Titipan: {Nama Siswa}") harus langsung terlihat tanpa membingungkan pembeli.
- **Harga Dominan**: Nilai harga jual resmi (`selling_price`) disajikan dalam tipografi tebal yang kontras tinggi.
- **Kesadaran Inventaris**: Label stok langsung terbaca ("Tersedia", "Sisa {n}", atau "Habis").

### 2.4 Akses Keranjang Belanja (*Cart Accessibility*)
- Ikon keranjang belanja di bar atas dengan indikator jumlah barang riil (*real-time cartCount*).
- Tombol aksi cepat "Tambah" pada kartu produk yang mengeksekusi endpoint backend `POST /cart/items` secara asinkron dengan notifikasi umpan balik instan (*toast*).

---

## 3. Analisis Pola Video Referensi & UI Reference Board

Merujuk pada dokumen [`docs/design-reference-analysis.md`](file:///c:/Users/asepm/Downloads/Laravel/docs/design-reference-analysis.md):

1. **Komposisi Grid 2-Kolom Seluler**:
   - Pada resolusi ponsel (390px / 430px), katalog menggunakan tata letak simetris 2 kolom (`grid-cols-2`) dengan celah konsisten 12px–16px.
2. **Rel Produk Horizontal (*Horizontal Rails*)**:
   - Bagian "Pilihan Unggulan" (*Featured Picks*) menggunakan rel gulir horizontal dengan dukungan *touch swipe* dan *scroll snap*.
3. **Dok Navigasi Apung Bawah (*Floating Bottom Dock*)**:
   - Mempertahankan komponen [`BottomNavigation.tsx`](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/layout/BottomNavigation.tsx) dengan status aktif pada tab `Jelajah` (`/explore`), memungkinkan navigasi jempol yang ergonomis.
4. **Sudut Permukaan Halus (*Corner Radii*)**:
   - Wadah kartu produk menggunakan `rounded-[20px]`, sedangkan tombol dan chip filter menggunakan radius pil `rounded-full` (9999px).

---

## 4. Kesinambungan Sistem Visual KOPDIG

Elemen visual dari *Landing Page* dan halaman *Auth* yang wajib dibawa:

| Elemen | Spesifikasi | Alasan Desain |
|---|---|---|
| **Kanvas Latar** | `#0A0A0A` | Menjaga identitas visual gelap industrial yang konsisten di seluruh platform. |
| **Permukaan Kartu** | `#141414` / `#1C1C1C` | Memberikan kontras elevasi halus terhadap kanvas tanpa bayangan berlebihan. |
| **Garis Batas** | `#262626` | Hairline border presisi yang rapi dan elegan. |
| **Aksen Utama** | Vermilion `#E34A27` | Aksen energik untuk tombol belanja utama, badge aktif, dan status fokus. |
| **Aksen Provenans** | Hijau Hutan `#2E795A` (Koperasi), Emas `#D5A84C` (Siswa) | Pembeda sumber barang yang bermartabat dan terpercaya. |
| **Tipografi Heading** | **Satoshi** (Black / Bold) | Karakter tegas, percaya diri, dan modern untuk judul dan angka harga. |
| **Tipografi Antarmuka** | **General Sans** | Keterbacaan tinggi untuk label kontrol, filter, dan nama produk. |
| **Tipografi Meta** | Monospace uppercase (`[ FIG. COMMERCE-01 ]`) | Estetika kurasi dan akurasi inventaris koperasi sekolah. |
| **Ikonografi** | **Lucide React** (Strict Zero Emoji) | Ikon vektor presisi: `Search`, `ShoppingBag`, `SlidersHorizontal`, `Plus`, `Check`, `Package`, `Ban`. |

---

## 5. Struktur Antarmuka Marketplace yang Diusulkan (`/explore`)

Struktur halaman dirancang secara hierarkis dan berorientasi komersial:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. HEADER KOMERSIAL PERSISTEN                                         │
│    [Logo KOPDIG] [Kolom Pencarian Global (Search)] [Keranjang (3)] [User]│
├────────────────────────────────────────────────────────────────────────┤
│ 2. BANNER DISCOVERY RINGKAS (Compact Commerce Banner)                  │
│    "Ruang Niaga Mandiri Warga Sekolah" — Kurasi Produk Istirahat & ATK │
├────────────────────────────────────────────────────────────────────────┤
│ 3. REL NAVIGASI KATEGORI HORIZONTAL (Scrollable Category Rail)         │
│    [Semua] [Jajanan] [Minuman] [ATK & Buku] [Atribut Sekolah] [Karya] │
├────────────────────────────────────────────────────────────────────────┤
│ 4. REL PRODUK UNGGULAN (Horizontal Featured Rail)                      │
│    Pilihan Terbaik Koperasi & Karya Unggulan Siswa (Scroll Snap)      │
├────────────────────────────────────────────────────────────────────────┤
│ 5. BAR FILTER & PENGURUTAN MULTI-FASET                                 │
│    [Semua Sumber / Koperasi / Titipan Siswa] [Tersedia Saja] [Total]   │
├────────────────────────────────────────────────────────────────────────┤
│ 6. KISI UTAMA PENEMUAN PRODUK (Main Product Discovery Grid)           │
│    Mobile: 2-Kolom | Tablet: 3-Kolom | Desktop: 4-Kolom                │
│    - Foto Produk 1:1                                                   │
│    - Badge Sumber (Koperasi / Titipan Siswa)                           │
│    - Nama Produk (2 baris max)                                         │
│    - Harga Resmi Server (Rp xx.xxx)                                    │
│    - Label Stok (Tersedia / Sisa n / Habis)                            │
│    - Tombol Quick Add (+ Tambah)                                       │
├────────────────────────────────────────────────────────────────────────┤
│ 7. PAGINASI RESMI SERVER (Server-driven Pagination Links)              │
│    [Sebelumnya] [1] [2] [Selanjutnya]                                  │
├────────────────────────────────────────────────────────────────────────┤
│ 8. DOK NAVIGASI APUNG MOBILE (Floating Bottom Dock)                    │
│    [Beranda] [*Jelajah*] [Pesanan] [Keranjang]                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Pola Interaksi & Gerak (*Interaction & Motion*)

1. **Pencarian Cepat**:
   - Debounce halus 300ms untuk input pencarian teks.
   - Tombol bersihkan pencarian (*clear query*) yang instan mengembalikan katalog ke kondisi awal.
2. **Hover Kartu Produk (Desktop)**:
   - Skala gambar halus: `group-hover:scale-105` (durasi 300ms ease-out).
   - Bingkai kartu: `hover:border-[#E34A27]/40` dengan elevasi halus.
3. **Aksi Cepat Tambah ke Keranjang (*Quick Add-to-Cart*)**:
   - Tombol "Tambah" mengirimkan `router.post('/cart/items', { product_id: product.id })`.
   - Menampilkan status proses putar (`LoaderCircle`), lalu berganti ke konfirmasi singkat dan memperbarui `cartCount` pada bar navigasi secara sinkron.
4. **Aksesibilitas & Pengurangan Gerak**:
   - Mematuhi `@media (prefers-reduced-motion: reduce)` dengan mematikan transisi skala dan animasi masuk.
   - Semua elemen interaktif memiliki `aria-label`, target sentuh minimum 44px, dan cincin fokus yang terlihat.

---

## 7. Pola yang Ditolak & Alasannya (*Rejected Patterns & Anti-AI Slop*)

| Pola yang Ditolak | Alasan Penolakan |
|---|---|
| **Ulasan / Bintang Palsu ("4.9/5", "100+ terjual")** | Dilarang keras oleh aturan R-17, R-36, dan C-5. Data ulasan tidak ada di basis data nyata, tidak boleh ada statistik palsu. |
| **Pencoretan Harga Diskon Palsu (`Rp 20.000` &rarr; `Rp 15.000`)** | Menipu pembeli dan melanggar integritas harga resmi server. |
| **Kartu Putih Mengambang SaaS Generik** | Merusak kesinambungan visual gelap KOPDIG yang telah dibangun di landing page dan auth. |
| **Hero Raksasa Berselimut Gradien Ungu/Biru** | Mengaburkan fokus komersial dan menyia-nyiakan ruang layar (*above-the-fold real estate*). |
| **Animasi Scroll GSAP Berat / Hijack Scrolling** | Marketplace harus cepat, lincah, dan praktis untuk belanja di jam istirahat sekolah; bukan animasi sinematik yang memperlambat browsing. |
| **Penggunaan Emoji dalam UI** | Pelanggaran aturan ketat proyek. Semua ikon wajib menggunakan Lucide React SVG. |
| **Filter Sisi Klien Tiruan (*Fake Client Filter*)** | Kueri pencarian dan filter harus tetap *server-authoritative* menggunakan parameter URL Eloquent. |

---

## 8. Pemilihan Pustaka & Dependensi

- **React 19 + Inertia.js React**: Menjaga integritas SPA dengan transisi halaman secepat kilat.
- **Lucide React**: Ikonografi vektor standar (`Search`, `ShoppingBag`, `Filter`, `SlidersHorizontal`, `Package`, `Plus`, `Check`, `Ban`, `ArrowRight`).
- **Tailwind CSS v4**: Styling token warna dan tipografi terpadu.
- **Sonner Toast**: Umpan balik notifikasi saat produk berhasil dimasukkan ke keranjang belanja.
- **Nol dependensi baru**: Tidak menambahkan pustaka pihak ketiga yang tidak perlu.
