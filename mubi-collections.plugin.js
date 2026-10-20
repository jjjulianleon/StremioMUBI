/**
 * @name MUBI Collections
 * @description Shows catalogs from the MUBI Collections addon as MUBI's collection blocks: duotone still, big title, synopsis, films below.
 * @updateUrl none
 * @version 1.0.0
 * @author jjjulianleon
 */

(function () {
    // Any addon whose manifest catalogs carry a "mubi" object ({title, subtitle, description, colors}) gets the hero.
    const manifests = new Map();

    const style = document.createElement("style");
    style.textContent = `
[class*="board-row"][data-mubi-collection] {
    position: relative !important;
    margin: 0 calc(-1 * var(--mubi-gutter, 1.5rem)) 2.25rem !important;
    padding: 3.5rem var(--mubi-gutter, 1.5rem) 3rem !important;
    overflow: hidden;
    isolation: isolate;
}
[data-mubi-collection] > [class*="header-container"] { display: none !important; }
[data-mubi-collection] [class*="meta-items-container"] > :nth-child(n+4) { display: block !important; }
[data-mubi-collection] [class*="meta-items-container"] > :nth-child(n+7) { display: none !important; }
.mubi-collection-bg { position: absolute; inset: 0; z-index: -1; background: var(--mc-light); }
.mubi-collection-bg img {
    width: 100%; height: 100%; object-fit: cover; object-position: center 30%;
    filter: grayscale(1) contrast(1.2) brightness(1.05); mix-blend-mode: multiply;
}
/* duotone: shadows take the dark colour, highlights the light one */
.mubi-collection-bg::after { content: ""; position: absolute; inset: 0; background: var(--mc-dark); mix-blend-mode: lighten; }
.mubi-collection-hero {
    position: relative; max-width: 44rem; margin-bottom: 2.75rem; color: #fff;
    font-family: Riforma, "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.mubi-collection-hero .mc-label { font-size: 16px; font-weight: 400; letter-spacing: 0.2px; text-transform: uppercase; }
.mubi-collection-hero h2 {
    margin: 2rem 0 0; font-size: 52px; line-height: 1; font-weight: 700; letter-spacing: -0.5px; text-transform: uppercase;
}
.mubi-collection-hero h2 span { display: block; font: inherit; color: var(--mc-light); }
.mubi-collection-hero p { max-width: 30rem; margin: 1.75rem 0 0; font-size: 18px; line-height: 1.45; font-weight: 300; }
`;
    document.head.appendChild(style);

    function manifest(url) {
        if (!manifests.has(url)) {
            manifests.set(url, fetch(url).then((r) => r.json()).catch(() => null));
        }
        return manifests.get(url);
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text) e.textContent = text;
        return e;
    }

    async function decorate(row) {
        if (row.querySelector(":scope > .mubi-collection-hero")) return;
        const seeAll = row.querySelector('a[class*="see-all-container"]');
        // see-all links look like #/discover/<encoded manifest url>/<type>/<catalog id>
        const m = seeAll && /#\/discover\/([^/]+)\/([^/]+)\/([^/?]+)/.exec(seeAll.getAttribute("href"));
        if (!m) return;
        const key = m.slice(1).join("/");
        if (row.dataset.mubiPending === key) return;
        row.dataset.mubiPending = key;
        const man = await manifest(decodeURIComponent(m[1]));
        delete row.dataset.mubiPending;

        const cat = man && (man.catalogs || []).find((c) => c.type === m[2] && c.id === decodeURIComponent(m[3]));
        if (!cat || !cat.mubi) { delete row.dataset.mubiCollection; return; }
        const info = cat.mubi;

        // Stremio may have re-rendered the row and dropped our nodes; start clean
        row.querySelectorAll(":scope > .mubi-collection-bg, :scope > .mubi-collection-hero").forEach((n) => n.remove());
        row.dataset.mubiCollection = cat.id;
        const [dark, light] = info.colors || ["#4b3a55", "#a8dcc8"];
        row.style.setProperty("--mc-dark", dark);
        row.style.setProperty("--mc-light", light);

        const bg = el("div", "mubi-collection-bg");
        const first = row.querySelector('a[class*="meta-item-link"][id^="tt"]');
        if (first) {
            const img = el("img");
            img.src = `https://images.metahub.space/background/medium/${first.id}/img`;
            bg.appendChild(img);
        }
        const hero = el("div", "mubi-collection-hero");
        const title = el("h2", null, info.title);
        if (info.subtitle) title.appendChild(el("span", null, info.subtitle));
        hero.append(el("div", "mc-label", "Collection"), title);
        if (info.description) hero.appendChild(el("p", null, info.description));
        row.prepend(bg, hero);
    }

    const scan = () => document.querySelectorAll('[class*="board-row"]').forEach(decorate);
    // ponytail: one body-wide observer; decorate() bails out early on rows it has already seen
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    scan();
})();
