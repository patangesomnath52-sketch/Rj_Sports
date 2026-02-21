const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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

// ३. ऑर्डर प्लेस करण्याचा API (सुपरफास्ट, क्रॅश-फ्री)
app.post('/api/place-order', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.json({ success: true, message: "Order saved successfully!" });
    } catch (error) {
        console.error("Error saving order:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ४. ऑर्डर्स मिळवण्याचा API (orders.html साठी)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json({ success: true, orders: orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ५. सर्व्हर सुरू करणे
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Server Live on port ${PORT}`);
});