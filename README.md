<h2 align="left">Hi 👋! thank you for choosing the services of <b>PT Bravo Creative Works</b>. </h2>

###

<img align="right" height="180" src="https://ptbcwk.web.id/assets/front/img/logo.png"  />

###

<div align="left">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" height="30" alt="javascript logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" height="30" alt="typescript logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" height="30" alt="react logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" height="30" alt="html5 logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" height="30" alt="css3 logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" height="30" alt="python logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg" height="30" alt="csharp logo"  />
</div>

###

<div align="left">
  <img src="https://img.shields.io/static/v1?message=Youtube&logo=youtube&label=&color=FF0000&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="youtube logo"  />
  <img src="https://img.shields.io/static/v1?message=Instagram&logo=instagram&label=&color=E4405F&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="instagram logo"  />
  <img src="https://img.shields.io/static/v1?message=Twitch&logo=twitch&label=&color=9146FF&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="twitch logo"  />
  <img src="https://img.shields.io/static/v1?message=Discord&logo=discord&label=&color=7289DA&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="discord logo"  />
  <img src="https://img.shields.io/static/v1?message=Gmail&logo=gmail&label=&color=D14836&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="gmail logo"  />
  <img src="https://img.shields.io/static/v1?message=LinkedIn&logo=linkedin&label=&color=0077B5&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="linkedin logo"  />
</div>

###

<br clear="both">

<img src="https://profile-readme-generator.com/assets/snake.svg" />

###

# Social Media Automation (ADB + Electron)

Aplikasi desktop berbasis **Electron** untuk melakukan **otomatisasi Instagram** menggunakan **ADB (Android Debug Bridge)** dengan banyak device Android secara paralel.

Aplikasi ini mendukung **auto scan device**, **auto like**, **auto comment**, **auto follow**, sistem **license**, **auto update**, serta **dashboard visual** dengan laporan aktivitas dan export Excel.

---

## ✨ Fitur Utama

### 📱 Device Management

- Deteksi otomatis semua device Android via ADB
- Scan device satuan atau massal
- Deteksi status login Instagram
- Ekstraksi username Instagram otomatis
- Batch & parallel scanning (aman untuk banyak device)
- Cache layout UI per device

### ❤️ Auto Like

- Like postingan Instagram berdasarkan URL
- Deteksi postingan sudah pernah di-like
- Eksekusi paralel multi-device
- Delay & random delay antar device

### 💬 Auto Comment

- Komentar otomatis ke postingan
- Multi-komentar (rotasi array komentar)
- Delay & random delay
- UI detection realtime (tanpa cache)

### 👤 Auto Follow

- Follow akun berdasarkan username atau URL
- Deteksi already following / requested
- Delay & random delay
- Eksekusi paralel multi-device

### 📄 Activity Log & Report

- Semua aktivitas dicatat ke file log
- Dashboard report realtime
- Status: SUCCESS / FAILED / ALREADY
- Link langsung ke target Instagram

### 📥 Export Excel

- Export daftar device ke file Excel (.xlsx)
- Styling profesional (header, zebra row, warna status)

### 🔐 License System

- Aktivasi berbasis hardware (Windows)
- Validasi token ke license server
- Lisensi disimpan secara lokal
- Aplikasi otomatis terkunci jika lisensi invalid / expired

### 🔄 Auto Update

- Cek update saat aplikasi dijalankan
- Progress update realtime

---

## 🛠️ Tech Stack

- Electron
- Node.js
- ADB (Android Debug Bridge)
- Bootstrap 5
- ExcelJS
- Axios
- UIAutomator XML Parsing

---

## 📂 Struktur Project

```
adb-automation/
├── main.js
├── preload.js
├── welcome.js
├── package.json
├── modules/
│   ├── core.js
│   ├── ui.js
│   ├── device.js
│   ├── like.js
│   ├── comment.js
│   ├── follow.js
│   ├── license.js
│   └── updater.js
├── pageui/
│   ├── dashboard.html
│   ├── license_window.html
│   ├── components/
│   └── assets/
├── adb.exe
└── activity_log.txt
```

---

## 🚀 Cara Menjalankan

### Development

```bash
npm install
npm start
```

### Persyaratan

- Windows
- Node.js >= 16
- Android device dengan USB Debugging aktif
- Instagram sudah login

