import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const loginForm = document.querySelector("#login-form");

document.querySelector('.btn-toggle-login').addEventListener('click', function () {
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
    const addressValue = document.querySelector("#address").value.trim();
    const phoneValue = document.querySelector("#Phone_number").value.trim();
    const fakeEmail = `${username}@account.com`;

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

        alert("Login successful!");
        window.location.href = "../html/index.html";

    } catch (error) {
        console.error("Login Error:", error);

        if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
            alert("Invalid username or password!");
        } else if (error.code === "auth/network-request-failed") {
            alert("Network error! Please check your connection.");
        } else {
            alert("Login failed: " + error.message);
        }
    }
});