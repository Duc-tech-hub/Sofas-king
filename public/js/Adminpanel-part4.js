import { db } from './firebase-config.js';
import {
    collection, onSnapshot, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const selectShippingBtn = document.getElementById('select-shipping');
const completeShippingBtn = document.getElementById('complete-shipping');
const deleteShippingBtn = document.getElementById('delete-shipping');
let isShippingSelectMode = false;

// --- HELPER: QUICK TOAST ---
const showToast = (message, icon = 'success') => {
    Swal.fire({
        title: message,
        icon: icon,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
};

// 1. Select Mode Toggle
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

// 2. Load Dashboard Logic
const loadShippingDashboard = () => {
    const container = document.getElementById('shipping-container');
    const totalCountEl = document.getElementById('total-orders-count');
    const pendingCountEl = document.getElementById('pending-delivery-count');

    if (!container) return;

    onSnapshot(collection(db, "all_orders"), (snapshot) => {
        let tempHTML = "";
        let totalOrders = snapshot.size;
        let pendingDeliveryCount = 0;

        snapshot.docs.forEach(docSnap => {
            const order = docSnap.data();
            const docId = docSnap.id;
            const currentStatus = (order.status || "").toLowerCase();
            
            const customerDisplayName = order.customerName || order.name || order.customerEmail || 'Guest';
            const firstItem = (order.items && order.items.length > 0) ? order.items[0] : {};
            const finalAddress = order.address || order.deliveryAddress || firstItem.address || 'No address provided';
            const finalPhone = order.phoneNumber || order.customerPhone || firstItem.phoneNumber || 'No phone number provided';

            const finalTotal = order.items ? order.items.reduce((sum, item) => {
                return sum + (Number(item.Price) || 0) * (Number(item.quantity) || 1);
            }, 0) : 0;

            if (currentStatus === "packing") {
                pendingDeliveryCount++;
            }

            tempHTML += `
                <div class="order-card" style="position: relative; border-left: 5px solid ${currentStatus === 'delivered' ? '#28a745' : '#f1c40f'}; border-bottom: 1px solid #ddd; padding: 15px; margin-bottom: 15px; background: #fff; text-align: left; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <input type="checkbox" class="shipping-checkbox" value="${docId}" 
                           style="display: ${isShippingSelectMode ? 'block' : 'none'}; 
                           position: absolute; top: 15px; right: 15px; width: 22px; height: 22px; cursor: pointer;">
                    
                    <div class="order-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; font-size: 1rem; color: #333;">ID: #${order.orderId || docId.slice(0, 8)}</h4>
                        <span style="background: ${currentStatus === 'delivered' ? '#d4edda' : '#fff3cd'}; color: ${currentStatus === 'delivered' ? '#155724' : '#856404'}; padding: 5px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">
                             ${order.status || 'Pending'}
                        </span>
                    </div>

                    <div style="margin: 12px 0; border-top: 1px solid #f1f1f1; padding-top: 10px;">
                        <p style="margin: 5px 0; font-size: 0.95rem;"><strong>👤 Customer:</strong> ${customerDisplayName}</p>
                        <p style="margin: 5px 0; font-size: 0.9rem;"><strong>📞 Phone:</strong> ${finalPhone}</p>
                        <p style="margin: 5px 0; font-size: 0.9rem; color: #555;"><strong>📍 Address:</strong> ${finalAddress}</p>
                        <p style="margin: 10px 0 5px 0; font-size: 1.1rem; color: #2ecc71; font-weight: bold;">Total: $${finalTotal.toLocaleString()}</p>
                    </div>

                    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: #888; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Items Details:</p>
                        <ul style="list-style: none; padding-left: 0; margin: 0;">
                            ${order.items ? order.items.map(item => `
                                <li style="font-size: 0.85rem; padding: 4px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                                    <span>• ${item.Name} (${item.Size}) <strong>x${item.quantity}</strong></span>
                                    <span>$${(item.Price * item.quantity).toLocaleString()}</span>
                                </li>
                            `).join("") : "<li>No items details</li>"}
                        </ul>
                    </div>
                    
                    ${currentStatus === "packing" ?
                        `<button class="btn-action" style="background: #007bff; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: bold; transition: 0.3s;" onclick="markAsDelivered('${docId}')">MARK AS DELIVERED</button>` :
                        `<div style="text-align: center; color: #28a745; font-weight: bold; padding: 8px; border: 2px solid #28a745; border-radius: 6px; background: #f0fff4;">✅ DELIVERED SUCCESSFULLY</div>`
                    }
                </div>
            `;
        });

        container.innerHTML = tempHTML || '<div style="text-align:center; padding:50px; color: #999;"><h3>No orders found</h3></div>';

        if (totalCountEl) totalCountEl.innerText = totalOrders;
        if (pendingCountEl) pendingCountEl.innerText = pendingDeliveryCount;
    });
};

// 3. Mark Single as Delivered
window.markAsDelivered = async (id) => {
    const result = await Swal.fire({
        title: 'Confirm Delivery?',
        text: "Did this order reach the customer?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Yes, Delivered!'
    });

    if (result.isConfirmed) {
        try {
            const orderRef = doc(db, "all_orders", id);
            await updateDoc(orderRef, {
                status: "Delivered",
                deliveredAt: Date.now()
            });
            showToast("Order status updated!");
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        }
    }
};

// 4. Batch Mark as Delivered
if (completeShippingBtn) {
    completeShippingBtn.addEventListener('click', async () => {
        const selected = document.querySelectorAll('.shipping-checkbox:checked');
        if (selected.length === 0) return Swal.fire('Wait!', 'Select at least one order.', 'info');
        
        const confirmResult = await Swal.fire({
            title: 'Batch Update?',
            text: `Mark ${selected.length} orders as Delivered?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            confirmButtonText: 'Confirm All'
        });

        if (confirmResult.isConfirmed) {
            try {
                Swal.fire({ title: 'Updating...', didOpen: () => Swal.showLoading() });
                for (const cb of selected) {
                    await updateDoc(doc(db, "all_orders", cb.value), { 
                        status: "Delivered", 
                        deliveredAt: Date.now() 
                    });
                }
                showToast("All selected orders updated!");
                if (isShippingSelectMode) selectShippingBtn.click();
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    });
}

// 5. Batch Delete Orders
if (deleteShippingBtn) {
    deleteShippingBtn.addEventListener('click', async () => {
        const selected = document.querySelectorAll('.shipping-checkbox:checked');
        if (selected.length === 0) return Swal.fire('Wait!', 'Select orders to delete.', 'info');

        const confirmDelete = await Swal.fire({
            title: 'PERMANENT DELETE?',
            text: `You are about to delete ${selected.length} order(s). This action cannot be undone!`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Delete Permanently'
        });

        if (confirmDelete.isConfirmed) {
            try {
                Swal.fire({ title: 'Deleting...', didOpen: () => Swal.showLoading() });
                for (const cb of selected) {
                    await deleteDoc(doc(db, "all_orders", cb.value));
                }
                showToast("Orders removed from database.");
                if (isShippingSelectMode) selectShippingBtn.click();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete orders.', 'error');
            }
        }
    });
}

loadShippingDashboard();