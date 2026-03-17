import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const STORAGE_KEY = 'sofa_cart_history';
const getAuthState = () => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
};
const clean = (str) => {
    if (!str) return "";
    if (typeof str !== 'string') return str;
    return str.replace(/[<>"']/g, m => ({
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
};
const getCartItems = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

const saveToLocal = (item) => {
    const items = getCartItems();
    items.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};
async function handleBuy(productIndex, quantityInput, errorSpan, productName, successline, productId) {
    const user = await getAuthState();

    if (!user) {
        alert("This function requires login!");
        return;
    }

    const checkedSize = document.querySelector(`input[name="radio"]:checked`);
    if (!checkedSize) {
        alert("Please select a size!");
        return;
    }

    let size = "";
    if (checkedSize.id.includes("sizes")) size = "S";
    else if (checkedSize.id.includes("sizem")) size = "M";
    else if (checkedSize.id.includes("sizel")) size = "L";

    const priceList = {
        "Emerald Luxe": 5000000, "Ivory Royale": 7200000, "Crimson Classic": 6500000,
        "Champagne Elegance": 4800000, "Rosé Charm": 6000000, "Granite Moderno": 7800000,
        "Sapphire Relaxa": 5200000, "Olive Haven": 5900000, "Pearl Serenity": 5900000,
        "Amber Glow": 6100000, "Charcoal Grace": 7000000, "Midnight Comfort": 5700000
    };

    const basePrice = priceList[productName] || 0;
    if (basePrice === 0) {
        console.error("Không tìm thấy giá cho sản phẩm:", productName);
    }

    const newItem = {
        productId: productId,
        Name: productName,
        Size: size,
        quantity: quantityInput ? parseInt(quantityInput.value) : 1,
        Price: basePrice,
        timestamp: Date.now()
    };

    console.log("Món hàng chuẩn bị lưu:", newItem);
    saveToLocal(newItem);
    alert("Added to cart successfully!");
    renderCart();
}

export async function addToCart(productData) {
    const user = await getAuthState();
    if (!user) return false;
    const newItem = {
        productId: productData.productId || productData.id,
        Name: productData.name,
        Size: productData.size || "Standard",
        quantity: parseInt(productData.quantity) || 1,
        Price: productData.price,
        Image: productData.image,
        timestamp: Date.now()
    };

    saveToLocal(newItem);
    alert(`Added ${productData.name} to cart!`);
    renderCart();
    return true;
}
export const renderCart = () => {
    const container = document.getElementById("cont");
    const payButton = document.getElementById("redirect");
    if (!container) return;

    const items = getCartItems();

    container.innerHTML = '<h3>Your Cart</h3>';

    if (items.length === 0) {
        if (payButton) payButton.style.display = "none";
        container.insertAdjacentHTML('beforeend', `
            <div class="empty-cart-msg text-center p-4">
                <p style="color: #888; font-style: italic;">Your cart is empty.</p>
                <a href="index.html" class="btn btn-sm btn-outline-primary">Go shopping</a>
            </div>
        `);
    } else {
        if (payButton) {
            payButton.style.display = "block";
            container.appendChild(payButton);
        }

        items.forEach((item, index) => {
            const div = document.createElement("div");
            div.className = "cart-item-row d-flex justify-content-between border-bottom p-2 mb-2 align-items-center";
            div.innerHTML = `
                <span>
                    <strong>${clean(item.Name)}</strong> <br>
                    <small>${clean(item.Size)} x ${item.quantity}</small>
                </span>
                <button class="btn btn-sm btn-danger delete-btn" data-index="${index}">X</button>
            `;
            payButton ? container.insertBefore(div, payButton) : container.appendChild(div);
        });
        container.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = function () {
                const idx = this.getAttribute("data-index");
                let currentItems = getCartItems();
                currentItems.splice(idx, 1);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(currentItems));
                renderCart();
            };
        });
    }
};
document.addEventListener("DOMContentLoaded", () => {
    renderCart();

    const payButton = document.getElementById("redirect");
    if (payButton) {
        payButton.onclick = () => window.location.href = '../html/pay-form.html';
    }
});