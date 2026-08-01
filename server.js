const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Inisialisasi Express
const app = express();
app.use(express.json()); // Middleware agar Express bisa membaca body berformat JSON

// Variabel global untuk menyimpan socket koneksi WhatsApp
let sock; 

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_wa');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), 
        browser: ['Windows', 'Chrome', '111.0'] 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        
        if (qr) {
            console.log('Silakan scan QR Code di bawah ini:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            console.log('❌ Koneksi terputus, menghubungkan ulang...');
            connectToWhatsApp();
        } else if (connection === 'open') {
            // Log ini menandakan WhatsApp dan API sudah siap
            console.log('✅ WhatsApp Berhasil Terhubung dan Siap Menerima Request API!');
        }
    });

    // Fitur Auto-Reply dari Part 1 tetap kita pertahankan
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const pengirim = msg.key.remoteJid;

        if (text) {
            console.log(`💬 Pesan masuk dari ${pengirim}: ${text}`);
            if (text.toLowerCase() === 'ping') {
                console.log('🤖 Membalas dengan: pong!');
                await sock.sendMessage(pengirim, { text: 'pong!' });
            }
        }
    });
}

// ==========================================
// ENDPOINT API (REST API)
// ==========================================

// Rute untuk menerima HTTP POST dan mengirim pesan WA
app.post('/api/send-message', async (req, res) => {
    // Menangkap data 'number' dan 'message' dari body request Postman/cURL
    const { number, message } = req.body;

    // 1. Validasi Input
    if (!number || !message) {
        return res.status(400).json({ status: false, error: 'Parameter "number" dan "message" wajib diisi!' });
    }

    // 2. Validasi Koneksi WhatsApp
    if (!sock) {
        return res.status(500).json({ status: false, error: 'Koneksi WhatsApp belum siap, silakan tunggu sebentar.' });
    }

    try {
        // 3. Format Nomor (Mengubah 08... menjadi 628...)
        let formattedNumber = number;
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '62' + formattedNumber.substring(1);
        }
        
        // Tambahkan domain WA agar dikenali oleh Baileys
        const jid = `${formattedNumber}@s.whatsapp.net`;

        // 4. Eksekusi Kirim Pesan
        await sock.sendMessage(jid, { text: message });

        console.log(`🚀 Mengirim pesan API ke ${formattedNumber}: ${message}`);

        // 5. Berikan respons sukses ke pemanggil API (Postman/cURL)
        res.status(200).json({ 
            status: true, 
            message: 'Pesan berhasil dikirim',
            data: { 
                to: formattedNumber, 
                text: message 
            }
        });
    } catch (error) {
        console.error('❌ Error saat mengirim pesan lewat API:', error);
        res.status(500).json({ status: false, error: 'Terjadi kesalahan pada server saat mengirim pesan.' });
    }
});

// ==========================================
// MENJALANKAN SERVER & WHATSAPP
// ==========================================
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🌐 Server API berjalan di port ${PORT} (http://localhost:${PORT})`);
    // Memulai koneksi WhatsApp setelah server jalan
    connectToWhatsApp(); 
});