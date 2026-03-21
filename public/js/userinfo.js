import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
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
            console.error("Error fetching data:", error);
        }
    } else {
        if (usernameDisplay) usernameDisplay.textContent = "Guest";
    }
});
updateBtn?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const originalText = updateBtn.innerText;
    updateBtn.innerText = "Saving...";
    updateBtn.disabled = true;

    try {
        const updateData = {
            address: addressInp.value.trim(),
            phoneNumber: phoneInp.value.trim()
        };

        await updateDoc(doc(db, "users", user.uid), updateData);
        
        Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Your profile is now up to date.',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });

    } catch (e) {
        console.error("Update error:", e);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong: ' + e.message
        });
    } finally {
        updateBtn.innerText = originalText;
        updateBtn.disabled = false;
    }
});