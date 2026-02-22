const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

// १. MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB यशस्वीरित्या कनेक्ट झाला!'))
    .catch(err => console.error('❌ MongoDB एरर:', err));

// २. Order Schema (🔴 नवीन: 'status' फील्ड ऍड केले आहे)
const orderSchema = new mongoose.Schema({
    orderId: String,
    customer: String,
    phone: String,
    address: String,
    pincode: String,
    items: Array,
    total: Number,
    status: { type: String, default: 'Processing' }, // ग्राहकाला डीफॉल्ट प्रोसेसिंग दिसेल
    date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// ३. Place Order API
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

// ४. Get All Orders API (orders.html आणि admin.html साठी)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json({ success: true, orders: orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ==========================================
// 🔴 ५. NEW API: Order चे Status अपडेट करण्यासाठी (Edit Feature)
// ==========================================
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status: status });
        res.json({ success: true, message: "Status Updated!" });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ success: false, message: "Update Failed" });
    }
});

// ==========================================
// 🔴 ६. NEW API: Order कायमची डिलीट करण्यासाठी (Delete Feature)
// ==========================================
app.delete('/api/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Order Deleted!" });
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ success: false, message: "Delete Failed" });
    }
});

// ७. सर्व्हर सुरू करणे
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Server Live on port ${PORT}`);
});