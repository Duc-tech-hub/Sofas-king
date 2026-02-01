import { auth, db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("#reviewform");
    const commentList = document.querySelector("#comment-list");
    const combutton = document.querySelector("#combutton");
    const comment = document.querySelector("#comment");
    const error1 = document.querySelector("#errorcheckp");
    const error2 = document.querySelector("#errorstars");
    const error3 = document.querySelector("#errorcomment");
    const successline = document.querySelector("#successline");
    const nocom = document.querySelector("#nocomment");
    let hasComments = false;
    const pad = n => n.toString().padStart(2, '0');
    // Load 2 newest comments (All comments are shown in comments.html)
    const fetchComments = async () => {
        error1.textContent = ""; error2.textContent = ""; error3.textContent = "";
        successline.textContent = "";
        if (nocom) nocom.textContent = "";

        commentList.innerHTML = "";
        const q = query(collection(db, "comments"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            if (nocom) nocom.textContent = "There's no comment yet.";
            combutton.classList.remove("combutton1");
            combutton.classList.add("combutton");
        } else {
            hasComments = true;
            combutton.classList.remove("combutton");
            combutton.classList.add("combutton1");

            let shown = 0;
            querySnapshot.forEach(doc => {
                if (shown >= 2) return;
                const item = doc.data();
                const d = item.date && typeof item.date.toDate === "function"
                    ? item.date.toDate()
                    : (item.date ? new Date(item.date) : new Date());

                const div = document.createElement("div");
                div.classList.add("comment");
                div.innerHTML = `
    <div class="author"></div>
    <div class="date">${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}</div>
    <div class="product"></div>
    <div class="rating">${"⭐".repeat(Math.max(0, Math.min(5, item.stars || 0)))}</div>
    <div class="text"></div>
`;
                div.querySelector(".author").textContent = item.name || "Anonymous";
                div.querySelector(".product").textContent = `Reviewed: ${item.product || "N/A"}`;
                div.querySelector(".text").textContent = item.text || "";

                commentList.appendChild(div);
            });
        }
    };

    await fetchComments();

    if (combutton) {
        combutton.style.display = "inline-block";
        combutton.addEventListener("click", (e) => {
            e.preventDefault();
            if (hasComments === true) {
                window.location.href = "comments.html";
            }
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const selectedProduct = document.querySelector('input[name="product"]:checked');
            const selectedStar = document.querySelector('input[name="stars"]:checked');

            const currentuser = auth.currentUser ? auth.currentUser.email : "Guest";
            error1.textContent = ""; error2.textContent = ""; error3.textContent = "";
            successline.textContent = "";

            const commentVal = comment.value.trim();
            const wordCount = commentVal.split(/\s+/).filter(w => w.length > 0).length;
            if (!selectedProduct) {
                error1.textContent = "You have to choose a product option to review.";
                return;
            }
            if (!selectedStar) {
                error2.textContent = "You have to choose one of the star options.";
                return;
            }
            if (commentVal.length === 0) {
                error3.textContent = "You haven't written a comment yet.";
                return;
            }
            if (wordCount >= 200) {
                error3.textContent = "Your comment was too long. Under 200 words please.";
                return;
            }
            // Save comments on firestore
            const now = new Date();
            await addDoc(collection(db, "comments"), {
                name: currentuser,
                date: now,
                product: selectedProduct.value,
                stars: parseInt(selectedStar.value),
                text: commentVal
            });

            successline.textContent = "Comment created successfully.";
            comment.value = "";
            if (selectedProduct) selectedProduct.checked = false;
            if (selectedStar) selectedStar.checked = false;

            await fetchComments();
        });
    }
});