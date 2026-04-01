import { app, auth, db } from "./firebase-config.js";
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const ADMIN_EMAILS = ["duck.sssop0356@gmail.com", "sangntp.stommy@mindx.net.vn", "wormholevn@gmail.com", "leopowerup@gmail.com"];
async function updateUserLocation(uid) {
    try {
        let city = sessionStorage.getItem('user_city');
        let country = sessionStorage.getItem('user_country');

        if (!city || city === "Unknown" || city.includes("Default")) {
            try {
                const response = await fetch('https://1.1.1.1/cdn-cgi/trace');
                const text = await response.text();
                const data = Object.fromEntries(text.split('\n').filter(v => v).map(v => v.split('=')));
                
                if (data.loc) {
                    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
                    country = regionNames.of(data.loc);
                    
                    const cityRes = await fetch(`https://ipapi.co/${data.ip}/json/`);
                    const cityData = await cityRes.json();
                    city = cityData.city || "Ho Chi Minh City";
                }
            } catch (err) {
                console.warn("📍 Location fallback triggered");
                city = city || "Ho Chi Minh City"; 
                country = country || "Vietnam";
            }
            sessionStorage.setItem('user_city', city);
            sessionStorage.setItem('user_country', country);
        }

        await updateDoc(doc(db, "users", uid), {
            city: city,
            country: country,
            lastLogin: serverTimestamp()
        });
    } catch (error) {
        console.error("📍 Location Update Error:", error);
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
                Swal.fire({ title: 'Verifying...', didOpen: () => Swal.showLoading() });
                const result = await signInWithEmailLink(auth, email, window.location.href);
                window.localStorage.removeItem('emailForSignIn');
                await Swal.fire({ icon: 'success', title: 'Welcome back!', timer: 1500, showConfirmButton: false });
                return result.user; // Trả về user để chạy tiếp luôn
            } catch (error) {
                console.error("Magic Link Error:", error);
                await Swal.fire('Login Failed', 'Link expired or invalid.', 'error');
            }
        }
    }
    return null;
};
const checkSecurity = () => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            
            if (user) {
                const output = document.querySelector("#inputinfo_username");
                if (output) output.textContent = user.email;

                updateUserLocation(user.uid); 
                onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
                    if (docSnap.exists() && docSnap.data().is_disabled === true) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Account Locked',
                            text: 'Your account has been disabled by admin.',
                            allowOutsideClick: false
                        });
                        await signOut(auth);
                        window.location.replace("../html/403.html");
                    }
                });
                const path = window.location.pathname.toLowerCase();
                if (path.includes("adminpanel.html") && !ADMIN_EMAILS.includes(user.email)) {
                    window.location.replace("../html/403.html");
                    return resolve(null);
                }
            }
            resolve(user);
        });
    });
};
(async () => {
    let user = await handleMagicLinkLogin();
    if (!user) {
        user = await checkSecurity();
    }

    const path = window.location.pathname;
    let fileName = path.split('/').pop().toLowerCase() || "index.html";
    
    const protectedFiles = [
        "adminpanel.html", "cart.html", "comments.html", 
        "history.html", "pay-form.html", "userinfo.html", "vieworder.html"
    ];

    if (protectedFiles.includes(fileName)) {
        if (!user) {
            await new Promise(res => setTimeout(res, 1000));
            if (!auth.currentUser) {
                window.location.replace("../html/403.html");
            }
        }
    }
})();