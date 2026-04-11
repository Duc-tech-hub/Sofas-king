import { db } from './firebase-config.js';
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

let isSelectMode = false;
let users = [];

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
                min-width: 220px;
                background-color: #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                vertical-align: top;
            `;

            const checkboxHTML = isSelectMode
                ? `<input type="checkbox" class="user-checkbox" value="${userDoc.id}" style="width: 20px; height: 20px; margin-right: 15px; cursor: pointer;">`
                : "";

            const locationInfo = (user.city && user.country) 
                ? `📍 ${user.city}, ${user.country}` 
                : "📍 Location: N/A";

            userBox.innerHTML = `
                <div style="display: flex; align-items: flex-start; padding: 5px;">
                    ${checkboxHTML} 
                    <div>
                        <strong class="user-email" style="display: block; color: #2c3e50; margin-bottom: 3px; font-size: 0.9rem;"></strong>
                        <p class="user-location" style="margin: 0 0 5px 0; font-size: 0.75rem; color: #3498db; font-weight: 500;">${locationInfo}</p>
                        <p class="user-status" style="margin: 0; font-size: 0.75rem;"></p>
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

                statusEl.textContent = `Online: ${displayTime}`;
                statusEl.style.color = "#666";
            }

            container.appendChild(userBox);
        });
    });
};

// --- GIỮ NGUYÊN CÁC LOGIC TÌM KIẾM VÀ CHẾ ĐỘ CHỌN DƯỚI ĐÂY ---

document.querySelector('#form-account').addEventListener('submit', (e) => {
    e.preventDefault();
    const keyword = document.querySelector('#search-account').value.toLowerCase().trim();
    filterUsers(keyword);
});

document.querySelector('#search-account').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    filterUsers(keyword);
});

function filterUsers(keyword) {
    const container = document.querySelector('#output-box-accouts');
    const userBoxes = container.querySelectorAll('.user-email');
    userBoxes.forEach((emailTag) => {
        const box = emailTag.closest('div[style*="border: 1px solid"]');
        if (box) {
            const emailValue = emailTag.textContent.toLowerCase();
            box.style.display = emailValue.includes(keyword) ? "inline-block" : "none";
        }
    });
}

document.querySelector('#select-account').addEventListener('click', (e) => {
    isSelectMode = !isSelectMode;
    const disableBtn = document.querySelector('#disable-account');
    const enableBtn = document.querySelector('#enable-account');

    e.target.textContent = isSelectMode ? "Cancel" : "Select";
    disableBtn.style.display = isSelectMode ? "inline-block" : "none";
    enableBtn.style.display = isSelectMode ? "inline-block" : "none";

    loadUsersToBox();
});

document.querySelector('#disable-account').addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        return Swal.fire({ icon: 'warning', title: 'Selection Required', text: 'You have to choose at least one account!' });
    }

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to lock ${selectedCheckboxes.length} account(s).`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, lock them!'
    });

    if (result.isConfirmed) {
        Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading() });
        try {
            for (const cb of selectedCheckboxes) {
                await updateDoc(doc(db, "users", cb.value), { is_disabled: true });
            }
            Swal.fire({ icon: 'success', title: 'Locked!', text: 'Accounts have been disabled successfully.', timer: 2000, showConfirmButton: false });
            resetSelectMode();
        } catch (error) {
            console.error("Error disabling:", error);
            Swal.fire('Error', 'Could not disable accounts.', 'error');
        }
    }
});

document.querySelector('#enable-account').addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        return Swal.fire({ icon: 'warning', title: 'Selection Required', text: 'You have to choose at least one account!' });
    }

    const result = await Swal.fire({
        title: 'Unlock accounts?',
        text: `Enable access for ${selectedCheckboxes.length} account(s)?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Yes, unlock!'
    });

    if (result.isConfirmed) {
        Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading() });
        try {
            for (const cb of selectedCheckboxes) {
                await updateDoc(doc(db, "users", cb.value), { is_disabled: false });
            }
            Swal.fire({ icon: 'success', title: 'Unlocked!', text: 'Accounts are now active.', timer: 2000, showConfirmButton: false });
            resetSelectMode();
        } catch (error) {
            console.error("Error enabling:", error);
            Swal.fire('Error', 'Could not unlock accounts.', 'error');
        }
    }
});

function resetSelectMode() {
    isSelectMode = false;
    const selectBtn = document.querySelector('#select-account');
    if (selectBtn) selectBtn.textContent = "Select";
    
    const disableBtn = document.querySelector('#disable-account');
    const enableBtn = document.querySelector('#enable-account');
    if (disableBtn) disableBtn.style.display = "none";
    if (enableBtn) enableBtn.style.display = "none";
    
    loadUsersToBox();
}

loadUsersToBox();