import type { Metadata } from "next";
import { churchConfig } from "@/config/church";

export const metadata: Metadata = {
  title: `Kebijakan Privasi | ${churchConfig.name}`,
  description: "Cara GMAHK BSD mengakses, menggunakan, menyimpan, dan membagikan data pada website serta koneksi Google.",
};

export default function PrivacyPolicyPage() {
  return <article className="site-width privacy-policy">
    <header><p className="eyebrow">GMAHK BSD</p><h1>Kebijakan Privasi</h1><p>Terakhir diperbarui: 17 Oktober 2026</p></header>
    <p>Website {churchConfig.name} menyediakan informasi ibadah, jadwal pelayanan, Kertas Acara, pengumuman, kegiatan jemaat, dan Pokok Doa. Kebijakan ini menjelaskan penggunaan data oleh website dan dashboard staf yang dikelola gereja.</p>
    <section><h2>Data yang digunakan</h2><ul>
      <li>Nama petugas pelayanan, jadwal, isi Kertas Acara, nama dan tanggal ulang tahun, serta informasi lain dari spreadsheet yang dikonfigurasi pengelola.</li>
      <li>Nama atau keluarga tamu, jemaat asal, nomor HP jika diisi, jumlah orang jika diisi, serta tanggal kunjungan.</li>
      <li>Nama dalam Pokok Doa dan alasan doa yang dimasukkan staf, termasuk pilihan apakah alasan tersebut boleh ditampilkan kepada publik.</li>
      <li>Foto kegiatan, gambar pengumuman, nama departemen, dan keterangan yang diunggah pengelola.</li>
      <li>Token otorisasi Google untuk menjalankan koneksi yang disetujui pemilik akun. Website meminta izin profil dasar dan email pada alur koneksi Google; koneksi ini digunakan untuk penyimpanan file, bukan untuk membuat akun anggota jemaat.</li>
    </ul></section>
    <section><h2>Akses Google dan tujuan penggunaannya</h2>
      <p>Google Sheets digunakan untuk membaca informasi ibadah dan pelayanan. Koneksi service account yang dikonfigurasi pengelola dapat memperbarui sel Kertas Acara dan Pokok Doa pada spreadsheet yang diberi akses, ketika penulisan diaktifkan.</p>
      <p>Google Drive digunakan untuk membaca dan menyimpan file pengumuman, foto kegiatan, daftar tamu, serta data pendukung pelayanan sesuai fitur dan izin yang dikonfigurasi. Koneksi OAuth meminta izin drive.file untuk file yang dapat diakses aplikasi. Sebagian pembacaan file menggunakan service account dan izin berbagi yang diberikan pengelola.</p>
      <p>Website tidak meminta akses ke isi Gmail atau daftar Google Contacts. Data Google digunakan untuk menyediakan fungsi gereja tersebut, bukan untuk iklan yang dipersonalisasi, penjualan data, atau pelatihan model kecerdasan buatan.</p>
      <p>Penggunaan informasi yang diterima dari Google API mengikuti <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, termasuk persyaratan Limited Use.</p>
    </section>
    <section><h2>Data yang ditampilkan dan dibagikan</h2>
      <p>Jadwal pelayanan, informasi ulang tahun, Kertas Acara, pengumuman, foto, serta nama Pokok Doa dapat tampil pada halaman publik. Alasan doa ditampilkan pada halaman publik hanya ketika staf menandainya sebagai publik. Staf yang mengelola Pokok Doa dapat mengakses alasan yang disimpan untuk keperluan pelayanan.</p>
      <p>Halaman penerima tamu dan pembawa acara tidak ditautkan dari navigasi publik dan tidak ditujukan untuk mesin pencari, tetapi saat ini tidak memerlukan kata sandi. Orang yang memiliki tautannya dapat membaca daftar tamu, termasuk nomor HP; tautan penerima tamu juga memungkinkan pengubahan catatan. Karena itu, bagikan tautan hanya kepada petugas yang memerlukannya dan hindari memasukkan informasi sensitif yang tidak diperlukan.</p>
      <p>Google menyediakan penyimpanan dan layanan spreadsheet; Vercel menyediakan hosting website. File atau metadata tertentu dapat tersimpan di layanan database yang dikonfigurasi pengelola. Halaman yang menyematkan Canva atau Google Maps menghubungi penyedia tersebut, yang memproses data sesuai kebijakan privasinya sendiri. Infrastruktur layanan dapat memproses data di luar Indonesia.</p>
    </section>
    <section><h2>Penyimpanan dan perlindungan</h2>
      <p>Data pelayanan disimpan pada spreadsheet, Drive, dan layanan penyimpanan yang dikonfigurasi gereja. Dashboard staf menggunakan sesi masuk. Kredensial Google pada browser disimpan dalam cookie terenkripsi yang tidak dapat dibaca JavaScript; koneksi bersama dapat menggunakan refresh token pada konfigurasi server. Pembatasan akses Google juga bergantung pada izin file dan akun yang diatur pengelola.</p>
      <p>Catatan dan arsip disimpan sampai diubah atau dihapus oleh pengelola; website belum menerapkan penghapusan otomatis dengan jangka waktu tetap. Log teknis dapat diproses oleh penyedia hosting untuk pengoperasian dan penanganan gangguan.</p>
    </section>
    <section><h2>Cookie dan preferensi browser</h2>
      <p>Cookie digunakan untuk sesi admin, proses otorisasi, dan koneksi Google. Koneksi Google pada browser memiliki masa berlaku tujuh hari. Browser juga menyimpan preferensi tampilan dan bahasa. Menghapus cookie dapat mengakhiri sesi atau koneksi pada browser tersebut.</p>
    </section>
    <section><h2>Mencabut akses, memperbaiki, atau menghapus data</h2>
      <p>Pemilik akun dapat mencabut koneksi aplikasi melalui <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">halaman koneksi Akun Google</a>. Pencabutan menghentikan penggunaan otorisasi tersebut, tetapi tidak otomatis menghapus file atau catatan yang sudah tersimpan. Akses service account dikelola terpisah melalui pengaturan berbagi Google Sheets dan Drive.</p>
      <p>Untuk meminta koreksi, penghapusan catatan atau foto, maupun bantuan privasi, hubungi pengelola website melalui akun Instagram resmi <a href={churchConfig.instagram.url} target="_blank" rel="noopener noreferrer">{churchConfig.instagram.handle}</a>, atau sampaikan kepada staf gereja di alamat {churchConfig.address}. Sampaikan permintaan melalui pesan pribadi dan hindari menuliskan alasan doa atau data sensitif pada komentar publik. Pengelola dapat meminta informasi seperlunya untuk memastikan catatan yang dimaksud.</p>
    </section>
    <section><h2>Perubahan kebijakan</h2><p>Kebijakan ini akan diperbarui jika fungsi website atau penggunaan data berubah. Tanggal pembaruan tercantum di bagian atas halaman.</p></section>
  </article>;
}
