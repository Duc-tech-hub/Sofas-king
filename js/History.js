import { auth, db } from "./firebase-config.js";
import {
    collection, getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
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
// Show all history
const renderHistory = async (email) => {
    const container = document.getElementById("history-container");
    if (!container) return;

    container.innerHTML = "<p class='text-center'>Loading history...</p>";

    try {
        const historyCol = collection(db, "history", email, "buying_history");
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
    <div class="card mb-3 shadow-sm">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-1">${clean(item.Name) || "Unknown Product"}</h5>
                <span class="badge bg-success">Purchased</span>
            </div>
            <p class="card-text mb-1 text-secondary">Size: ${clean(item.Size) || "Standard"}</p>
            <div class="d-flex justify-content-between">
                <span>Quantity: <strong>${clean(item.quantity) || 1}</strong></span>
                <small class="text-muted">${dateStr}</small>
            </div>
        </div>
    </div>
`;
        });

    } catch (error) {
        console.error("Firestore Error:", error);
        container.innerHTML = `<p class='text-danger text-center'>Error loading data: ${error.message}</p>`;
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        renderHistory(user.email);
    } else {
        const container = document.getElementById("history-container");
        if (container) {
            container.innerHTML = "<p class='text-center'>Please login to see your history.</p>";
        }
    }
});