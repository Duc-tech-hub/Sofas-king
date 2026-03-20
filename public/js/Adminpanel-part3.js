import { db } from './firebase-config.js';
import {
    collection, collectionGroup, onSnapshot,
    doc, updateDoc, getDocs, deleteDoc, addDoc, query, where, getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

let isOrderSelectMode = false;

const clean = (str) => {
    if (!str) return "";
    if (typeof str !== 'string') return str;
    return str.replace(/[<>"']/g, m => ({
        '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
};

const loadOrdersToBox = () => {
    const container = document.querySelector('#output-box-orders');
    if (!container) return;
    const q = query(collectionGroup(db, 'admin_verify'), where('is_waiting', '==', true));

    onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<div style='padding:40px; text-align:center; color:#999;'>No pending orders.</div>`;
            return;
        }

        const promises = snapshot.docs.map(async (statusDoc) => {
            const dataStatus = statusDoc.data();
            const userRef = statusDoc.ref.parent.parent; 
            if (!userRef) return "";

            const uid = userRef.id;
            const pendingSnap = await getDocs(collection(db, "history", uid, "pending_orders"));

            let productsHTML = "";
            pendingSnap.forEach(p => {
                const data = p.data();
                productsHTML += `<div class="product-item">📦 ${clean(data.Name)} <b style="color:#2ecc71;">x${data.quantity}</b></div>`;
            });

            const checkboxHTML = isOrderSelectMode
                ? `<div class="check-col"><input type="checkbox" class="order-checkbox" value="${clean(uid)}"></div>`
                : "";

            return `
            <div class="order-card">
                ${checkboxHTML}
                <div class="info-col email-section">
                    <label>CUSTOMER</label>
                    <div class="email-text"><b>${clean(dataStatus.userName || uid)}</b></div>
                    <div style="font-size:10px; color:#999;">${uid}</div>
                </div>
                <div class="info-col products-section">
                    <label>ORDER DETAILS</label>
                    <div class="product-list">${productsHTML || "<i>Loading...</i>"}</div>
                </div>
                <div class="info-col status-section">
                    <span class="status-badge">WAITING</span>
                </div>
            </div>`;
        });

        const results = await Promise.all(promises);
        container.innerHTML = results.join("");
    });
};

const handleAccept = async () => {
    const selected = document.querySelectorAll('.order-checkbox:checked');
    if (selected.length === 0) return alert("Select an order!");

    for (const cb of selected) {
        const uid = cb.value;
        const statusRef = doc(db, "history", uid, "admin_verify", "status");
        
        try {
            const statusSnap = await getDoc(statusRef);
            const dataStatus = statusSnap.data() || {};

            const pendingCol = collection(db, "history", uid, "pending_orders");
            const pendingSnap = await getDocs(pendingCol);
            
            const products = [];
            for (const pDoc of pendingSnap.docs) {
                const item = pDoc.data();
                products.push(item);
                if (item.productId) {
                    const productRef = doc(db, "products", item.productId);
                    const productSnap = await getDoc(productRef);
                    
                    if (productSnap.exists()) {
                        const currentStock = parseInt(productSnap.data().Stock) || 0;
                        const buyQty = parseInt(item.quantity) || 0;
                        const newStock = Math.max(0, currentStock - buyQty);
                        
                        await updateDoc(productRef, { Stock: newStock });
                        console.log(`Đã trừ Stock cho ${item.productId}: ${currentStock} -> ${newStock}`);
                    } else {
                        console.error(`Không tìm thấy sản phẩm có ID: ${item.productId}`);
                    }
                } else {
                    console.error("Món hàng trong pending_orders không có field 'productId'!");
                }
            }

            if (products.length === 0) continue;
            await addDoc(collection(db, "all_orders"), {
                uid: uid,
                customerName: dataStatus.userName || "Customer",
                items: products,
                totalBill: dataStatus.totalBill || 0,
                status: "packing",
                createdAt: Date.now()
            });
            for (const pDoc of pendingSnap.docs) {
                await deleteDoc(pDoc.ref);
            }
            await updateDoc(statusRef, { is_waiting: false, is_confirmed: true });

        } catch (e) { console.error("Lỗi:", e); }
    }
    alert("Accepted!");
    resetMode();
};
const handleDeny = async () => {
    const selected = document.querySelectorAll('.order-checkbox:checked');
    if (selected.length === 0) return alert("Select an order!");

    if (confirm("Deny and clear these orders?")) {
        for (const cb of selected) {
            const uid = cb.value;
            const statusRef = doc(db, "history", uid, "admin_verify", "status");
            const pendingSnap = await getDocs(collection(db, "history", uid, "pending_orders"));
            for (const pDoc of pendingSnap.docs) {
                await deleteDoc(pDoc.ref);
            }

            await updateDoc(statusRef, {
                is_waiting: false,
                is_confirmed: false,
                is_rejected: true
            });
        }
        alert("Denied and Cleared!");
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