const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', async (req, res) => {
    const { email, password } = req.query; // Mengambil data dari parameter URL

    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();

        await page.goto('https://my.kmsp-store.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Tunggu elemen login muncul
        await page.waitForSelector('#email');
        await page.waitForSelector('#password');
        await page.waitForSelector('#submitLogin');

        // Masukkan email dan kata sandi
        await page.type('#email', email);
        await page.type('#password', password);

        // Klik tombol login
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('#submitLogin')
        ]);

        // Tangkap cookie
        const cookies = await page.cookies();
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');      

        // Tutup browser
        await browser.close();

        // Inisialisasi browser baru untuk halaman yang diinginkan dengan cookie yang diperoleh dari login
        const browser2 = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page2 = await browser2.newPage();

        // Set cookie dari halaman login
        await page2.setCookie(...cookies);

        // Buka halaman yang diinginkan
        await page2.goto('https://my.kmsp-store.com/panel/produk/tembak_xl_special', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Dapatkan csrf_token
        const csrfToken = await page2.evaluate(() => {
            const csrfInput = document.evaluate("//input[@name='csrf_token']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            return csrfInput ? csrfInput.value : null;
        });

        // Tutup browser kedua
        await browser2.close();

        res.send({ cookies: cookies, csrfToken: csrfToken, copyCookies: cookieString });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
