const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// १. 'public/uploads' फोल्डर खात्रीने तयार करणे
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.static('public'));

// २. MongoDB कनेक्शन (तुमची लिंक इथे पेस्ट करा)
const MONGO_URI = "तुमची_खरी_MONGODB_ATLAS_LINK_इथे_टाका"; 
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// ३. डेटाबेस मॉडेल
const Product = mongoose.model('Product', new mongoose.Schema({
    productId: { type: String, unique: true },
    name: String,
    price: Number,
    category: String,
    images: [String],
    isOutOfStock: { type: Boolean, default: false },
    disabledSizes: { type: Array, default: [] }
}));

// ४. इमेज अपलोड सेटिंग
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, 'rj-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- API ROUTES ---

// सर्व प्रॉडक्ट्सची लिस्ट मिळवण्यासाठी
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// नवीन प्रॉडक्ट आणि ३ इमेजेस ऍड करण्यासाठी
app.post('/api/products/add', upload.array('productImages', 3), async (req, res) => {
    try {
        const imagePaths = req.files.map(file => '/uploads/' + file.filename);
        const newProduct = new Product({
            productId: req.body.productId,
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            images: imagePaths
        });
        await newProduct.save();
        res.json({ success: true, message: "प्रॉडक्ट ऍड झाला!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// स्टॉक आणि साईजेस अपडेट करण्यासाठी
app.post('/api/stock/update', async (req, res) => {
    try {
        const { productId, isOutOfStock, disabledSizes } = req.body;
        await Product.findOneAndUpdate({ productId }, { isOutOfStock, disabledSizes });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));