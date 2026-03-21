import { db } from './firebase-config.js';
import {
    collection, collectionGroup, onSnapshot,
    doc, updateDoc, getDocs, deleteDoc, addDoc, query, where, getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

let isOrderSelectMode = false;

const showToast = (message, icon = 'success') => {
    Swal.fire({
        title: message,
        icon: icon,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
};

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
            const userDocRef = statusDoc.ref.parent.parent;
            if (!userDocRef) return "";
            const uid = userDocRef.id;

            const pendingSnap = await getDocs(collection(db, "history", uid, "pending_orders"));

            let productsHTML = "";
            pendingSnap.forEach(p => {
                const data = p.data();
                productsHTML += `<div class="product-item">📦 ${clean(data.Name)} <b style="color:#2ecc71;">x${data.quantity}</b></div>`;
            });

            const checkboxHTML = isOrderSelectMode
                ? `<div class="check-col">
                    <input type="checkbox" class="order-checkbox" 
                           value="${uid}" 
                           data-statusid="${statusDoc.id}" 
                           style="width:20px; height:20px;">
                   </div>`
                : "";

            return `
            <div class="order-card">
                ${checkboxHTML}
                <div class="info-col email-section">
                    <label>CUSTOMER</label>
                    <div class="email-text"><b>${clean(dataStatus.userName || uid)}</b></div>
                    <div style="font-size:10px; color:#999;">ID: ${uid}</div>
                </div>
                <div class="info-col products-section">
                    <label>ORDER DETAILS</label>
                    <div class="product-list">${productsHTML || "<i>No items found</i>"}</div>
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
    if (selected.length === 0) return Swal.fire('Wait!', 'Select orders to accept.', 'info');

    const confirmResult = await Swal.fire({
        title: 'Confirm Orders?',
        text: `Process ${selected.length} order(s)?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2ecc71'
    });

    if (confirmResult.isConfirmed) {
        try {
            Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading() });

            for (const cb of selected) {
                const uid = cb.value;
                const statusId = cb.getAttribute('data-statusid');
                
                const statusRef = doc(db, "history", uid, "admin_verify", statusId);
                const statusSnap = await getDoc(statusRef);
                const dataStatus = statusSnap.data() || {};

                const pendingCol = collection(db, "history", uid, "pending_orders");
                const pendingSnap = await getDocs(pendingCol);
                
                const products = [];
                const now = Date.now();

                for (const pDoc of pendingSnap.docs) {
                    const item = pDoc.data();
                    const finalItem = { ...item, timestamp: now, status: "completed" };
                    products.push(finalItem);

                    await addDoc(collection(db, "history", uid, "buying_history"), finalItem);

                    if (item.productId) {
                        const productRef = doc(db, "products", item.productId);
                        const pSnap = await getDoc(productRef);
                        if (pSnap.exists()) {
                            const newStock = Math.max(0, (parseInt(pSnap.data().Stock) || 0) - (parseInt(item.quantity) || 0));
                            await updateDoc(productRef, { Stock: newStock });
                        }
                    }
                    await deleteDoc(pDoc.ref);
                }

                if (products.length > 0) {
                    await addDoc(collection(db, "all_orders"), {
                        uid: uid,
                        customerName: dataStatus.userName || "Customer",
                        customerEmail: dataStatus.userEmail || "", 
                        items: products,
                        totalBill: dataStatus.totalBill || 0,
                        status: "packing",
                        createdAt: now
                    });
                }

                await updateDoc(statusRef, { is_waiting: false, is_confirmed: true });
            }

            Swal.close();
            showToast("Orders accepted!");
            resetMode();
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Failed to process.', 'error');
        }
    }
};

const handleDeny = async () => {
    const selected = document.querySelectorAll('.order-checkbox:checked');
    if (selected.length === 0) return Swal.fire('Wait!', 'Select orders to deny.', 'info');

    const confirmDeny = await Swal.fire({
        title: 'Reject Orders?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33'
    });

    if (confirmDeny.isConfirmed) {
        try {
            Swal.fire({ title: 'Rejecting...', didOpen: () => Swal.showLoading() });
            for (const cb of selected) {
                const uid = cb.value;
                const statusId = cb.getAttribute('data-statusid');
                const statusRef = doc(db, "history", uid, "admin_verify", statusId);
                
                const pendingSnap = await getDocs(collection(db, "history", uid, "pending_orders"));
                for (const pDoc of pendingSnap.docs) await deleteDoc(pDoc.ref);

                await updateDoc(statusRef, { is_waiting: false, is_rejected: true });
            }
            showToast("Orders denied.");
            resetMode();
        } catch (e) { console.error(e); }
    }
};

const selectBtn = document.querySelector('#select-order');
const acceptBtn = document.querySelector('#accept-order');
const denyBtn = document.querySelector('#deny-order');

const resetMode = () => {
    isOrderSelectMode = false;
    if (selectBtn) selectBtn.textContent = "Select";
    if (acceptBtn) acceptBtn.style.display = "none";
    if (denyBtn) denyBtn.style.display = "none";
    loadOrdersToBox();
};

selectBtn?.addEventListener('click', () => {
    isOrderSelectMode = !isOrderSelectMode;
    selectBtn.textContent = isOrderSelectMode ? "Cancel" : "Select";
    if (acceptBtn) acceptBtn.style.display = isOrderSelectMode ? "inline-block" : "none";
    if (denyBtn) denyBtn.style.display = isOrderSelectMode ? "inline-block" : "none";
    loadOrdersToBox();
});

acceptBtn?.addEventListener('click', handleAccept);
denyBtn?.addEventListener('click', handleDeny);

loadOrdersToBox();