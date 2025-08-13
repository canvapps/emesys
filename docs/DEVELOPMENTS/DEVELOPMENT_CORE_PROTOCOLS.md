**CanvaStack Development Protocols:**
===

Pada setiap development process, kita tidak akan pernah memisahkan 'development' dan 'testing'. Keduanya adalah satu kesatuan. Untuk setiap *task* di semua fase, kita akan menerapkan dua protokol wajib:

1.  *Test-First, Module-Centric*: Tidak ada kode implementasi yang ditulis tanpa ada tes yang gagal terlebih dahulu. Tes adalah spesifikasi kita.
2.  *Chunked Development*: Kita bekerja dalam sesi-sesi fokus yang terisolasi untuk menghindari *context overload* dan memastikan setiap komponen selesai dengan tuntas dan berkualitas tinggi.

<br />

---
<br />
<br />

**Chunked Development Protocols Life Cycle:**

---

Untuk setiap *chunk* dalam tiap *phase* ini, kamu **wajib** mengikuti protokol yang sudah terbukti:
1.  **Satu Sesi, Satu Fokus:** Setiap sesi development hanya mengerjakan satu *target file* atau satu *chunk* kecil dan wajib dimulai dengan fresh session.
2.  **Konteks Minimal:** Mulai setiap sesi dengan bersih. Hanya berikan konteks dari file yang sedang dikerjakan.
3.  **Red-Green-Refactor:** Terapkan siklus ini secara disiplin untuk setiap penambahan tes.
4.  **Lapor, Dokumentasikan & Lanjut:** Setelah setiap *chunk* selesai, laporkan hasilnya dan dokumentasikan seluruh pencapaiannya dengan jelas, teliti, detail, informatif, komprehensif dan aktual, sebelum saya memberikan perintah untuk memulai *chunk* berikutnya. Kamu bisa membuat dokumentasinya pada folder yang sudah Saya sediakan, agar lebih terstruktur: `packages/*packagename*/docs/DEVELOPMENT PROGRESS` <- *ini folder dari dokumentasi development progress pada setiap packagenya*.

<br />

---
<br />
<br />

**1. Objective (Tujuan Utama)**

Untuk secara fundamental mengubah pendekatan pengujian kita dari model "verifikasi di akhir" menjadi model "spesifikasi di awal". Tujuannya adalah untuk meningkatkan kualitas kode, mempercepat *feedback loop*, dan menghilangkan fase "perbaikan massal" yang tidak efisien di akhir siklus development.

Mulai saat ini, unit test tidak lagi dianggap sebagai tahap akhir, melainkan sebagai **spesifikasi teknis yang bisa dieksekusi (*executable specification*)** untuk setiap modul yang kita bangun.

**2. The CanvaStack Development Protocol: "Red-Green-Refactor" per Module**

Untuk setiap *task*, *story*, atau *feature* baru, proses development **wajib** mengikuti siklus mikro "Red-Green-Refactor" pada level modul.

**Definisi "Modul":**
Sebuah "modul" adalah unit kode terkecil yang memiliki tanggung jawab spesifik. Contoh:
*   Satu *class* (`FileUploadManager`, `ValidationEngine`).
*   Satu set fungsi terkait (misalnya, *utility functions* untuk format tanggal).
*   Satu komponen UI (jika menggunakan React/Vue).

**Siklus Wajib untuk Setiap Modul:**

*   **Phase 1: RED (Tulis Spesifikasi Gagal)**
    *   **Action:** Sebelum menulis kode implementasi, buat file tes (`[module-name].test.ts`).
    *   **Task:** Tulis satu atau beberapa tes yang mendefinisikan perilaku paling dasar dari modul tersebut.
    *   **Expected Outcome:** Tes ini **harus gagal (MERAH)** karena kodenya belum ada. Tes yang gagal ini adalah *to-do list* dan kontrak kita.
    *   **Contoh:** Untuk modul `ValidationEngine`, tes pertama adalah `it('should return true for a valid email')`.

