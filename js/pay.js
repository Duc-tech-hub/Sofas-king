import { auth, db, app } from "./firebase-config.js";
import { 
    doc, setDoc, collection, addDoc, onSnapshot, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const STORAGE_KEY = 'sofa_cart_history';

const calculateTotal = () => {
    const rawData = localStorage.getItem(STORAGE_KEY);
    const outputMoneyEl = document.getElementById("output_money");
    if (!rawData) return 0;

    try {
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
    } catch (e) {
        console.error("Lỗi parse giỏ hàng:", e);
        return 0;
    }
};

let unsubAdminListener = null; 
const startListeningAdmin = (uid) => {
    if (unsubAdminListener) unsubAdminListener();

    const statusRef = doc(db, "history", uid, "admin_verify", "status");
    const note = document.getElementById("note");
    const confirmBtn = document.getElementById("confirmed-sent");

    unsubAdminListener = onSnapshot(statusRef, async (docSnap) => {
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
            localStorage.clear(); 
            calculateTotal(); 
            if (data.is_confirmed === true) {
                alert("Payment Successful! Your order has been placed.");
            } else {
                alert("Payment Rejected! Your cart has been cleared.");
            }
            if (confirmBtn) confirmBtn.style.display = "block";
            if (confirmBtn) confirmBtn.disabled = false;
            if (confirmBtn) confirmBtn.innerText = "I have sent money.";
            if (note) note.style.display = "none";
            await updateDoc(statusRef, {
                is_waiting: false,
                is_confirmed: false,
                is_rejected: false,
                updatedAt: Date.now(),
                totalBill: 0
            });
            window.location.href="../html/index.html"
            console.log("LocalStorage & UI đã reset. Sẵn sàng cho đơn mới.");
        }
    }, (error) => {
        console.error("Lỗi Listener:", error);
    });
};
const handleConfirmRequest = async (user, totalAmount, address) => {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData || !user) return false;

    try {
        const items = JSON.parse(rawData);
        let finalName = user.email;
        
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const dbEmail = userData.email || user.email || "";
                finalName = dbEmail.includes("@account.com") ? dbEmail.split('@')[0] : dbEmail;
            }
        } catch (err) { console.error(err); }

        const pendingCol = collection(db, "history", user.uid, "pending_orders");
        
        for (const item of items) {
            await addDoc(pendingCol, {
                productId: item.productId || item.id || null, 
                Name: item.Name,
                Price: item.Price,
                quantity: item.quantity,
                userName: finalName,
                address: address,
                timestamp: Date.now(),
                status: "waiting"
            });
        }

        const statusRef = doc(db, "history", user.uid, "admin_verify", "status");
        await setDoc(statusRef, {
            is_waiting: true,
            is_confirmed: false,
            is_rejected: false,
            updatedAt: Date.now(),
            userEmail: user.email,
            userName: finalName,
            totalBill: totalAmount,
            deliveryAddress: address,
            uid: user.uid
        });

        return true;
    } catch (e) {
        console.error("Lỗi gửi yêu cầu:", e);
        return false;
    }
};
onAuthStateChanged(auth, async (user) => { 
    if (!user) return;
    
    const addressInput = document.getElementById("address");
    const confirmBtn = document.getElementById("confirmed-sent");
    
    // Tự động điền địa chỉ
    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && addressInput) {
            addressInput.value = userSnap.data().address || "";
        }
    } catch (e) { console.error(e); }

    const totalAmount = calculateTotal();
    startListeningAdmin(user.uid);

    if (confirmBtn) {
        // Clone nút để tránh bị dính event cũ
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.replaceWith(newConfirmBtn);

        newConfirmBtn.addEventListener("click", async (e) => {
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

            newConfirmBtn.disabled = true;
            newConfirmBtn.innerText = "Processing...";

            const success = await handleConfirmRequest(user, totalAmount, addressValue);

            if (!success) {
                newConfirmBtn.disabled = false;
                newConfirmBtn.innerText = "I have sent money.";
                alert("Failed to send request.");
            }
        });
    }
});