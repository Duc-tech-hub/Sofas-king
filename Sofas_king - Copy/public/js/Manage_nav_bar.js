import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const ADMIN_EMAILS = [
    Your_admin_emails
];
const navAcp = document.getElementById('nav-acp');
const navAuth = document.getElementById('nav-auth');
const navAcpMobile = document.getElementById('nav-acp-mobile');
const navAuthMobile = document.getElementById('nav-auth-mobile');
const mobileBtn = document.getElementById('mobile-btn');
const mobileMenu = document.getElementById('mobile-menu');
mobileBtn?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
});
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userEmail = user.email.toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(userEmail);
        if (navAcp) navAcp.style.display = isAdmin ? "block" : "none";
        if (navAcpMobile) navAcpMobile.style.display = isAdmin ? "block" : "none";
        const logoutHtml = `
            <button id="logout-btn" class="font-bold text-slate-600 hover:text-red-600 transition-all border-none bg-transparent">
                Logout <i class="bi bi-box-arrow-right ms-1"></i>
            </button>
        `;
        
        if (navAuth) navAuth.innerHTML = logoutHtml;
        if (navAuthMobile) {
            navAuthMobile.innerHTML = `
                <button id="logout-btn-mobile" class="block w-full text-center font-bold text-red-600 py-3 border border-red-100 rounded-2xl mt-2 bg-transparent">
                    Logout
                </button>
            `;
        }
        const handleLogout = () => {
            signOut(auth).then(() => {
                window.location.href = "index.html";
            });
        };

        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
        document.getElementById('logout-btn-mobile')?.addEventListener('click', handleLogout);

    } else {
        if (navAcp) navAcp.style.display = "none";
        if (navAcpMobile) navAcpMobile.style.display = "none";

        const loginHtml = `<a class="font-bold text-blue-600 no-underline hover:text-blue-700" href="login.html">Login</a>`;
        const loginMobileHtml = `
            <a class="block w-full text-center font-bold text-blue-600 py-3 border border-blue-100 rounded-2xl mt-2 no-underline" href="login.html">
                Login
            </a>
        `;

        if (navAuth) navAuth.innerHTML = loginHtml;
        if (navAuthMobile) navAuthMobile.innerHTML = loginMobileHtml;
    }
});