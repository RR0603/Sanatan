#!/usr/bin/env python3
"""Brings the Western sky in line with Stellarium's "modern" sky culture.

Inputs (download into a scratch directory):
  index.json      https://raw.githubusercontent.com/Stellarium/stellarium/master/skycultures/modern/index.json
                  (GPL-2.0-or-later data; figures and names are facts about the sky)
  hyg_v38.csv.gz  https://github.com/astronexus/HYG-Database  (CC BY-SA 4.0), any version with HIP numbers

What it changes:
  js/data/constellations.js  stick figures rebuilt from Stellarium's HIP star chains, and each name placed
                             where Stellarium puts it: the mean direction of the figure's stars.
                             Latin / English / Hindi names and ranks are kept from the existing file.
  js/data/stars.js           star names: Stellarium's first common name for every catalogued star it names.

Usage: python3 tools/build_stellarium.py <index.json> <hyg.csv[.gz]>
"""
import csv
import gzip
import json
import math
import os
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_js(path, prefix):
    src = open(path, encoding="utf8").read()
    head, body = src.split(prefix, 1)
    return head, json.loads(body.strip().rstrip(";"))


def write_js(path, head, prefix, data):
    with open(path, "w", encoding="utf8") as f:
        f.write(head + prefix)
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
        f.write(";\n")


def wrap(ra):
    """The app stores right ascension in -180..180 for the western half of the sky."""
    return round(ra - 360 if ra > 180 else ra, 3)


def mean_direction(points):
    x = y = z = 0.0
    for ra, dec in points:
        r, d = math.radians(ra), math.radians(dec)
        x += math.cos(d) * math.cos(r)
        y += math.cos(d) * math.sin(r)
        z += math.sin(d)
    return [wrap(math.degrees(math.atan2(y, x)) % 360), round(math.degrees(math.atan2(z, math.hypot(x, y))), 3)]


def main(index_path, hyg_path):
    index = json.load(open(index_path, encoding="utf8"))
    opener = gzip.open if hyg_path.endswith(".gz") else open
    hip = {}
    with opener(hyg_path, "rt") as f:
        for r in csv.DictReader(f):
            if r["hip"]:
                hip[int(r["hip"])] = (float(r["ra"]) * 15.0, float(r["dec"]))

    # ---- constellations ----
    cpath = os.path.join(ROOT, "js", "data", "constellations.js")
    chead, old = load_js(cpath, "LS_DATA.constellations = ")
    meta = {}
    for c in old:
        meta.setdefault(c["id"], {k: c[k] for k in ("la", "en", "hi", "rank") if k in c})
    figs = []
    for c in index["constellations"]:
        cid = c["id"].split()[-1]
        polylines, stars = [], []
        for chain in c["lines"]:
            pts = [hip[h] for h in chain]
            polylines.append([[wrap(ra), round(dec, 3)] for ra, dec in pts])
            stars += pts
        m = dict(meta.get(cid, {}))
        m["la"] = c["common_name"]["native"]
        m.setdefault("en", c["common_name"].get("english", m["la"]))
        figs.append({"id": cid, "l": polylines, **m, "pos": mean_direction(stars)})
    chead = chead.replace("from d3-celestial (BSD-3-Clause)", "from Stellarium's modern sky culture (tools/build_stellarium.py)")
    write_js(cpath, chead, "LS_DATA.constellations = ", figs)
    print(f"constellations: {len(figs)} figures from Stellarium -> {cpath}")

    # ---- star names ----
    spath = os.path.join(ROOT, "js", "data", "stars.js")
    shead, stars = load_js(spath, "LS_DATA.stars = ")
    d = stars["d"]
    grid = defaultdict(list)
    for i in range(stars["n"]):
        grid[(int(d[4 * i] // 1), int(d[4 * i + 1] // 1))].append(i)

    def find(ra, dec):
        best, bd = None, 0.02
        for a in (-1, 0, 1):
            for b in (-1, 0, 1):
                for i in grid.get((int(ra // 1) + a, int(dec // 1) + b), []):
                    dd = math.hypot((d[4 * i] - ra) * math.cos(math.radians(dec)), d[4 * i + 1] - dec)
                    if dd < bd:
                        best, bd = i, dd
        return best

    names, added, renamed = dict(stars["names"]), 0, 0
    for key, entries in index["common_names"].items():
        if not key.startswith("HIP ") or int(key[4:]) not in hip:
            continue
        i = find(*hip[int(key[4:])])
        if i is None:
            continue  # fainter than the app's catalogue
        name = entries[0]["english"]
        prev = names.get(str(i))
        if prev != name:
            added += prev is None
            renamed += prev is not None
            names[str(i)] = name
    stars["names"] = dict(sorted(names.items(), key=lambda kv: int(kv[0])))
    write_js(spath, shead, "LS_DATA.stars = ", stars)
    print(f"star names: {len(names)} ({added} added, {renamed} renamed to Stellarium's name) -> {spath}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
