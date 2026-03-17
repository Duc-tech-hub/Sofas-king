import { auth, db } from "./firebase-config.js";
import { getDoc, doc, setDoc, serverTimestamp, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", async () => {
    const googleMethodButton = document.querySelector("#googlemethod");
    const Search = document.querySelector("#formsearch");
    const productsearch = document.querySelector("#product");
    const logoutbutton = document.querySelector("#logoutbutton");
    const searchinput = document.querySelector("#search");
    const textsearch = document.querySelector("#text");
    const imgresult = document.querySelector("#img-result");
    const textresult = document.querySelector("#product-result");
    let isLoggingIn = false;
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
    if (googleMethodButton) {
        googleMethodButton.addEventListener("click", () => {
            isLoggingIn = true;
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
                            alert("Your account has been locked!");
                            await signOut(auth);
                            isLoggingIn = false;
                            return;
                        }
                        const updateData = {
                            email: user.email,
                            lastLogin: serverTimestamp(),
                            is_disabled: userDoc.exists() ? userDoc.data().is_disabled : false
                        };
                        if (addressValue) updateData.address = addressValue;
                        if (phoneValue) updateData.phoneNumber = phoneValue;
                        await setDoc(userDocRef, updateData, { merge: true });
                        console.log("Data saved successfully!");
                        window.location.href = "../html/index.html";
                    } catch (e) {
                        console.error("Lỗi xử lý Firestore:", e);
                        alert("System error occurred.");
                        await signOut(auth);
                    }
                })
                .catch((error) => {
                    console.error("LỖI LOGIN:", error.code, error.message);
                    alert("Login with Google failed");
                    isLoggingIn = false;
                });
        });
    }
    if (logoutbutton) {
        logoutbutton.addEventListener("click", (e) => {
            auth.signOut()
                .then(() => {
                    localStorage.clear();
                    window.location.replace("index.html");
                })
                .catch((error) => {
                    alert("Log out fail");
                });
        });
    };
    if (Search) {
        imgresult.src = "";
        textsearch.textContent = "";
        textresult.textContent = "";
        productsearch.classList.remove("product1");
        productsearch.classList.add("product");
        localStorage.removeItem("current_product_id");

        Search.addEventListener("submit", (e) => {
            e.preventDefault();
            textresult.textContent = "";
            textsearch.textContent = "";
            imgresult.src = "";

            const searchin = searchinput.value.trim().toLowerCase();
            const keyword = searchin.replace(/\s+/g, "");

            if (!keyword) {
                resetSearchResult("You have to input words to search.");
                return;
            }
            const result = allProducts.find(p => p.Name.toLowerCase().replace(/\s+/g, "") === keyword);

            if (result) {
                displaySearchResult(result);
            } else {
                resetSearchResult(`There's no product named "${searchin}".`);
            }
        });

        Search.addEventListener("input", () => {
            const searchin = searchinput.value.trim().toLowerCase();
            const keyword = searchin.replace(/\s+/g, "");

            if (!keyword) {
                resetSearchResult("You have to input words to search.");
                return;
            }

            textsearch.textContent = "";
            const matches = allProducts.filter(p => p.Name.toLowerCase().replace(/\s+/g, "").includes(keyword));

            if (matches.length === 1) {
                displaySearchResult(matches[0]);
            } else {
                resetSearchResult("");
            }
        });
    }
    function displaySearchResult(product) {
        imgresult.src = product.Image || "";
        imgresult.classList.add("image");
        imgresult.classList.remove("hideimg");
        textresult.textContent = product.Name;
        textsearch.textContent = "";
        productsearch.classList.remove("product");
        productsearch.classList.add("product1");
        localStorage.setItem("current_product_id", product.id); 
    }

    function resetSearchResult(msg) {
        textresult.textContent = "";
        imgresult.src = "";
        imgresult.classList.add("hideimg");
        imgresult.classList.remove("image");
        productsearch.classList.remove("product1");
        productsearch.classList.add("product");
        localStorage.setItem("current_product_id", "");
        if (msg) textsearch.textContent = msg;
    }
    if (productsearch) {
        productsearch.addEventListener("click", (e) => {
            e.preventDefault();
            const productId = localStorage.getItem("current_product_id");
            if (productId) {
                window.location.href = `../html/product-detail.html?id=${productId}`;
            }
        });
    }
});