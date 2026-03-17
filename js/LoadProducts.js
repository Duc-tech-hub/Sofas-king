import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

async function renderAllProducts() {
    const productListContainer = document.getElementById('product-list');
    const reviewContainer = document.getElementById('review-radio-container'); 
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        
        productListContainer.innerHTML = ""
        if (reviewContainer) reviewContainer.innerHTML = ""; 

        querySnapshot.forEach((doc) => {
            const p = doc.data();
            const productId = doc.id;
            const productHTML = `
                <div class="product-card">
                    <a href="product-detail.html?id=${productId}" class="product-link">
                        <img src="${p.Image}" alt="Products: ${p.Name}" />
                        <p class="text">${p.Name}</p>
                    </a>
                </div>
            `;
            productListContainer.insertAdjacentHTML('beforeend', productHTML);
            if (reviewContainer) {
                const radioHTML = `
                    <div class="col-md-5">
                        <label>
                            <input type="radio" name="product" value="${p.Name}" required />
                            ${p.Name}
                        </label>
                    </div>
                `;
                reviewContainer.insertAdjacentHTML('beforeend', radioHTML);
            }
        });

        console.log("Render sản phẩm và review thành công!");
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu: ", error);
        productListContainer.innerHTML = "<p>Error: Cannot load products.</p>";
    }
}

renderAllProducts();