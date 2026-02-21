require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
// MongoDB Connection
// तुमच्या server.js मधील हा भाग थोडा बदलून पहा:
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB यशस्वीरित्या कनेक्ट झाला!'))
    .catch(err => {
        console.log('❌ MongoDB एरर खालीलप्रमाणे आहे:');
        console.log(err); // हा मेसेज आपल्याला नेमकी चूक सांगेल
    });

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customer: String,
    phone: String,
    address: String,
    items: Array,
    total: Number,
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// WhatsApp Setup
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // हे Render च्या RAM साठी सर्वात महत्त्वाचे आहे
            '--disable-gpu'
        ]
    }
});

// --- API ROUTES ---

// १. नवीन ऑर्डर प्लेस करणे (Customer)
app.post('/api/place-order', async (req, res) => {
    try {
        const newOrder = await Order.create(req.body);
        const msg = `🏏 *RJ SPORTS: NEW ORDER!* \nID: #${newOrder.orderId}\nCustomer: ${newOrder.customer}\nTotal: ₹${newOrder.total}`;
        if (client.info) client.sendMessage(process.env.MY_NUMBER + "@c.us", msg);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});
// ऑर्डर्स मिळवण्याचा API
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json({ success: true, orders: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});
// २. सेल्स रिपोर्ट (Owner Dashboard)
app.get('/api/admin/sales-summary', async (req, res) => {
    try {
        const orders = await Order.find();
        const summary = {
            totalSales: orders.reduce((sum, o) => sum + o.total, 0),
            totalOrders: orders.length,
            pending: orders.filter(o => o.status === 'Pending').length
        };
        res.json(summary);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ३. सर्व ऑर्डर्स (Admin)
app.get('/api/admin/all-orders', async (req, res) => {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
});

// ४. स्टेटस अपडेट आणि डिलीट
app.post('/api/admin/update-status', async (req, res) => {
    await Order.findOneAndUpdate({ orderId: req.body.orderId }, { status: req.body.newStatus });
    res.json({ success: true });
});

app.post('/api/admin/delete-order', async (req, res) => {
    await Order.findOneAndDelete({ orderId: req.body.orderId });
    res.json({ success: true });
});

// ५. वैयक्तिक ऑर्डर्स (My Orders)
app.get('/api/my-orders/:phone', async (req, res) => {
    const orders = await Order.find({ phone: req.params.phone }).sort({ date: -1 });
    res.json(orders);
});

app.listen(PORT, () => console.log(`🔥 Server Live: http://localhost:${PORT}`));