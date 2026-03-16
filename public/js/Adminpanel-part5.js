import { db } from "./firebase-config.js";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const productList = document.getElementById('output-box-products');
const productForm = document.getElementById('product-form');
const btnSelect = document.getElementById('select-product');
const btnDelete = document.getElementById('delete-product');
const searchInput = document.getElementById('search-product');

let allProducts = [];
const imageFileInput = document.getElementById('p-image-file');

if (imageFileInput) {
    imageFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const status = document.getElementById('upload-status');
        const preview = document.getElementById('img-preview');
        status.innerHTML = '<i class="bi bi-hourglass-split"></i> Uploading to ImgBB...';
        const formData = new FormData();
        formData.append("image", file);
        const API_KEY = "Your_ImageBB_API_KEY"; 

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                const downloadURL = result.data.url; // Direct link
                
                // Lưu vào input ẩn
                document.getElementById('p-image').value = downloadURL;
                
                // Hiện ảnh xem trước
                if (preview) {
                    preview.src = downloadURL;
                    preview.style.display = "block";
                }
                
                status.innerHTML = `<span class="text-success">✅ Upload Success!</span>`;
            } else {
                throw new Error("ImgBB error: " + result.error.message);
            }
        } catch (error) {
            status.innerHTML = `<span class="text-danger">❌ Error: ${error.message}</span>`;
            console.error("Upload failed:", error);
        }
    };
}
async function renderProducts(filterText = "") {
    if (!productList) return;
    
    if (allProducts.length === 0 && filterText === "") {
        productList.innerHTML = "<p>Loading products...</p>";
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    productList.innerHTML = "";
    const filtered = allProducts.filter(p => p.Name.toLowerCase().includes(filterText.toLowerCase()));

    filtered.forEach((p) => {
        const div = document.createElement('div');
        div.className = "item-row d-flex justify-content-between align-items-center p-2 border-bottom";
        div.innerHTML = `
            <div class="d-flex align-items-center">
                <input type="radio" name="prod-select" value="${p.id}" class="me-2">
                <span><strong>${p.Name}</strong></span>
            </div>
        `;

        const btnEdit = document.createElement('button');
        btnEdit.className = "btn btn-sm btn-primary";
        btnEdit.innerText = "Edit";
        btnEdit.onclick = (e) => {
            e.preventDefault();
            openEditModal(p.id, p);
        };

        div.appendChild(btnEdit);
        productList.appendChild(div);
    });
}
function openEditModal(id, data) {
    document.getElementById('edit-id').value = id;
    document.getElementById('p-name').value = data.Name;
    document.getElementById('p-price').value = data.Price;
    document.getElementById('p-stock').value = data.Stock;
    document.getElementById('p-image').value = data.Image || "";
    document.getElementById('p-desc').value = data.Description || "";
    document.getElementById('modalTitle').innerText = "Edit Product";

    const preview = document.getElementById('img-preview');
    if (data.Image) {
        preview.src = data.Image;
        preview.style.display = "block";
    } else {
        preview.style.display = "none";
    }

    const modalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('productModal'));
    modalInstance.show();
}
searchInput.addEventListener('input', (e) => renderProducts(e.target.value));

btnSelect.onclick = () => {
    btnDelete.classList.toggle('button-hide');
    btnDelete.style.display = btnDelete.classList.contains('button-hide') ? "none" : "inline-block";
};

btnDelete.onclick = async () => {
    const checked = document.querySelector('input[name="prod-select"]:checked');
    if (!checked) return alert("Please select a product first!");

    if (confirm("Permanently delete this product?")) {
        try {
            await deleteDoc(doc(db, "products", checked.value));
            alert("Deleted successfully!");
            allProducts = []; 
            renderProducts();
        } catch (err) {
            alert("Error: " + err.message);
        }
    }
};

productForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const data = {
        Name: document.getElementById('p-name').value,
        Price: Number(document.getElementById('p-price').value),
        Stock: Number(document.getElementById('p-stock').value),
        Image: document.getElementById('p-image').value,
        Description: document.getElementById('p-desc').value
    };

    try {
        if (id) {
            await updateDoc(doc(db, "products", id), data);
            alert("Updated successfully!");
        } else {
            await addDoc(collection(db, "products"), data);
            alert("Added successfully!");
        }
        productForm.reset();
        document.getElementById('img-preview').style.display = "none";
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        allProducts = [];
        renderProducts();
    } catch (err) {
        alert("Error: " + err.message);
    }
};

document.getElementById('btn-add-new').onclick = () => {
    productForm.reset();
    document.getElementById('edit-id').value = "";
    document.getElementById('img-preview').style.display = "none";
    document.getElementById('upload-status').innerText = "";
    document.getElementById('modalTitle').innerText = "Add New Product";
};

renderProducts();