# RuangHadir

Website absensi QR untuk sekolah dasar. Aplikasi dapat dijalankan langsung dari
folder ini tanpa instalasi paket:

1. Salin folder ke `C:\xampp\htdocs\absensi`.
2. Jalankan Apache dari XAMPP.
3. Buka `http://localhost/absensi/` di browser.
4. Buka **Data Siswa** untuk melihat QR contoh atau menambahkan siswa.
5. Pilih **Scan QR Siswa** untuk memindai QR dengan kamera. Jika kamera tidak
   tersedia, masukkan NIS siswa secara manual.

## Fitur

- Ringkasan jumlah siswa, hadir, terlambat, dan belum hadir.
- Daftar siswa dan pembuatan QR code yang dapat dicetak.
- Pemindaian QR melalui kamera serta pencatatan manual dengan NIS.
- Pencegahan absensi ganda dalam satu hari.
- Filter riwayat berdasarkan tanggal, pencarian, dan ekspor CSV.
- Antarmuka responsif untuk desktop dan ponsel.

## Catatan penggunaan

- Data disimpan di `localStorage` browser, bukan di server atau database.
  Data hanya tersedia pada browser dan perangkat yang sama; hapus data browser
  dapat menghilangkannya. Aplikasi ini sesuai untuk demo atau penggunaan lokal,
  belum untuk sinkronisasi multi-perangkat/sekolah.
- Pemindaian kamera membutuhkan izin kamera dan konteks aman (`localhost` atau
  HTTPS). Penggunaan melalui alamat IP jaringan lokal biasanya memerlukan HTTPS.
- Pustaka QR dan font dimuat dari CDN, sehingga koneksi internet diperlukan
  untuk menghasilkan QR code dan menggunakan pemindai kamera.
- Contoh QR berisi NIS siswa, bukan kredensial rahasia. Aplikasi ini belum
  menyediakan akun pengguna atau verifikasi server.
