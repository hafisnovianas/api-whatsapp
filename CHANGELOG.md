# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dukungan modul `dotenv` untuk pengelolaan konfigurasi server dan kredensial via file `.env`.
- Template konfigurasi [.env.example](file:///e:/UPGRADE%20SKILL/WEB/BACKEND/api-whatsapp/.env.example) untuk memudahkan pengaturan lingkungan saat proyek di-clone/deploy.
- Proteksi opsional API Key pada endpoint `POST /api/send-message` melalui header `x-api-key` atau `Authorization: Bearer <token>`.
- Otomatisasi pembuatan dan pembaruan file `.env` di server Ubuntu pada proses workflow deployment GitHub Actions menggunakan secret `WA_TARGET_NUMBER`.

### Changed
- Parameter `TARGET_PHONE`, `ADMIN_NAME`, `ADMIN_PHONE`, dan `PORT` pada [server.js](file:///e:/UPGRADE%20SKILL/WEB/BACKEND/api-whatsapp/server.js) dan [index.js](file:///e:/UPGRADE%20SKILL/WEB/BACKEND/api-whatsapp/index.js) kini membaca nilai dinamis dari `process.env`.
- Pembaruan aturan [.gitignore](file:///e:/UPGRADE%20SKILL/WEB/BACKEND/api-whatsapp/.gitignore) untuk mengabaikan file `.env`, `.env.*` (dengan pengecualian `!.env.example`), log, dan folder backup.

### Security
- Menyamarkan nomor telepon pribadi dan nama kontak dari kode aktif serta seluruh riwayat commit terdahulu (*Git history rewrite*) tanpa mengubah tanggal kontribusi di profil GitHub.
- Menutup celah open relay pada endpoint API WhatsApp dengan menyediakan opsi validasi kunci rahasia (API Key).
