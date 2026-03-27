import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const ADMIN_EMAILS = ["duck.sssop0356@gmail.com", "sangntp.stommy@mindx.net.vn", "wormholevn@gmail.com"];

onAuthStateChanged(auth, (user) => {
    const navAcp = document.getElementById('nav-acp');
    const navAuth = document.getElementById('nav-auth');

    if (user) {
        if (navAcp) {
            navAcp.style.display = ADMIN_EMAILS.includes(user.email) ? "block" : "none";
        }

    } else {
        if (navAcp) navAcp.style.display = "none";
        if (navAuth) {
            navAuth.innerHTML = `<a class="nav-link" href="login.html">Login</a>`;
        }
    }
});