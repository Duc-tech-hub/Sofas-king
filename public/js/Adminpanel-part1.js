import { db } from './firebase-config.js';
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

let isSelectMode = false;
let users = [];

// --- HELPER: SWEETALERT2 TOAST (Quick notification) ---
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

// Output: show users and their status
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
            userBox.className = "user-item-box"; 
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
                        <strong class="user-email" style="display: block; color: #2c3e50; margin-bottom: 5px;">${user.email}</strong>
                        <p class="user-status" style="margin: 0; font-size: 0.8rem;"></p>
                    </div>
                </div>
            `;

            const statusEl = userBox.querySelector(".user-status");
            if (user.is_disabled) {
                statusEl.textContent = "🚫 Account Disabled";
                statusEl.style.color = "red";
            } else {
                let displayTime = "Never";
                if (user.lastLogin) {
                    displayTime = typeof user.lastLogin.toDate === 'function' 
                        ? user.lastLogin.toDate().toLocaleString('vi-VN') 
                        : user.lastLogin;
                }
                statusEl.textContent = `Last login: ${displayTime}`;
                statusEl.style.color = "#666";
            }

            container.appendChild(userBox);
        });
    });
};

// --- SEARCH LOGIC ---
const handleSearch = (keyword) => {
    const container = document.querySelector('#output-box-accouts');
    const boxes = container.querySelectorAll('.user-item-box');

    boxes.forEach((box) => {
        const email = box.querySelector('.user-email').textContent.toLowerCase();
        box.style.display = email.includes(keyword.toLowerCase()) ? "inline-block" : "none";
    });
};

document.querySelector('#form-account').addEventListener('submit', (e) => {
    e.preventDefault();
    handleSearch(document.querySelector('#search-account').value);
});

document.querySelector('#search-account').addEventListener('input', (e) => {
    handleSearch(e.target.value);
});

// --- TOGGLE SELECT MODE ---
document.querySelector('#select-account').addEventListener('click', (e) => {
    isSelectMode = !isSelectMode;
    const disableBtn = document.querySelector('#disable-account');
    const enableBtn = document.querySelector('#enable-account');

    e.target.textContent = isSelectMode ? "Cancel" : "Select";
    disableBtn.style.display = isSelectMode ? "inline-block" : "none";
    enableBtn.style.display = isSelectMode ? "inline-block" : "none";

    loadUsersToBox();
});

// --- ACTION: LOCK ACCOUNTS ---
document.querySelector('#disable-account').addEventListener('click', async () => {
    const selected = document.querySelectorAll('.user-checkbox:checked');
    
    if (selected.length === 0) {
        return Swal.fire('Action Required', 'Please select at least one account to lock.', 'warning');
    }

    const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to lock ${selected.length} account(s)?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, lock them!'
    });

    if (confirmResult.isConfirmed) {
        try {
            Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading() });
            
            for (const cb of selected) {
                await updateDoc(doc(db, "users", cb.value), { is_disabled: true });
            }
            
            showToast('Accounts locked successfully');
            resetSelectMode();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to lock accounts.', 'error');
        }
    }
});

// --- ACTION: UNLOCK ACCOUNTS ---
document.querySelector('#enable-account').addEventListener('click', async () => {
    const selected = document.querySelectorAll('.user-checkbox:checked');
    
    if (selected.length === 0) {
        return Swal.fire('Action Required', 'Please select at least one account to unlock.', 'warning');
    }

    const confirmResult = await Swal.fire({
        title: 'Unlock Accounts?',
        text: `Enable access for ${selected.length} account(s)?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Yes, unlock!'
    });

    if (confirmResult.isConfirmed) {
        try {
            Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading() });

            for (const cb of selected) {
                await updateDoc(doc(db, "users", cb.value), { is_disabled: false });
            }

            showToast('Accounts unlocked successfully');
            resetSelectMode();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to unlock accounts.', 'error');
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