import { auth, db } from "./firebase-config.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const ADMIN_EMAILS = ["duck.sssop0356@gmail.com", "sangntp.stommy@mindx.net.vn", "wormholevn@gmail.com"];
const root = document.documentElement;

const unlockVisual = () => {
    root.style.setProperty('--auth-blur', '0px');
    root.style.setProperty('--auth-opacity', '1');
    root.style.setProperty('--auth-pointer', 'all');
};

// Check if user is locked, is redirecting to adminpanel, if is locked, redirect to index.html, if is redirecting to adminpanel and the email is not admin, redirect to home page
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
                            window.location.replace("../html/403_2.html");
                            return resolve(null);
                        }
                    }

                    unlockVisual();

                } catch (error) {
                    console.error("Security Check Error:", error);
                }
            }
            resolve(user);
        });
    });
};

// Check if the user is login, if not, redirect to index.html
(async () => {
    const user = await checkSecurity();
    const path = window.location.pathname.toLowerCase();
    const protectedFiles = ["adminpanel.html", "cart.html", "comments.html", "home.html", "product", "cart.html", "comments.html", "History.html", "pay-form.html", "search.html", "userinfo.html", "vieworder.html"];
    const isProtected = protectedFiles.some(file => path.includes(file.toLowerCase()));
    if (isProtected && !user) {
        window.location.replace("../html/403.html");
        return;
    }
})();