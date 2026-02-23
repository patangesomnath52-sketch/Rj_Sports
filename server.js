const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use(express.static('public'));

// १. MongoDB Connection (तुमचा सुरक्षित पासवर्ड)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Ram_Jadhav:Ram%401234@cluster0.5ii6lfb.mongodb.net/rjsports?retryWrites=true&w=majority"; 

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected Successfully!");
        seedDatabase(); // सर्व्हर चालू झाल्यावर जुने शूज चेक करेल
    })
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// २. प्रॉडक्ट मॉडेल
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

// ३. ऑटोमॅटिक जुने शूज डेटाबेसमध्ये टाकणे (Auto-Seed)
async function seedDatabase() {
    const count = await Product.countDocuments();
    if (count === 0) {
        const oldShoes = [
            { productId: "s1", name: "Puma Nitro Red Runner", price: 2499, category: "Footwear", brand: "Puma", images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600", "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=600"] },
            { productId: "s2", name: "Puma Sky Blue Sneakers", price: 1899, category: "Footwear", brand: "Puma", images: ["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=600", "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600"] },
            { productId: "s3", name: "HiGrip Black Runner", price: 1299, category: "Footwear", brand: "HiGrip", images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600", "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?q=80&w=600"] },
            { productId: "s4", name: "Puma Classic B&W", price: 1999, category: "Footwear", brand: "Puma", images: ["https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=600", "https://images.unsplash.com/photo-1512374382149-4332c6c021f1?q=80&w=600"] },
            { productId: "s5", name: "ProNine Sport White", price: 999, category: "Footwear", brand: "ProNine", images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=600", "https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=600"] },
            { productId: "s7", name: "Nike Smile Edition", price: 2999, category: "Footwear", brand: "Nike", images: ["https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=600", "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=600"] }
        ];
        await Product.insertMany(oldShoes);
        console.log("👟 जुने शूज डेटाबेसमध्ये यशस्वीरित्या ऍड झाले!");
    }
}

// ४. API Routes
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json({ success: true, products });
});

// Myntra सारख्या डिटेल पेजसाठी खास API
app.get('/api/products/:id', async (req, res) => {
    const product = await Product.findOne({ productId: req.params.id });
    if(product) res.json({ success: true, product });
    else res.status(404).json({ success: false });
});

app.post('/api/stock/update', async (req, res) => {
    try {
        const { productId, isOutOfStock, disabledSizes } = req.body;
        let updateData = {};
        if (isOutOfStock !== undefined) updateData.isOutOfStock = isOutOfStock;
        if (disabledSizes !== undefined) {
            // "7, 9" असं आल्यास त्याला ॲरे मध्ये बदलणे
            if(typeof disabledSizes === 'string') {
                updateData.disabledSizes = disabledSizes.split(',').map(s => s.trim()).filter(s => s);
            } else {
                updateData.disabledSizes = disabledSizes;
            }
        }
        await Product.findOneAndUpdate({ productId }, { $set: updateData });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, 'rj-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

app.post('/api/products/add', upload.array('productImages', 3), async (req, res) => {
    try {
        // इमेजचा पाथ अचूक करणे
        const imagePaths = req.files.map(file => 'uploads/' + file.filename);
        
        const newProduct = new Product({ 
            productId: req.body.productId,
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            brand: req.body.name.split(' ')[0], // नावातील पहिला शब्द ब्रँड म्हणून घेणे
            images: imagePaths,
            isOutOfStock: false,
            disabledSizes: []
        });

        await newProduct.save();
        res.json({ success: true, message: "प्रॉडक्ट अपलोड झाला!" });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});
app.listen(process.env.PORT || 3000, () => console.log(`🚀 Server is LIVE!`));