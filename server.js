const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// १. Cloudinary Configuration (Security: Environment Variables वापरणे उत्तम)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME || 'dcxsebtas',
    api_key: process.env.CLOUDINARY_API_KEY || '872585929966168',
    api_secret: process.env.CLOUDINARY_API_SECRET || 't490x7y5jzQhZrJ8juEhNmjmLwI'
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
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected!"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ४. प्रॉडक्ट मॉडेल
const Product = mongoose.model('Product', new mongoose.Schema({
    productId: { type: String, unique: true, required: true },
    name: String,
    price: Number,
    category: String,
    brand: String,
    images: [String],
    isOutOfStock: { type: Boolean, default: false },
    disabledSizes: { type: Array, default: [] }
}));

// ५. API Routes

// अ) नवीन प्रॉडक्ट ऍड करणे
app.post('/api/products/add', upload.array('productImages', 3), async (req, res) => {
    try {
        // सुरक्षितता: जर फोटो नसतील तर एरर देऊया
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "कृपया फोटो अपलोड करा!" });
        }

        const imagePaths = req.files.map(file => file.path); // Cloudinary URL मिळेल

        const newProduct = new Product({ 
            productId: req.body.productId,
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            brand: req.body.name ? req.body.name.split(' ')[0] : "General",
            images: imagePaths, 
            isOutOfStock: req.body.isOutOfStock === 'true' || req.body.isOutOfStock === true,
            disabledSizes: req.body.disabledSizes || []
        });

        await newProduct.save();
        res.json({ success: true, message: "प्रॉडक्ट क्लाउडवर यशस्वीरित्या अपलोड झाला!" });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ब) सर्व प्रॉडक्ट्स मिळवणे
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// क) एक प्रॉडक्ट मिळवणे
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.id });
        if(product) res.json({ success: true, product });
        else res.status(404).json({ success: false, message: "Product not found" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ड) स्टॉक आणि साईज अपडेट करणे
app.post('/api/stock/update', async (req, res) => {
    try {
        const { productId, isOutOfStock, disabledSizes } = req.body;
        let updateData = {};
        
        if (isOutOfStock !== undefined) updateData.isOutOfStock = isOutOfStock;
        if (disabledSizes !== undefined) {
            updateData.disabledSizes = Array.isArray(disabledSizes) 
                ? disabledSizes 
                : disabledSizes.split(',').map(s => s.trim()).filter(s => s);
        }
        
        const result = await Product.findOneAndUpdate({ productId }, { $set: updateData }, { new: true });
        if (result) res.json({ success: true, message: "स्टॉक अपडेट झाला!" });
        else res.status(404).json({ success: false, message: "प्रॉडक्ट सापडला नाही." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ई) प्रॉडक्ट कायमचा डिलीट करण्यासाठी API
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

// ६. सर्व्हर चालू करणे
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 RJ Sports Cloud Server is LIVE on port ${PORT}!`));