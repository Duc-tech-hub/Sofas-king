const STORAGE_KEY = 'sofa_cart_history';
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
async function handleBuy(productIndex, quantityInput, errorSpan, productName, successline) {
    const checkedSize = document.querySelector(`input[name="radio"]:checked`);
    if (!checkedSize) {
        alert("Please select a size for the product!");
        if (errorSpan) errorSpan.textContent = "Please select a size!";
        return;
    } else {
        if (errorSpan) errorSpan.textContent = "";
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
    const newItem = {
        Name: productName,
        Size: size,
        quantity: quantityInput ? parseInt(quantityInput.value) : 1,
        Price: basePrice,
        timestamp: Date.now()
    };
    // Save the item
    saveToLocal(newItem);
    alert("Added to cart successfully!");

    if (successline) {
        successline.style.color = "green";
        successline.textContent = "Added to cart!";
        setTimeout(() => { successline.textContent = ""; }, 2000);
    }

    renderCart();
}

// Show all items in cart
const renderCart = () => {
    const container = document.getElementById("cont");
    const payButton = document.getElementById("redirect");
    if (!container) return;

    const items = getCartItems();
    const oldItems = container.querySelectorAll(".cart-item-row, .empty-cart-msg");
    oldItems.forEach(el => el.remove());

    if (items.length === 0) {
        if (payButton) payButton.style.display = "none";
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "empty-cart-msg text-center p-4";
        emptyMsg.innerHTML = `
            <p style="color: #888; font-style: italic;">Your cart is empty.</p>
            <a href="home.html" class="btn btn-sm btn-outline-primary">Go shopping</a>
        `;
        if (payButton) {
            container.insertBefore(emptyMsg, payButton);
        } else {
            container.appendChild(emptyMsg);
        }
    } else {
        if (payButton) payButton.style.display = "block";
        items.forEach((item, index) => {
            const div = document.createElement("div");
            div.className = "cart-item-row d-flex justify-content-between border-bottom p-2 mb-2 align-items-center";
            div.innerHTML = `
    <span>
        <strong>${clean(item.Name)}</strong> (${clean(item.Size)}) x ${clean(item.quantity)}
    </span>
    <button class="btn btn-sm btn-danger delete-btn" data-index="${index}">X</button>
`;

            if (payButton) {
                container.insertBefore(div, payButton);
            } else {
                container.appendChild(div);
            }
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

// Take value from html
document.addEventListener("DOMContentLoaded", () => {
    const names = ["Emerald Luxe", "Ivory Royale", "Crimson Classic", "Champagne Elegance", "Rosé Charm", "Granite Moderno", "Sapphire Relaxa", "Olive Haven", "Pearl Serenity", "Amber Glow", "Charcoal Grace", "Midnight Comfort"];

    for (let i = 1; i <= 12; i++) {
        const btn = document.querySelector(`#buttonbuy${i}`);
        if (btn) {
            const qty = document.querySelector(`#number${i}`);
            const err = document.querySelector(`#errorcheck${i}`);
            const success = document.querySelector(`#successlinep${i}`);

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                handleBuy(i, qty, err, names[i - 1], success);
            });
        }
    }
    renderCart();

    const payButton = document.getElementById("redirect");
    if (payButton) {
        payButton.addEventListener("click", () => {
            window.location.href = '../html/pay-form.html';
        });
    }
});