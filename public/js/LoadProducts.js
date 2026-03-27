import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export let allProductsData = []; 
export function displayProductGrid(products) {
    const productListContainer = document.getElementById('product-list');
    if (!productListContainer) return;
    productListContainer.innerHTML = "";
    if (products.length === 0) {
        productListContainer.innerHTML = "<p style='text-align: center; grid-column: 1/-1;'>There is no result.</p>";
        return;
    }
    products.forEach((item) => {
        const p = item.data;
        const productId = item.id;
        const productHTML = `
            <div class="product-card">
                <a href="product-detail.html?id=${productId}" class="product-link">
                    <img src="${p.Image}" alt="Products: ${p.Name}" />
                    <p class="text">${p.Name}</p>
                </a>
            </div>`;
        productListContainer.insertAdjacentHTML('beforeend', productHTML);
    });
}
export function displayReviewSelect(products) {
    const reviewSelect = document.getElementById('review-product-select');
    if (!reviewSelect) return;
    reviewSelect.innerHTML = '<option value="" selected disabled>-- Select a product --</option>';
    products.forEach((item) => {
        const optionHTML = `<option value="${item.data.Name}">${item.data.Name}</option>`;
        reviewSelect.insertAdjacentHTML('beforeend', optionHTML);
    });
}
export async function fetchAndInitProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProductsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
        }));
        return allProductsData;
    } catch (error) {
        console.error("Lỗi fetch:", error);
        return [];
    }
}