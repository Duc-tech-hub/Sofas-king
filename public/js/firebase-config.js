import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const firebaseConfig = {
    apiKey: "AIzaSyC6_5eRmmVg9htrYvHhzDQ_KQhNn3CleFc",
    authDomain: "sofas-king-108e2.firebaseapp.com",
    projectId: "sofas-king-108e2",
    storageBucket: "sofas-king-108e2.firebasestorage.app",
    messagingSenderId: "298599751502",
    appId: "1:298599751502:web:7c9b7d0bd14559bf42081f",
    measurementId: "G-BB8SML36E1"
  };
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);