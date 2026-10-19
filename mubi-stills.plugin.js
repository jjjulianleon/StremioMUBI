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
        const m = POSTER.exec(img.src);
        // non-IMDb items (anime, custom addons) and missing stills keep their poster, cropped by the theme
        if (!m || noStill.has(m[1])) return;
        const poster = img.src;
        img.onerror = () => { img.onerror = null; noStill.add(m[1]); img.src = poster; };
        img.src = `https://images.metahub.space/background/medium/${m[1]}/img`;
    }

    const scan = () => document.querySelectorAll('img[class*="poster-image"]').forEach(swap);
    // ponytail: one body-wide observer; debounce if it ever shows up in profiles
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    scan();
})();
