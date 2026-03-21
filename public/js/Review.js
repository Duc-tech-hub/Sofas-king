import { auth, db } from "./firebase-config.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("#reviewform");
    const commentList = document.querySelector("#comment-list");
    const combutton = document.querySelector("#combutton");
    const commentInput = document.querySelector("#comment");
    
    const productSelect = document.getElementById('review-product-select');
    const ratingSelect = document.getElementById('rating-select');

    const error1 = document.querySelector("#errorcheckp");
    const error2 = document.querySelector("#errorstars");
    const error3 = document.querySelector("#errorcomment");
    const successline = document.querySelector("#successline");
    const nocom = document.querySelector("#nocomment");

    let hasComments = false;
    const pad = n => n.toString().padStart(2, '0');

    // --- HELPER: QUICK TOAST ---
    const showToast = (message, icon = 'success') => {
        Swal.fire({
            title: message,
            icon: icon,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    };

    const checkContentSafe = async (text) => {
        if (!text) return true;
        const viBadWordsRegex = /địt|đm|vcl|vkl|đéo|cặc|lồn|buồi|óc chó|ngu lồn|mẹ mày|tổ sư|vãi/i;
        if (viBadWordsRegex.test(text)) return false;
        
        try {
            const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
            const isProfane = await response.text();
            return isProfane !== "true";
        } catch (err) {
            console.error("Lọc API lỗi:", err);
            return true;
        }
    };

    const fetchComments = async () => {
        if (error1) error1.textContent = ""; 
        if (error2) error2.textContent = ""; 
        if (error3) error3.textContent = "";
        if (nocom) nocom.textContent = "";

        commentList.innerHTML = "";
        
        try {
            const q = query(collection(db, "comments"), orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                if (nocom) nocom.textContent = "There's no comment yet.";
                combutton?.classList.replace("combutton1", "combutton");
            } else {
                hasComments = true;
                combutton?.classList.replace("combutton", "combutton1");

                let shown = 0;
                querySnapshot.forEach(userDoc => {
                    if (shown >= 2) return;
                    
                    const item = userDoc.data();
                    const d = item.date?.toDate ? item.date.toDate() : (item.date ? new Date(item.date) : new Date());
                    
                    let displayName = item.name || "Anonymous";
                    if (displayName.includes("@account.com")) {
                        displayName = displayName.split('@')[0];
                    }

                    const div = document.createElement("div");
                    div.classList.add("comment");
                    div.innerHTML = `
                        <div class="author" style="font-weight: bold; color: #2c3e50;">${displayName}</div>
                        <div class="date" style="font-size: 0.85rem; color: #95a5a6;">
                            ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}
                        </div>
                        <div class="product" style="font-style: italic; margin: 5px 0;">Reviewed: ${item.product || "N/A"}</div>
                        <div class="rating">${"⭐".repeat(Math.max(0, Math.min(5, item.stars || 0)))}</div>
                        <div class="text" style="margin-top: 8px; line-height: 1.4;">${item.text || ""}</div>
                    `;
                    commentList.appendChild(div);
                    shown++;
                });
            }
        } catch (err) {
            console.error("Lỗi khi load comment:", err);
        }
    };

    await fetchComments();

    if (combutton) {
        combutton.addEventListener("click", (e) => {
            e.preventDefault();
            if (hasComments) window.location.href = "comments.html";
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const productVal = productSelect?.value || "";
            const ratingVal = ratingSelect?.value || "";
            const commentVal = commentInput.value.trim();
            const wordCount = commentVal.split(/\s+/).filter(w => w.length > 0).length;

            // Reset errors
            [error1, error2, error3].forEach(el => { if(el) el.textContent = ""; });

            // Validation
            if (!productVal) { error1.textContent = "Please select a product."; return; }
            if (!ratingVal) { error2.textContent = "Please give a rating."; return; }
            if (commentVal === "") { error3.textContent = "Please write your comment."; return; }
            if (wordCount > 200) { error3.textContent = "Comment is too long."; return; }

            // Show Loading
            Swal.fire({
                title: 'Checking content...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const isSafe = await checkContentSafe(commentVal);
            if (!isSafe) {
                Swal.fire('Warning', 'Your content contains inappropriate language!', 'error');
                error3.textContent = "Bad words detected!";
                return;
            }

            let nameToSave = "Guest";
            const user = auth.currentUser;
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const userData = userDoc.exists() ? userDoc.data() : null;
                    const email = userData?.email || user.email;
                    nameToSave = email.includes("@account.com") ? email.split('@')[0] : email;
                } catch (err) {
                    nameToSave = user.email.split('@')[0];
                }
            }

            // Save to Firestore
            try {
                await addDoc(collection(db, "comments"), {
                    name: nameToSave,
                    product: productVal,
                    stars: parseInt(ratingVal),
                    text: commentVal,
                    date: serverTimestamp()
                });

                // Success notification
                Swal.fire({
                    icon: 'success',
                    title: 'Posted!',
                    text: 'Thank you for your review.',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Clear form
                commentInput.value = "";
                if (productSelect) productSelect.selectedIndex = 0;
                if (ratingSelect) ratingSelect.selectedIndex = 0;

                await fetchComments();
            } catch (err) {
                console.error("Lưu lỗi:", err);
                Swal.fire('Error', 'Could not post comment. Try again.', 'error');
            }
        });
    }
});