import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

let isSelectModeComment = false;
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
// Show all comments getting from firestore
const loadComments = () => {
    const container = document.querySelector('#output-box-comments');
    if (!container) return;

    onSnapshot(collection(db, "comments"), (snapshot) => {
        container.innerHTML = "";
        snapshot.forEach((commentDoc) => {
            const data = commentDoc.data();
            const commentId = commentDoc.id;

            const div = document.createElement("div");
            div.className = "comment-item";
            div.style.cssText = `
                border: 1px solid #ccc; 
                padding: 10px; 
                margin: 10px; 
                border-radius: 8px; 
                display: inline-block; 
                min-width: 250px;
                background-color: #fff;
            `;

            const checkboxHTML = isSelectModeComment
                ? `<input type="checkbox" class="comment-checkbox" value="${commentId}" style="margin-right: 10px;">`
                : "";

            div.innerHTML = `
    <div style="display: flex; align-items: flex-start;">
        ${checkboxHTML}
        <div>
            <strong style="color: #2c3e50;">${clean(data.name)}</strong>
            <p style="margin: 5px 0; font-size: 0.9rem;">${clean(data.text)}</p>
            <small style="color: #999;">Product: ${clean(data.product)}</small><br>
            <small style="color: #c2c05cff;">Stars: ${data.stars}</small>
        </div>
    </div>
`;
            container.appendChild(div);
        });
    });
};

document.querySelector('#select-comment').addEventListener('click', (e) => {
    isSelectModeComment = !isSelectModeComment;
    const removeBtn = document.querySelector('#remove-comment');

    if (isSelectModeComment) {
        e.target.textContent = "Cancel";
        removeBtn.style.display = "inline-block";
    } else {
        e.target.textContent = "Select";
        removeBtn.style.display = "none";
    }
    loadComments();
});
// Delete comments
document.querySelector('#remove-comment').addEventListener('click', async () => {
    const selected = document.querySelectorAll('.comment-checkbox:checked');

    if (selected.length === 0) {
        alert("Please select at least one comment to remove.");
        return;
    }

    if (confirm(`Are you sure you want to delete ${selected.length} comment(s)?`)) {
        try {
            for (const cb of selected) {
                await deleteDoc(doc(db, "comments", cb.value));
            }
            alert("Deleted successfully!");
            resetCommentMode();
        } catch (error) {
            console.error("Error removing comments: ", error);
        }
    }
});
// Search for comments
document.querySelector('#search-comment').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    const items = document.querySelectorAll('.comment-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(keyword) ? "inline-block" : "none";
    });
});

function resetCommentMode() {
    isSelectModeComment = false;
    document.querySelector('#select-comment').textContent = "Select";
    document.querySelector('#remove-comment').style.display = "none";
    loadComments();
}
loadComments();