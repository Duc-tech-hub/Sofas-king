import { auth, db } from "./firebase-config.js";
import { getDoc, doc, serverTimestamp, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();

async function getLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return { city: data.city || "N/A", country: data.country_name || "N/A" };
    } catch (error) {
        return { city: "Unknown", country: "Unknown" };
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const googleMethodButton = document.querySelector("#googlemethod");

    if (googleMethodButton) {
        googleMethodButton.addEventListener("click", async () => {
            Swal.fire({
                title: 'Connecting to Google...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                const email = user.email.toLowerCase();
                const q = query(collection(db, "users"), where("email", "==", email));
                const querySnapshot = await getDocs(q);
                
                let existingUser = null;
                querySnapshot.forEach((doc) => {
                    if (doc.id !== user.uid) {
                        existingUser = doc.data();
                    }
                });

                if (existingUser) {
                    await signOut(auth);
                    return Swal.fire({
                        icon: 'warning',
                        title: 'Account Exists',
                        text: 'This email is already registered via Email/Password. Please use that method.',
                        confirmButtonColor: '#f39c12'
                    });
                }
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists() && userDoc.data().is_disabled === true) {
                    await signOut(auth);
                    return Swal.fire({
                        icon: 'error',
                        title: 'Account Locked!',
                        text: 'Your account has been disabled.',
                        confirmButtonColor: '#e74c3c'
                    });
                }

                const location = await getLocation();
                let updateData = {
                    uid: user.uid,
                    email: email,
                    city: location.city,
                    country: location.country,
                    lastLogin: serverTimestamp()
                };
                if (!userDoc.exists()) {
                    updateData.username = user.displayName || "Google User";
                    updateData.createdAt = serverTimestamp();
                    updateData.is_disabled = false;
                }
                await setDoc(userDocRef, updateData, { merge: true });

                await Swal.fire({
                    icon: 'success',
                    title: 'Login Successful',
                    timer: 1500,
                    showConfirmButton: false
                });

                window.location.href = "../html/index.html";

            } catch (error) {
                console.error(error);
                if (auth.currentUser) await signOut(auth);
                Swal.fire({ icon: 'error', title: 'Login Failed', text: "System error or window closed." });
            }
        });
    }
});