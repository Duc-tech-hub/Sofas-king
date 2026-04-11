import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const loginForm = document.querySelector("#login-form");
document.querySelector('.btn-toggle-login')?.addEventListener('click', function () {
    const passwordInput = document.getElementById('login-password');
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
});

loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.querySelector("#login-username").value.trim();
    const password = document.querySelector("#login-password").value;
    const addressValue = document.querySelector("#address")?.value.trim() || "";
    const phoneValue = document.querySelector("#Phone_number")?.value.trim() || "";

    Swal.fire({
        title: 'Authenticating...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailInput, password);
        const user = userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            await signOut(auth);
            return Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'User profile not found in our system.',
            });
        }

        const userData = userDoc.data();
        if (userData.is_disabled === true) {
            await signOut(auth);
            return Swal.fire({
                icon: 'error',
                title: 'Account Locked!',
                text: 'Your account has been disabled. Please contact support.',
            });
        }
        const updateData = { lastLogin: serverTimestamp() };
        if (addressValue) updateData.address = addressValue;
        if (phoneValue) updateData.phoneNumber = phoneValue;

        await updateDoc(userDocRef, updateData);
        await Swal.fire({
            icon: 'success',
            title: 'Login Successful',
            text: `Welcome back, ${userData.username || 'User'}!`,
            timer: 1500,
            showConfirmButton: false
        });

        window.location.href = "../html/index.html";

    } catch (error) {
        console.error("Login Error Details:", error);
        if (auth.currentUser) await signOut(auth);

        let errorMsg = "Invalid email or password!";
        if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
            errorMsg = "Invalid email or password!";
        } else if (error.code === "auth/too-many-requests") {
            errorMsg = "Too many failed attempts. Please try again sau!";
        } else if (error.code === "permission-denied") {
            errorMsg = "Security Block: You don't have permission to access this data.";
        } else if (error.message) {
            errorMsg = error.message;
        }

        Swal.fire({ icon: 'error', title: 'Login Failed', text: errorMsg });
    }
});