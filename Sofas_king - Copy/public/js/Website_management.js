import { app, auth, db } from "./firebase-config.js";
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const ADMIN_EMAILS = ["duck.sssop0356@gmail.com", "sangntp.stommy@mindx.net.vn", "wormholevn@gmail.com", "leopowerup@gmail.com"];
async function updateUserLocation(uid) {
    console.log("📍 [1] STARTING LOCATION TRACKING (IP-API.COM)...");
    try {
        let city = sessionStorage.getItem('user_city');
        let country = sessionStorage.getItem('user_country');
        
        console.log(`📍 [2] Current Session: City = ${city} | Country = ${country}`);

        if (!city || !country || city === "N/A" || city === "Unknown") {
            console.log("📍 [3] No valid session data. Fetching from IP-API...");
            try {
                const response = await fetch('https://demo.ip-api.com/json/'); 
                const res = await fetch('https://api.db-ip.com/v2/free/self');
                const data = await res.json();

                console.log("📍 [4] API Response:", data);

                if (data && data.city) {
                    city = data.city;
                    country = data.countryName || data.country;
                    console.log(`📍 [5] Success: ${city}, ${country}`);
                } else {
                    throw new Error("API returned empty city data");
                }

            } catch (err) {
                console.warn("📍 [6] Primary API failed, trying Cloudflare Backup...");
                try {
                    const cfRes = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
                    const cfText = await cfRes.text();
                    const cfData = Object.fromEntries(cfText.split('\n').filter(v => v).map(v => v.split('=')));
                    
                    if (cfData.loc) {
                        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
                        country = regionNames.of(cfData.loc);
                        city = "Unknown City";
                    }
                } catch (cfErr) {
                    console.error("❌ [CRITICAL] All Location APIs failed.");
                    return;
                }
            }

            if (country) {
                sessionStorage.setItem('user_city', city || "Unknown City");
                sessionStorage.setItem('user_country', country);
            }
        }

        if (country && country !== "N/A") {
            console.log("📍 [7] Pushing to Firestore...");
            await updateDoc(doc(db, "users", uid), {
                city: city || "Unknown City",
                country: country,
                lastLogin: serverTimestamp()
            });
            console.log("✅ [SUCCESS] Location Updated:", city, country);
        }

    } catch (error) {
        console.error("❌ [FIRESTORE ERROR]:", error);
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
                return result.user;
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
        "adminpanel.html", "cart.html", 
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