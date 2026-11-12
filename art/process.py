#!/usr/bin/env python3
"""Turns raw/ art into game assets in frontend/public/assets/process/.

Buildings are trimmed to their opaque pixels and scaled so their width matches the footprint's
isometric diamond at 128 px per tile; the game anchors each image's bottom centre on the
footprint's bottom corner. Icons become 64 px squares, tiles 256 px squares.
Run with a Python that has Pillow.
"""
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).parent
OUT = HERE.parent / "frontend" / "public" / "assets" / "process"
TILE_PX = 128

# Footprint sizes, matching rust/src/world/protos.rs.
SIZES = {
    "valve": 1, "check_valve": 1, "pump": 1, "compressor": 2, "storage_tank": 3, "gas_sphere": 3,
    "water_well": 2, "gas_well": 2, "air_intake": 2, "vent": 1, "flare_stack": 1, "fired_boiler": 3,
    "steam_turbine": 3, "condenser": 3, "solar_array": 2, "battery_bank": 2, "heat_exchanger": 2,
    "electric_heater": 2, "flash_drum": 2, "smr_reformer": 4, "shift_reactor": 2, "ammonia_converter": 3,
    "methanol_reactor": 2, "cracker_furnace": 3, "electrolyser": 3, "power_pole": 1, "wreck": 2,
}


def trimmed(path):
    im = Image.open(path).convert("RGBA")
    # Drop faint haze so the trim box hugs the object.
    alpha = im.split()[-1].point(lambda a: 255 if a > 24 else 0)
    return im.crop(alpha.getbbox())


def main():
    (OUT / "buildings").mkdir(parents=True, exist_ok=True)
    (OUT / "icons").mkdir(exist_ok=True)
    (OUT / "tiles").mkdir(exist_ok=True)
    manifest = {}
    for path in sorted((HERE / "raw").glob("*.png")):
        name = path.stem
        if name.startswith("icon_"):
            im = trimmed(path)
            side = max(im.size)
            sq = Image.new("RGBA", (side, side))
            sq.alpha_composite(im, ((side - im.width) // 2, (side - im.height) // 2))
            sq.resize((64, 64), Image.LANCZOS).save(OUT / "icons" / f"{name[5:]}.png", optimize=True)
        elif name.startswith("tile_"):
            Image.open(path).convert("RGB").resize((256, 256), Image.LANCZOS).save(OUT / "tiles" / f"{name[5:]}.png", optimize=True)
        elif name in SIZES:
            im = trimmed(path)
            width = SIZES[name] * TILE_PX
            height = round(im.height * width / im.width)
            im = im.resize((width, height), Image.LANCZOS)
            im.save(OUT / "buildings" / f"{name}.png", optimize=True)
            # Buttons in the build bar.
            thumb = im.copy()
            thumb.thumbnail((56, 56), Image.LANCZOS)
            sq = Image.new("RGBA", (56, 56))
            sq.alpha_composite(thumb, ((56 - thumb.width) // 2, (56 - thumb.height) // 2))
            sq.save(OUT / "icons" / f"b_{name}.png", optimize=True)
            manifest[name] = {"w": width, "h": height}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1))
    print(f"{len(manifest)} buildings")
    build_terrain_atlas()
    build_deposit_atlas()


def atlas(images, path, cols):
    """Packs named images into a grid and writes a Phaser JSON-hash atlas beside it."""
    cw = max(im.width for im in images.values()) + 2
    ch = max(im.height for im in images.values()) + 2
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cw, rows * ch))
    frames = {}
    for k, (name, im) in enumerate(images.items()):
        x, y = (k % cols) * cw + 1, (k // cols) * ch + 1
        sheet.alpha_composite(im, (x, y))
        frames[name] = {
            "frame": {"x": x, "y": y, "w": im.width, "h": im.height}, "rotated": False, "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": im.width, "h": im.height}, "sourceSize": {"w": im.width, "h": im.height},
        }
    sheet.save(path.with_suffix(".png"), optimize=True)
    meta = {"image": path.with_suffix(".png").name, "size": {"w": sheet.width, "h": sheet.height}, "scale": "1"}
    path.with_suffix(".json").write_text(json.dumps({"frames": frames, "meta": meta}))


def build_terrain_atlas():
    """Four ground variants per terrain: quarters of the texture, turned into 2:1 diamonds
    (130×66, a pixel of overlap on each side so neighbours meet without seams)."""
    images = {}
    for path in sorted((HERE / "raw").glob("terrain_*.png")):
        src = Image.open(path).convert("RGBA")
        half = src.width // 2
        for v in range(4):
            q = src.crop(((v % 2) * half, (v // 2) * half, (v % 2 + 1) * half, (v // 2 + 1) * half)).resize((256, 256), Image.LANCZOS)
            d = q.rotate(45, resample=Image.BICUBIC, expand=True).resize((130, 66), Image.LANCZOS)
            images[f"{path.stem[8:]}_{v}"] = d
    if images:
        atlas(images, OUT / "terrain", 8)
        print(f"terrain atlas: {len(images)} frames")


def build_deposit_atlas():
    """Resource decals, under two thirds of a tile wide."""
    images = {}
    for path in sorted((HERE / "raw").glob("deposit_*.png")):
        im = trimmed(path)
        w = 80
        images[path.stem[8:]] = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    if images:
        atlas(images, OUT / "deposits", 5)
        print(f"deposit atlas: {len(images)} frames")


if __name__ == "__main__":
    main()
