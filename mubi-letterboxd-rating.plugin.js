/**
 * @name MUBI Letterboxd Rating
 * @description Replaces the IMDb rating button with the film's Letterboxd average, linking to its Letterboxd page. Also used by the MUBI Hover card.
 * @updateUrl none
 * @version 1.0.0
 * @author jjjulianleon
 */

(function () {
    const STORE = "mubi-letterboxd-ratings";
    const MAX_AGE = 7 * 24 * 3600 * 1000; // ratings move slowly; refetch weekly
    const LOGO = '<svg viewBox="0 0 30 10" aria-label="Letterboxd"><circle cx="5" cy="5" r="4.3" fill="#ff8000"/><circle cx="15" cy="5" r="4.3" fill="#00e054"/><circle cx="25" cy="5" r="4.3" fill="#40bcf4"/></svg>';

    const style = document.createElement("style");
    style.textContent = `[data-mubi-hidden] { display: none !important; }
a[data-mubi-lb] svg { width: 2.2em !important; height: auto !important; }`;
    document.head.appendChild(style);

    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { /* cache is optional */ }
    const pending = new Map();

    // Stremio Enhanced turns off the browser's cross-site checks, so letterboxd.com can be read directly.
    // letterboxd.com/imdb/<id>/ redirects to the film page, whose JSON-LD carries the average rating.
    window.mubiLetterboxdRating = function (imdb) {
        if (!/^tt\d+$/.test(imdb || "")) return Promise.resolve(null);
        const hit = stored[imdb];
        if (hit && Date.now() - hit.t < MAX_AGE) return Promise.resolve(hit.v);
        if (!pending.has(imdb)) {
            pending.set(imdb, fetch(`https://letterboxd.com/imdb/${imdb}/`)
                .then((r) => (r.ok ? r.text() : null))
                .then((html) => {
                    if (!html) return null;
                    const rating = /"ratingValue":\s*([\d.]+)/.exec(html);
                    const url = /<meta property="og:url" content="([^"]+)"/.exec(html);
                    const v = { rating: rating ? parseFloat(rating[1]) : null, url: url ? url[1] : null };
                    stored[imdb] = { t: Date.now(), v };
                    try { localStorage.setItem(STORE, JSON.stringify(stored)); } catch (e) { /* cache is optional */ }
                    return v;
                })
                .catch(() => null));
        }
        return pending.get(imdb);
    };

    window.mubiLetterboxdLogo = LOGO;

    function swap(btn) {
        const href = decodeURIComponent(btn.getAttribute("href") || "");
        const id = (/tt\d+/.exec(href) || /tt\d+/.exec(location.hash) || [])[0];
        if (!id || btn.dataset.mubiLbFor === id) return;
        btn.dataset.mubiLbFor = id;
        // Discover's preview reuses the same button for the next film: drop the old copy
        btn.parentElement.querySelectorAll(":scope > [data-mubi-lb]").forEach((n) => n.remove());
        delete btn.dataset.mubiHidden;

        window.mubiLetterboxdRating(id).then((v) => {
            if (!v || v.rating == null || !btn.isConnected || btn.dataset.mubiLbFor !== id) return;
            const lb = btn.cloneNode(true); // keeps Stremio's classes, so it looks exactly like the IMDb button
            lb.dataset.mubiLb = id;
            delete lb.dataset.mubiLbFor;
            lb.href = "https://www.stremio.com/warning#" + encodeURIComponent(v.url || `https://letterboxd.com/imdb/${id}/`);
            const label = lb.querySelector('[class*="label"]');
            if (label) label.textContent = v.rating.toFixed(1);
            const svg = lb.querySelector("svg");
            if (svg) svg.outerHTML = LOGO;
            btn.after(lb);
            btn.dataset.mubiHidden = "1";
        });
    }

    const scan = () => document.querySelectorAll('a[class*="imdb-button-container"]:not([data-mubi-lb])').forEach(swap);
    // ponytail: one body-wide observer; swap() returns early for buttons it has already handled
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
    scan();
})();
