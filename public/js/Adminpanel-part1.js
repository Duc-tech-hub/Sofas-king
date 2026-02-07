import { db } from './firebase-config.js';
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

let isSelectMode = false;
let users = [];

// Output: show users and their last login, show their status(islocked or not)
const loadUsersToBox = () => {
    const container = document.querySelector('#output-box-accouts');
    if (!container) return;

    onSnapshot(collection(db, "users"), (snapshot) => {
        container.innerHTML = "";
        users = [];

        snapshot.forEach((userDoc) => {
            const user = userDoc.data();
            users.push(user.email);

            const userBox = document.createElement("div");
            userBox.style.cssText = `
                border: 1px solid #ccc; 
                padding: 15px; 
                margin: 10px; 
                border-radius: 8px; 
                display: inline-block; 
                min-width: 180px;
                background-color: #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            `;

            const checkboxHTML = isSelectMode
                ? `<input type="checkbox" class="user-checkbox" value="${userDoc.id}" style="width: 20px; height: 20px; margin-right: 15px; cursor: pointer;">`
                : "";
            userBox.innerHTML = `
                <div style="display: flex; align-items: center; padding: 5px;">
                    ${checkboxHTML} 
                    <div>
                        <strong class="user-email" style="display: block; color: #2c3e50; margin-bottom: 5px;"></strong>
                        <p class="user-status" style="margin: 0; font-size: 0.8rem;"></p>
                    </div>
                </div>
            `;
            const emailEl = userBox.querySelector(".user-email");
            const statusEl = userBox.querySelector(".user-status");

            emailEl.textContent = user.email;

            if (user.is_disabled) {
                statusEl.textContent = "🚫 Account Disabled";
                statusEl.style.color = "red";
            } else {
                let displayTime = "Never";

                if (user.lastLogin) {
                    if (typeof user.lastLogin.toDate === 'function') {
                        displayTime = user.lastLogin.toDate().toLocaleString('vi-VN');
                    } else {
                        displayTime = user.lastLogin;
                    }
                }

                statusEl.textContent = `Last login: ${displayTime}`;
                statusEl.style.color = "#666";
            }

            container.appendChild(userBox);
        });
    });
};

// Search account (Submit form)
document.querySelector('#form-account').addEventListener('submit', (e) => {
    e.preventDefault();
    const keyword = document.querySelector('#search-account').value.toLowerCase().trim();
    const container = document.querySelector('#output-box-accouts');
    const userBoxes = container.querySelectorAll('.user-email');

    userBoxes.forEach((emailTag) => {
        const box = emailTag.closest('div[style*="border: 1px solid"]');
        if (box) {
            const emailValue = emailTag.textContent.toLowerCase();
            box.style.display = emailValue.includes(keyword) ? "inline-block" : "none";
        }
    });
});

// Search account (Realtime input)
document.querySelector('#search-account').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    const container = document.querySelector('#output-box-accouts');
    const userBoxes = container.querySelectorAll('.user-email');

    userBoxes.forEach((emailTag) => {
        const box = emailTag.closest('div[style*="border: 1px solid"]');
        if (box) {
            const emailValue = emailTag.textContent.toLowerCase();
            box.style.display = emailValue.includes(keyword) ? "inline-block" : "none";
        }
    });
});

// Select Mode Toggle
document.querySelector('#select-account').addEventListener('click', (e) => {
    isSelectMode = !isSelectMode;
    const disableBtn = document.querySelector('#disable-account');
    const enableBtn = document.querySelector('#enable-account');

    e.target.textContent = isSelectMode ? "Cancel" : "Select";
    disableBtn.style.display = isSelectMode ? "inline-block" : "none";
    enableBtn.style.display = isSelectMode ? "inline-block" : "none";

    loadUsersToBox();
});

// Lock accounts
document.querySelector('#disable-account').addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
    if (selectedCheckboxes.length === 0) return alert("You have to choose an account");

    if (confirm(`Are you sure you want to lock ${selectedCheckboxes.length} account(s)?`)) {
        try {
            for (const cb of selectedCheckboxes) {
                await updateDoc(doc(db, "users", cb.value), { is_disabled: true });
            }
            alert("Lock successfully");
            resetSelectMode();
        } catch (error) {
            console.error("Error disabling:", error);
        }
    }
});

// Unlock accounts
document.querySelector('#enable-account').addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
    if (selectedCheckboxes.length === 0) return alert("You have to choose an account");

    if (confirm(`Unlock ${selectedCheckboxes.length} account(s)?`)) {
        try {
            for (const cb of selectedCheckboxes) {
                await updateDoc(doc(db, "users", cb.value), { is_disabled: false });
            }
            alert("Unlock successfully!");
            resetSelectMode();
        } catch (error) {
            console.error("Error enabling:", error);
        }
    }
});

function resetSelectMode() {
    isSelectMode = false;
    document.querySelector('#select-account').textContent = "Select";
    document.querySelector('#disable-account').style.display = "none";
    document.querySelector('#enable-account').style.display = "none";
    loadUsersToBox();
}

loadUsersToBox();