*   **Phase 2: GREEN (Tulis Kode Minimal untuk Lulus)**
    *   **Action:** Buka file implementasi (`[module-name].ts`).
    *   **Task:** Tulis kode **paling sederhana dan minimalis** yang diperlukan hanya untuk membuat tes yang gagal tadi menjadi lulus. Jangan melakukan optimasi atau menambahkan fitur lain.
    *   **Expected Outcome:** Jalankan tes. Semua tes yang sudah ditulis harus **lulus (HIJAU)**.
    *   **Contoh:** Tulis fungsi validasi email yang sangat dasar.

*   **Phase 3: REFACTOR (Riset dan Perbaiki)**
    *   **Action:** Lihat kembali kode yang baru saja ditulis (baik kode tes maupun kode implementasi).
    *   **Task:** Apakah ada cara untuk membuatnya lebih bersih, lebih efisien, atau lebih mudah dibaca? Lakukan perbaikan sekarang.
    *   **Expected Outcome:** Setelah *refactoring*, jalankan kembali semua tes. Mereka **harus tetap HIJAU**. Ini adalah jaring pengaman kita.

**Ulangi siklus ini untuk setiap fungsionalitas kecil di dalam modul tersebut.** Tambahkan tes baru (RED), tulis kode untuk membuatnya lulus (GREEN), lalu rapikan (REFACTOR).

**3. Aturan Wajib Tambahan**

*   **No Implementation Without a Failing Test:** Tidak boleh ada baris kode fungsional baru yang ditulis tanpa didahului oleh sebuah tes yang gagal yang memvalidasinya.
*   **Environment Mocks First:** Jika sebuah modul memerlukan interaksi dengan lingkungan eksternal (API Browser seperti `indexedDB`, `fetch`; atau *library* lain), tes untuk interaksi tersebut dan *mock*-nya harus dibuat **sebelum** implementasi logika yang bergantung padanya.
*   **Commit per Siklus:** Sangat dianjurkan untuk melakukan *commit* setelah setiap siklus "GREEN" yang sukses. Pesan *commit* bisa seperti: `feat(Validation): Add email validation rule` atau `fix(FileUpload): Handle oversized file error`. Ini menciptakan histori yang sangat jelas.

**4. Expected Outcome dari Protokol Baru**

*   **Tidak Ada Lagi "Big Bang Testing":** Pengujian terjadi secara kontinu, bukan menumpuk di akhir.
*   **Masalah Terdeteksi Secara Instan:** *Bug*, masalah lingkungan, dan miskomunikasi antar komponen akan terdeteksi dalam hitungan menit, bukan hari.
*   **Unit Test sebagai Dokumentasi Hidup:** File tes akan menjadi dokumentasi terbaik yang menjelaskan apa yang seharusnya dilakukan oleh setiap modul.
*   **Kepercayaan Diri yang Tinggi:** Kita akan memiliki kepercayaan diri untuk melakukan *refactoring* dan menambahkan fitur kapan pun, karena jaring pengaman selalu terpasang.

***Protokol ini tidak bisa ditawar dan berlaku untuk semua development baru setelah semua isu saat ini terselesaikan. Memang ini akan mengubah ritme kerja kita, tetapi ini adalah investasi untuk kecepatan dan stabilitas jangka panjang.***


```markdown
> Dengan cara ini, kita secara fundamental mengubah fase  'perbaikan massal' menjadi fase 'integrasi mulus'.

> Ini bukan hanya tentang teknis, tapi tentang membangun kultur "engineering excellence" sejak hari awal.

> Ini adalah perubahan besar yang akan mengubah cara kita bekerja dan berkontribusi pada proyek-proyek yang kita kerjakan.
```
**Apakah kamu siap untuk menjalankan rencana ini dengan disiplin tersebut?**