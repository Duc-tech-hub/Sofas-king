import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { addToCart } from "./cart.js";

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
                    const qty = document.getElementById('p-quantity').value;
                    const success = await addToCart({
                        name: p.Name,
                        price: p.Price,
                        image: p.Image,
                        quantity: qty,
                        size: "Standard"
                    });

                    if (success) {
                        console.log("Thêm vào giỏ hàng thành công!");
                    }
                };
            }
        } else {
            document.body.innerHTML = "<h2 class='text-center py-5'>The product has been deleted!</h2>";
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}
loadProductDetails();