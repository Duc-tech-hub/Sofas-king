import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const loginForm = document.querySelector("#login-form");

// Toggle ẩn/hiện mật khẩu
document.querySelector('.btn-toggle-login')?.addEventListener('click', function () {
    const passwordInput = document.getElementById('login-password');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.classList.replace('bi-eye-slash', 'bi-eye');
    } else {
        passwordInput.type = 'password';
        this.classList.replace('bi-eye', 'bi-eye-slash');
    }
});

loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.querySelector("#login-username").value.trim();
    const password = document.querySelector("#login-password").value;
    const addressValue = document.querySelector("#address")?.value.trim() || "";
    const phoneValue = document.querySelector("#Phone_number")?.value.trim() || "";
    const fakeEmail = `${username}@account.com`;
    Swal.fire({
        title: 'Logging in...',
        text: 'Checking credentials, please wait.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, password);
        const user = userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
        
        const updateData = {
            lastLogin: serverTimestamp()
        };
        
        if (addressValue) updateData.address = addressValue;
        if (phoneValue) updateData.phoneNumber = phoneValue;
        
        await updateDoc(userDocRef, updateData);
        await Swal.fire({
            icon: 'success',
            title: 'Login successful!',
            text: `Welcome back, ${username}!`,
            timer: 1500,
            showConfirmButton: false
        });

        window.location.href = "../html/index.html";

    } catch (error) {
        console.error("Login Error:", error);
        let errorMsg = "Login failed: " + error.message;
        if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
            errorMsg = "Invalid username or password!";
        } else if (error.code === "auth/network-request-failed") {
            errorMsg = "Network error! Please check your connection.";
        }

        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: errorMsg,
            confirmButtonColor: '#e74c3c'
        });
    }
});