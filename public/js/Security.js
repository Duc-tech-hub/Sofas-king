import { app, auth, db } from "./firebase-config.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app-check.js";

const ADMIN_EMAILS = ["Your_email"];

// --- RECAPTCHA ACTIVATED ---
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('Your_recapcha_provider'),
    isTokenAutoRefreshEnabled: true
});

/**
 * Security check for locked accounts and admin permissions
 */
const checkSecurity = () => {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            const output = document.querySelector("#inputinfo_username");
            
            if (user && output) {
                output.textContent = user.email;
            }

            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // Handle Locked Account
                        if (userData.is_disabled === true) {
                            await Swal.fire({
                                icon: 'error',
                                title: 'Account Locked',
                                text: 'Your account has been disabled. Please contact the administrator.',
                                confirmButtonColor: '#d33',
                                allowOutsideClick: false
                            });
                            
                            await signOut(auth);
                            window.location.replace("../html/403.html");
                            return resolve(null);
                        }
                    }

                    // Admin Panel Access Control
                    const path = window.location.pathname.toLowerCase();
                    if (path.includes("adminpanel.html")) {
                        if (!ADMIN_EMAILS.includes(user.email)) {
                            await Swal.fire({
                                icon: 'warning',
                                title: 'Restricted Area',
                                text: 'You do not have permission to access the Admin Panel.',
                                timer: 3000,
                                showConfirmButton: false
                            });
                            
                            window.location.replace("../html/403.html");
                            return resolve(null);
                        }
                    }

                } catch (error) {
                    console.error("Security Check Error:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'System Error',
                        text: 'Something went wrong while verifying your account.'
                    });
                }
            }
            resolve(user);
        });
    });
};

(async () => {
    const user = await checkSecurity();
    const path = window.location.pathname;

    let fileName = path.split('/').pop().toLowerCase();
    if (fileName === "" || fileName === "/") fileName = "index.html";

    const protectedFiles = [
        "adminpanel.html", "cart.html", "comments.html", 
        "history.html", "pay-form.html", "userinfo.html", "vieworder.html"
    ];

    if (protectedFiles.includes(fileName) && !user) {
        window.location.replace("../html/403.html");
    }
})();