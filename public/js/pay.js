import { auth, db } from "./firebase-config.js";
import { 
    doc, setDoc, collection, addDoc, onSnapshot, getDoc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const getCloudCart = async (uid) => {
    const cartRef = doc(db, "carts", uid);
    const snap = await getDoc(cartRef);
    return snap.exists() ? snap.data().items : [];
};
const resetCloudCart = async (uid) => {
    const cartRef = doc(db, "carts", uid);
    await setDoc(cartRef, { items: [] }); // Reset mảng items về rỗng
    console.log("Cloud Cart đã được reset.");
};
const calculateTotal = async (uid) => {
    const outputMoneyEl = document.getElementById("output_money");
    const items = await getCloudCart(uid);
    
    const total = items.reduce((sum, item) => {
        const price = parseFloat(item.Price) || 0;
        const qty = parseInt(item.quantity) || 0;
        return sum + (price * qty);
    }, 0);

    if (outputMoneyEl) {
        outputMoneyEl.textContent = `Total: ${total.toLocaleString()} VND`;
    }
    return { total, items };
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
            await resetCloudCart(uid);
            
            if (data.is_confirmed === true) {
                alert("Payment Successful! Your order has been placed.");
            } else {
                alert("Payment Rejected! Your cart has been cleared.");
            }

            if (confirmBtn) {
                confirmBtn.style.display = "block";
                confirmBtn.disabled = false;
                confirmBtn.innerText = "I have sent money.";
            }
            if (note) note.style.display = "none";
            await updateDoc(statusRef, {
                is_waiting: false,
                is_confirmed: false,
                is_rejected: false,
                updatedAt: Date.now(),
                totalBill: 0
            });

            window.location.href = "../html/index.html";
        }
    });
};

const handleConfirmRequest = async (user, totalAmount, items, address) => {
    if (!items || items.length === 0 || !user) return false;

    try {
        let finalName = user.email;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            finalName = userData.email || user.email;
        }

        const pendingCol = collection(db, "history", user.uid, "pending_orders");
        for (const item of items) {
            await addDoc(pendingCol, {
                productId: item.productId || null, 
                Name: item.Name,
                Price: item.Price,
                quantity: item.quantity,
                Size: item.Size || "Standard",
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
        console.error("Lỗi gửi yêu cầu Cloud:", e);
        return false;
    }
};

onAuthStateChanged(auth, async (user) => { 
    if (!user) return;
    
    const addressInput = document.getElementById("address");
    const confirmBtn = document.getElementById("confirmed-sent");
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists() && addressInput) {
        addressInput.value = userSnap.data().address || "";
    }
    const { total, items } = await calculateTotal(user.uid);
    startListeningAdmin(user.uid);

    if (confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.replaceWith(newConfirmBtn);

        newConfirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const addressValue = addressInput ? addressInput.value.trim() : "";

            if (!addressValue) {
                alert("Please enter your delivery address!");
                return;
            }

            if (total <= 0) {
                alert("Your Cloud Cart is empty!");
                return;
            }

            newConfirmBtn.disabled = true;
            newConfirmBtn.innerText = "Processing Cloud Data...";

            const success = await handleConfirmRequest(user, total, items, addressValue);

            if (!success) {
                newConfirmBtn.disabled = false;
                newConfirmBtn.innerText = "I have sent money.";
                alert("Failed to send request.");
            }
        });
    }
});