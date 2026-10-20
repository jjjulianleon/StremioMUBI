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
    // ponytail: one body-wide observer; addArrow() only creates the button when it's missing
    new MutationObserver(addArrow).observe(document.body, { childList: true, subtree: true });
    addEventListener("hashchange", () => setTimeout(addArrow));
    addArrow();

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
