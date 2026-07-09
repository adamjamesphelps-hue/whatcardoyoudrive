(function () {
  // --- Sample data. Swap fetchModelData() below for a real API call once a backend exists. ---
  const SAMPLE_DB = {
    "toyota camry": { count: 412, reasons: ["Reliability over 10+ years", "Cheapest to insure in my area", "Resale value beat every competitor I looked at"] },
    "honda civic": { count: 387, reasons: ["Manual transmission was still available", "Best fuel economy in its class", "Grew up with one, trusted the brand"] },
    "tesla model 3": { count: 298, reasons: ["No more gas station stops", "Software updates keep improving it", "Instant torque, sold me on the test drive"] },
    "ford f-150": { count: 265, reasons: ["Needed real towing capacity", "Parts and service everywhere", "Best resale value for a truck"] },
    "toyota corolla": { count: 231, reasons: ["Wanted the lowest cost of ownership", "Toyota reliability reputation", "Small enough to park anywhere"] },
    "honda cr-v": { count: 219, reasons: ["Best cargo space in its class", "AWD for winter driving", "Comfortable for a family of four"] },
    "mazda cx-5": { count: 156, reasons: ["Interior felt a class above the price", "Fun to actually drive", "Fewer recalls than competitors"] },
    "subaru outback": { count: 149, reasons: ["Standard AWD, no upcharge", "Ground clearance for gravel roads", "Ski trips every winter"] },
    "bmw 3 series": { count: 138, reasons: ["Handling was noticeably better in the test drive", "Wanted the badge, no shame in admitting it", "Lease deal was hard to pass up"] },
    "hyundai tucson": { count: 122, reasons: ["Best warranty in the segment", "Loaded with features at the price", "Looked more expensive than it was"] }
  };

  const KNOWN_MODELS = Object.keys(SAMPLE_DB);

  function fetchModelData(key) {
    // Placeholder for a real API call, e.g.:
    // return fetch(`https://api.whatcardoyoudrive.com/model?q=${encodeURIComponent(key)}`).then(r => r.json());
    return Promise.resolve(SAMPLE_DB[key] || null);
  }

  function detectModelKey() {
    const haystack = (document.title + " " + (document.querySelector("h1")?.innerText || "")).toLowerCase();
    return KNOWN_MODELS.find(model => haystack.includes(model)) || null;
  }

  function buildWidget(modelKey, data) {
    const existing = document.getElementById("wcdyd-widget");
    if (existing) existing.remove();

    const label = modelKey.replace(/\b\w/g, c => c.toUpperCase());
    const wrap = document.createElement("div");
    wrap.id = "wcdyd-widget";
    wrap.innerHTML = `
      <div class="wcdyd-header">
        <span class="wcdyd-mark">whatcardoyoudrive<span class="wcdyd-dot">.</span>com</span>
        <button class="wcdyd-close" aria-label="Close">&times;</button>
      </div>
      <div class="wcdyd-body">
        <div class="wcdyd-count"><strong>${data.count.toLocaleString()}</strong> people said they drive a <strong>${label}</strong></div>
        <ul class="wcdyd-reasons">
          ${data.reasons.slice(0, 3).map(r => `<li>${r}</li>`).join("")}
        </ul>
        <a class="wcdyd-link" href="https://whatcardoyoudrive.com/?model=${encodeURIComponent(modelKey)}" target="_blank" rel="noopener">See all reasons &rarr;</a>
      </div>
    `;
    document.body.appendChild(wrap);
    wrap.querySelector(".wcdyd-close").addEventListener("click", () => wrap.remove());
  }

  function run() {
    chrome.storage?.sync?.get(['wcdyd_enabled'], (result) => {
      if (result.wcdyd_enabled === false) return; // user turned it off
      const key = detectModelKey();
      if (!key) return;
      fetchModelData(key).then(data => {
        if (data) buildWidget(key, data);
      });
    });
  }

  run();

  // Re-check on SPA-style navigation (Google search results, filtered listing pages, etc.)
  let lastHref = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      setTimeout(run, 800);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
