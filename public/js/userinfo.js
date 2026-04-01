import { auth, db } from "./firebase-config.js";
import { 
    onAuthStateChanged, 
    signOut, 
    updatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const addressInp = document.getElementById('address');
const phoneInp = document.getElementById('inputinfo_phone');
const usernameInp = document.getElementById('inputinfo_username');
const emailInp = document.getElementById('inputinfo_email');
const updateBtn = document.getElementById('update_btn');
const logoutBtn = document.getElementById('logoutbutton');
const changePassForm = document.getElementById('change-password-form');

let cachedUserData = null;

const checkContentSafe = async (text) => {
    const viBadWordsRegex = /địt|đm|vcl|vkl|đéo|cặc|lồn|buồi|óc chó|ngu lồn|mẹ mày|tổ sư|vãi/i;
    if (viBadWordsRegex.test(text)) return false;
    try {
        const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
        const isProfane = await response.text();
        return isProfane !== "true";
    } catch (err) { return true; }
};

onAuthStateChanged(auth, async (user) => {
    const googleSection = document.getElementById('pass-google-msg');
    const normalSection = document.getElementById('pass-normal-action');
    
    if (user) {
        try {
            if (emailInp) emailInp.value = user.email;

            const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
            if (googleSection) googleSection.style.display = isGoogle ? "block" : "none";
            if (normalSection) normalSection.style.display = isGoogle ? "none" : "block";

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                cachedUserData = userDoc.data();
                if (usernameInp) usernameInp.value = cachedUserData.username || "";
                if (addressInp) addressInp.value = cachedUserData.address || "";
                if (phoneInp) phoneInp.value = cachedUserData.phoneNumber || "";
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        window.location.href = "login.html";
    }
});

updateBtn?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || !cachedUserData) return;

    const newUsername = usernameInp.value.trim();
    const oldUsername = cachedUserData.username;

    if (!newUsername) return Swal.fire('Warning', 'Username cannot be empty!', 'warning');

    updateBtn.innerText = "Checking...";
    updateBtn.disabled = true;

    if (!(await checkContentSafe(newUsername))) {
        Swal.fire('Warning', 'Inappropriate language!', 'error');
        updateBtn.innerText = "Update Info";
        updateBtn.disabled = false;
        return;
    }

    try {
        if (newUsername !== oldUsername) {
            const q = query(collection(db, "users"), where("username", "==", newUsername));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                Swal.fire('Error', 'Username already taken!', 'error');
                updateBtn.innerText = "Update Info";
                updateBtn.disabled = false;
                return;
            }
        }

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            username: newUsername,
            address: addressInp.value.trim(),
            phoneNumber: phoneInp.value.trim()
        });
        
        cachedUserData.username = newUsername;

        Swal.fire({ 
            icon: 'success', 
            title: 'Profile Updated!', 
            timer: 1500, 
            showConfirmButton: false, 
            toast: true, 
            position: 'top-end' 
        });

    } catch (e) {
        Swal.fire('Error', 'Update failed!', 'error');
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
        text: `Send link to: ${user.email}`,
        icon: 'question',
        showCancelButton: true
    });
    if (result.isConfirmed) {
        try {
            await sendPasswordResetEmail(auth, user.email);
            Swal.fire('Sent!', 'Check inbox.', 'success');
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
});

changePassForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const currentPass = document.getElementById('current-password-input').value;
    const newPass = document.getElementById('new-password-input').value;
    const confirmPass = document.getElementById('confirm-password-input').value;

    if (newPass !== confirmPass) return Swal.fire('Error', 'Passwords mismatch!', 'error');

    try {
        Swal.fire({ title: 'Updating...', didOpen: () => Swal.showLoading() });
        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPass);
        
        bootstrap.Modal.getInstance(document.getElementById('changePassModal'))?.hide();
        changePassForm.reset();
        Swal.fire({ icon: 'success', title: 'Success!', timer: 2000, showConfirmButton: false });
    } catch (error) {
        Swal.fire('Error', 'Current password incorrect!', 'error');
    }
});

document.querySelectorAll('.toggle-pass').forEach(button => {
    button.addEventListener('click', function() {
        const input = document.getElementById(this.getAttribute('data-target'));
        const icon = this.querySelector('i');
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('bi-eye');
        icon.classList.toggle('bi-eye-slash');
    });
});

logoutBtn?.addEventListener('click', () => {
    Swal.fire({ title: 'Log out?', icon: 'warning', showCancelButton: true }).then(async (result) => {
        if (result.isConfirmed) {
            await signOut(auth);
            window.location.href = "login.html";
        }
    });
});