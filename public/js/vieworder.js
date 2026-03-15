import { auth, db } from "./firebase-config.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const container = document.getElementById('user-orders-container');
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
onAuthStateChanged(auth, (user) => {
    if (user) {
        renderOrders(user.email);
    }
});
// Get orders from all_orders, take orders from the correct email of the user to show out
function renderOrders(email) {
    const q = query(collection(db, "all_orders"), where("customerEmail", "==", email));

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<p style="text-align:center; padding:20px;">No orders found for your account.</p>`;
            return;
        }

        let html = "";
        snapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const status = (order.status || "Packing").toLowerCase();
            const isDelivered = status === 'delivered';

            html += `
    <div class="order-card ${isDelivered ? 'border-delivered' : 'border-packing'}">
        <div class="order-card-header">
            <span class="order-id">#${clean(order.orderId) || 'N/A'}</span>
            <span class="status-badge ${isDelivered ? 'bg-delivered' : 'bg-packing'}">
                ${clean(order.status) || 'Packing'}
            </span>
        </div>
        
        <div class="order-info">
            <p>Order date: <b>${new Date(order.createdAt).toLocaleDateString()}</b></p>
        </div>

        <ul class="order-items-list">
            ${order.items ? order.items.map(item => `
                <li>
                    <span>${clean(item.Name)}</span>
                    <span class="item-qty">x${clean(item.quantity)}</span>
                </li>
            `).join("") : "<li>No items</li>"}
        </ul>
    </div>
`;
        });
        container.innerHTML = html;
    });
}