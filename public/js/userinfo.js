import { auth, db } from "./firebase-config.js";
import { 
    onAuthStateChanged, 
    signOut, 
    updatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const addressInp = document.getElementById('address');
const phoneInp = document.getElementById('inputinfo_phone');
const usernameInp = document.getElementById('inputinfo_username');
const updateBtn = document.getElementById('update_btn');
const logoutBtn = document.getElementById('logoutbutton');
const changePassForm = document.getElementById('change-password-form');
const checkContentSafe = async (text) => {
    const viBadWordsRegex = /địt|đm|vcl|vkl|đéo|cặc|lồn|buồi|óc chó|ngu lồn|mẹ mày|tổ sư|vãi/i;
    if (viBadWordsRegex.test(text)) return false;
    try {
        const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
        const isProfane = await response.text();
        return isProfane !== "true";
    } catch (err) { return true; }
};

let cachedUserData = null;
onAuthStateChanged(auth, async (user) => {
    const googleSection = document.getElementById('pass-google-msg');
    const normalSection = document.getElementById('pass-normal-action');
    
    if (user) {
        try {
            const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
            if (isGoogle) {
                if (googleSection) googleSection.style.display = "block";
                if (normalSection) normalSection.style.display = "none";
            } else {
                if (googleSection) googleSection.style.display = "none";
                if (normalSection) normalSection.style.display = "block";
            }
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                cachedUserData = userDoc.data();
                if (usernameInp) usernameInp.value = cachedUserData.username || "";
                if (addressInp) addressInp.value = cachedUserData.address || "";
                if (phoneInp) phoneInp.value = cachedUserData.phoneNumber || "";
            }
        } catch (error) {
            console.error("Load Data Error:", error);
        }
    } else {
        window.location.href = "login.html";
    }
});

updateBtn?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;

    const newUsername = usernameInp.value.trim();
    if (!newUsername) {
        return Swal.fire('Warning', 'Username cannot be empty!', 'warning');
    }

    updateBtn.innerText = "Checking...";
    updateBtn.disabled = true;
    const isSafe = await checkContentSafe(newUsername);
    if (!isSafe) {
        Swal.fire('Warning', 'Your username contains inappropriate language!', 'error');
        updateBtn.innerText = "Update Info";
        updateBtn.disabled = false;
        return;
    }

    updateBtn.innerText = "Saving...";
    try {
        const updateData = {
            username: newUsername,
            address: addressInp.value.trim(),
            phoneNumber: phoneInp.value.trim()
        };
        await updateDoc(doc(db, "users", user.uid), updateData);
        Swal.fire({ icon: 'success', title: 'Profile Updated!', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    } finally {
        updateBtn.innerText = "Update Info";
        updateBtn.disabled = false;
    }
});

document.getElementById('link-forgot-pass')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const result = await Swal.fire({
        title: 'Reset Password?',
        text: `We will send a reset link to your email: ${user.email}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, send it!'
    });

    if (result.isConfirmed) {
        try {
            await sendPasswordResetEmail(auth, user.email);
            Swal.fire('Sent!', 'Please check your inbox to reset password.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('changePassModal'))?.hide();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
});

changePassForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const currentPass = document.getElementById('current-password-input').value;
    const newPass = document.getElementById('new-password-input').value;
    const confirmPass = document.getElementById('confirm-password-input').value;

    if (newPass !== confirmPass) {
        return Swal.fire('Error', 'New passwords do not match!', 'error');
    }

    try {
        Swal.fire({ title: 'Updating Password...', didOpen: () => Swal.showLoading() });
        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPass);
        bootstrap.Modal.getInstance(document.getElementById('changePassModal'))?.hide();
        changePassForm.reset();

        Swal.fire({ icon: 'success', title: 'Success!', text: 'Password updated in Auth system.', timer: 2000, showConfirmButton: false });
    } catch (error) {
        console.error(error);
        let errorMsg = "Failed to update. Check your current password.";
        if (error.code === "auth/wrong-password") errorMsg = "Current password is incorrect!";
        Swal.fire('Error', errorMsg, 'error');
    }
});

document.querySelectorAll('.toggle-pass').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = this.querySelector('i');
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('bi-eye');
        icon.classList.toggle('bi-eye-slash');
    });
});

logoutBtn?.addEventListener('click', () => {
    Swal.fire({
        title: 'Log out?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, log out!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await signOut(auth);
            window.location.href = "login.html";
        }
    });
});