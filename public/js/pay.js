import { auth, db, app } from "./firebase-config.js";
import { 
    doc, setDoc, collection, addDoc, onSnapshot, getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const STORAGE_KEY = 'sofa_cart_history';
// Caculate total money
const calculateTotal = () => {
    const rawData = localStorage.getItem(STORAGE_KEY);
    const outputMoneyEl = document.getElementById("output_money");
    if (!rawData) return 0;

    const items = JSON.parse(rawData);
    const total = items.reduce((sum, item) => {
        const price = parseFloat(item.Price) || 0;
        const qty = parseInt(item.quantity) || 0;
        return sum + (price * qty);
    }, 0);

    if (outputMoneyEl) {
        outputMoneyEl.textContent = `Total: $${total.toLocaleString()}`;
    }
    return total;
};
// Listen to admin verify
const startListeningAdmin = (email) => {
    const statusRef = doc(db, "history", email, "admin_verify", "status");
    const note = document.getElementById("note");
    const confirmBtn = document.getElementById("confirmed-sent");

    return onSnapshot(statusRef, async (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        if (data.is_waiting === true && !data.is_confirmed && !data.is_rejected) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (note) {
                note.style.display = "block";
                note.style.color = "orange";
                note.innerText = "Waiting for Admin to verify your payment...";
            }
            return;
        }
        if (data.is_confirmed === true || data.is_rejected === true) {
            localStorage.removeItem(STORAGE_KEY);

            if (data.is_confirmed === true) {
                alert("Payment Successful! Your order has been placed.");
                await setDoc(statusRef, {
                    is_waiting: false,
                    is_confirmed: false,
                    is_rejected: false,
                    updatedAt: Date.now()
                }, { merge: true });

                window.location.href = "../html/index.html";
            }
            else if (data.is_rejected === true) {
                alert("Payment Rejected! Please check your transaction or contact support.");
                await setDoc(statusRef, {
                    is_waiting: false,
                    is_confirmed: false,
                    is_rejected: false,
                    updatedAt: Date.now()
                }, { merge: true });

                window.location.href = "../html/index.html";
            }
        }
    });
};
// Send request to admin
const handleConfirmRequest = async (user, totalAmount, address) => {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData || !user) return false;

    try {
        const items = JSON.parse(rawData);
        const pendingCol = collection(db, "history", user.email, "pending_orders");

        for (const item of items) {
            await addDoc(pendingCol, {
                ...item,
                address: address,
                timestamp: Date.now(),
                status: "waiting"
            });
        }

        const statusRef = doc(db, "history", user.email, "admin_verify", "status");
        await setDoc(statusRef, {
            is_waiting: true,
            is_confirmed: false,
            is_rejected: false,
            updatedAt: Date.now(),
            userEmail: user.email,
            totalBill: totalAmount,
            deliveryAddress: address
        });

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
onAuthStateChanged(auth, async (user) => { 
    if (!user) return;
    const addressInput = document.getElementById("address");
    
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.address && addressInput) {
                addressInput.value = userData.address;
            }
        }
    } catch (error) {
        console.error("Lỗi lấy địa chỉ:", error);
    }
    const totalAmount = calculateTotal();
    startListeningAdmin(user.email);
    const confirmBtn = document.getElementById("confirmed-sent");

    if (confirmBtn) {
        confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const addressValue = addressInput ? addressInput.value.trim() : "";

            if (!addressValue) {
                alert("Please enter your delivery address!");
                addressInput.focus();
                return;
            }

            if (totalAmount <= 0) {
                alert("Your cart is empty!");
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.innerText = "Processing...";

            const success = await handleConfirmRequest(user, totalAmount, addressValue);

            if (!success) {
                confirmBtn.disabled = false;
                confirmBtn.innerText = "I have sent money.";
                alert("Failed to send request.");
            }
        });
    }
});