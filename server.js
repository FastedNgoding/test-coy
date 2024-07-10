const express = require('express');
const { chromium } = require('playwright');

const app = express();
const port = 3000;

let loggedInKMSP = false;
let cookiesDataKMSP = null;
let loggedInHS = false;
let cookiesDataHS = null;
let loggedInGF = false;
let cookiesDataGF = null;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Rute untuk login hesda-store
app.post('/login-hs', async (req, res) => {
    const { username, password } = req.body;
    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Login ke hesda-store
        await page.goto('https://hesda-store.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(1000);
        await page.fill('[name="username"]', username);
        await page.fill('#password', password);

        await Promise.all([
            page.waitForLoadState('networkidle', {timeout: 60000}),
            page.click('#submit')
        ]);
        
        const cookies = await context.cookies();
        cookiesDataHS = cookies;
        loggedInHS = true;
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

        await browser.close();

        res.send({ success: true, cookiesString: cookieString });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: error.message });
    }
});

// Rute Untuk login GriyaFlazz
app.post('/login-gf', async (req, res) => {
    const { username, password } = req.body;
    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Login ke Griyaflazz
        await page.goto('https://griyaflazz.xyz/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(1000);
        await page.fill('[name="username"]', username);
        await page.fill('[name="password"]', password);

        const element = await page.waitForSelector('label[for="rememberMe"]', { timeout: 20000 });

        await element.click();

        await Promise.all([
            page.waitForLoadState('networkidle', {timeout: 60000}),
            page.click('[name="masuk"]')
        ]);
        
        const cookies = await context.cookies();
        cookiesDataGF = cookies;
        loggedInGF = true;
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

        await browser.close();

        res.send({ success: true, cookiesString: cookieString });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: error.message });
    }
});

// Rute untuk login kmsp
app.post('/login-kmsp', async (req, res) => {
    const { email, password } = req.body;
    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('https://my.kmsp-store.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(1000);
        await page.fill('#email', email);
        await page.fill('#password', password);

        await Promise.all([
            page.waitForLoadState('networkidle', {timeout: 60000}),
            page.click('#submitLogin')
        ]);

        await page.waitForTimeout(1000);
        await page.goto('https://my.kmsp-store.com/panel/produk/digital', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const cookies = await context.cookies();
        cookiesDataKMSP = cookies;
        loggedInKMSP = true;
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '); 

        const csrfToken = await page.evaluate(() => {
            const csrfInput = document.evaluate("//input[@name='csrf_token']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            return csrfInput ? csrfInput.value : null;
        });

        await browser.close();

        res.send({ success: true, csrfToken: csrfToken, cookiesString: cookieString});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: error.message });
    }
});

// app.post('/bypass-kmsp', async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const browser = await chromium.launch({ headless: false });
//         const context = await browser.newContext();
//         const page = await context.newPage();

//         await page.goto('http://my.kmsp-store.com/login', { waitUntil: 'domcontentloaded', timeout: 100000 });
//         await page.waitForTimeout(30000);
//         await page.fill('#email', email);
//         await page.fill('#password', password);

//         await Promise.all([
//             page.waitForLoadState('networkidle', {timeout: 100000}),
//             page.click('#submitLogin')
//         ]);

//         const cookies = await context.cookies();
//         cookiesDataKMSP = cookies; // Simpan cookies dalam variabel global
//         loggedInKMSP = true; // Set status login menjadi true

//         await browser.close();

//         res.send({ success: true });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).send({ error: error.message });
//     }
// });

// Rute untuk melakukan capture setelah login
app.get('/capture-hs', async (req, res) => {
    if (!loggedInHS || !cookiesDataHS) {
        res.status(401).send({ error: 'Not logged in' });
        return;
    }

    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        await context.addCookies(cookiesDataHS);
        await page.goto('https://hesda-store.com/user/paket/otp', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const cookies = await page.context().cookies();
        cookiesDataHS = cookies;
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '); 

        await browser.close();

        res.send({ success: true, cookiesString: cookieString });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: error.message });
    }
});

// Rute untuk melakukan capture setelah login
app.get('/capture-gf', async (req, res) => {
    if (!loggedInGF || !cookiesDataGF) {
        res.status(401).send({ error: 'Not logged in' });
        return;
    }

    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        await context.addCookies(cookiesDataGF);
        await page.goto('https://griyaflazz.xyz/order/produk-otp-v2', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const cookies = await page.context().cookies();
        cookiesDataGF = cookies;
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '); 

        await browser.close();

        res.send({ success: true, cookiesString: cookieString });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: error.message });
    }
});

// Rute untuk melakukan capture setelah login
app.get('/capture-kmsp', async (req, res) => {
    if (!loggedInKMSP || !cookiesDataKMSP) {
        res.status(401).send({ error: 'Not logged in' });
        return;
    }

    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        await context.addCookies(cookiesDataKMSP);
        await page.goto('https://my.kmsp-store.com/panel/produk/digital', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const cookies = await context.cookies();
        cookiesDataKMSP = cookies;
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '); 

        const csrfToken = await page.evaluate(() => {
            const csrfInput = document.evaluate("//input[@name='csrf_token']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            return csrfInput ? csrfInput.value : null;
        });

        await browser.close();

        res.send({ success: true, csrfToken: csrfToken, cookiesString: cookieString});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`[-] Server berjalan di port ${port}...`);
});
