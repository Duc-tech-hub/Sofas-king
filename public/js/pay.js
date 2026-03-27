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

const resetCloudCart = async (uid) => {
    const cartRef = doc(db, "carts", uid);
    await setDoc(cartRef, { items: [] });
    console.log("Cloud Cart has been reset.");
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
                await Swal.fire({
                    icon: 'success',
                    title: 'Payment Successful!',
                    text: 'Your order has been placed successfully.',
                    confirmButtonColor: '#28a745'
                });
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Payment Rejected!',
                    text: 'Your payment was not approved. Your cart has been cleared.',
                    confirmButtonColor: '#d33'
                });
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
            finalName = userDoc.data().username || userDoc.data().email || user.email;
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

    const { total, items } = await calculateTotal(user.uid);
    startListeningAdmin(user.uid);

    if (confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.replaceWith(newConfirmBtn);

        newConfirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const addressValue = addressInput ? addressInput.value.trim() : "";

            if (!addressValue) {
                return Swal.fire('Notice', 'Please enter your delivery address!', 'warning');
            }

            if (total <= 0) {
                return Swal.fire('Empty Cart', 'Your Cloud Cart is currently empty!', 'info');
            }
            Swal.fire({
                title: 'Sending Request...',
                text: 'Uploading your order to Cloud Server.',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            newConfirmBtn.disabled = true;
            newConfirmBtn.innerText = "Processing...";

            const success = await handleConfirmRequest(user, total, items, addressValue);

            if (success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Order Created!',
                    html: `
                        <p>Your order has been sent to the system.</p>
                        <p style="font-size: 0.9em; color: #d35400; font-weight: bold;">
                            If you don't receive a confirmation within 30 minutes, 
                            please contact the Administrator immediately!
                        </p>
                    `,
                    confirmButtonText: 'I Understand',
                    confirmButtonColor: '#28a745'
                });
            } else {
                newConfirmBtn.disabled = false;
                newConfirmBtn.innerText = "I have sent money.";
                Swal.fire('Error', 'Failed to send request. Please try again later.', 'error');
            }
        });
    }
});