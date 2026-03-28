import { db } from "./firebase-config.js";
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const commentsContainer = document.querySelector("#comments-container");
    if (!commentsContainer) return;

    const pad = n => n.toString().padStart(2, '0');
    commentsContainer.innerHTML = '<div class="loading">Loading comments...</div>';
    const q = query(collection(db, "comments"), orderBy("date", "desc"));
    onSnapshot(q, (querySnapshot) => {
        commentsContainer.innerHTML = '';

        if (querySnapshot.empty) {
            commentsContainer.innerHTML = '<div class="no-comments">No comments yet.</div>';
            return;
        }
        querySnapshot.forEach(docSnap => {
            const item = docSnap.data();
            const d = item.date && typeof item.date.toDate === "function"
                ? item.date.toDate()
                : (item.date ? new Date(item.date) : new Date());

            const date = pad(d.getDate());
            const month = pad(d.getMonth() + 1);
            const year = d.getFullYear();

            // Tạo element bao ngoài
            const div = document.createElement("div");
            div.classList.add("comment");
            
            // Render khung HTML
            div.innerHTML = `
                <div class="author" style="font-weight: bold; color: #2c3e50;"></div>
                <div class="date" style="font-size: 0.85rem; color: #95a5a6;">${date}/${month}/${year}</div>
                <div class="product" style="font-style: italic; margin: 5px 0;"></div>
                <div class="rating">${"⭐".repeat(Math.max(0, Math.min(5, item.stars || 0)))}</div>
                <div class="text" style="margin-top: 8px; line-height: 1.4;"></div>
            `;
            div.querySelector(".author").textContent = item.name || "Anonymous";
            div.querySelector(".product").textContent = `Reviewed: ${item.product || "N/A"}`;
            div.querySelector(".text").textContent = item.text || "";

            commentsContainer.appendChild(div);
        });
    }, (error) => {
        console.error("Lỗi Real-time Comments:", error);
        commentsContainer.innerHTML = '<div class="error">Failed to load comments.</div>';
    });
});