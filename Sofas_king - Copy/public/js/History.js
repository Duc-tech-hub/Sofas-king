import { auth, db } from "./firebase-config.js";
import {
    collection, getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const clean = (str) => {
    if (!str) return "";
    if (typeof str !== 'string') return str;
    return str.replace(/[<>"']/g, m => ({
        '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
};

const renderHistory = async (uid) => {
    const container = document.getElementById("history-container");
    if (!container) return;

    container.innerHTML = "<p class='text-center'>Loading history...</p>";

    try {
        const historyCol = collection(db, "history", uid, "buying_history");
        const snapshot = await getDocs(historyCol);

        if (snapshot.empty) {
            container.innerHTML = "<p class='text-center text-muted'>No purchase history found.</p>";
            return;
        }

        let historyData = [];
        snapshot.forEach(doc => {
            historyData.push(doc.data());
        });

        historyData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        container.innerHTML = "";

        historyData.forEach((item) => {
            const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : "N/A";
            container.innerHTML += `
    <div class="card mb-4 border-0 rounded-[2rem] shadow-[0_15px_35px_-10px_rgba(0,0,0,0.1)] bg-white overflow-hidden transition-all hover:scale-[1.01]">
        <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center gap-2">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: #eff6ff; color: #3b82f6;">
                        <i class="bi bi-bag-heart-fill"></i>
                    </div>
                    <div>
                        <h6 class="text-sm font-black mb-0 uppercase tracking-tight" style="color: #1e293b;">
                            ${clean(item.Name) || "Premium Sofa"}
                        </h6>
                        <span class="text-[10px] font-bold uppercase tracking-widest" style="color: #64748b;">
                            <i class="bi bi-calendar-check me-1"></i> ${dateStr}
                        </span>
                    </div>
                </div>
                <span class="badge rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-wider" 
                      style="background-color: #ecfdf5; color: #059669; border: 1px solid #d1fae5;">
                    <i class="bi bi-check-all"></i> Purchased
                </span>
            </div>

            <div class="p-3 rounded-2xl d-flex justify-content-between align-items-center" 
                 style="background-color: #f8fafc; border: 1px solid #f1f5f9;">
                
                <div class="d-flex flex-column">
                    <span class="text-[10px] font-black uppercase tracking-widest mb-1" style="color: #94a3b8;">Specification</span>
                    <p class="text-xs font-bold mb-0" style="color: #334155;">
                        <i class="bi bi-aspect-ratio me-1" style="color: #3b82f6;"></i> Size: ${clean(item.Size) || "Standard"}
                    </p>
                </div>

                <div class="text-end">
                    <span class="text-[10px] font-black uppercase tracking-widest d-block mb-1" style="color: #94a3b8;">Quantity</span>
                    <div class="badge rounded-pill font-black px-3 py-1 shadow-sm" 
                         style="background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0;">
                        x${clean(item.quantity) || 1}
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
        });

    } catch (error) {
        console.error("Firestore Error:", error);
        container.innerHTML = `<p class='text-danger text-center'>Error loading data.</p>`;
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        renderHistory(user.uid);
    } else {
        const container = document.getElementById("history-container");
        if (container) {
            container.innerHTML = "<p class='text-center'>Please login to see your history.</p>";
        }
    }
});