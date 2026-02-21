const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

// १. MongoDB कनेक्शन
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB यशस्वीरित्या कनेक्ट झाला!'))
    .catch(err => console.error('❌ MongoDB एरर:', err));

// २. ऑर्डरचा डेटाबेस स्ट्रक्चर
const orderSchema = new mongoose.Schema({
    orderId: String,
    customer: String,
    phone: String,
    address: String,
    pincode: String,
    items: Array,
    total: Number,
    date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// ३. तुमचा जुना ओरिजनल WhatsApp Bot 
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
            '--single-process', 
            '--disable-gpu'
        ]
    }
});

// QR कोड जनरेट करण्यासाठी
client.on('qr', (qr) => {
    console.log('👇 खालील QR कोड तुमच्या WhatsApp ने स्कॅन करा 👇');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Bot is Ready!');
});

client.initialize();

// ४. ऑर्डर प्लेस करण्याचा API (WhatsApp Bot सह)
app.post('/api/place-order', async (req, res) => {
    try {
        const newOrder = await Order.create(req.body);
        
        // तुमच्या WhatsApp वर मेसेज पाठवण्याचा कोड
        const msg = `🏏 *RJ SPORTS: NEW ORDER!* \nID: #${newOrder.orderId}\nCustomer: ${newOrder.customer}\nTotal: ₹${newOrder.total}`;
        
        // तुमचा नंबर (process.env.MY_NUMBER नसल्यास थेट नंबर वापरला आहे)
        const myNumber = process.env.MY_NUMBER || "919359239161"; 
        
        if (client.info) {
            await client.sendMessage(myNumber + "@c.us", msg);
            console.log("WhatsApp message sent successfully!");
        }

        res.json({ success: true, message: "Order saved successfully!" });
    } catch (e) { 
        console.error("Error saving order:", e);
        res.status(500).json({ success: false }); 
    }
});

// ५. ऑर्डर्स मिळवण्याचा API (orders.html साठी)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json({ success: true, orders: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ६. सर्व्हर सुरू करणे
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Server Live: http://localhost:${PORT}`);
});