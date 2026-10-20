/**
 * @name MUBI Navigation
 * @description Back arrow in the top bar, plus browser-style back/forward: Cmd+[ / Cmd+], Cmd+← / Cmd+→, mouse side buttons and a two-finger swipe.
 * @updateUrl none
 * @version 1.0.0
 * @author jjjulianleon
 */

(function () {
    const SWIPE_DISTANCE = 140; // px of horizontal trackpad travel that counts as a swipe

    const style = document.createElement("style");
    style.textContent = `
.mubi-back {
    display: flex; align-items: center; justify-content: center; flex: none;
    width: 2rem; height: 2rem; margin-right: 0.5rem; padding: 0; border: 0; background: none;
    color: #000; cursor: pointer;
}
.mubi-back svg { width: 0.75rem; height: 1.25rem; }
.mubi-back:disabled { color: #c8c8c8; cursor: default; }
.mubi-search-icon { border-bottom: 0 !important; }
.mubi-search-icon [class*="search-input"] { display: none !important; }
/* on the search page a tight field widens over the links instead of hiding the text box */
.mubi-search-over { position: relative; z-index: 3; background: #fff !important; }
`;
    document.head.appendChild(style);

    const canGoBack = () => (window.navigation && "canGoBack" in window.navigation ? window.navigation.canGoBack : history.length > 1);
    const back = () => { if (canGoBack()) history.back(); };
    const forward = () => history.forward();

    // ---- Arrow in the top bar (before the STREMIO wordmark) ----
    function addArrow() {
        document.querySelectorAll('[class*="horizontal-nav-bar-container"] > [class*="logo-container"]').forEach((logo) => {
            let btn = logo.previousElementSibling;
            if (!btn || !btn.classList.contains("mubi-back")) {
                btn = document.createElement("button");
                btn.className = "mubi-back";
                btn.title = "Back (⌘[)";
                btn.innerHTML = '<svg viewBox="0 0 12 20"><path d="M10 2L2 10l8 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
                btn.addEventListener("click", back);
                logo.before(btn);
            }
            btn.disabled = !canGoBack();
        });
    }
    // ---- Search field sized to the room the links leave, so it never covers SETTINGS ----
    // Measured rather than guessed, since window width, interface zoom and fonts all change it.
    function fitSearch() {
        // each page keeps its own top bar in the DOM, so pair links and search within the same page
        document.querySelectorAll('[class*="main-nav-bars-container"]').forEach((page) => {
            const links = page.querySelector(':scope > [class*="vertical-nav-bar-container"]');
            const bar = page.querySelector(':scope > [class*="horizontal-nav-bar-container"] [class*="search-bar-container"]');
            if (!links || !bar || !bar.getBoundingClientRect().width) return;
            const room = bar.getBoundingClientRect().right - links.getBoundingClientRect().right - 24;
            const fit = Math.round(Math.max(40, Math.min(224, room)));
            const tight = fit < 110;
            const onSearch = location.hash.startsWith("#/search");
            // too tight for text: keep only the magnifier, except on the search page where you need to type
            const width = tight && onSearch ? 224 : fit;
            bar.style.setProperty("flex", `0 0 ${width}px`, "important");
            bar.style.setProperty("max-width", `${width}px`, "important");
            bar.classList.toggle("mubi-search-icon", tight && !onSearch);
            bar.classList.toggle("mubi-search-over", tight && onSearch);
        });
    }

    function update() { addArrow(); fitSearch(); }
    // ponytail: one body-wide observer; addArrow() only creates the button when it's missing
    new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
    addEventListener("hashchange", () => setTimeout(update));
    addEventListener("resize", fitSearch);
    update();

    // ---- Keyboard: Cmd+[ / Cmd+] and Cmd+← / Cmd+→ (not while typing) ----
    addEventListener("keydown", (e) => {
        if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
        const typing = e.target.closest && e.target.closest("input, textarea, [contenteditable]");
        if (e.key === "[" || (e.key === "ArrowLeft" && !typing)) { e.preventDefault(); back(); }
        else if (e.key === "]" || (e.key === "ArrowRight" && !typing)) { e.preventDefault(); forward(); }
    }, true);

    // ---- Mouse side buttons ----
    addEventListener("mouseup", (e) => {
        if (e.button === 3) { e.preventDefault(); back(); }
        else if (e.button === 4) { e.preventDefault(); forward(); }
    });

    // ---- Two-finger horizontal swipe ----
    // Skipped over anything that can still scroll sideways (genre rows) and inside the player.
    function scrollsSideways(node, dx) {
        for (; node && node !== document.body; node = node.parentElement) {
            if (node.scrollWidth <= node.clientWidth) continue;
            const ox = getComputedStyle(node).overflowX;
            if (ox !== "auto" && ox !== "scroll") continue;
            if (dx < 0 ? node.scrollLeft > 0 : node.scrollLeft + node.clientWidth < node.scrollWidth - 1) return true;
        }
        return false;
    }
    let travel = 0, fired = false, idle = null;
    addEventListener("wheel", (e) => {
        clearTimeout(idle);
        idle = setTimeout(() => { travel = 0; fired = false; }, 250); // a pause ends the gesture
        if (fired || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        if (location.hash.startsWith("#/player") || scrollsSideways(e.target, e.deltaX)) { travel = 0; return; }
        travel += e.deltaX;
        if (Math.abs(travel) < SWIPE_DISTANCE) return;
        fired = true;
        if (travel < 0) back(); else forward(); // fingers right = back, like Safari
    }, { passive: true });
})();
