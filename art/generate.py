#!/usr/bin/env python3
"""Generates FrankForge sprites with Higgsfield (GPT Image 2.5, transparent background).

Usage: generate.py [name ...]  — with no names, generates everything in prompts.tsv that has no
raw/<name>.png yet. Each row of prompts.tsv is: name <TAB> building|object|decal|icon|tile <TAB> description.
"""
import json, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).parent
RAW = HERE / "raw"
STYLE = ("Industrial chemical-plant equipment for a factory-building game, drawn in a detailed painted "
         "Factorio-like style. Seen from a true 2:1 isometric angle (camera rotated 45 degrees, looking down "
         "about 30 degrees). Weathered steel with rivets and welds, soft light from the top left. The whole "
         "object is visible and centred, with no ground, no cast shadow, no text and no labels.")
ICON = ("Game inventory icon, a single object centred and filling the frame, detailed painted Factorio-like "
        "style with crisp edges, soft top-left lighting, no text, no letters, no labels, no border.")
DECAL = ("A natural terrain feature only: no machines, no pipes, no buildings, no equipment, no people. Low and "
         "flat, lying on the ground, seen from a true 2:1 isometric angle, painted Factorio-like style, soft light from "
         "the top left, nothing around it, no text.")
OBJECT = ("A natural object for a factory-building game set on an alien frontier world, drawn in a detailed painted "
          "Factorio-like style. Seen from a true 2:1 isometric angle, soft light from the top left. The whole object is "
          "visible and centred, standing on nothing: no ground patch, no cast shadow, no text.")
TILE = ("Seamless tileable top-down ground texture for a 2D factory-building game, painted Factorio-like style, "
        "evenly lit with no shadows, no objects, no text, filling the whole square.")


def prompt_for(kind, desc):
    if kind == "icon":
        return f"{desc} {ICON}"
    if kind == "tile":
        return f"{desc} {TILE}"
    if kind == "object":
        return f"Isometric game sprite of {desc} {OBJECT}"
    if kind == "decal":
        return f"Isometric game ground decal of {desc} {DECAL}"
    return f"Isometric game sprite of {desc} {STYLE}"


def gen(row):
    name, kind, desc = row
    args = ["higgsfield", "generate", "create", "gpt_image_2_5", "--prompt", prompt_for(kind, desc),
            "--quality", "xhigh", "--aspect_ratio", "1:1", "--wait", "--json"]
    if kind != "tile":
        args += ["--background", "transparent"]
    out = subprocess.run(args, capture_output=True, text=True)
    try:
        job = json.loads(out.stdout)[0]
        assert job.get("status") == "completed"
        urllib.request.urlretrieve(job["result_url"], RAW / f"{name}.png")
        return f"ok {name}"
    except Exception:
        return f"FAILED {name}: {(out.stderr or out.stdout)[-300:]}"


def main():
    RAW.mkdir(exist_ok=True)
    rows = []
    for line in (HERE / "prompts.tsv").read_text().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        name, kind, desc = line.split("\t")
        wanted = sys.argv[1:]
        if (wanted and name in wanted) or (not wanted and not (RAW / f"{name}.png").exists()):
            rows.append((name, kind, desc))
    with ThreadPoolExecutor(5) as pool:
        for result in pool.map(gen, rows):
            print(result, flush=True)


if __name__ == "__main__":
    main()
