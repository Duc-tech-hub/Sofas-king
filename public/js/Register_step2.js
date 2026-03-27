import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
const securityForm = document.querySelector("#security-form");

securityForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputEmail = document.querySelector("#security-answer").value.trim();
    const username = sessionStorage.getItem('temp_username');
    const password = sessionStorage.getItem('temp_password');
    if (!username || !password) {
        Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'Please complete Step 1 again.',
            confirmButtonText: 'Go Back'
        }).then(() => {
            window.location.href = "Register_step1.html";
        });
        return;
    }

    Swal.fire({
        title: 'Finalizing Registration...',
        text: 'Creating your secure account, please wait.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, inputEmail, password);
        const user = userCredential.user;
        const userData = {
            uid: user.uid,
            email: user.email,
            username: username,
            is_disabled: false,
            is_setup_complete: true,
            lastLogin: serverTimestamp(),
            createdAt: serverTimestamp()
        };
        await setDoc(doc(db, "users", user.uid), userData);
        sessionStorage.clear();

        await Swal.fire({
            icon: 'success',
            title: 'Registration Complete!',
            text: 'Your account has been successfully secured.',
            timer: 2000,
            showConfirmButton: false
        });
        window.location.replace("index.html");

    } catch (error) {
        console.error("Step 2 Error:", error);
        let errorMsg = "An error occurred during registration.";
        
        if (error.code === "auth/email-already-in-use") {
            errorMsg = "This email address is already in use!";
        } else if (error.code === "auth/invalid-email") {
            errorMsg = "Please enter a valid email address!";
        } else if (error.code === "auth/weak-password") {
            errorMsg = "Password is too weak!";
        }
        
        Swal.fire({ icon: 'error', title: 'Registration Failed', text: errorMsg });
    }
});