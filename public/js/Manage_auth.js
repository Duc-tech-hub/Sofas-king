import { auth, db } from "./firebase-config.js";
import { getDoc, doc, setDoc, serverTimestamp, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", async () => {
    const googleMethodButton = document.querySelector("#googlemethod");
    const logoutbutton = document.querySelector("#logoutbutton");
    
    // --- SEARCH SYSTEM LOGIC ---
    let allProducts = [];
    async function fetchProducts() {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            allProducts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("Search system ready with", allProducts.length, "products.");
        } catch (error) {
            console.error("Error fetching products for search:", error);
        }
    }
    await fetchProducts();

    // --- GOOGLE LOGIN ---
    if (googleMethodButton) {
        googleMethodButton.addEventListener("click", () => {
            Swal.fire({
                title: 'Connecting to Google...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            signInWithPopup(auth, googleProvider)
                .then(async (result) => {
                    const user = result.user;
                    const addressField = document.querySelector("#address");
                    const phoneField = document.querySelector("#Phone_number");
                    const addressValue = addressField?.value.trim();
                    const phoneValue = phoneField?.value.trim();

                    try {
                        const userDocRef = doc(db, "users", user.uid);
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists() && userDoc.data().is_disabled === true) {
                            await signOut(auth);
                            return Swal.fire({
                                icon: 'error',
                                title: 'Account Locked!',
                                text: 'Your account has been disabled by the administrator.',
                                confirmButtonColor: '#e74c3c'
                            });
                        }

                        const updateData = {
                            email: user.email,
                            lastLogin: serverTimestamp(),
                            is_disabled: userDoc.exists() ? userDoc.data().is_disabled : false
                        };
                        
                        if (addressValue) updateData.address = addressValue;
                        if (phoneValue) updateData.phoneNumber = phoneValue;

                        await setDoc(userDocRef, updateData, { merge: true });
                        await Swal.fire({
                            icon: 'success',
                            title: 'Login Successful',
                            text: `Welcome, ${user.displayName}!`,
                            timer: 1500,
                            showConfirmButton: false
                        });

                        window.location.href = "../html/index.html";

                    } catch (e) {
                        console.error("Firestore Error:", e);
                        Swal.fire('System Error', 'Could not sync your profile data.', 'error');
                        await signOut(auth);
                    }
                })
                .catch((error) => {
                    console.error("GOOGLE LOGIN ERROR:", error.code);
                    // Đóng Loading và báo lỗi
                    Swal.fire({
                        icon: 'error',
                        title: 'Login Failed',
                        text: 'Google login was cancelled or failed. Please try again.',
                        confirmButtonColor: '#3498db'
                    });
                });
        });
    }
});