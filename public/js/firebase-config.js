import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
// Replace your real firebase config here
const firebaseConfig = {
    apiKey: "AIzaSyB-FakeKey-888-Xyz-999-ExampleOnly",
    authDomain: "furniture-ecommerce-app.firebaseapp.com",
    projectId: "furniture-ecommerce-app",
    storageBucket: "furniture-ecommerce-app.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890ghijk",
    measurementId: "G-EXAMPLE123" 
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);