import { auth, db } from "./firebase-config.js";
import {
    collection, query, where, onSnapshot, doc
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

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (userInfoEl) {
                userInfoEl.innerHTML = `
                    <div class="alert alert-info py-2 shadow-sm" style="font-size: 0.9rem;">
                        <i class="bi bi-person-circle"></i> Signed in as: <strong>${clean(user.email)}</strong>
                    </div>`;
            }
            fetchAndRenderOrdersEnhanced(user.uid, container, clean);
        } else {
            container.innerHTML = `<div class="text-center py-5">Please log in to see orders.</div>`;
        }
    });
});

function fetchAndRenderOrdersEnhanced(userUid, container, clean) {
    let ordersList = [];
    let pendingOrder = null;
    const q = query(collection(db, "all_orders"), where("uid", "==", userUid));
    const statusRef = doc(db, "history", userUid, "admin_verify", "status");

    const renderAll = () => {
        let html = "";
        if (pendingOrder && pendingOrder.is_waiting) {
            html += `<div class="card mb-4 border-0 rounded-[1.5rem] shadow-[0_15px_40px_-12px_rgba(0,0,0,0.05)] overflow-hidden bg-white group hover:-translate-y-1 transition-all duration-300">
    <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="d-flex align-items-center gap-2">
                <span class="relative d-flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                <h6 class="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0">New Request</h6>
            </div>
            <span class="badge bg-orange-50 text-orange-600 border border-orange-100 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider">
                Waiting for Approval
            </span>
        </div>

        <div class="row g-0 align-items-end mb-4">
            <div class="col-7">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest d-block mb-1">Current Status</span>
                <p class="text-sm font-bold text-slate-700 mb-0">
                    <i class="bi bi-shield-check text-blue-500 me-1"></i> Admin is verifying payment...
                </p>
            </div>
            <div class="col-5 text-end">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest d-block mb-1">Total Bill</span>
                <strong class="text-2xl font-black text-slate-900 leading-none">
                    $${Number(pendingOrder.totalBill || 0).toLocaleString()}
                </strong>
            </div>
        </div>

        <div class="pt-3 border-t border-slate-50 d-flex align-items-start gap-2">
            <i class="bi bi-geo-alt-fill text-slate-300 mt-0.5"></i>
            <div class="small">
                <span class="text-[10px] font-bold text-slate-400 uppercase d-block">Destination</span>
                <b class="text-slate-600 font-semibold">${clean(pendingOrder.deliveryAddress)}</b>
            </div>
        </div>
    </div>
</div>`;
        }
        if (ordersList.length === 0 && (!pendingOrder || !pendingOrder.is_waiting)) {
            if (html === "") html = `<p class="text-center py-5">No orders found.</p>`;
        } else {
            ordersList.forEach((orderData) => {
                const order = orderData.data;
                const status = (order.status || "Processing").toLowerCase();
                const isDelivered = status === 'delivered';
                const totalAmount = order.totalBill || 0;

                let displayDate = "Pending Date";
                const rawDate = order.createdAt || order.timestamp;
                if (rawDate) {
                    const d = (typeof rawDate.toDate === 'function') ? rawDate.toDate() : new Date(rawDate);
                    displayDate = d.toLocaleDateString();
                }

                html += `<div class="card mb-4 border-0 rounded-[1.5rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] bg-white overflow-hidden transition-all hover:shadow-xl">
    <div class="card-header bg-transparent border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
        <div>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 d-block mb-1">Order ID</span>
            <h6 class="text-sm font-black text-slate-800 mb-0">#${orderData.id.slice(0, 8).toUpperCase()}</h6>
        </div>
        <span class="badge ${isDelivered ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'} border rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider">
            ${(order.status || 'WAITING').toUpperCase()}
        </span>
    </div>

    <div class="card-body p-4">
        <div class="row g-0 mb-4 py-3 border-y border-slate-50">
            <div class="col-6">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest d-block mb-1">Order Date</span>
                <strong class="text-slate-700 text-sm font-semibold">${displayDate}</strong>
            </div>
            <div class="col-6 text-end">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest d-block mb-1">Total Bill</span>
                <strong class="${isDelivered ? 'text-emerald-600' : 'text-slate-900'} text-xl font-black leading-none">
                    $${totalAmount.toLocaleString()}
                </strong>
            </div>
        </div>

        <div class="space-y-1">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
                <i class="bi bi-list-ul me-1"></i> Items Purchased
            </p>
            <div class="rounded-2xl bg-slate-50/50 p-3 border border-slate-100">
                ${order.items ? order.items.map(item => `
                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-slate-100 last:border-0">
                        <div class="d-flex flex-column">
                            <span class="text-sm font-bold text-slate-700">${clean(item.Name)}</span>
                            <span class="text-[10px] text-slate-400 font-medium">Product Category: Sofa King Series</span>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-white text-slate-600 border border-slate-200 rounded-pill font-black text-[10px] px-2 py-1">
                                Qty: ${item.quantity}
                            </span>
                        </div>
                    </div>
                `).join("") : ""}
            </div>
        </div>
    </div>
</div>`;
            });
        }
        container.innerHTML = html;
    };
    onSnapshot(statusRef, (docSnap) => {
        pendingOrder = docSnap.exists() ? docSnap.data() : null;
        renderAll();
    });
    onSnapshot(q, (snapshot) => {
        ordersList = snapshot.docs.map(d => ({ id: d.id, data: d.data() }));
        ordersList.sort((a, b) => {
            const timeA = a.data.createdAt || a.data.timestamp || 0;
            const timeB = b.data.createdAt || b.data.timestamp || 0;
            return (timeB?.seconds || timeB) - (timeA?.seconds || timeA);
        });
        renderAll();
    });
}