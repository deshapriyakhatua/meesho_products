(function() {
  const targetURL = "https://www.meesho.com/api/v1/products/search";

  // --- Hook fetch ---
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = typeof args[0] === "string" ? args[0] : args[0].url;
    const options = args[1] || {};

    if (url.startsWith(targetURL)) {
      console.log("📤 FETCH Request URL:", url);
      if (options.body) {
        try {
          console.log("📦 FETCH Payload:", 
            typeof options.body === "string" ? options.body : await bodyToString(options.body)
          );
        } catch (e) { console.error("Error reading fetch body", e); }
      }
    }

    const response = await originalFetch(...args);

    if (url.startsWith(targetURL)) {
      response.clone().text().then(text => {
        try {
          console.log("📥 FETCH Response (JSON):", JSON.parse(text));
        } catch {
          console.log("📥 FETCH Response (Text):", text);
        }
      });
    }

    return response;
  };

  // --- Hook XHR ---
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url; // store URL for later
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (this._url && this._url.startsWith(targetURL)) {
      console.log("📤 XHR Request URL:", this._url);
      if (body) {
        bodyToString(body).then(payloadStr => {
          console.log("📦 XHR Payload:", payloadStr);
        });
      }
      this.addEventListener("load", function() {
        try {
          console.log("📥 XHR Response (JSON):", JSON.parse(this.responseText).catalogs);
        } catch {
          console.log("📥 XHR Response (Text):", this.responseText);
        }
      });
    }
    return originalSend.call(this, body);
  };

  async function bodyToString(body) {
    if (body instanceof FormData) {
      let obj = {};
      body.forEach((value, key) => { obj[key] = value; });
      return JSON.stringify(obj);
    }
    if (body instanceof URLSearchParams) {
      return body.toString();
    }
    if (body instanceof Blob) {
      return await body.text();
    }
    return String(body);
  }

  console.log("✅ Capture started for:", targetURL);
})();





