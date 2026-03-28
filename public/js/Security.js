import { app, auth, db } from "./firebase-config.js";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const ADMIN_EMAILS = ["Your_admin_emails"];
async function updateUserLocation(uid) {
    try {
        let city = sessionStorage.getItem('user_city');
        let country = sessionStorage.getItem('user_country');

        if (!city || !country || city === "Unknown") {
            try {
                const response = await fetch('https://geolocation-db.com/json/');
                const data = await response.json();
                city = data.city && data.city !== "Not found" ? data.city : "Hanoi (Default)";
                country = data.country_name || "Vietnam";
            } catch (err) {
                console.warn("📍 API 1 tạch, thử API dự phòng...");
                const res2 = await fetch('https://api.db-ip.com/v2/free/self');
                const data2 = await res2.json();
                city = data2.city || "Unknown";
                country = data2.countryName || "Unknown";
            }

            sessionStorage.setItem('user_city', city);
            sessionStorage.setItem('user_country', country);
        }
        const userDocRef = doc(db, "users", uid);
        await updateDoc(userDocRef, {
            city: city,
            country: country,
            lastLogin: serverTimestamp()
        });
        console.log(`✅ Sync thành công: ${city}, ${country}`);

    } catch (error) {
        console.error("📍 Lỗi cuối cùng:", error);
    }
}
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
        onAuthStateChanged(auth, async (user) => {
            const output = document.querySelector("#inputinfo_username");
            if (user && output) output.textContent = user.email;

            if (user) {
                updateUserLocation(user.uid); 

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
