import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const addressInp = document.getElementById('address');
const phoneInp = document.getElementById('inputinfo_phone');
const updateBtn = document.getElementById('update_btn');
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('inputinfo_username').textContent = user.email;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            addressInp.value = data.address || "";
            phoneInp.value = data.phoneNumber || "";
        }
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