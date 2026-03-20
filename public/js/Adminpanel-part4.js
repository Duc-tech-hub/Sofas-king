import { db } from './firebase-config.js';
import {
    collection, onSnapshot, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const selectShippingBtn = document.getElementById('select-shipping');
const completeShippingBtn = document.getElementById('complete-shipping');
const deleteShippingBtn = document.getElementById('delete-shipping');
let isShippingSelectMode = false;

// 1. Xử lý bật/tắt chế độ chọn nhiều (Select Mode)
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

// 2. Hàm Load Dashboard (Realtime với onSnapshot)
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
            
            // --- FIX LỖI HIỂN THỊ TÊN (Ưu tiên customerName) ---
            const customerDisplayName = order.customerName || order.name || order.customerEmail || 'Guest';
            
            // Logic lấy thông tin liên hệ (Ưu tiên thông tin đơn hàng trước, item sau)
            const firstItem = (order.items && order.items.length > 0) ? order.items[0] : {};
            const finalAddress = order.address || order.deliveryAddress || firstItem.address || 'No address provided';
            const finalPhone = order.phoneNumber || order.customerPhone || firstItem.phoneNumber || 'No phone number provided';

            // Tính tổng tiền đơn hàng
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

        container.innerHTML = tempHTML || '<div style="text-align:center; padding:50px; color: #999;"><h3>No orders found</h3><p>Orders will appear here once customers checkout.</p></div>';

        if (totalCountEl) totalCountEl.innerText = totalOrders;
        if (pendingCountEl) pendingCountEl.innerText = pendingDeliveryCount;
    });
};

// 3. Chuyển trạng thái đơn lẻ
window.markAsDelivered = async (id) => {
    if (!confirm("Confirm delivery for this order?")) return;
    try {
        const orderRef = doc(db, "all_orders", id);
        await updateDoc(orderRef, {
            status: "Delivered",
            deliveredAt: Date.now()
        });
    } catch (e) {
        console.error("Error updating order:", e);
        alert("Update failed: " + e.message);
    }
};

// 4. Chuyển trạng thái hàng loạt
if (completeShippingBtn) {
    completeShippingBtn.addEventListener('click', async () => {
        const selected = document.querySelectorAll('.shipping-checkbox:checked');
        if (selected.length === 0) return alert("Please select at least one order!");
        
        if (!confirm(`Mark ${selected.length} orders as Delivered?`)) return;

        try {
            for (const cb of selected) {
                await updateDoc(doc(db, "all_orders", cb.value), { 
                    status: "Delivered", 
                    deliveredAt: Date.now() 
                });
            }
            alert("Updated successfully!");
            if (isShippingSelectMode) selectShippingBtn.click(); // Tắt chế độ chọn
        } catch (error) {
            alert("Error updating orders: " + error.message);
        }
    });
}

// 5. Xóa đơn hàng hàng loạt
if (deleteShippingBtn) {
    deleteShippingBtn.addEventListener('click', async () => {
        const selected = document.querySelectorAll('.shipping-checkbox:checked');
        if (selected.length === 0) return alert("Please select at least one order to remove!");

        const confirmDelete = confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${selected.length} order(s)? This cannot be undone.`);

        if (confirmDelete) {
            try {
                for (const cb of selected) {
                    await deleteDoc(doc(db, "all_orders", cb.value));
                }
                alert("Orders deleted successfully!");
                if (isShippingSelectMode) selectShippingBtn.click();
            } catch (error) {
                console.error(error);
                alert("Failed to delete orders.");
            }
        }
    });
}

// Khởi chạy
loadShippingDashboard();