# KOPDIG — Dokumen Redesain UI Autentikasi (Login & Register)

Dokumen ini mencatat keputusan desain, arsitektur frontend, integritas sistem autentikasi, aksesibilitas, dan hasil pengujian kualitas untuk pembaruan antarmuka **Masuk (Login)** dan **Daftar (Register)** KOPDIG.

---

## 1. Inspeksi Implementasi Autentikasi Eksisting

Sebelum penulisan kode dimulai, inspeksi mendalam dilakukan terhadap struktur rute, kontroler, aksi Fortify, dan komponen autentikasi proyek:

- **Arsitektur Backend**: Laravel 12 + Laravel Fortify (`config/fortify.php`).
- **Rute Autentikasi**:
  - GET `/login` &rarr; `AuthenticatedSessionController::login` (Inertia page: `auth/login`)
  - POST `/login` &rarr; Fortify login pipeline (verifikasi kredensial email & password)
  - GET `/register` &rarr; `RegisteredUserController::register` (Inertia page: `auth/register`)
  - POST `/register` &rarr; `App\Actions\Fortify\CreateNewUser`
- **Integritas Role & Pendaftaran**:
  - `CreateNewUser` secara ketat menetapkan peran default `UserRole::Student`:
    ```php
    'role' => UserRole::Student,
    ```
  - Tidak ada peran Koperasi, Penjual (Seller), atau Admin yang dapat didaftarkan secara publik melalui `/register`.
- **Bidang Formulir Nyata (Form Fields)**:
  - **Login**: `email` (string, required, email), `password` (string, required), `remember` (boolean, optional), opsional passkey (`PasskeyVerify`).
  - **Register**: `name` (string, required, max:255), `email` (string, required, email, unique), `password` (string, required, password rules), `password_confirmation` (string, required, same:password).
- **Pengaturan Layout Inertia**:
  - Pada `resources/js/app.tsx`, konfigurasi `layout: (name)` di-handle dengan:
    ```tsx
    switch (true) {
        case name === 'welcome':
        case name === 'auth/login':
        case name === 'auth/register':
            return null;
        case name.startsWith('auth/'):
            return AuthLayout;
        ...
    }
    ```
  - Dengan mengembalikan `null` untuk `auth/login` dan `auth/register`, Inertia tidak lagi membungkus kedua halaman tersebut ke dalam `AuthLayout` (yang menggunakan template `AuthSimpleLayout` kartu terpusat dengan logo Laravel). Halaman `AuthSplitLayout` kini dapat merender kanvas layar penuh (*full-bleed split-screen*) secara tepat dan mandiri.

---

## 2. Arah Desain & Hubungan Visual dengan Halaman Beranda (*Landing Page*)

Antarmuka autentikasi dirancang sebagai pintu gerbang produk (*product entry experience*) yang merupakan kelanjutan langsung dari landing page KOPDIG, namun dengan ekspresi visual yang lebih tenang, fokus, dan fungsional.

### Kesinambungan Sistem Visual:
1. **Palet Warna & Atmosfer**:
   - Kanvas Gelap Murni: `#0A0A0A` (bukan kartu mengambang abu-abu atau gradien ungu SaaS generik).
   - Permukaan Kontrol Form: `#141414` dengan garis batas kontras terkontrol `#262626`.
   - Warna Aksen Utama: Vermilion KOPDIG `#E34A27` pada badge aktif, tombol submit utama, dan status fokus.
   - Tipografi Teks: `#F5F2EB` (Warm White) untuk heading utama, `#A3A3A3` dan `#737373` untuk label dan teks sekunder.
2. **Tipografi**:
   - Font heading: **Satoshi** (Black/Bold) untuk karakter industrial dan editorial yang tegas.
   - Font antarmuka & form: **General Sans** untuk keterbacaan tinggi pada bidang input data.
   - Monospace: Label meta teknis (`[ FIG. AUTH-01 ]`, status badge, copyright).
3. **Komposisi Split-Screen Desktop**:
   - **Kolom Form Utama (42% lebar)**: Fokus langsung pada efisiensi pengisian form, logo KOPDIG, indikator alur, dan tindakan alternatif.
   - **Kolom Visual Editorial (58% lebar)**: Menampilkan karya visual beresolusi tinggi KOPDIG dengan scrim gelap atmosferik, badge penanda platform, serta kartu manifesto koperasi digital sekolah di bagian bawah.

---

## 3. Desain Halaman Masuk (*Login*)

