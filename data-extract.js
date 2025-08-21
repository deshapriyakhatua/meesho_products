(function () {
    let allProducts = [];

    // Helper to parse "Base Metal: Synthetic\n..." into key-value object
    function parseFullDetails(fullDetails) {
        if (!fullDetails) return {};
        const lines = fullDetails.split("\n");
        const detailsObj = {};

        lines.forEach(line => {
            const [key, value] = line.split(":").map(s => s.trim());
            if (key && value) {
                // convert key into snake_case
                const formattedKey = key.toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-z0-9_]/g, "");
                detailsObj[formattedKey] = value;
            }
        });

        return detailsObj;
    }

    // Hook into XMLHttpRequest to capture Meesho search API
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        this.addEventListener('load', function () {
            if (url.includes('/api/v1/products/search')) {
                try {
                    const json = JSON.parse(this.responseText);
                    if (json && json.catalogs) {
                        json.catalogs.forEach(item => {
                            const details = parseFullDetails(item?.full_details || "");
                            allProducts.push({
                                product_id: item?.product_id || item?.id || null,
                                name: item?.name,
                                hero_product_name: item?.hero_product_name || null,
                                price: item?.min_product_price,
                                shipping: (item?.shipping?.charges || 0) + (item?.shipping_2?.charges || 0),
                                images: item.images ? item.images.join(", ") : "",
                                average_rating: item?.catalog_reviews_summary?.average_rating || null,
                                rating_count: item?.catalog_reviews_summary?.rating_count || null,
                                review_count: item?.catalog_reviews_summary?.review_count || null,
                                sub_category: item?.sub_sub_category_name || null,
                                url: item?.original_slug ? `https://www.meesho.com/${item.original_slug}/p/${item?.product_id}` : null,
                                ...details
                            });
                        });
                        console.log(`✅ Captured ${json.catalogs.length} products. Total: ${allProducts.length}`);
                    }
                } catch (e) {
                    console.error("❌ Error parsing Meesho response", e);
                }
            }
        });
        return originalOpen.apply(this, arguments);
    };

    // Function to export XLSX
    window.exportProducts = function () {
        if (allProducts.length === 0) {
            console.warn("⚠ No products captured yet!");
            return;
        }
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(allProducts);
        XLSX.utils.book_append_sheet(wb, ws, "Products");
        XLSX.writeFile(wb, "meesho_products.xlsx");
        console.log("📁 meesho_products.xlsx downloaded with", allProducts.length, "products");
    };

    console.log("✅ Meesho capture script loaded. Scroll/search to collect products, then run exportProducts() to download XLSX.");
})();





/////////////////////////////////////////////////////////////////////////////////////
var script = document.createElement('script');
script.src = "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js";
document.body.appendChild(script);



///////////////////////////////
exportProducts();
