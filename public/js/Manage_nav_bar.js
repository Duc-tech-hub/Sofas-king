import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const ADMIN_EMAILS = [
    "Your_admin_email"
];

onAuthStateChanged(auth, (user) => {
    const navAcp = document.getElementById('nav-acp');
    const navAuth = document.getElementById('nav-auth');

    if (user) {
        if (navAcp) {
            navAcp.style.display = ADMIN_EMAILS.includes(user.email) ? "block" : "none";
        }
        if (navAuth) {
            navAuth.style.display = "none"; 
        }

    } else {
        if (navAcp) navAcp.style.display = "none";
        if (navAuth) {
            navAuth.style.display = "block";
            navAuth.innerHTML = `<a class="nav-link" href="login.html">Login</a>`;
        }
    }
});