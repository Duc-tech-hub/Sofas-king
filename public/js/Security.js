import { app, auth, db } from "./firebase-config.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app-check.js";

const ADMIN_EMAILS = ["Your_email"];
// const appCheck = initializeAppCheck(app, {
//     provider: new ReCaptchaV3Provider('Your_recapcha_provider'),
//     isTokenAutoRefreshEnabled: true
// });

// Check if user is locked, is redirecting to adminpanel, if is locked, redirect to error page, if is redirecting to adminpanel and the email is not admin, redirect to home page
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
                    const userData = userDoc.data();
                    if (userDoc.exists() && userData.is_disabled === true) {
                        alert("Your account has been locked!");
                        await signOut(auth);
                        window.location.replace("../html/403.html");
                        return resolve(null);
                    }

                    const path = window.location.pathname.toLowerCase();
                    if (path.includes("adminpanel.html")) {
                        if (!ADMIN_EMAILS.includes(user.email)) {
                            console.warn("Warning: You do not have permission to access this page");
                            window.location.replace("../html/403.html");
                            return resolve(null);
                        }
                    }

                } catch (error) {
                    console.error("Security Check Error:", error);
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
    if (fileName === "") fileName = "index.html";

    const protectedFiles = [
        "adminpanel.html", 
        "cart.html", 
        "comments.html", 
        "history.html", 
        "pay-form.html", 
        "userinfo.html", 
        "vieworder.html"
    ];
    const isProtected = protectedFiles.includes(fileName);

    if (isProtected && !user) {
        window.location.replace("../html/403.html");
        return;
    }
})();