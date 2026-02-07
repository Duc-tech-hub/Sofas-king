import { auth, db } from "./firebase-config.js";
import { getDoc, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const googleProvider = new GoogleAuthProvider();
document.addEventListener("DOMContentLoaded", () => {
    const googleMethodButton = document.querySelector("#googlemethod");
    const Search = document.querySelector("#formsearch");
    const productsearch = document.querySelector("#product")
    const logoutbutton = document.querySelector("#logoutbutton")
    const searchinput = document.querySelector("#search");
    const textsearch = document.querySelector("#text");
    const imgresult = document.querySelector("#img-result");
    const textresult = document.querySelector("#product-result");
    let isLoggingIn = false;
    // Login with google
    if (googleMethodButton) {
        googleMethodButton.addEventListener("click", () => {
            isLoggingIn = true;
            signInWithPopup(auth, googleProvider)
                .then(async (result) => {
                    const user = result.user;
                    try {
                        const userDoc = await getDoc(doc(db, "users", user.uid));
                        if (userDoc.exists() && userDoc.data().is_disabled === true) {
                            alert("Your account has been locked!");
                            await signOut(auth);
                            isLoggingIn = false;
                            return;
                        }
                        await setDoc(doc(db, "users", user.uid), {
                            email: user.email,
                            lastLogin: serverTimestamp()
                        }, { merge: true });

                        window.location.href = "../html/home.html";

                    } catch (e) {
                        console.error("Lỗi khi kiểm tra user:", e);
                        alert("System error. Please try again.");
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
    // Log out
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
    // Search products
    if (Search) {
        imgresult.src = "";
        textsearch.textContent = "";
        textresult.textContent = "";
        productsearch.classList.remove("product1");
        productsearch.classList.add("product");
        localStorage.removeItem("current_product");

        Search.addEventListener("submit", (e) => {
            e.preventDefault();

            textresult.textContent = "";
            textsearch.textContent = "";
            imgresult.src = "";

            const searchin = searchinput.value.trim();
            const keyword = searchin.toLowerCase().replace(/\s+/g, "");

            if (!keyword) {
                textresult.textContent = "";
                imgresult.classList.add("hideimg");
                imgresult.classList.remove("image");
                textsearch.textContent = "You have to input words to search.";
                productsearch.classList.remove("product1");
                productsearch.classList.add("product");
            }
            else {
                textsearch.textContent = "";
            }

            const products = [
                { key: "emeraldluxe", name: "Emerald Luxe", img: "/image/imagep1" },
                { key: "ivoryroyale", name: "Ivory Royale", img: "/image/imagep2" },
                { key: "crimsonclassic", name: "Crimson Classic", img: "/image/imagep3" },
                { key: "champagneelegance", name: "Champagne Elegance", img: "/image/imagep4" },
                { key: "rosecharm", name: "Rose Charm", img: "/image/imagep5" },
                { key: "granitemoderno", name: "Granite Moderno", img: "/image/imagep6" },
                { key: "sapphirerelaxa", name: "Sapphire Relaxa", img: "/image/imagep7" },
                { key: "olivehaven", name: "Olive Haven", img: "/image/imagep8" },
                { key: "pearlserenity", name: "Pearl Serenity", img: "/image/imagep9" },
                { key: "amberglow", name: "Amber Glow", img: "/image/imagep10" },
                { key: "charcoalgrace", name: "Charcoal Grace", img: "/image/imagep11" },
                { key: "midnightcomfort", name: "Midnight Comfort", img: "/image/imagep12" },
            ];

            const result = products.find(p => p.key === keyword);

            if (result) {
                imgresult.src = result.img;
                textresult.textContent = result.name;
                productsearch.classList.remove("product");
                productsearch.classList.add("product1");
                localStorage.setItem("current_product", result.key);
                textsearch.textContent = "";
            } else {
                textresult.textContent = "";
                imgresult.classList.add("hideimg");
                imgresult.classList.remove("image");
                productsearch.classList.remove("product1");
                productsearch.classList.add("product");
                textsearch.textContent = `There's no product named "${searchin}".`;
            }
        });
        Search.addEventListener("input", () => {
            const products = [
                { key: "emeraldluxe", name: "Emerald Luxe", img: "/image/imagep1.jpg" },
                { key: "ivoryroyale", name: "Ivory Royale", img: "/image/imagep2.jpg" },
                { key: "crimsonclassic", name: "Crimson Classic", img: "/image/imagep3.jpg" },
                { key: "champagneelegance", name: "Champagne Elegance", img: "/image/imagep4.jpg" },
                { key: "rosecharm", name: "Rosé Charm", img: "/image/imagep5.jpg" },
                { key: "granitemoderno", name: "Granite Moderno", img: "/image/imagep6.jpg" },
                { key: "sapphirerelaxa", name: "Sapphire Relaxa", img: "/image/imagep7.jpg" },
                { key: "olivehaven", name: "Olive Haven", img: "/image/imagep8.jpg" },
                { key: "pearlserenity", name: "Pearl Serenity", img: "/image/imagep9.jpg" },
                { key: "amberglow", name: "Amber Glow", img: "/image/imagep10.jpg" },
                { key: "charcoalgrace", name: "Charcoal Grace", img: "/image/imagep11.jpg" },
                { key: "midnightcomfort", name: "Midnight Comfort", img: "/image/imagep12.jpg" },
            ];
            const searchin = searchinput.value.trim();
            const keyword = searchin.toLowerCase().replace(/\s+/g, "");
            const result1 = products.filter(p => p.key.toLowerCase().includes(keyword));
            if (!keyword) {
                imgresult.classList.add("hideimg");
                imgresult.classList.remove("image");
                localStorage.setItem("current_product", "")
                textsearch.textContent = "You have to input words to search.";
                productsearch.classList.remove("product1");
                productsearch.classList.add("product");
                imgresult.src = "";
                textresult.textContent = "";
            }
            else {
                textsearch.textContent = "";
            }
            if (result1) {
                if (result1.length === 1) {
                    let result = result1[0]
                    imgresult.src = result.img;
                    textresult.textContent = result.name;
                    imgresult.classList.add("image");
                    imgresult.classList.remove("hideimg");
                    productsearch.classList.remove("product");
                    productsearch.classList.add("product1");
                    localStorage.setItem("current_product", result.key);
                    textsearch.textContent = "";
                }
                else {
                    localStorage.setItem("current_product", "")
                    productsearch.classList.remove("product1");
                    productsearch.classList.add("product");
                    imgresult.classList.add("hideimg");
                    imgresult.classList.remove("image");
                    imgresult.src = "";
                    textresult.textContent = "";
                }
            }
        })
    }
    if (productsearch) {
        productsearch.addEventListener("click", (e) => {
            e.preventDefault();
            const currentproduct = localStorage.getItem("current_product")
            if (currentproduct === "emeraldluxe") {
                window.location.href = "../html/product1.html"
            }
            else if (currentproduct === "ivoryroyale") {
                window.location.href = "../html/product2.html"
            }
            else if (currentproduct === "crimsonclassic") {
                window.location.href = "../html/product3.html"
            }
            else if (currentproduct === "champagneelegance") {
                window.location.href = "../html/product4.html"
            }
            else if (currentproduct === "rosecharm") {
                window.location.href = "../html/product5.html"
            }
            else if (currentproduct === "granitemoderno") {
                window.location.href = "../html/product6.html"
            }
            else if (currentproduct === "sapphirerelaxa") {
                window.location.href = "../html/product7.html"
            }
            else if (currentproduct === "olivehaven") {
                window.location.href = "../html/product8.html"
            }
            else if (currentproduct === "pearlserenity") {
                window.location.href = "../html/product9.html"
            }
            else if (currentproduct === "amberglow") {
                window.location.href = "../html/product10.html"
            }
            else if (currentproduct === "charcoalgrace") {
                window.location.href = "../html/product11.html"
            }
            else if (currentproduct === "midnightcomfort") {
                window.location.href = "../html/product12.html"
            }
        })
    }

});
