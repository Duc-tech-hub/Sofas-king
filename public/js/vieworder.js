import { auth, db } from "./firebase-config.js";
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    getDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('user-orders-container');
    const userInfoEl = document.getElementById('user-info');

    if (!container) return;

    const clean = (str) => {
        if (!str) return "";
        return String(str).replace(/[<>"']/g, m => ({
            '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                let searchIdentifier = user.email;

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Ưu tiên lấy field 'email' trong DB (có thể là "Duck")
                    searchIdentifier = userData.email || user.email;
                }

                if (userInfoEl) {
                    userInfoEl.innerHTML = `
                        <div class="alert alert-info py-2 shadow-sm" style="font-size: 0.9rem;">
                            <i class="bi bi-person-circle"></i> Signed in as: <strong>${clean(searchIdentifier)}</strong>
                        </div>`;
                }

                fetchAndRenderOrders(searchIdentifier, container, clean);

            } catch (error) {
                console.error("User Context Error:", error);
                fetchAndRenderOrders(user.email, container, clean);
            }
        } else {
            container.innerHTML = `<div class="text-center py-5">Please log in to see orders.</div>`;
        }
    });
});

function fetchAndRenderOrders(identifier, container, clean) {
    const q = query(
        collection(db, "all_orders"), 
        where("customerName", "==", identifier)
    );

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<p class="text-center py-5">No orders found.</p>`;
            return;
        }

        const sortedDocs = snapshot.docs.sort((a, b) => {
            const valA = a.data().createdAt || a.data().timestamp || 0;
            const valB = b.data().createdAt || b.data().timestamp || 0;
            return (valB?.seconds || valB) - (valA?.seconds || valA);
        });

        let html = "";
        sortedDocs.forEach((docSnap) => {
            const order = docSnap.data();
            const status = (order.status || "Processing").toLowerCase();
            const isDelivered = status === 'delivered';
            
            // --- ĐÂY LÀ CHỖ QUAN TRỌNG NHẤT: PHẢI NẰM TRONG VÒNG LẶP ---
            // Nó sẽ bới vào items[0] để tìm địa chỉ nếu bên ngoài không có
            const finalAddress = order.address || (order.items && order.items[0]?.address) || "No Address Provided";
            
            let displayDate = "Pending Date";
            const rawDate = order.createdAt || order.timestamp || order.date;
            if (rawDate) {
                const d = (typeof rawDate.toDate === 'function') ? rawDate.toDate() : new Date(rawDate);
                displayDate = d.toLocaleDateString();
            }

            const orderTotal = order.items ? order.items.reduce((sum, item) => sum + (Number(item.Price) * Number(item.quantity)), 0) : 0;

            html += `
                <div class="card mb-4 border-0 shadow-sm" style="border-left: 6px solid ${isDelivered ? '#28a745' : '#ffc107'} !important;">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="text-muted mb-0">ORDER #${clean(order.orderId) || docSnap.id.slice(0, 8)}</h6>
                            <span class="badge ${isDelivered ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2">
                                ${clean(order.status).toUpperCase() || 'WAITING'}
                            </span>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-6 small">
                                <span class="text-muted d-block">Placed on:</span>
                                <strong>${displayDate}</strong>
                            </div>
                            <div class="col-6 text-end small">
                                <span class="text-muted d-block">Order Total:</span>
                                <strong class="text-success" style="font-size: 1.1rem;">$${orderTotal.toLocaleString()}</strong>
                            </div>
                        </div>

                        <div class="p-3 bg-light rounded">
                            <p class="small fw-bold border-bottom pb-1 mb-2">PRODUCT SUMMARY</p>
                            ${order.items ? order.items.map(item => `
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="small">${clean(item.Name)} <small class="text-muted">(${clean(item.Size)})</small></span>
                                    <span class="small fw-bold">x${item.quantity} - $${(item.Price * item.quantity).toLocaleString()}</span>
                                </div>
                            `).join("") : "<p class='small m-0'>Details unavailable</p>"}
                        </div>

                        <div class="mt-3 small text-muted">
                            <i class="bi bi-geo-alt"></i> Shipping to: <b>${clean(finalAddress)}</b>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    });
}