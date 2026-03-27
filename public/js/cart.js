import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

// --- ACTION: ADD TO CART ---
export async function addToCart(productData) {
    const user = await getAuthState();
    if (!user) {
        await Swal.fire({
            icon: 'info',
            title: 'Login Required',
            text: 'Please login to add products to your cart!',
            confirmButtonColor: '#3498db'
        });
        return false;
    }

    const newItem = {
        productId: productData.productId || productData.id,
        Name: productData.name,
        Size: productData.size || "Standard",
        quantity: parseInt(productData.quantity) || 1,
        Price: productData.price,
        Image: productData.image,
        timestamp: Date.now()
    };

    let items = await getCartItems(user.uid);
    items.push(newItem);
    await saveToCloud(user.uid, items);
    
    // REMOVED: alert(`Added ${productData.name} to cart!`);
    // Now returns true so product-details.js can show its own Toast.
    
    await renderCart();
    return true;
}

// --- UI: RENDER CART ---
export const renderCart = async () => {
    const container = document.getElementById("cont");
    const payButton = document.getElementById("redirect");
    if (!container) return;

    const user = await getAuthState();
    if (!user) {
        container.innerHTML = '<h3>Your Cart</h3><p class="text-muted">Please login to view cart.</p>';
        if (payButton) payButton.style.display = "none";
        return;
    }

    const items = await getCartItems(user.uid);
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
                    <small class="text-muted">${clean(item.Size)} x ${item.quantity}</small>
                </span>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            payButton ? container.insertBefore(div, payButton) : container.appendChild(div);
        });

        // --- ACTION: DELETE ITEM ---
        container.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = async function () {
                const idx = parseInt(this.getAttribute("data-index"));
                
                const result = await Swal.fire({
                    title: 'Remove item?',
                    text: "Do you want to remove this product from your cart?",
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, remove it!'
                });

                if (result.isConfirmed) {
                    let currentItems = await getCartItems(user.uid);
                    currentItems.splice(idx, 1);
                    await saveToCloud(user.uid, currentItems);
                    await renderCart();
                    
                    // Small toast for deletion
                    Swal.fire({
                        title: 'Removed!',
                        icon: 'success',
                        timer: 1000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                }
            };
        });
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await renderCart();

    const payButton = document.getElementById("redirect");
    if (payButton) {
        payButton.onclick = () => {
            window.location.href = '../html/pay-form.html';
        };
    }
});