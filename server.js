const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// १. Cloudinary Configuration (तुमचे डिटेल्स इथे टाका)
cloudinary.config({
    cloud_name: 'dcxsebtas',
    api_key: '872585929966168',
    api_secret: 't490x7y5jzQhZrJ8juEhNmjmLwI'
});

// २. Storage Engine सेट करणे
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'rj_sports_products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});
const upload = multer({ storage: storage });

// ३. MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Ram_Jadhav:Ram%401234@cluster0.5ii6lfb.mongodb.net/rjsports?retryWrites=true&w=majority"; 
mongoose.connect(MONGO_URI).then(() => console.log("✅ MongoDB Connected!"));

// ४. प्रॉडक्ट मॉडेल
const Product = mongoose.model('Product', new mongoose.Schema({
    productId: { type: String, unique: true },
    name: String,
    price: Number,
    category: String,
    brand: String,
    images: [String],
    isOutOfStock: { type: Boolean, default: false },
    disabledSizes: { type: Array, default: [] }
}));

// ५. API Routes
// अ) नवीन प्रॉडक्ट ऍड करणे (आता फोटो थेट क्लाउडवर जातील)
app.post('/api/products/add', upload.array('productImages', 3), async (req, res) => {
    try {
        const imagePaths = req.files.map(file => file.path); // Cloudinary URL मिळेल
        const newProduct = new Product({ 
            ...req.body, 
            images: imagePaths, 
            brand: req.body.name.split(' ')[0] 
        });
        await newProduct.save();
        res.json({ success: true, message: "प्रॉडक्ट क्लाउडवर अपलोड झाला!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json({ success: true, products });
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.id });
        if(product) res.json({ success: true, product });
        else res.status(404).json({ success: false, message: "Product not found" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/stock/update', async (req, res) => {
    const { productId, isOutOfStock, disabledSizes } = req.body;
    let updateData = {};
    if (isOutOfStock !== undefined) updateData.isOutOfStock = isOutOfStock;
    if (disabledSizes !== undefined) {
        updateData.disabledSizes = typeof disabledSizes === 'string' 
            ? disabledSizes.split(',').map(s => s.trim()).filter(s => s) 
            : disabledSizes;
    }
    // प्रॉडक्ट कायमचा डिलीट करण्यासाठी API
app.delete('/api/products/:id', async (req, res) => {
    try {
        const result = await Product.findOneAndDelete({ productId: req.params.id });
        if (result) {
            res.json({ success: true, message: "प्रॉडक्ट यशस्वीरित्या डिलीट झाला!" });
        } else {
            res.status(404).json({ success: false, message: "प्रॉडक्ट सापडला नाही." });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
    await Product.findOneAndUpdate({ productId }, { $set: updateData });
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => console.log(`🚀 Cloud Server is LIVE!`));