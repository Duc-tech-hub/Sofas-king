import { fetchAndInitProducts, displayProductGrid, displayReviewSelect } from "./LoadProducts.js";
async function startPage() {
    const data = await fetchAndInitProducts();
    displayProductGrid(data);
    displayReviewSelect(data);
    const searchInput = document.getElementById('user-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            const filtered = data.filter(item => 
                item.data.Name.toLowerCase().includes(keyword)
            );
            displayProductGrid(filtered);
        });
    }
}
startPage();