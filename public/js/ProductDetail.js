import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { addToCart } from "./cart.js";

// --- HELPER: QUICK TOAST ---
const showToast = (message, icon = 'success') => {
    Swal.fire({
        title: message,
        icon: icon,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
};

async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = "index.html";
        return;
    }

    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const p = docSnap.data();

            // UI Data Binding
            document.title = `${p.Name} - Kingsofas`;
            document.getElementById('p-name').innerText = p.Name;
            document.getElementById('p-breadcrumb').innerText = p.Name;
            document.getElementById('p-id').innerText = productId;
            document.getElementById('p-desc').innerText = p.Description;
            document.getElementById('p-stock').innerText = p.Stock;

            const formattedPrice = new Intl.NumberFormat('vi-VN').format(p.Price);
            document.getElementById('p-price').innerText = `${formattedPrice} VND`;

            document.getElementById('p-image').src = p.Image;
            document.getElementById('p-image').alt = p.Name;

            const addToCartBtn = document.getElementById('add-to-cart-btn');

            if (addToCartBtn) {
                addToCartBtn.onclick = async () => {
                    const qtyInput = document.getElementById('p-quantity');
                    const qty = parseInt(qtyInput.value) || 0;
                    const currentStock = parseInt(p.Stock) || 0;

                    // Validation 1: Quantity check
                    if (qty <= 0) {
                        return Swal.fire({
                            icon: 'warning',
                            title: 'Invalid Quantity',
                            text: 'You must buy more than 0 product!',
                            confirmButtonColor: '#3498db'
                        });
                    }

                    // Validation 2: Stock check
                    if (qty > currentStock) {
                        return Swal.fire({
                            icon: 'error',
                            title: 'Out of Stock',
                            text: `Sorry, there is not enough stock! Only ${currentStock} left.`,
                            confirmButtonColor: '#e74c3c'
                        });
                    }

                    // Loading State
                    Swal.fire({
                        title: 'Adding to cart...',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });

                    const success = await addToCart({
                        productId: productId,
                        name: p.Name,
                        price: p.Price,
                        image: p.Image,
                        quantity: qty,
                        Stock: p.Stock, // THÊM DÒNG NÀY VÀO ĐÂY (Chữ S viết hoa)
                        size: "Standard"
                    })

                    if (success) {
                        Swal.close();
                        showToast(`Added ${qty} ${p.Name} to cart!`);
                    }
                };
            }
        } else {
            // Product not found UI
            document.body.innerHTML = `
                <div style="text-align: center; padding: 100px 20px; font-family: sans-serif;">
                    <h2 style="color: #e74c3c;">Product not found!</h2>
                    <p>This item might have been removed or the link is incorrect.</p>
                    <a href="index.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Back to Home</a>
                </div>`;
        }
    } catch (error) {
        console.error("Error:", error);
        Swal.fire('System Error', 'Could not load product details.', 'error');
    }
}

loadProductDetails();