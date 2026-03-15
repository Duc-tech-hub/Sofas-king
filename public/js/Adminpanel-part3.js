import { db } from './firebase-config.js';
import {
    collection, collectionGroup, onSnapshot,
    doc, updateDoc, getDocs, deleteDoc, addDoc, query, where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
let isOrderSelectMode = false;
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
// Show all pending orders getting from firestore, using onsnapshot -> get in real time, does not need reloads
const loadOrdersToBox = () => {
    const container = document.querySelector('#output-box-orders');
    if (!container) return;

    const q = query(collectionGroup(db, 'admin_verify'), where('is_waiting', '==', true));

    onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `
                <div style='padding:40px; text-align:center; color:#999; font-style:italic;'>
                    No pending orders at the moment.
                </div>`;
            return;
        }

        const promises = snapshot.docs.map(async (statusDoc) => {
            const userRef = statusDoc.ref.parent.parent;
            if (!userRef) return "";

            const email = userRef.id;
            const pendingSnap = await getDocs(collection(db, "history", email, "pending_orders"));

            let productsHTML = "";
            pendingSnap.forEach(p => {
                const data = p.data();
                productsHTML += `
        <div class="product-item">
            📦 ${clean(data.Name)} <b style="color:#2ecc71;">x${data.quantity}</b>
        </div>`;
            });

            const checkboxHTML = isOrderSelectMode
                ? `<div class="check-col"><input type="checkbox" class="order-checkbox" value="${clean(email)}"></div>`
                : "";

            return `
    <div class="order-card">
        ${checkboxHTML}
        
        <div class="info-col email-section">
            <label>CUSTOMER</label>
            <div class="email-text">${clean(email)}</div>
        </div>

        <div class="info-col products-section">
            <label>ORDER DETAILS</label>
            <div class="product-list">
                ${productsHTML || "<i>Loading items...</i>"} 
            </div>
        </div>

        <div class="info-col status-section">
            <span class="status-badge">WAITING</span>
        </div>
    </div>
`;
        });

        const results = await Promise.all(promises);
        container.innerHTML = results.join("");
    });
};
// Accept orders by change the flag is_confirmed from false to true
const handleAccept = async () => {
    const selected = document.querySelectorAll('.order-checkbox:checked');
    if (selected.length === 0) return alert("Select an order!");

    for (const cb of selected) {
        const email = cb.value;
        const statusRef = doc(db, "history", email, "admin_verify", "status");
        const pendingSnap = await getDocs(collection(db, "history", email, "pending_orders"));
        const products = [];
        pendingSnap.forEach(p => products.push(p.data()));

        if (products.length === 0) continue;
        const historyCol = collection(db, "history", email, "buying_history");
        for (const item of products) {
            await addDoc(historyCol, { ...item, approvedAt: Date.now() });
        }
        const allOrdersCol = collection(db, "all_orders");
        await addDoc(allOrdersCol, {
            customerEmail: email,
            items: products,
            status: "packing",
            createdAt: Date.now(),
            orderId: "ORD" + Date.now().toString().slice(-6)
        });
        for (const pDoc of pendingSnap.docs) {
            await deleteDoc(pDoc.ref);
        }
        await updateDoc(statusRef, {
            is_waiting: false,
            is_confirmed: true,
            is_rejected: false
        });
        setTimeout(async () => {
            await updateDoc(statusRef, { is_confirmed: false });
        }, 5000);
    }
    alert("Aproved!");
};
// Deny orders by change the flag is_rejected to true
const handleDeny = async () => {
    const selected = document.querySelectorAll('.order-checkbox:checked');
    if (selected.length === 0) return alert("Select an order!");

    if (confirm("Deny selected orders?")) {
        for (const cb of selected) {
            const email = cb.value;
            const statusRef = doc(db, "history", email, "admin_verify", "status");
            await updateDoc(statusRef, {
                is_waiting: false,
                is_confirmed: false,
                is_rejected: true
            });
        }
        alert("Denied!");
        resetMode();
    }
};

const selectBtn = document.querySelector('#select-order');
const acceptBtn = document.querySelector('#accept-order');
const denyBtn = document.querySelector('#deny-order');

const resetMode = () => {
    isOrderSelectMode = false;
    selectBtn.textContent = "Select";
    acceptBtn.style.display = "none";
    denyBtn.style.display = "none";
    loadOrdersToBox();
};

selectBtn.addEventListener('click', () => {
    isOrderSelectMode = !isOrderSelectMode;
    selectBtn.textContent = isOrderSelectMode ? "Cancel" : "Select";
    acceptBtn.style.display = isOrderSelectMode ? "inline-block" : "none";
    denyBtn.style.display = isOrderSelectMode ? "inline-block" : "none";
    loadOrdersToBox();
});

acceptBtn.addEventListener('click', handleAccept);
denyBtn.addEventListener('click', handleDeny);

loadOrdersToBox();