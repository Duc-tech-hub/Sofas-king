// Sugest all destination from all over the world
document.addEventListener("DOMContentLoaded", () => {
    const address = document.querySelector("#address");
    const suggestions = document.querySelector("#address-suggestions");
    let debounceTimer;

    if (!address || !suggestions) return;

    address.addEventListener("input", () => {
        const query = address.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < 3) {
            suggestions.innerHTML = "";
            suggestions.style.display = "none";
            return;
        }
        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                const results = await response.json();

                suggestions.innerHTML = "";

                if (results.length > 0) {
                    suggestions.style.display = "block";
                    results.forEach(result => {
                        const div = document.createElement("div");
                        div.className = "suggestion-item";
                        div.textContent = result.display_name;

                        div.addEventListener("click", () => {
                            address.value = result.display_name;
                            suggestions.innerHTML = "";
                            suggestions.style.display = "none";
                        });
                        suggestions.appendChild(div);
                    });
                } else {
                    suggestions.style.display = "none";
                }
            } catch (error) {
                console.error("Lỗi lấy địa chỉ:", error);
            }
        }, 300);
    });

    document.addEventListener("click", (e) => {
        if (!address.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = "none";
        }
    });
});