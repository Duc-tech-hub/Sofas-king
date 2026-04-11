import { auth, db } from "./firebase-config.js";
import {
    doc, setDoc, collection, addDoc, onSnapshot, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const getCloudCart = async (uid) => {
    const cartRef = doc(db, "carts", uid);
    const snap = await getDoc(cartRef);
    return snap.exists() ? snap.data().items : [];
};
const clearSelectedItems = async (uid) => {
    const cartRef = doc(db, "carts", uid);
    const snap = await getDoc(cartRef);
    if (snap.exists()) {
        const allItems = snap.data().items || [];
        const remainingItems = allItems.filter(item => item.selected === false);
        await setDoc(cartRef, { items: remainingItems });
    }
};
const calculateTotal = async (uid) => {
    const outputMoneyEl = document.getElementById("output_money");
    const sessionData = sessionStorage.getItem('checkoutItems');
    const selectedItems = sessionData ? JSON.parse(sessionData) : [];

    const total = selectedItems.reduce((sum, item) => {
        const price = parseFloat(item.Price) || 0;
        const qty = parseInt(item.quantity) || 0;
        return sum + (price * qty);
    }, 0);

    if (outputMoneyEl) {
        outputMoneyEl.textContent = `Total: ${total.toLocaleString()} VND`;
    }
    return { total, selectedItems };
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
            await clearSelectedItems(uid);
            sessionStorage.removeItem('checkoutItems');
            await updateDoc(statusRef, {
                is_waiting: false,
                is_confirmed: false,
                is_rejected: false,
                updatedAt: Date.now(),
                totalBill: 0
            });
            window.location.replace("../html/index.html");
            return;
        }
        if (confirmBtn) {
            confirmBtn.style.display = "block";
            confirmBtn.disabled = false;
            confirmBtn.innerText = "I have sent money.";
        }
        if (note) note.style.display = "none";
    });
};
const handleConfirmRequest = async (user, totalAmount, selectedItems, address) => {
    if (!selectedItems || selectedItems.length === 0 || !user) return false;

    try {
        let finalName = user.email;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            finalName = userDoc.data().username || userDoc.data().email || user.email;
        }
        const pendingCol = collection(db, "history", user.uid, "pending_orders");
        for (const item of selectedItems) {
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
        console.error("Cloud Request Error:", e);
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

    const { total, selectedItems } = await calculateTotal(user.uid);
    startListeningAdmin(user.uid);

    if (confirmBtn) {
        confirmBtn.onclick = async (e) => {
            e.preventDefault();
            const addressValue = addressInput ? addressInput.value.trim() : "";

            if (!addressValue) {
                return Swal.fire('Notice', 'Please enter your delivery address!', 'warning');
            }

            if (total <= 0 || selectedItems.length === 0) {
                return Swal.fire('Empty Selection', 'Please select items to pay!', 'info');
            }

            Swal.fire({
                title: 'Sending Request...',
                text: 'Uploading your order to Cloud Server.',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            confirmBtn.disabled = true;
            confirmBtn.innerText = "Processing...";

            const success = await handleConfirmRequest(user, total, selectedItems, addressValue);

            if (success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Order Created!',
                    text: 'Your request has been sent. Admin will verify it shortly.',
                    confirmButtonText: 'I Understand',
                    confirmButtonColor: '#28a745'
                });
            } else {
                confirmBtn.disabled = false;
                confirmBtn.innerText = "I have sent money.";
                Swal.fire('Error', 'Failed to send request.', 'error');
            }
        };
    }
});