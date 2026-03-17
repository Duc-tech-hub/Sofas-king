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
    const error1 = document.querySelector("#errorcheckp");
    const error2 = document.querySelector("#errorstars");
    const error3 = document.querySelector("#errorcomment");
    const successline = document.querySelector("#successline");
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
                querySnapshot.forEach(userDoc => {
                    if (shown >= 2) return;
                    
                    const item = userDoc.data();
                    const d = item.date && typeof item.date.toDate === "function"
                        ? item.date.toDate()
                        : (item.date ? new Date(item.date) : new Date());
                    let displayName = item.name || "Anonymous";
                    if (displayName.includes("@account.com")) {
                        displayName = displayName.split('@')[0];
                    }

                    const div = document.createElement("div");
                    div.classList.add("comment");
                    div.innerHTML = `
                        <div class="author" style="font-weight: bold; color: #2c3e50;"></div>
                        <div class="date" style="font-size: 0.85rem; color: #95a5a6;">
                            ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}
                        </div>
                        <div class="product" style="font-style: italic; margin: 5px 0;"></div>
                        <div class="rating">${"⭐".repeat(Math.max(0, Math.min(5, item.stars || 0)))}</div>
                        <div class="text" style="margin-top: 8px; line-height: 1.4;"></div>
                    `;
                    
                    div.querySelector(".author").textContent = displayName;
                    div.querySelector(".product").textContent = `Reviewed: ${item.product || "N/A"}`;
                    div.querySelector(".text").textContent = item.text || "";

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
            const selectedProduct = document.querySelector('input[name="product"]:checked');
            const selectedStar = document.querySelector('input[name="stars"]:checked');
            const commentVal = commentInput.value.trim();
            const wordCount = commentVal.split(/\s+/).filter(w => w.length > 0).length;
            error1.textContent = ""; error2.textContent = ""; error3.textContent = "";
            successline.textContent = "";
            if (!selectedProduct) {
                error1.textContent = "Please select a product."; return;
            }
            if (!selectedStar) {
                error2.textContent = "Please give a rating."; return;
            }
            if (commentVal === "") {
                error3.textContent = "Please write your comment."; return;
            }
            if (wordCount > 200) {
                error3.textContent = "Comment is too long (max 200 words)."; return;
            }
            let nameToSave = "Guest";
            const user = auth.currentUser;

            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const email = userData.email || user.email;
                        nameToSave = email.includes("@account.com") ? email.split('@')[0] : email;
                    } else {
                        nameToSave = user.email.includes("@account.com") ? user.email.split('@')[0] : user.email;
                    }
                } catch (err) {
                    console.error("Lỗi lấy thông tin user:", err);
                    nameToSave = user.email.split('@')[0];
                }
            }
            try {
                await addDoc(collection(db, "comments"), {
                    name: nameToSave,
                    product: selectedProduct.value,
                    stars: parseInt(selectedStar.value),
                    text: commentVal,
                    date: serverTimestamp()
                });
                successline.textContent = "Comment posted successfully!";
                commentInput.value = "";
                if (selectedProduct) selectedProduct.checked = false;
                if (selectedStar) selectedStar.checked = false;
                await fetchComments();
            } catch (err) {
                console.error("Lỗi khi lưu comment:", err);
                successline.textContent = "Error: Could not save comment.";
            }
        });
    }
});