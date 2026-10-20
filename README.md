# StremioMUBI

A theme, three plugins and a collections addon for [Stremio Enhanced](https://github.com/REVENGE977/stremio-enhanced) that restyle every Stremio screen after [MUBI](https://mubi.com): white editorial pages, widescreen film stills, uppercase type and MUBI blue.

Unofficial fan project, not affiliated with MUBI or Stremio.

| File | What it does |
|---|---|
| `mubi.theme.css` | The look: board, search, discover, library, calendar, film page, add-ons, settings, login, menus and player. Also replaces the default cat avatar. |
| `mubi-stills.plugin.js` | Swaps portrait posters for widescreen stills, like MUBI's tiles. |
| `mubi-hover.plugin.js` | MUBI's hover card: hover a film to get a bigger still, a blue WATCH button, the synopsis, director, country, year, runtime and genres. |
| `mubi-collections.plugin.js` | Draws collections from the MUBI Collections addon as MUBI's collection blocks: duotone still, big title, synopsis, films below. |
| `collections.json` | The hand-picked collections (Wong Kar-wai, Iñárritu, David Lynch, Palme d'Or, Three Colours, the Before trilogy). |

## Install

The official Stremio app can't load themes, so this needs **Stremio Enhanced**, a community Stremio client that can. It uses the same account, library and add-ons.

1. Download Stremio Enhanced for your system from its [releases page](https://github.com/REVENGE977/stremio-enhanced/releases) and sign in with your Stremio account.
2. Download `mubi.theme.css` and the three `.plugin.js` files from this repo.
3. In Stremio Enhanced, open **Settings**, scroll down and click **Open Themes Folder**. Put `mubi.theme.css` there.
4. Click **Open Plugins Folder** and put the three `.plugin.js` files there.
5. Restart Stremio Enhanced. In **Settings**, apply the **MUBI** theme and enable the **MUBI Stills**, **MUBI Hover** and **MUBI Collections** plugins.
6. Go to **Addons**, paste `https://jjjulianleon.github.io/StremioMUBI/manifest.json` into **Add addon** and install it. The collections show up at the bottom of the Board; drag the addon higher in the add-ons list to move them up.

## Adding a collection

Edit `collections.json`: give it an `id`, a `title` and `subtitle` (the subtitle is drawn in the light colour), a `description`, two `colors` (dark, light) for the duotone, and the films as IMDb ids or IMDb links. Then rebuild and push:

```bash
python3 build_collections.py
```

Stremio picks up changes the next time it loads the add-on. New collections need the add-on reinstalled, because Stremio caches the list of catalogs.

## Letterboxd

[Stremboxd](https://stremboxd.com/configure) adds your Letterboxd watchlist and lists as Stremio catalogs. The *Username only* mode needs no password and covers public watchlists and lists.

## Changing the profile picture

The avatar is embedded in `mubi.theme.css` under "Profile picture" as a base64 data URL. Replace it with your own image:

```bash
base64 -i your-image.webp | tr -d '\n'
```

Paste the output after `data:image/webp;base64,` (use `image/png` or `image/jpeg` for those formats).

## Notes

- MUBI's font (Riforma) is licensed, so the theme uses Helvetica Neue, which is MUBI's own fallback.
- Stremio updates can rename parts of its interface. If something stops matching, open an issue with a screenshot.
