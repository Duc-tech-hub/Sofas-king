import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

let isRendering = false;

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
        '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
};

const getCartItems = async (uid) => {
    const cartRef = doc(db, "carts", uid);
    const snap = await getDoc(cartRef);
    return snap.exists() ? snap.data().items : [];
};

const saveToCloud = async (uid, items) => {
    const cartRef = doc(db, "carts", uid);
    await setDoc(cartRef, { items: items });
};

const updateCartTotal = (items) => {
    let subtotal = 0;
    items.forEach(item => {
        if (item.selected !== false) {
            subtotal += (parseFloat(item.Price) || 0) * (parseInt(item.quantity) || 1);
        }
    });
    const subtotalAmount = document.getElementById('subtotal-amount');
    const totalAmount = document.getElementById('total-amount');
    if (subtotalAmount) subtotalAmount.innerText = subtotal.toLocaleString() + ' VND';
    if (totalAmount) totalAmount.innerText = subtotal.toLocaleString() + ' VND';
};

export async function addToCart(productData) {
    const user = await getAuthState();
    if (!user) {
        await Swal.fire({ icon: 'info', title: 'Login Required', text: 'Please login!', confirmButtonColor: '#3498db' });
        return false;
    }

    let items = await getCartItems(user.uid);
    const productId = productData.productId || productData.id;
    const stockAvailable = productData.Stock !== undefined ? parseInt(productData.Stock) : (parseInt(productData.stock) || 0);
    const size = productData.size || "Standard";
    const existingIndex = items.findIndex(i => i.productId === productId && i.Size === size);

    if (existingIndex > -1) {
        const currentQty = items[existingIndex].quantity;
        const addQty = parseInt(productData.quantity) || 1;
        if (currentQty + addQty > stockAvailable) {
            await Swal.fire('Out of Stock', `Max: ${stockAvailable}. In cart: ${currentQty}`, 'error');
            return false;
        }
        items[existingIndex].quantity += addQty;
        items[existingIndex].Stock = stockAvailable;
    } else {
        items.push({
            productId: productId,
            Name: productData.name,
            Size: size,
            quantity: parseInt(productData.quantity) || 1,
            Price: productData.price,
            Image: productData.image,
            Stock: stockAvailable,
            selected: true,
            timestamp: Date.now()
        });
    }

    await saveToCloud(user.uid, items);
    await renderCart();
    return true;
}

export const renderCart = async () => {
    if (isRendering) return;
    isRendering = true;

    try {
        const container = document.getElementById("cont");
        if (!container) return;

        const user = await getAuthState();
        if (!user) {
            container.innerHTML = '<h1>Your Cart</h1><p class="text-muted">Please login.</p>';
            return;
        }

        const items = await getCartItems(user.uid);
        container.innerHTML = '<h1 class="mb-4">Your Cart</h1>';

        if (items.length === 0) {
            container.insertAdjacentHTML('beforeend', '<p class="text-center p-5 text-muted">Your cart is empty.</p>');
            updateCartTotal([]);
            return;
        }

        const updatedItems = await Promise.all(items.map(async (item) => {
            try {
                const productRef = doc(db, "products", item.productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    item.Stock = parseInt(productSnap.data().Stock) || 0;
                }
            } catch (err) {
                console.error(err);
            }
            return item;
        }));

        updatedItems.forEach((item, index) => {
            const isChecked = item.selected !== false ? 'checked' : '';
            const maxStock = parseInt(item.Stock) || 0;
            const currentQty = parseInt(item.quantity) || 1;

            const div = document.createElement("div");
            div.className = "cart-item-row d-flex justify-content-between border-bottom p-3 mb-2 align-items-center bg-white rounded-3 shadow-sm";
            div.innerHTML = `
                <div class="d-flex align-items-center gap-3">
                    <input type="checkbox" class="item-checkbox form-check-input" data-index="${index}" ${isChecked}>
                    <img src="${item.Image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                    <div style="min-width: 150px;">
                        <strong class="d-block">${clean(item.Name)}</strong>
                        <small class="text-primary fw-bold">${parseFloat(item.Price).toLocaleString()} VND</small>
                        <br><small class="text-dark fw-medium" style="font-size:0.75rem">Available: ${maxStock}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <div class="input-group input-group-sm" style="width: 110px;">
                        <button class="btn btn-outline-secondary qty-btn" data-index="${index}" data-change="-1">-</button>
                        <input type="text" class="form-control text-center bg-light" value="${currentQty}" readonly>
                        <button class="btn btn-outline-secondary qty-btn" data-index="${index}" data-change="1" 
                            ${currentQty >= maxStock ? 'disabled' : ''}>+</button>
                    </div>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-index="${index}"><i class="bi bi-trash"></i></button>
                </div>
            `;
            container.appendChild(div);
        });

        updateCartTotal(updatedItems);
        attachCartEvents(container, updatedItems, user.uid);
    } finally {
        isRendering = false;
    }
};

function attachCartEvents(container, items, uid) {
    container.querySelectorAll(".item-checkbox").forEach(chk => {
        chk.onchange = async () => {
            items[chk.dataset.index].selected = chk.checked;
            await saveToCloud(uid, items);
            updateCartTotal(items);
        };
    });

    container.querySelectorAll(".qty-btn").forEach(btn => {
        btn.onclick = async () => {
            const idx = btn.dataset.index;
            const change = parseInt(btn.dataset.change);
            const maxStock = parseInt(items[idx].Stock) || 0;
            let newQty = (parseInt(items[idx].quantity) || 1) + change;
            if (newQty < 1 || (change > 0 && newQty > maxStock)) return;
            items[idx].quantity = newQty;
            await saveToCloud(uid, items);
            await renderCart(); 
        };
    });

    container.querySelectorAll(".delete-btn").forEach(btn => {
        btn.onclick = async () => {
            const result = await Swal.fire({ title: 'Remove?', icon: 'warning', showCancelButton: true });
            if (result.isConfirmed) {
                items.splice(parseInt(btn.dataset.index), 1);
                await saveToCloud(uid, items);
                await renderCart();
            }
        };
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await renderCart();
    const payButton = document.getElementById("redirect");
    if (payButton) {
        payButton.onclick = async () => {
            const user = await getAuthState();
            if (!user) return;
            const items = await getCartItems(user.uid);
            const selected = items.filter(i => i.selected !== false);
            if (selected.length === 0) {
                Swal.fire('Oops!', 'Please select at least one item to pay!', 'error');
                return;
            }
            sessionStorage.setItem('checkoutItems', JSON.stringify(selected));
            window.location.href = '../html/pay-form.html';
        };
    }
});