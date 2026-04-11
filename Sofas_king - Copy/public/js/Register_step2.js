import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, serverTimestamp, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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
            text: 'Please complete Step 1 again.'
        }).then(() => { window.location.href = "Register_step1.html"; });
        return;
    }

    Swal.fire({
        title: 'Finalizing Registration...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw { code: "custom/username-taken" };
        }

        const userCredential = await createUserWithEmailAndPassword(auth, inputEmail, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email.toLowerCase(),
            username: username,
            is_disabled: false,
            is_setup_complete: true,
            lastLogin: serverTimestamp(),
            createdAt: serverTimestamp()
        });

        sessionStorage.clear();

        await Swal.fire({
            icon: 'success',
            title: 'Registration Complete!',
            timer: 2000,
            showConfirmButton: false
        });

        window.location.replace("index.html");

    } catch (error) {
        console.error(error);
        if (auth.currentUser) await signOut(auth);

        let errorMsg = "An error occurred.";
        if (error.code === "custom/username-taken") {
            errorMsg = "This username is already taken!";
        } else if (error.code === "auth/email-already-in-use") {
            errorMsg = "This email is already in use!";
        } else if (error.code === "auth/invalid-email") {
            errorMsg = "Invalid email format!";
        }

        Swal.fire({ icon: 'error', title: 'Failed', text: errorMsg });
    }
});