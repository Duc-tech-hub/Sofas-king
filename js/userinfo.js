import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const addressInp = document.getElementById('address');
const phoneInp = document.getElementById('inputinfo_phone');
const updateBtn = document.getElementById('update_btn');
const usernameDisplay = document.getElementById('inputinfo_username');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                const userEmail = data.email || user.email || ""; 
                if (userEmail.includes("@account.com")) {
                    usernameDisplay.textContent = userEmail.split('@')[0];
                } else {
                    usernameDisplay.textContent = userEmail;
                }
                if (addressInp) addressInp.value = data.address || "";
                if (phoneInp) phoneInp.value = data.phoneNumber || "";
            }
        } catch (error) {
            console.error("Lỗi lấy data:", error);
        }
    } else {
        if (usernameDisplay) usernameDisplay.textContent = "Guest";
    }
});

updateBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;

    updateBtn.innerText = "Saving...";
    try {
        await updateDoc(doc(db, "users", user.uid), {
            address: addressInp.value.trim(),
            phoneNumber: phoneInp.value.trim()
        });
        alert("Your info has been updated!");
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        updateBtn.innerText = "Update Info";
    }
});