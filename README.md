# StremioMUBI

A theme and plugin for [Stremio Enhanced](https://github.com/REVENGE977/stremio-enhanced) that restyle every Stremio screen after [MUBI](https://mubi.com): white editorial pages, widescreen film stills, uppercase type and MUBI blue.

Unofficial fan project, not affiliated with MUBI or Stremio.

| File | What it does |
|---|---|
| `mubi.theme.css` | The look: board, search, discover, library, calendar, film page, add-ons, settings, login, menus and player. Also replaces the default cat avatar. |
| `mubi-stills.plugin.js` | Swaps portrait posters for widescreen stills, like MUBI's tiles. |

## Install

The official Stremio app can't load themes, so this needs **Stremio Enhanced**, a community Stremio client that can. It uses the same account, library and add-ons.

1. Download Stremio Enhanced for your system from its [releases page](https://github.com/REVENGE977/stremio-enhanced/releases) and sign in with your Stremio account.
2. Download `mubi.theme.css` and `mubi-stills.plugin.js` from this repo.
3. In Stremio Enhanced, open **Settings**, scroll down and click **Open Themes Folder**. Put `mubi.theme.css` there.
4. Click **Open Plugins Folder** and put `mubi-stills.plugin.js` there.
5. Restart Stremio Enhanced. In **Settings**, apply the **MUBI** theme and enable the **MUBI Stills** plugin.

## Changing the profile picture

The avatar is embedded in `mubi.theme.css` under "Profile picture" as a base64 data URL. Replace it with your own image:

```bash
base64 -i your-image.webp | tr -d '\n'
```

Paste the output after `data:image/webp;base64,` (use `image/png` or `image/jpeg` for those formats).

## Notes

- MUBI's font (Riforma) is licensed, so the theme uses Helvetica Neue, which is MUBI's own fallback.
- Stremio updates can rename parts of its interface. If something stops matching, open an issue with a screenshot.
