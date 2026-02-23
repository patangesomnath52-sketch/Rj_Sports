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

// ==========================================
// 🔴 NEW: Stock Inventory Schema (स्टॉक सांभाळण्यासाठी)
// ==========================================
const stockSchema = new mongoose.Schema({
    productId: String, // उदा. 's1', 's2'
    isOutOfStock: { type: Boolean, default: false }, // संपूर्ण शूज संपला का?
    disabledSizes: { type: Array, default: [] } // उदा. ['8', '10'] (फक्त विशिष्ट साईझ संपले)
});
const Stock = mongoose.model('Stock', stockSchema);

// २. Order Schema (जुना कोड)
const orderSchema = new mongoose.Schema({
    orderId: String,
    customer: String,
    phone: String,
    address: String,
    pincode: String,
    items: Array,
    total: Number,
    status: { type: String, default: 'Processing' }, 
    date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// ==========================================
// 🔴 NEW APIs: Stock Management साठी
// ==========================================

// ग्राहकाला लाईव्ह स्टॉक दाखवण्यासाठी (GET)
app.get('/api/stock', async (req, res) => {
    try {
        const stocks = await Stock.find();
        res.json({ success: true, stocks: stocks });
    } catch (error) {
        console.error("Error fetching stock:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ॲडमिन पॅनेलमधून स्टॉक अपडेट करण्यासाठी (POST)
app.post('/api/stock/update', async (req, res) => {
    try {
        const { productId, isOutOfStock, disabledSizes } = req.body;
        
        // जर प्रॉडक्ट डेटाबेसमध्ये नसेल तर नवीन बनेल, असेल तर अपडेट होईल (upsert: true)
        await Stock.findOneAndUpdate(
            { productId: productId },
            { isOutOfStock: isOutOfStock, disabledSizes: disabledSizes },
            { upsert: true, new: true } 
        );
        res.json({ success: true, message: "Stock Updated Successfully!" });
    } catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({ success: false, message: "Stock Update Failed" });
    }
});


// ==========================================
// ३. Orders चे जुने APIs (सुरक्षित ठेवले आहेत)
// ==========================================
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

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json({ success: true, orders: orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status: status });
        res.json({ success: true, message: "Status Updated!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Update Failed" });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Order Deleted!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Delete Failed" });
    }
});

// ४. सर्व्हर सुरू करणे
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Server Live on port ${PORT} with Stock Management Engine`);
});