---

## 📊 Format Log

```
YYYY-MM-DD HH:mm:ss | username (deviceId) | ACTION=STATUS | url=...
```

---

## 🖥️ Cara Menggunakan Aplikasi (.exe)

Setelah aplikasi dibuild menjadi file **`.exe`**, pengguna **tidak perlu Node.js** atau menjalankan perintah terminal.

---

### 1️⃣ Persiapan Awal

Sebelum menjalankan aplikasi:

- Gunakan **Windows**
- Install software **Social Media Automation**
- Siapkan **Android device**:
  - USB Debugging **aktif**
  - Sudah **login Instagram** / Sudah Download **Instagram** (bukan instagram lite)
  - Tidak sedang dibatasi (checkpoint / challenge)
- Hubungkan device ke PC via **USB cable**
- Izinkan **USB Debugging** saat popup muncul di HP

---

### 2️⃣ Menjalankan Aplikasi

1. Klik dua kali file:
   Social Media Automation.exe

---

2.  Aplikasi akan:

- Cek update
- Validasi lisensi
- Membuka **Dashboard**

Jika lisensi belum aktif atau expired, aplikasi akan menampilkan **License Activation Window**.

---

### 3️⃣ Aktivasi Lisensi

1. Masukkan **License Key**
2. Klik **Activate**
3. Jika berhasil:

- Window tertutup otomatis
- Dashboard utama terbuka

> Lisensi terikat ke **hardware PC** dan disimpan secara lokal.

---

### 4️⃣ Scan Device Android

Saat dashboard terbuka:

- Aplikasi akan **auto-scan semua device**
- Atau klik tombol **🔄 Scan Semua**
- Untuk satu device, klik **🔄 Scan** pada baris device

Informasi yang ditampilkan:

- Device ID
- Brand & Model
- Username Instagram
- Status login (LOGGED IN / LOGIN SCREEN)

---

### 5️⃣ Auto Like

1. Buka menu **❤️ Like**
2. Isi:

- URL postingan Instagram
- Jumlah Like (max = jumlah device)
- Delay (detik)
- Random (detik)

3. Klik **🚀 Mulai Like**

Hasil akan ditampilkan sebagai notifikasi:

- SUCCESS
- ALREADY
- FAILED

---

### 6️⃣ Auto Comment

1. Buka menu **💬 Komentar**
2. Isi:

- URL postingan
- Komentar (1 komentar per baris)
- Jumlah device
- Delay & Random

3. Klik **🚀 Mulai Komentar**

Komentar akan dibagikan secara **rotasi** ke device.

---

### 7️⃣ Auto Follow

1. Buka menu **👤 Follow**
2. Masukkan:

- URL profil Instagram  
  **atau**
- Username saja (tanpa @)

3. Tentukan jumlah device
4. Klik **🚀 Mulai Follow**

Aplikasi otomatis mendeteksi:

- Sudah follow
- Requested
- Follow berhasil / gagal

---

### 8️⃣ Melihat Report Aktivitas

1. Buka menu **📄 Report Log**
2. Semua aktivitas akan tampil:

- Waktu
- Device / Username
- Aksi (LIKE / COMMENT / FOLLOW)
- Status
- Link target

Log juga tersimpan di file:
activity_log.txt

yaml
Copy code

---

### 9️⃣ Export Device ke Excel

1. Buka halaman **Device**
2. Klik **📥 Export Excel**
3. Pilih lokasi penyimpanan
4. File `.xlsx` akan dibuat dengan format profesional

---

## ⚠️ Tips Penggunaan Aman

- Gunakan **delay minimal 10–20 detik**
- Aktifkan **random delay**
- Jangan gunakan semua device sekaligus terlalu sering
- Hindari akun Instagram baru / fresh
- Gunakan IP & jaringan yang stabil

---

## ❌ Hal yang Perlu Dihindari

- Spam tanpa delay
- Menjalankan aksi berulang dalam waktu singkat
- Menggunakan akun yang sedang checkpoint
- Menutup aplikasi saat proses berjalan

---

## ⚠️ Disclaimer

Project ini tidak menggunakan API resmi Instagram.  
Gunakan dengan bijak. Risiko penggunaan ditanggung pengguna.

---

© Developed by Bravo Creative Works
