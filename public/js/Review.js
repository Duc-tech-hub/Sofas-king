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
    const nocom = document.querySelector("#nocomment");

    let hasComments = false;
    const pad = n => n.toString().padStart(2, '0');
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
                querySnapshot.forEach(docSnap => {
                    if (shown >= 2) return;
                    
                    const item = docSnap.data();
                    const d = item.date?.toDate ? item.date.toDate() : new Date();
                    const displayName = item.name || "Anonymous";

                    const div = document.createElement("div");
                    div.classList.add("comment");
                    div.innerHTML = `
                        <div class="author" style="font-weight: bold; color: #2c3e50;">${displayName}</div>
                        <div class="date" style="font-size: 0.85rem; color: #95a5a6;">
                            ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}
                        </div>
                        <div class="product" style="font-style: italic; margin: 5px 0;">Reviewed: ${item.product || "N/A"}</div>
                        <div class="rating">${"⭐".repeat(item.stars || 0)}</div>
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
    const checkContentSafe = async (text) => {
        const viBadWordsRegex = /địt|đm|vcl|vkl|đéo|cặc|lồn|buồi|óc chó|ngu lồn|mẹ mày|tổ sư|vãi/i;
        if (viBadWordsRegex.test(text)) return false;
        try {
            const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
            const isProfane = await response.text();
            return isProfane !== "true";
        } catch (err) { return true; }
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

            if (!productVal) { error1.textContent = "Please select a product."; return; }
            if (!ratingVal) { error2.textContent = "Please give a rating."; return; }
            if (!commentVal) { error3.textContent = "Please write your comment."; return; }

            Swal.fire({ title: 'Posting...', didOpen: () => Swal.showLoading() });
            const isSafe = await checkContentSafe(commentVal);
            if (!isSafe) {
                Swal.fire('Warning', 'Your content contains inappropriate language!', 'error');
                return;
            }
            let nameToSave = "Guest";
            const user = auth.currentUser;
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        nameToSave = userDoc.data().username || user.email.split('@')[0];
                    } else {
                        nameToSave = user.email.split('@')[0];
                    }
                } catch (err) {
                    nameToSave = "Anonymous";
                }
            }
            try {
                await addDoc(collection(db, "comments"), {
                    name: nameToSave,
                    product: productVal,
                    stars: parseInt(ratingVal),
                    text: commentVal,
                    date: serverTimestamp()
                });

                Swal.fire({ icon: 'success', title: 'Posted!', timer: 2000, showConfirmButton: false });

                form.reset();
                await fetchComments();
            } catch (err) {
                Swal.fire('Error', 'Could not post comment.', 'error');
            }
        });
    }
});