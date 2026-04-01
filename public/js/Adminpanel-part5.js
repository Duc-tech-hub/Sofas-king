import { db } from "./firebase-config.js";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const productList = document.getElementById('output-box-products');
const productForm = document.getElementById('product-form');
const btnSelect = document.getElementById('select-product');
const btnDelete = document.getElementById('delete-product');
const searchInput = document.getElementById('search-product');

let allProducts = [];
const imageFileInput = document.getElementById('p-image-file');

// --- HELPER: QUICK TOAST ---
const showToast = (message, icon = 'success') => {
    Swal.fire({
        title: message,
        icon: icon,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
};

// --- IMAGE UPLOAD LOGIC ---
if (imageFileInput) {
    imageFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const status = document.getElementById('upload-status');
        const preview = document.getElementById('img-preview');
        status.innerHTML = '<i class="bi bi-hourglass-split"></i> Uploading...';
        
        const formData = new FormData();
        formData.append("image", file);
        const API_KEY = "Your_ImgBB_api_key"; 

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                const downloadURL = result.data.url; 
                document.getElementById('p-image').value = downloadURL;
                if (preview) {
                    preview.src = downloadURL;
                    preview.style.display = "block";
                }
                status.innerHTML = `<span class="text-success">✅ Upload Success!</span>`;
                showToast("Image uploaded!");
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            status.innerHTML = `<span class="text-danger">❌ Error</span>`;
            Swal.fire('Upload Failed', error.message, 'error');
        }
    };
}

// --- RENDER PRODUCTS ---
async function renderProducts(filterText = "") {
    if (!productList) return;
    
    if (allProducts.length === 0 && filterText === "") {
        productList.innerHTML = "<p>Loading products...</p>";
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    productList.innerHTML = "";
    const lowStockItems = allProducts.filter(p => Number(p.Stock) <= 5);
    if (lowStockItems.length > 0 && filterText === "") {
        const alertDiv = document.createElement('div');
        alertDiv.className = "alert alert-danger border-0 shadow-sm mb-3";
        alertDiv.innerHTML = `
            <h6 class="fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>Warning: Low Stock (≤ 5):</h6>
            <ul class="mb-0 small">
                ${lowStockItems.map(p => `<li>${p.Name}: <strong>${p.Stock}</strong> left</li>`).join('')}
            </ul>
        `;
        productList.appendChild(alertDiv);
    }

    const filtered = allProducts.filter(p => p.Name.toLowerCase().includes(filterText.toLowerCase()));

    filtered.forEach((p) => {
        const div = document.createElement('div');
        div.className = "item-row d-flex justify-content-between align-items-center p-2 border-bottom";
        const isLow = Number(p.Stock) <= 5;
        const stockStyle = isLow ? "text-danger fw-bold" : "text-muted";

        div.innerHTML = `
            <div class="d-flex align-items-center">
                <input type="radio" name="prod-select" value="${p.id}" class="me-2">
                <div>
                    <div><strong>${p.Name}</strong></div>
                    <small class="${stockStyle}">Stock: ${p.Stock}</small>
                </div>
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

// --- ACTION: DELETE PRODUCT ---
btnDelete.onclick = async () => {
    const checked = document.querySelector('input[name="prod-select"]:checked');
    if (!checked) return Swal.fire('Selection Required', 'Please select a product to delete.', 'info');

    const result = await Swal.fire({
        title: 'Delete Product?',
        text: "This action will permanently remove the item from your store.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, Delete it!'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({ title: 'Deleting...', didOpen: () => Swal.showLoading() });
            await deleteDoc(doc(db, "products", checked.value));
            
            showToast("Product deleted");
            allProducts = []; 
            renderProducts();
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
};

// --- ACTION: ADD/UPDATE PRODUCT ---
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
        Swal.fire({ title: 'Saving...', didOpen: () => Swal.showLoading() });

        if (id) {
            await updateDoc(doc(db, "products", id), data);
            showToast("Updated successfully!");
        } else {
            await addDoc(collection(db, "products"), data);
            showToast("Added to store!");
        }
        
        productForm.reset();
        document.getElementById('img-preview').style.display = "none";
        
        const modalEl = document.getElementById('productModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        
        allProducts = [];
        renderProducts();
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
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