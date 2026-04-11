import { db, auth } from "./firebase-config.js";
import { 
    collection, 
    getDocs, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const productList = document.getElementById('output-box-products');
const productForm = document.getElementById('product-form');
const btnSelect = document.getElementById('select-product');
const btnDelete = document.getElementById('delete-product');
const searchInput = document.getElementById('search-product');
const imageFileInput = document.getElementById('p-image-file');

let allProducts = [];

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
        
        // Wait for auth state to ensure user is logged in
        const user = await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((u) => {
                unsubscribe();
                resolve(u);
            });
        });

        if (!user) {
            Swal.fire('Access Denied', 'You must be logged in as an Admin to upload images!', 'error');
            return;
        }

        status.innerHTML = '<i class="bi bi-hourglass-split"></i> Authenticating Admin...';

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];

            try {
                const idToken = await user.getIdToken();

                status.innerHTML = '<i class="bi bi-cloud-upload"></i> Uploading to server...';
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ image: base64Image })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    const downloadURL = result.data.url;
                    document.getElementById('p-image').value = downloadURL;
                    if (preview) {
                        preview.src = downloadURL;
                        preview.style.display = "block";
                    }
                    status.innerHTML = `<span class="text-success">✅ Upload successful!</span>`;
                    showToast("Image link secured");
                } else {
                    throw new Error(result.error || "Upload failed (Check Admin permissions)");
                }
            } catch (error) {
                console.error("Upload Error:", error);
                status.innerHTML = `<span class="text-danger">❌ Permission Denied</span>`;
                Swal.fire('Security Error', error.message, 'error');
            }
        };
    };
}

// --- RENDER PRODUCTS ---
async function renderProducts(filterText = "") {
    if (!productList) return;

    if (allProducts.length === 0 && filterText === "") {
        productList.innerHTML = "<p class='text-center py-3'>Fetching inventory...</p>";
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    productList.innerHTML = "";
    
    // Low stock warning logic
    const lowStockItems = allProducts.filter(p => Number(p.Stock) <= 5);
    if (lowStockItems.length > 0 && filterText === "") {
        const alertDiv = document.createElement('div');
        alertDiv.className = "alert alert-warning border-0 shadow-sm mb-3";
        alertDiv.innerHTML = `
            <h6 class="fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>Inventory Alert (Low Stock):</h6>
            <ul class="mb-0 small">
                ${lowStockItems.map(p => `<li>${p.Name}: <strong>${p.Stock}</strong> units remaining</li>`).join('')}
            </ul>
        `;
        productList.appendChild(alertDiv);
    }

    const filtered = allProducts.filter(p => p.Name.toLowerCase().includes(filterText.toLowerCase()));

    if (filtered.length === 0) {
        productList.innerHTML += "<p class='text-center text-muted'>No matching products found.</p>";
        return;
    }

    filtered.forEach((p) => {
        const div = document.createElement('div');
        div.className = "item-row d-flex justify-content-between align-items-center p-2 border-bottom";
        
        const isLow = Number(p.Stock) <= 5;
        const stockStyle = isLow ? "text-danger fw-bold" : "text-muted";

        div.innerHTML = `
            <div class="d-flex align-items-center">
                <input type="radio" name="prod-select" value="${p.id}" class="me-3">
                <div>
                    <div class="fw-bold">${p.Name}</div>
                    <small class="${stockStyle}">Availability: ${p.Stock} in stock</small>
                </div>
            </div>
        `;

        const btnEdit = document.createElement('button');
        btnEdit.className = "btn btn-sm btn-outline-primary";
        btnEdit.innerHTML = '<i class="bi bi-pencil"></i> Edit';
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
    document.getElementById('p-name').value = data.Name || "";
    document.getElementById('p-price').value = data.Price || 0;
    document.getElementById('p-stock').value = data.Stock || 0;
    document.getElementById('p-image').value = data.Image || "";
    document.getElementById('p-desc').value = data.Description || "";
    document.getElementById('modalTitle').innerText = "Edit Product Details";

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

// --- EVENT LISTENERS ---
searchInput.addEventListener('input', (e) => renderProducts(e.target.value));

btnSelect.onclick = () => {
    btnDelete.classList.toggle('button-hide');
    btnDelete.style.display = btnDelete.classList.contains('button-hide') ? "none" : "inline-block";
};

// --- ACTION: DELETE PRODUCT ---
btnDelete.onclick = async () => {
    const checked = document.querySelector('input[name="prod-select"]:checked');
    if (!checked) return Swal.fire('Selection Required', 'Please select an item to remove.', 'info');

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This product will be permanently deleted from the database.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Confirm Delete'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading() });
            await deleteDoc(doc(db, "products", checked.value));

            showToast("Product removed successfully");
            allProducts = []; // Reset local cache
            renderProducts();
        } catch (err) {
            Swal.fire('Operation Failed', err.message, 'error');
        }
    }
};

// --- ACTION: SAVE (ADD OR UPDATE) ---
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
        Swal.fire({ title: 'Saving data...', didOpen: () => Swal.showLoading() });

        if (id) {
            await updateDoc(doc(db, "products", id), data);
            showToast("Catalog updated!");
        } else {
            await addDoc(collection(db, "products"), data);
            showToast("New product added!");
        }

        productForm.reset();
        document.getElementById('img-preview').style.display = "none";

        const modalEl = document.getElementById('productModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();

        allProducts = []; // Refresh list
        renderProducts();
    } catch (err) {
        Swal.fire('Save Error', err.message, 'error');
    }
};

// --- ACTION: RESET FOR NEW ENTRY ---
document.getElementById('btn-add-new').onclick = () => {
    productForm.reset();
    document.getElementById('edit-id').value = "";
    document.getElementById('img-preview').style.display = "none";
    document.getElementById('upload-status').innerText = "";
    document.getElementById('modalTitle').innerText = "Add New Catalog Entry";
};

// INITIAL RENDER
renderProducts();