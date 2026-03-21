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
        Swal.fire('Error', 'Firebase services are not initialized. Please refresh!', 'error');
        return;
    }

    const username = document.querySelector("#username").value.trim();
    const password = document.querySelector("#password").value;
    const confirmPassword = document.querySelector("#confirm-password").value;
    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'Passwords do not match!',
            confirmButtonColor: '#3498db'
        });
        return;
    }

    const fakeEmail = `${username}@account.com`;
    Swal.fire({
        title: 'Creating account...',
        text: 'Please wait a moment.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);

        await setDoc(userDocRef, {
            email: username,
            is_disabled: false
        }, { merge: true });

        console.log("Firestore data saved successfully!");
        await Swal.fire({
            icon: 'success',
            title: 'Registration successful!',
            text: 'Welcome to Kingsofas!',
            timer: 2000,
            showConfirmButton: false
        });

        window.location.href = "../html/login.html";

    } catch (error) {
        console.error("Error details:", error);
        let errorMsg = "System error: " + error.message;
        if (error.code === "auth/network-request-failed") {
            errorMsg = "Network error! Please check your connection.";
        } else if (error.code === "auth/email-already-in-use") {
            errorMsg = "This username is already taken!";
        } else if (error.code === "auth/weak-password") {
            errorMsg = "Password is too weak. Must be at least 6 characters.";
        }

        Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: errorMsg,
            confirmButtonColor: '#e74c3c'
        });
    }
});