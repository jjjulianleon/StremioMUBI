/**
 * @name MUBI Stills
 * @description Swaps portrait posters for widescreen film stills (Board, Search, Discover, Library), for the MUBI theme.
 * @updateUrl none
 * @version 2.0.0
 * @author jjjulianleon
 */

(function () {
    // Cinemeta posters look like images.metahub.space/poster/<size>/<imdb id>/img;
    // the same host serves a widescreen still at /background/medium/<id>/img.
    const POSTER = /images\.metahub\.space\/poster\/\w+\/(tt\d+)\/img/;

    const noStill = new Set();

    function swap(img) {
        if (!img.closest('[class*="board-row"], [class*="search-row"], [class*="discover-content"], [class*="library-content"]')) return;
        if (img.src.includes("/background/")) return;
        // the IMDb id comes from a Cinemeta poster URL, or from the tile's link for addons with their own posters (Stremboxd)
        const link = img.closest('a[class*="meta-item-link"]');
        const fromLink = link && (/^tt\d+$/.test(link.id) ? link.id : (/\/(tt\d+)/.exec(link.getAttribute("href") || "") || [])[1]);
        const id = (POSTER.exec(img.src) || [])[1] || fromLink || null;
        // non-IMDb items (anime, custom addons) and missing stills keep their poster, cropped by the theme
        if (!id || noStill.has(id)) return;
        const poster = img.src;
        img.onerror = () => { img.onerror = null; noStill.add(id); img.src = poster; };
        img.src = `https://images.metahub.space/background/medium/${id}/img`;
    }

    const scan = () => document.querySelectorAll('img[class*="poster-image"]').forEach(swap);
    // ponytail: one body-wide observer; debounce if it ever shows up in profiles
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    scan();
})();
