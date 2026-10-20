"""Builds the MUBI Collections Stremio addon from collections.json into docs/ (served by GitHub Pages).

Usage: python3 build_collections.py
Films can be IMDb ids (tt0118694) or IMDb links; names and posters come from Cinemeta.
"""
import json
import pathlib
import re
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "docs"


def film(ref):
    imdb = re.search(r"tt\d+", ref)
    if not imdb:
        raise SystemExit(f"Not an IMDb id or link: {ref}")
    imdb = imdb.group()
    for attempt in range(3):  # Cinemeta sometimes returns a transient 5xx
        try:
            with urllib.request.urlopen(f"https://v3-cinemeta.strem.io/meta/movie/{imdb}.json", timeout=30) as r:
                meta = json.load(r).get("meta")
            break
        except urllib.error.HTTPError as e:
            if e.code < 500 or attempt == 2:
                raise SystemExit(f"Cinemeta error {e.code} for {imdb}")
            time.sleep(2)
    if not meta:
        raise SystemExit(f"Cinemeta doesn't know {imdb}")
    return {
        "id": imdb,
        "type": "movie",
        "name": meta["name"],
        "poster": f"https://images.metahub.space/poster/medium/{imdb}/img",
        "background": f"https://images.metahub.space/background/medium/{imdb}/img",
        "releaseInfo": meta.get("releaseInfo") or meta.get("year"),
    }


def main():
    collections = json.loads((ROOT / "collections.json").read_text())
    catalogs = []
    for c in collections:
        metas = [film(f) for f in c["films"]]
        path = OUT / "catalog" / "movie" / f"{c['id']}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"metas": metas}, ensure_ascii=False, indent=1))
        # "mubi" is ignored by Stremio; the MUBI Collections plugin reads it to draw the hero
        catalogs.append({
            "type": "movie",
            "id": c["id"],
            "name": f"{c['title']} {c['subtitle']}",
            "mubi": {k: c[k] for k in ("title", "subtitle", "description", "colors")},
        })
        print(f"{c['id']}: {len(metas)} films")
    manifest = {
        "id": "com.jjjulianleon.mubi-collections",
        "version": "1.0.0",
        "name": "MUBI Collections",
        "description": "Hand-picked film collections in the style of MUBI: directors, trilogies and award winners.",
        "resources": ["catalog"],
        "types": ["movie"],
        "idPrefixes": ["tt"],
        "catalogs": catalogs,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
    (OUT / ".nojekyll").touch()  # serve files as-is on GitHub Pages


if __name__ == "__main__":
    main()
