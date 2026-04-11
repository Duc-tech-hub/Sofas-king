import { auth, db } from "./firebase-config.js";
import {
    collection,
    onSnapshot,
    getDoc,
    doc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("#reviewform");
    const commentList = document.querySelector("#comment-list");
    const commentInput = document.querySelector("#comment");
    const productSelect = document.getElementById('review-product-select');
    const ratingSelect = document.getElementById('rating-select');

    const error1 = document.querySelector("#errorcheckp");
    const error2 = document.querySelector("#errorstars");
    const error3 = document.querySelector("#errorcomment");
    const nocom = document.querySelector("#nocomment");

    const pad = n => n.toString().padStart(2, '0');
    const updateText = (el, text) => { if (el) el.textContent = text; };

    const listenToComments = () => {
        if (!commentList) return;

        const q = query(collection(db, "comments"), orderBy("date", "desc"));
        onSnapshot(q, (querySnapshot) => {
            [error1, error2, error3, nocom].forEach(el => updateText(el, ""));
            commentList.innerHTML = "";

            if (querySnapshot.empty) {
                updateText(nocom, "There's no comment yet.");
            } else {
                querySnapshot.forEach(docSnap => {
                    const item = docSnap.data();
                    const d = item.date?.toDate ? item.date.toDate() : new Date();
                    const displayName = item.name || "Anonymous";

                    const div = document.createElement("div");
                    div.classList.add("comment");
                    div.innerHTML = `
                        <div class="review-card p-4 mb-4 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] border border-slate-50 transition-all hover:shadow-md overflow-hidden">
                            <div class="flex flex-col sm:flex-row items-start gap-3">
                                <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-base md:text-lg border border-blue-100 shadow-sm flex-shrink-0">
                                    ${displayName.charAt(0).toUpperCase()}
                                </div>
                                <div class="flex-1 w-full min-w-0"> 
                                    <div class="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-2 gap-1">
                                        <h6 class="font-black text-slate-800 text-sm md:text-base mb-0 truncate w-full sm:w-auto">${displayName}</h6>
                                        <span class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                            <i class="bi bi-calendar3 me-1"></i> ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}
                                        </span>
                                    </div>
                                    <div class="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 mb-3 max-w-full">
                                        <i class="bi bi-bag-check text-emerald-500 text-[10px] flex-shrink-0"></i>
                                        <span class="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider break-words leading-tight">
                                            Purchased: ${item.product || "Unknown Product"}
                                        </span>
                                    </div>
                                    <div class="flex gap-0.5 mb-3">
                                        ${Array(5).fill(0).map((_, i) => `
                                            <i class="bi bi-star-fill ${i < (item.stars || 0) ? 'text-amber-400' : 'text-slate-200'} text-[10px] md:text-xs"></i>
                                        `).join("")}
                                    </div>
                                    <div class="text-slate-600 text-xs md:text-sm leading-relaxed font-medium bg-slate-50/50 p-3 rounded-xl md:rounded-2xl border border-dashed border-slate-200 break-words">
                                        "${item.text || "Customer didn't leave a comment."}"
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    commentList.appendChild(div);
                });
            }
        }, (err) => console.error("Lỗi lắng nghe:", err));
    };

    listenToComments();

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const user = auth.currentUser;
            if (!user) {
                Swal.fire('Auth Required', 'Please login to post a review.', 'warning');
                return;
            }

            const productVal = productSelect?.value || "";
            const ratingVal = ratingSelect?.value || "";
            const commentVal = commentInput?.value.trim() || "";

            if (!productVal || !ratingVal || !commentVal) return;

            Swal.fire({
                title: 'Processing...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            let nameToSave = "Anonymous";
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                nameToSave = userDoc.exists() ? (userDoc.data().username || user.email.split('@')[0]) : user.email.split('@')[0];
            } catch (err) { }

            try {
                const response = await fetch("/api/post-comment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: commentVal,
                        name: nameToSave,
                        product: productVal,
                        stars: ratingVal,
                        userId: user.uid
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    Swal.fire({ icon: 'success', title: 'Posted!', timer: 2000, showConfirmButton: false });
                    form.reset();
                } else {
                    Swal.close();
                    if (response.status === 429) {
                        Swal.fire({
                            icon: 'info',
                            title: 'Slow down!',
                            text: result.detail || 'You are posting too fast.',
                            confirmButtonColor: '#3085d6'
                        });
                    } else if (result.message === "INAPPROPRIATE_CONTENT") {
                        Swal.fire('Warning', 'Inappropriate content detected.', 'error');
                    } else if (result.message === "AUTH_REQUIRED") {
                        Swal.fire('Auth Error', 'Please login again.', 'error');
                    } else {
                        Swal.fire('Error', result.message || 'Server error.', 'error');
                    }
                }
            } catch (err) {
                Swal.fire('Error', 'Connection failed.', 'error');
            }
        });
    }
});