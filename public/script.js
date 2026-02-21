
// १. ग्लोबल व्हेरिएबल आणि इनिशिएलायझेशन
let cart = JSON.parse(localStorage.getItem('rj_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    // २. "Add to Cart" बटन क्लिक इव्हेंट
    document.querySelectorAll('.add-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const id = card.dataset.id;
            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);

            addToCart(id, name, price);
        });
    });
});

// ३. कार्टमध्ये आयटम ॲड करणे
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }

    saveAndRefresh();
    openCartSidebar();
}

// ४. डेटा सेव्ह आणि रिफ्रेश करणे
function saveAndRefresh() {
    localStorage.setItem('rj_cart', JSON.stringify(cart));
    updateCartUI();
}

// ५. UI अपडेट करणे
function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalElem = document.getElementById('cart-total');
    const badges = document.querySelectorAll('.cart-badge');

    container.innerHTML = '';
    let totalPrice = 0;
    let totalCount = 0;

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;
        totalCount += item.quantity;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <p>₹${item.price} x ${item.quantity}</p>
            </div>
            <button onclick="removeFromCart('${item.id}')" style="color:red; border:none; background:none; cursor:pointer;">REMOVE</button>
        `;
        container.appendChild(div);
    });

    totalElem.innerText = totalPrice;
    badges.forEach(b => b.innerText = totalCount);
}

// ६. रिमूव्ह करणे
window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    saveAndRefresh();
}

// ७. कार्ट उघडणे/मिटणे
window.toggleCart = function() {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cart-overlay').classList.toggle('open');
}

function openCartSidebar() {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
}

// ८. Checkout (पुढच्या स्टेपसाठी)
window.checkout = function() {
    if(cart.length === 0) return alert("Your cart is empty!");
    window.location.href = 'checkout.html';
}