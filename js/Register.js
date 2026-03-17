import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const registerForm = document.querySelector("#register-form");
document.querySelectorAll('.btn-toggle').forEach(icon => {
    icon.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);

        if (input.type === 'password') {
            input.type = 'text';
            this.classList.replace('bi-eye-slash', 'bi-eye');
        } else {
            input.type = 'password';
            this.classList.replace('bi-eye', 'bi-eye-slash');
        }
    });
});

registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!db || !auth) {
        alert("Error: Firebase services are not initialized. Please refresh the page!");
        return;
    }

    const username = document.querySelector("#username").value.trim();
    const password = document.querySelector("#password").value;
    const confirmPassword = document.querySelector("#confirm-password").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }
    const fakeEmail = `${username}@account.com`;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);

        await setDoc(userDocRef, {
            email: username,
            is_disabled: false
        }, { merge: true });

        console.log("Firestore data saved successfully!");
        alert("Registration successful!");
        window.location.href = "../html/login.html";

    } catch (error) {
        console.error("Error details:", error);

        if (error.code === "auth/network-request-failed") {
            alert("Network error! Please check your connection or disable VPN/Adblock.");
        } else if (error.code === "auth/email-already-in-use") {
            alert("This username is already taken!");
        } else if (error.code === "auth/weak-password") {
            alert("Password is too weak. Must be at least 6 characters.");
        } else {
            alert("System error: " + error.message);
        }
    }
});