- **File**: [`resources/js/pages/auth/login.tsx`](file:///c:/Users/asepm/Downloads/Laravel/resources/js/pages/auth/login.tsx)
- **Komponen Layout**: `AuthSplitLayout` dengan mode `"login"`.
- **Elemen Visual**:
  - Gambar Visual: `/images/campaign/community-counter.jpg` (kegiatan loket dan transaksi nyata warga sekolah).
  - Badge Header: `"Portal Masuk Resmi"`.
  - Judul: `"Masuk ke KOPDIG"`.
  - Subjudul: `"Masuk ke ruang niaga warga sekolah."`.
  - Headline Kartu Visual: `"RUANG NIAGA MANDIRI WARGA SEKOLAH."`.
- **Interaksi Form**:
  - Input Alamat Email dengan status fokus cincin `#E34A27`/30.
  - Input Kata Sandi terintegrasi dengan tombol kontrol visibilitas sandi (`Eye` dan `EyeOff`).
  - Tautan *"Lupa kata sandi?"* jika fitur reset kata sandi aktif pada konfigurasi Fortify.
  - Komponen Checkbox kustom *"Ingat saya di perangkat ini"*.
  - Tombol Submit Vermilion dengan efek hover translate pada ikon panah (`ArrowRight`) dan indikator proses (`LoaderCircle` spinner) saat form sedang memverifikasi kredensial.
  - Alur login difokuskan langsung pada Email & Kata Sandi (opsi *Passkey* pada halaman login telah dihilangkan agar form tetap bersih, cepat, dan terfokus).

---

## 4. Desain Halaman Daftar (*Register*)

- **File**: [`resources/js/pages/auth/register.tsx`](file:///c:/Users/asepm/Downloads/Laravel/resources/js/pages/auth/register.tsx)
- **Komponen Layout**: `AuthSplitLayout` dengan mode `"register"`.
- **Elemen Visual**:
  - Gambar Visual: `/images/campaign/student-craft.jpg` (karya kemasan produk kreatif dan kejuruan siswa).
  - Badge Header: `"Pendaftaran Akun Siswa"`.
  - Judul: `"Gabung ke KOPDIG"`.
  - Subjudul: `"Mulai menjelajahi, berkarya, dan bertransaksi bersama warga sekolah."`.
  - Headline Kartu Visual: `"DARI KARYA SISWA HINGGA TRANSAKSI NYATA."`.
- **Integritas Peran Siswa (Student Role Integrity)**:
  - **TIDAK ADA** pemilih peran (*role selector*), dropdown penjual, akun koperasi, atau admin.
  - Ditambahkan badge notifikasi penenang yang tenang:
    > *"Pendaftaran publik otomatis terdaftar sebagai Akun Siswa."*
  - Menjaga integritas peran backend di mana `CreateNewUser` hanya mendaftarkan akun siswa secara publik.
- **Interaksi Form**:
  - Nama Lengkap (`name`), Alamat Email (`email`).
  - Kata Sandi (`password`) dengan atribut `passwordrules`.
  - Konfirmasi Kata Sandi (`password_confirmation`) dengan atribut `passwordrules`.
  - Tombol submit `data-test="register-user-button"` dengan transisi loading stabil.

---

## 5. Sistem Aset Visual & Penanganan Media

- Menggunakan aset fotografi editorial resolusi tinggi yang sudah diverifikasi dan ada dalam repositori:
  - `/images/campaign/community-counter.jpg` (819 KB) untuk Login.
  - `/images/campaign/student-craft.jpg` (779 KB) untuk Register.
- Dilengkapi fallback otomatis (`onError`) ke `/images/campaign/hero-editorial.jpg` untuk menjamin tampilan tidak pernah rusak jika terjadi kegagalan jaringan aset.
- Diberi gradien scrim bertingkat:
  - `bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-[#0A0A0A]/70`
  - Gradien radial kontras untuk menjaga teks manifesto di atas gambar tetap tajam dan memiliki kontras rasio tinggi.

---

## 6. Sistem Ikon (Strict Zero Emoji)

Seluruh komponen autentikasi **bebas 100% dari emoji**. Seluruh ikon visual menggunakan pustaka vektor resmi proyek: **Lucide React**.

Ikon yang digunakan:
- `ArrowRight` : Interaksi panah tombol aksi utama form.
- `ArrowLeft` : Tombol navigasi kembali ke beranda.
- `Eye` / `EyeOff` : Sakelar interaktif visibilitas kata sandi.
- `ShieldCheck` : Penanda integritas akun siswa dan keaslian platform.
- `CheckCircle2` : Status flash message sukses dari sesi Fortify.
- `AlertCircle` : Penanda visual pesan kesalahan validasi form.
- `LoaderCircle` : Indikator putar (*spinner*) saat pengiriman data form berlangsung.

---

## 7. Sistem Gerak (*Motion System*) & Aksesibilitas

### Animasi Masuk (*Entrance Animation*):
- Didefinisikan pada [`resources/css/app.css`](file:///c:/Users/asepm/Downloads/Laravel/resources/css/app.css):
  ```css
  @keyframes authFadeInUp {
      from {
          opacity: 0;
          transform: translateY(12px);
      }
      to {
          opacity: 1;
          transform: translateY(0);
      }
  }

  .auth-reveal {
      animation: authFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  ```
- Efek stagger berjenjang yang tenang: Brand &rarr; Heading &rarr; Form &rarr; Footer.

### Preferensi Pengurangan Gerak (*prefers-reduced-motion*):
- Jika pengguna mengaktifkan preferensi *reduce motion* di sistem operasi mereka, animasi masuk secara otomatis dimatikan (`animation: none !important`), dan durasi transisi dihilangkan:
  ```css
  @media (prefers-reduced-motion: reduce) {
      .auth-reveal {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
      }
      *, *::before, *::after {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
      }
  }
  ```

---

## 8. Desain Responsif & Tata Letak Mobile

Pengujian tata letak dirancang untuk adaptasi sempurna di seluruh rentang viewport:

1. **Desktop (> 1024px)**:
   - Komposisi split: Form 42% di kiri, visual editorial 58% di kanan.
   - Header atas menampilkan logo KOPDIG dan pintasan berpindah halaman (*switcher action*).
2. **Tablet (768px - 1023px)**:
   - Kolom form meluas hingga 50-100%, visual samping disesuaikan atau disembunyikan untuk memprioritaskan penyelesaian pengisian form tanpa *horizontal scrollbar*.
3. **Mobile (< 768px / 390x844 / 430x932)**:
   - Kolom visual latar belakang disembunyikan agar tidak mendorong formulir ke bawah.
   - Kanvas form menjadi 100% lebar layar dengan padding ergonomis (`px-6 py-8`).
   - Bidang input memiliki tinggi nyaman 44px (`h-11`) untuk target sentuh (*tap target*) yang ramah jari.
   - Tautan navigasi alih peran dipindahkan ke bawah tombol submit agar mudah diakses dengan satu tangan.
   - Bebas *overflow* horizontal (`w-full`, `overflow-x-hidden`).

---

## 9. Penanganan Kesalahan Validasi (*Validation Handling*)

Pesan kesalahan validasi berasal langsung dari server Laravel Fortify tanpa ada pemalsuan di sisi klien:
- Komponen [`resources/js/components/input-error.tsx`](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/input-error.tsx) diperbarui untuk menampilkan ikon `AlertCircle` berukuran `size-3.5` bersamaan dengan teks kesalahan.
- Elemen memiliki atribut `role="alert"` untuk keterbacaan oleh pembaca layar (*screen reader*).
- Garis batas input yang mengalami galat tetap terbaca jelas tanpa mengorbankan konsistensi tema gelap.

---

## 10. Validasi Pengujian & Penanganan Browser

Sesuai instruksi protokol *Browser Failure Handling*:
- Pengujian otomatis headless Playwright melalui subagent mengalami kendala unduhan biner driver eksternal pada CDN Playwright (`404 Not Found` pada CDN Microsoft/Akamai).
- Sesuai protokol, proses tidak dihentikan; validasi dilakukan secara lokal melalui server aktif `http://127.0.0.1:8000/`.
- **Hasil Verifikasi Langsung**:
  - `GET http://127.0.0.1:8000/login` &rarr; Status HTTP **200 OK**.
  - `GET http://127.0.0.1:8000/register` &rarr; Status HTTP **200 OK**.
  - Pemeriksaan payload Inertia mengonfirmasi registrasi komponen `auth/login` dan `auth/register`, tersedianya CSRF token, rule password, serta aset modul bundel Vite yang terpasang secara tepat.

---

## 11. Hasil Gerbang Kualitas (*Quality Gates Results*)

Seluruh pengujian kualitas dijalankan dan berhasil lulus 100% tanpa kompromi:

| Pengujian Kualitas | Perintah | Status | Keterangan |
|---|---|---|---|
| **Code Style (PHP)** | `vendor/bin/pint --test` | **LULUS** | `{"tool":"pint","result":"passed"}` |
| **Analisis Statis (PHP)** | `vendor/bin/phpstan --configuration=phpstan.neon` | **LULUS** | `{"tool":"phpstan","result":"passed","errors":0}` |
| **Suite Pengujian Aplikasi** | `php artisan test` | **LULUS** | **251 passed**, 1738 assertions (10.3s) |
| **Pemeriksaan Tipe (TS)** | `npm run types:check` | **LULUS** | `tsc --noEmit` keluar dengan kode 0 |
| **Format & Linter (JS/TS)** | `npm run check` | **LULUS** | 114 file terformat, 0 warning/error |
| **Kompilasi Produksi** | `npm run build` | **LULUS** | Semua aset terkompilasi dalam 13.7s |

---

## 12. Kesimpulan

Redesain antarmuka autentikasi KOPDIG untuk **Login** dan **Register** telah selesai secara penuh:
- Visual autentikasi kini menyatu dalam satu keluarga bahasa desain dengan Landing Page KOPDIG (gelap, berwibawa, beraksen vermilion, tipografi Satoshi/General Sans).
- Pendaftaran publik tetap terisolasi secara aman hanya untuk peran **Siswa**.
- Seluruh 251 tes fungsional dan seluruh gerbang kualitas lulus dengan sempurna.
