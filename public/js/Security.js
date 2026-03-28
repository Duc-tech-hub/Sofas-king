import { app, auth, db } from "./firebase-config.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js"; // Thay getDoc bằng onSnapshot
import { signOut, onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const ADMIN_EMAILS = ["duck.sssop0356@gmail.com", "sangntp.stommy@mindx.net.vn", "wormholevn@gmail.com"];

const handleMagicLinkLogin = async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            const { value: emailInput } = await Swal.fire({
                title: 'Confirm Email',
                input: 'email',
                inputLabel: 'Please enter your email to complete login',
                allowOutsideClick: false
            });
            email = emailInput;
        }

        if (email) {
            try {
                Swal.fire({ title: 'Logging in...', didOpen: () => Swal.showLoading() });
                await signInWithEmailLink(auth, email, window.location.href);
                window.localStorage.removeItem('emailForSignIn');
                await Swal.fire({ icon: 'success', title: 'Authenticated!', timer: 1500, showConfirmButton: false });
            } catch (error) {
                console.error("Magic Link Error:", error);
                Swal.fire('Login Failed', 'The link is invalid or has expired.', 'error');
            }
        }
    }
};

const checkSecurity = () => {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            const output = document.querySelector("#inputinfo_username");
            if (user && output) output.textContent = user.email;

            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                onSnapshot(userDocRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        if (userData.is_disabled === true) {
                            await Swal.fire({
                                icon: 'error',
                                title: 'Account Locked',
                                text: 'Your account has been disabled by admin.',
                                allowOutsideClick: false,
                                confirmButtonText: 'OK'
                            });
                            
                            await signOut(auth);
                            window.location.replace("../html/403.html");
                        }
                    }
                }, (error) => {
                    console.error("Snapshot Error:", error);
                });
                const path = window.location.pathname.toLowerCase();
                if (path.includes("adminpanel.html") && !ADMIN_EMAILS.includes(user.email)) {
                    Swal.fire({ icon: 'warning', title: 'Access Denied', text: 'Admins only!', timer: 2000 });
                    window.location.replace("../html/403.html");
                    return resolve(null);
                }
            }
            resolve(user);
        });
    });
};

(async () => {
    await handleMagicLinkLogin();

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