import { auth } from "./firebase-config.js";
import { sendSignInLinkToEmail } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const forgetForm = document.querySelector("#forget-form");
const successMsg = document.querySelector("#success-msg");

const actionCodeSettings = {
    url: window.location.origin + '/html/index.html', 
    handleCodeInApp: true,
};

forgetForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.querySelector("#forget-username").value.trim();

    if (!emailInput) {
        return Swal.fire('Error', 'Please enter your email address', 'warning');
    }

    Swal.fire({
        title: 'Sending Link...',
        text: 'Processing your request, please wait.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        await sendSignInLinkToEmail(auth, emailInput, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', emailInput);
        forgetForm.style.display = 'none'; 
        successMsg.classList.remove('hidden');

        Swal.close();

    } catch (error) {
        console.error("Firebase Auth Error:", error);
        let errorMsg = "Could not send the login link. Please try again.";
        
        if (error.code === "auth/invalid-email") {
            errorMsg = "The email address is not valid.";
        } else if (error.code === "auth/too-many-requests") {
            errorMsg = "Too many requests. Please try again later.";
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Request Failed',
            text: errorMsg
        });
    }
});