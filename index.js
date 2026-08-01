const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal'); // Tambahan untuk memunculkan QR Code

async function connectToWhatsApp() {
    // Menyimpan sesi agar tidak perlu scan QR terus menerus
    // Sesi akan disimpan di folder bernama 'auth_wa'
    const { state, saveCreds } = await useMultiFileAuthState('auth_wa');

    // Inisialisasi koneksi socket WhatsApp
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), // 'silent' agar log terminal bersih dan QR mudah dibaca
        browser: ['Windows', 'Chrome', '111.0'] // Mencegah WhatsApp menolak koneksi karena dianggap bot tanpa browser
    });

    // Simpan kredensial saat ada pembaruan dari WhatsApp
    sock.ev.on('creds.update', saveCreds);

    // Pantau status koneksi
    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        
        // Menangkap event QR dan mencetaknya ke terminal
        if (qr) {
            console.log('Silakan scan QR Code di bawah ini:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            console.log('❌ Koneksi terputus, menghubungkan ulang...');
            // Rekoneksi otomatis
            connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Berhasil Terhubung!');
            
            // ==========================================
            // BAGIAN MENGIRIM PESAN OTOMATIS
            // ==========================================
            
            // GANTI NOMOR INI: Gunakan 62 untuk Indonesia (tanpa angka 0 di depan)
            const nomorTujuan = '6281534856394'; 
            
            // Format ID yang dikenali oleh WhatsApp
            const jid = `${nomorTujuan}@s.whatsapp.net`;
            
            try {
                console.log(`Mencoba mengirim pesan ke ${nomorTujuan}...`);
                
                // Perintah mengirim pesan teks
                await sock.sendMessage(jid, { text: 'Halo! Ini adalah pesan otomatis pertama dari skrip Baileys saya.' });
                
                console.log('✅ Pesan berhasil dikirim!');
                
            } catch (error) {
                console.error('❌ Gagal mengirim pesan:', error);
            }
        }
    });

    // ==========================================
    // BAGIAN MEMBACA DAN MEMBALAS PESAN
    // ==========================================
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        
        // Abaikan pesan dari diri sendiri atau pesan kosong (misal sistem update)
        if (!msg.message || msg.key.fromMe) return;

        // Ekstrak teks dari pesan biasa atau pesan balasan (extended)
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const pengirim = msg.key.remoteJid;

        if (text) {
            console.log(`💬 Pesan masuk dari ${pengirim}: ${text}`);

            // Cek jika pesannya adalah "ping" (tidak sensitif huruf besar/kecil)
            if (text.toLowerCase() === 'ping') {
                console.log('🤖 Membalas dengan: pong!');
                await sock.sendMessage(pengirim, { text: 'pong!' });
            }
        }
    });
}

// Jalankan fungsi
connectToWhatsApp();