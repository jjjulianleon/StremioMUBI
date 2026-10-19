/**
 * @name MUBI Hover
 * @description MUBI-style hover card on film tiles: enlarged still, blue WATCH button, synopsis and details. For the MUBI theme.
 * @updateUrl none
 * @version 1.0.0
 * @author jjjulianleon
 */

(function () {
    const TILE = ':is([class*="board-row"], [class*="search-row"], [class*="discover-content"], [class*="library-content"]) a[class*="meta-item-link"]';
    const DELAY = 450; // ms the pointer rests on a tile before the card opens, like mubi.com
    const metaCache = new Map();

    const style = document.createElement("style");
    style.textContent = `
#mubi-hover {
    position: fixed; z-index: 1000; background: #fff; color: #323232;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3); border-radius: 0 !important;
    font-family: Riforma, "Helvetica Neue", Helvetica, Arial, sans-serif;
    animation: mubi-hover-in 0.15s ease-out;
}
@keyframes mubi-hover-in { from { opacity: 0; transform: scale(0.94); } }
#mubi-hover .mh-media { position: relative; display: block; aspect-ratio: 16 / 9; background: #000; }
#mubi-hover .mh-media img { width: 100%; height: 100%; object-fit: cover; object-position: center 30%; display: block; }
#mubi-hover .mh-media::after { content: ""; position: absolute; inset: 45% 0 0; background: linear-gradient(transparent, rgba(0, 0, 0, 0.65)); }
#mubi-hover .mh-caption { position: absolute; left: 1.25rem; right: 1.25rem; bottom: 1rem; z-index: 1; color: #fff; }
#mubi-hover .mh-title { font-size: 24px; line-height: 1.05; font-weight: 500; text-transform: uppercase; }
#mubi-hover .mh-credit { margin-top: 0.3rem; font-size: 13px; font-weight: 300; text-transform: uppercase; }
#mubi-hover .mh-credit b { font-weight: 700; }
#mubi-hover .mh-body { padding: 1.4rem 1.4rem 1.5rem; }
#mubi-hover .mh-watch {
    display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1.4rem;
    background: #001489; color: #fff; border-radius: 999px !important;
    font-size: 16px; font-weight: 500; letter-spacing: 0.4px; text-transform: uppercase; text-decoration: none;
}
#mubi-hover .mh-watch:hover { background: #00106e; }
#mubi-hover .mh-watch svg { width: 0.85rem; height: 0.85rem; fill: currentColor; }
#mubi-hover .mh-desc {
    margin: 1.1rem 0 0; font-size: 16px; line-height: 1.45; font-weight: 300;
    display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden;
}
#mubi-hover .mh-meta { display: flex; flex-wrap: wrap; gap: 0.4rem 1.1rem; margin-top: 1.1rem; font-size: 15px; font-weight: 300; color: #666; }
#mubi-hover .mh-meta span { display: inline-flex; align-items: center; gap: 0.3rem; }
#mubi-hover .mh-meta svg { width: 1rem; height: 1rem; fill: currentColor; }
#mubi-hover .mh-desc:empty, #mubi-hover .mh-meta:empty { display: none; }
`;
    document.head.appendChild(style);

    const PLAY = '<svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z"/></svg>';
    const CLOCK = '<svg viewBox="0 0 16 16"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm.75 8.2l2.9 1.75-.75 1.25-3.65-2.2V3.5h1.5z"/></svg>';

    let card = null, timer = null, tile = null;

    function fetchMeta(href) {
        const m = /#\/detail\/(movie|series)\/(tt\d+)/.exec(href);
        if (!m) return Promise.resolve(null); // only Cinemeta (IMDb) titles have details to show
        const key = m[1] + "/" + m[2];
        if (!metaCache.has(key)) {
            metaCache.set(key, fetch(`https://v3-cinemeta.strem.io/meta/${key}.json`)
                .then((r) => r.json()).then((j) => j.meta || null).catch(() => null));
        }
        return metaCache.get(key);
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text) e.textContent = text;
        return e;
    }

    function hide() {
        clearTimeout(timer);
        timer = null;
        tile = null;
        if (card) { card.remove(); card = null; }
    }

    function show(link) {
        hide();
        tile = link;
        const poster = link.querySelector('[class*="poster-container"]') || link;
        const r = poster.getBoundingClientRect();
        if (!r.width) return;

        card = el("div");
        card.id = "mubi-hover";
        const media = el("a", "mh-media");
        media.href = link.getAttribute("href");
        const img = link.querySelector("img");
        if (img) { const i = el("img"); i.src = img.currentSrc || img.src; media.appendChild(i); }
        const caption = el("div", "mh-caption");
        caption.appendChild(el("div", "mh-title", link.textContent.trim()));
        const credit = el("div", "mh-credit");
        caption.appendChild(credit);
        media.appendChild(caption);

        const body = el("div", "mh-body");
        const watch = el("a", "mh-watch");
        watch.href = link.getAttribute("href");
        watch.innerHTML = PLAY + "<span>Watch</span>";
        const desc = el("p", "mh-desc");
        const meta = el("div", "mh-meta");
        body.append(watch, desc, meta);
        card.append(media, body);
        card.addEventListener("mouseleave", hide);
        card.addEventListener("click", () => setTimeout(hide));

        // MUBI's card is ~1.3x the tile, centred on it, with the still over the tile
        const w = Math.round(r.width * 1.3);
        card.style.width = w + "px";
        card.style.left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8) + "px";
        card.style.top = Math.max(8, r.top - (w * 9 / 16 - r.height) / 2) + "px";
        document.body.appendChild(card);
        keepOnScreen();

        const forCard = card;
        fetchMeta(link.getAttribute("href")).then((m) => {
            if (!m || card !== forCard) return;
            const director = [].concat(m.director || [])[0];
            if (director) credit.appendChild(el("b", null, director + " "));
            const country = (m.country || "").split(",")[0];
            credit.appendChild(document.createTextNode([country, m.year || m.releaseInfo].filter(Boolean).join(" ")));
            desc.textContent = m.description || "";
            const runtime = parseInt(m.runtime, 10);
            if (runtime) { const s = el("span"); s.innerHTML = CLOCK; s.append(String(runtime)); meta.appendChild(s); }
            const genres = [].concat(m.genres || m.genre || []).slice(0, 3).join(", ");
            if (genres) meta.appendChild(el("span", null, genres));
            if (m.imdbRating) meta.appendChild(el("span", null, "IMDb " + m.imdbRating));
            keepOnScreen();
        });
    }

    function keepOnScreen() {
        if (!card) return;
        const over = card.getBoundingClientRect().bottom - (innerHeight - 8);
        if (over > 0) card.style.top = Math.max(8, parseFloat(card.style.top) - over) + "px";
    }

    document.addEventListener("mouseover", (e) => {
        if (card && card.contains(e.target)) return;
        const link = e.target.closest && e.target.closest(TILE);
        if (link === tile) return;
        hide();
        if (!link) return;
        tile = link;
        timer = setTimeout(() => show(link), DELAY);
    });
    // Anything that moves the tiles out from under the card closes it
    addEventListener("scroll", hide, true);
    addEventListener("hashchange", hide);
    addEventListener("blur", hide);
})();
