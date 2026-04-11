import { db } from './firebase-config.js';
import {
    collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const selectShippingBtn = document.getElementById('select-shipping');
const completeShippingBtn = document.getElementById('complete-shipping');
const deleteShippingBtn = document.getElementById('delete-shipping');
let isShippingSelectMode = false;

const showToast = (message, icon = 'success') => {
    Swal.fire({
        title: message, icon: icon, timer: 1500,
        showConfirmButton: false, toast: true, position: 'top-end'
    });
};
if (selectShippingBtn) {
    selectShippingBtn.addEventListener('click', () => {
        isShippingSelectMode = !isShippingSelectMode;
        selectShippingBtn.innerText = isShippingSelectMode ? "Cancel" : "Select";

        const displayMode = isShippingSelectMode ? "inline-block" : "none";
        if (completeShippingBtn) completeShippingBtn.style.display = displayMode;
        if (deleteShippingBtn) deleteShippingBtn.style.display = displayMode;
        document.querySelectorAll('.shipping-checkbox').forEach(cb => {
            cb.style.display = isShippingSelectMode ? "block" : "none";
        });
    });
}
const loadShippingDashboard = () => {
    const container = document.getElementById('shipping-container');
    const totalCountEl = document.getElementById('total-orders-count');
    const pendingCountEl = document.getElementById('pending-delivery-count');

    if (!container) return;

    onSnapshot(collection(db, "all_orders"), (snapshot) => {
        let tempHTML = "";
        let pendingDeliveryCount = 0;

        snapshot.docs.forEach(docSnap => {
            const order = docSnap.data();
            const docId = docSnap.id;
            const currentStatus = (order.status || "Pending").toLowerCase();
            const customerDisplayName = order.customerName || order.userName || order.email || 'Guest';
            const finalAddress = order.address || 'No address provided';
            const finalPhone = order.phoneNumber || 'No phone';
            const finalTotal = order.totalBill || (order.items ? order.items.reduce((sum, item) => sum + (Number(item.Price) * Number(item.quantity)), 0) : 0);

            if (currentStatus === "packing") pendingDeliveryCount++;

            // Trong vòng lặp snapshot.docs.forEach...
            tempHTML += `
    <div class="order-card ${currentStatus === 'delivered' ? 'border-delivered' : 'border-packing'}">
        <input type="checkbox" class="shipping-checkbox" value="${docId}" 
               style="display: ${isShippingSelectMode ? 'block' : 'none'};">
        
        <div class="order-card-header">
            <div>
                <h4 style="margin:0; font-size: 1rem;">ID: #${order.orderId || docId.slice(0, 8)}</h4>
                <small style="color: #a0aec0;">${new Date(order.createdAt || Date.now()).toLocaleDateString()}</small>
            </div>
            <span class="status-badge ${currentStatus === 'delivered' ? 'bg-delivered' : 'bg-packing'}">
                ${currentStatus.toUpperCase()}
            </span>
        </div>

        <div class="order-card-body">
            <p><strong>👤 Customer:</strong> ${customerDisplayName}</p>
            <p><strong>📞 Phone:</strong> ${finalPhone}</p>
            <p><strong>📍 Address:</strong> ${finalAddress}</p>
            <p style="font-size: 1.1rem; color: #2f855a; font-weight: bold; margin-top: 10px;">
                Total: $${finalTotal.toLocaleString()}
            </p>
        </div>

        <div class="items-list-container">
            <label style="font-size: 0.7rem; font-weight: bold; color: #718096; text-transform: uppercase;">Items Details:</label>
            <ul>
                ${order.items ? order.items.map(item => `
                    <li>
                        <span>${item.Name} x${item.quantity}</span>
                        <span>$${(item.Price * item.quantity).toLocaleString()}</span>
                    </li>
                `).join("") : "<li>No items</li>"}
            </ul>
        </div>
        
        ${currentStatus === "packing" ?
                    `<button class="btn-action-delivery" onclick="markAsDelivered('${docId}')">MARK AS DELIVERED</button>` :
                    `<div style="text-align: center; color: #28a745; font-weight: bold; padding: 10px; border: 2px solid #c6f6d5; border-radius: 8px; background: #f0fff4;">✅ DELIVERED</div>`
                }
    </div>
`;
        });

        container.innerHTML = tempHTML || '<div class="text-center p-5">No orders found</div>';
        if (totalCountEl) totalCountEl.innerText = snapshot.size;
        if (pendingCountEl) pendingCountEl.innerText = pendingDeliveryCount;
    });
};
window.markAsDelivered = async (id) => {
    const { isConfirmed } = await Swal.fire({
        title: 'Confirm Delivery?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delivered'
    });

    if (isConfirmed) {
        try {
            await updateDoc(doc(db, "all_orders", id), {
                status: "Delivered",
                deliveredAt: Date.now()
            });
            showToast("Updated!");
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        }
    }
};
if (completeShippingBtn) {
    completeShippingBtn.addEventListener('click', async () => {
        const selected = document.querySelectorAll('.shipping-checkbox:checked');
        if (selected.length === 0) return showToast("Select orders!", "info");

        const { isConfirmed } = await Swal.fire({
            title: `Mark ${selected.length} orders?`,
            icon: 'warning', showCancelButton: true
        });

        if (isConfirmed) {
            const batch = writeBatch(db);
            selected.forEach(cb => {
                batch.update(doc(db, "all_orders", cb.value), {
                    status: "Delivered",
                    deliveredAt: Date.now()
                });
            });
            await batch.commit();
            showToast("Batch updated!");
            if (isShippingSelectMode) selectShippingBtn.click();
        }
    });
}
if (deleteShippingBtn) {
    deleteShippingBtn.addEventListener('click', async () => {
        const selected = document.querySelectorAll('.shipping-checkbox:checked');
        if (selected.length === 0) return showToast("Select to delete!", "info");

        const { isConfirmed } = await Swal.fire({
            title: 'PERMANENT DELETE?',
            text: `Deleting ${selected.length} orders...`,
            icon: 'error', showCancelButton: true
        });

        if (isConfirmed) {
            const batch = writeBatch(db);
            selected.forEach(cb => batch.delete(doc(db, "all_orders", cb.value)));
            await batch.commit();
            showToast("Deleted!");
            if (isShippingSelectMode) selectShippingBtn.click();
        }
    });
}

loadShippingDashboard();