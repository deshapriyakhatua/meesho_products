(function() {
    let allProducts = [];

    // Hook into XMLHttpRequest to capture Meesho search API
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener('load', function() {
            if (url.includes('/api/v1/products/search')) {
                try {
                    const json = JSON.parse(this.responseText);
                    if (json && json.catalogs) {
                        json.catalogs.forEach(item => {
                            allProducts.push({
                                product_id: item?.product_id || item?.id || null,
                                name: item?.name,
                                price: item?.min_product_price,
                                images: item.images ? item.images.join(", ") : "",
                                average_rating: item?.catalog_reviews_summary?.average_rating || null,
                                rating_count: item?.catalog_reviews_summary?.rating_count || null,
                                review_count: item?.catalog_reviews_summary?.review_count || null,
                                sub_category: item?.sub_sub_category_name || null
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
    window.exportProducts = function() {
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
downloadProducts();
