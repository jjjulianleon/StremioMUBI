/**
 * @name MUBI Rows
 * @description Board becomes Continue Watching + your Letterboxd watchlist grouped by genre; Discover shows one row per genre with MUBI collection banners in between.
 * @updateUrl none
 * @version 1.0.0
 * @author jjjulianleon
 */

(function () {
    // ---- Settings -------------------------------------------------------------------------------
    const LETTERBOXD_USER = "jjjulian_"; // public watchlist, read through Stremboxd (no password needed)
    const COLLECTIONS = "https://jjjulianleon.github.io/StremioMUBI/manifest.json";
    const CINEMETA = "https://v3-cinemeta.strem.io/manifest.json";
    const MIN_PER_GENRE = 4; // smaller genres are left out of the Board
    const BANNER_EVERY = 2; // Discover: a collection banner after every N genre rows
    const CACHE_KEY = "mubi-rows-watchlist";

    const STREMBOXD = "https://api.stremboxd.com/" +
        btoa(JSON.stringify({ u: LETTERBOXD_USER, c: { watchlist: true, popular: false, top250: false }, l: [], r: false }))
            .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const style = document.createElement("style");
    style.textContent = `
body.mubi-board-on [class*="board-content-"]:not([class*="container"]) > [class*="board-row"]:not([class*="continue-watching"]):not(.mubi-row) { display: none !important; }
body.mubi-discover-on [class*="catalog-container"] > :not([class*="selectable-inputs-container"]):not(.mubi-rows) { display: none !important; }
body.mubi-discover-on [class*="discover-content"] > [class*="meta-preview-container"] { display: none !important; }
body.mubi-discover-on [class*="catalog-container"] { padding-right: var(--mubi-gutter, 1.5rem) !important; }
div.mubi-row div.mubi-items {
    display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 8px) / 3); gap: 4px;
    overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none;
}
div.mubi-row div.mubi-items::-webkit-scrollbar { display: none; }
div.mubi-row div.mubi-items > div { display: block !important; scroll-snap-align: start; }
div.mubi-row > [class*="header-container"] { display: flex !important; align-items: center; }
.mubi-row .mubi-arrows { margin-left: auto; display: flex; gap: 0.25rem; }
.mubi-row .mubi-arrows button {
    width: 2rem; height: 2rem; border: 1px solid #c8c8c8; background: #fff; color: #323232;
    font: 400 16px/1 Riforma, "Helvetica Neue", Helvetica, Arial, sans-serif; cursor: pointer;
}
.mubi-row .mubi-arrows button:hover { border-color: #000; }
.mubi-rows-status { padding: 2rem 0; font: 300 15px/1.5 Riforma, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #666; }
`;
    document.head.appendChild(style);

    // ---- Small helpers ------------------------------------------------------------------------
    const jsonCache = new Map();
    function getJSON(url) {
        if (!jsonCache.has(url)) jsonCache.set(url, fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null));
        return jsonCache.get(url);
    }
    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text) e.textContent = text;
        return e;
    }
    const base = (manifestUrl) => manifestUrl.replace(/\/manifest\.json$/, "");

    // Markup mirrors Stremio's own row/tile classes so the theme, Stills and Hover plugins style it too.
    function tile(meta) {
        const box = el("div", "meta-item-container mubi-tile");
        const a = el("a", "meta-item-link");
        a.id = meta.id;
        a.href = `#/detail/${meta.type || "movie"}/${meta.id}/${meta.id}`;
        const poster = el("div", "poster-container");
        const layer = el("div", "poster-image-layer");
        const img = el("img", "poster-image");
        img.loading = "lazy";
        img.src = /^tt\d+$/.test(meta.id) ? `https://images.metahub.space/background/medium/${meta.id}/img` : meta.poster;
        if (meta.poster) img.onerror = () => { img.onerror = null; img.src = meta.poster; };
        layer.appendChild(img);
        poster.appendChild(layer);
        const bar = el("div", "title-bar-container");
        bar.appendChild(el("div", "title-label", meta.name));
        a.append(poster, bar);
        box.appendChild(a);
        return box;
    }

    function row(title, metas, seeAll) {
        const r = el("div", "board-row mubi-row");
        const header = el("div", "header-container");
        const tc = el("div", "title-container");
        tc.appendChild(el("div", "title", title));
        header.appendChild(tc);
        if (seeAll) {
            const a = el("a", "see-all-container");
            a.href = seeAll;
            a.appendChild(el("div", "label", "See all"));
            header.appendChild(a);
        }
        const items = el("div", "mubi-items");
        metas.forEach((m) => items.appendChild(tile(m)));
        if (!seeAll && metas.length > 3) {
            const arrows = el("div", "mubi-arrows");
            [["‹", -1], ["›", 1]].forEach(([label, dir]) => {
                const b = el("button", null, label);
                b.onclick = () => items.scrollBy({ left: dir * items.clientWidth, behavior: "smooth" });
                arrows.appendChild(b);
            });
            header.appendChild(arrows);
        }
        r.append(header, items);
        return r;
    }

    // ---- Board: Letterboxd watchlist by genre -----------------------------------------------------
    async function fetchWatchlist() {
        const all = [];
        for (let skip = 0; skip < 3000; skip += 100) {
            const page = await getJSON(`${STREMBOXD}/catalog/movie/letterboxd-watchlist${skip ? `/skip=${skip}` : ""}.json`);
            const metas = (page && page.metas) || [];
            all.push(...metas);
            if (metas.length < 100) break;
        }
        return all;
    }

    function cachedWatchlist() {
        try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch (e) { return null; }
    }

    function boardRows(watchlist) {
        const rows = [row("Your watchlist", watchlist.slice(0, 30), `#/discover/${encodeURIComponent(STREMBOXD + "/manifest.json")}/movie/letterboxd-watchlist`)];
        // Prefer the installed Stremboxd's own link (its config may differ from ours); its row is hidden but still there
        rows[0].querySelector(".see-all-container").addEventListener("click", (e) => {
            const own = document.querySelector('[class*="board-row"]:not(.mubi-row) a[class*="see-all-container"][href*="letterboxd-watchlist"]');
            if (own) { e.preventDefault(); location.hash = own.getAttribute("href").slice(1); }
        });
        const byGenre = new Map();
        watchlist.forEach((m) => (m.genres || []).forEach((g) => {
            if (g === "TV Movie") return;
            if (!byGenre.has(g)) byGenre.set(g, []);
            byGenre.get(g).push(m);
        }));
        [...byGenre.entries()]
            .filter(([, films]) => films.length >= MIN_PER_GENRE)
            .sort((a, b) => b[1].length - a[1].length)
            // films whose main (first) genre is this one lead the row, so rows don't all open the same way
            .forEach(([genre, films]) => rows.push(row(genre, [
                ...films.filter((m) => m.genres[0] === genre),
                ...films.filter((m) => m.genres[0] !== genre),
            ])));
        return rows;
    }

    let watchlist = (cachedWatchlist() || {}).metas || null;
    let refreshing = null;
    function refreshWatchlist() {
        if (!refreshing) {
            refreshing = fetchWatchlist().then((metas) => {
                if (!metas.length) {
                    document.querySelectorAll(".mubi-rows[data-for=board] .mubi-rows-status").forEach((n) => {
                        n.textContent = `Couldn't load the Letterboxd watchlist of ${LETTERBOXD_USER}. It has to be public.`;
                    });
                    refreshing = null;
                    return;
                }
                const changed = JSON.stringify(metas.map((m) => m.id)) !== JSON.stringify((watchlist || []).map((m) => m.id));
                watchlist = metas;
                try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), metas })); } catch (e) { /* cache is optional */ }
                if (changed) document.querySelectorAll(".mubi-rows[data-for=board]").forEach((n) => n.remove());
            });
        }
        return refreshing;
    }

    function renderBoard() {
        const content = document.querySelector('[class*="board-content-"]:not([class*="container"])');
        if (!content) return;
        document.body.classList.add("mubi-board-on");
        if (content.querySelector(":scope > .mubi-rows[data-for=board]")) return;
        const box = el("div", "mubi-rows");
        box.dataset.for = "board";
        if (watchlist) boardRows(watchlist).forEach((r) => box.appendChild(r));
        else box.appendChild(el("div", "mubi-rows-status", "Loading your Letterboxd watchlist…"));
        // display: contents lets the rows sit in the board column as if they were Stremio's own
        box.style.display = "contents";
        const cw = content.querySelector(':scope > [class*="continue-watching"]');
        if (cw) cw.after(box); else content.prepend(box);
        refreshWatchlist();
    }

    // ---- Discover: one row per genre, collection banners in between ----------------------------
    function discoverTarget() {
        // #/discover/<encoded manifest>/<type>/<catalog>?genre=…
        const m = /^#\/discover(?:\/([^/?]+)\/([^/?]+)\/([^/?]+))?(\?.*)?$/.exec(location.hash);
        if (!m) return null;
        const params = new URLSearchParams(m[4] || "");
        if (params.get("genre")) return null; // a genre is picked: keep Stremio's grid
        if (m[1] && decodeURIComponent(m[1]).includes("stremboxd.com")) return null; // its "genre" filter is really a sort order
        return { manifest: m[1] ? decodeURIComponent(m[1]) : CINEMETA, type: m[2] || "movie", catalog: m[3] || "top" };
    }

    async function collectionRows() {
        const man = await getJSON(COLLECTIONS);
        const cats = ((man && man.catalogs) || []).filter((c) => c.mubi);
        return Promise.all(cats.map(async (c) => {
            const data = await getJSON(`${base(COLLECTIONS)}/catalog/${c.type}/${c.id}.json`);
            // the see-all link is how the MUBI Collections plugin recognises a row and draws its banner
            return row(c.name, (data && data.metas) || [], `#/discover/${encodeURIComponent(COLLECTIONS)}/${c.type}/${c.id}`);
        }));
    }

    let discoverKey = null;
    async function renderDiscover() {
        const target = discoverTarget();
        const catalog = document.querySelector('[class*="catalog-container"]');
        document.body.classList.toggle("mubi-discover-on", !!(target && catalog));
        if (!target || !catalog) {
            document.querySelectorAll('[class*="catalog-container"] > .mubi-rows').forEach((n) => n.remove());
            return;
        }
        const key = JSON.stringify(target);
        const existing = catalog.querySelector(":scope > .mubi-rows");
        if (existing && existing.dataset.key === key) return;
        if (existing) existing.remove();
        if (discoverKey === key) return; // already building
        discoverKey = key;

        const box = el("div", "mubi-rows");
        box.dataset.key = key;
        box.appendChild(el("div", "mubi-rows-status", "Loading…"));
        const inputs = catalog.querySelector(':scope > [class*="selectable-inputs-container"]');
        if (inputs) inputs.after(box); else catalog.prepend(box);

        const man = await getJSON(target.manifest);
        const cat = man && (man.catalogs || []).find((c) => c.type === target.type && c.id === target.catalog);
        const genreExtra = cat && (cat.extra || []).find((e) => e.name === "genre");
        const genres = (genreExtra && genreExtra.options) || [];
        const [rows, banners] = await Promise.all([
            Promise.all(genres.map(async (g) => {
                const data = await getJSON(`${base(target.manifest)}/catalog/${target.type}/${target.catalog}/genre=${encodeURIComponent(g)}.json`);
                const metas = (data && data.metas) || [];
                const seeAll = `#/discover/${encodeURIComponent(target.manifest)}/${target.type}/${target.catalog}?genre=${encodeURIComponent(g)}`;
                return metas.length ? row(g, metas.slice(0, 30), seeAll) : null;
            })),
            target.type === "movie" ? collectionRows() : [],
        ]);
        discoverKey = null;
        if (!box.isConnected) return;
        box.textContent = "";
        if (!genres.length) { document.body.classList.remove("mubi-discover-on"); box.remove(); return; }
        rows.filter(Boolean).forEach((r, i) => {
            box.appendChild(r);
            if ((i + 1) % BANNER_EVERY === 0 && banners.length) box.appendChild(banners.shift());
        });
        banners.forEach((b) => box.appendChild(b));
    }

    // ---- Wiring ---------------------------------------------------------------------------------
    function update() {
        const onBoard = /^#\/?$/.test(location.hash) || location.hash === "";
        if (onBoard) renderBoard(); else document.body.classList.remove("mubi-board-on");
        renderDiscover();
    }
    let queued = false;
    // ponytail: one body-wide observer, batched to one update per frame
    new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; update(); });
    }).observe(document.body, { childList: true, subtree: true });
    addEventListener("hashchange", update);
    update();
})();
