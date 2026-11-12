#!/usr/bin/env python3
"""Animated sprite sheets for FrankForge, made with Higgsfield.

Each building sprite (raw/<name>.png) is composited onto a flat magenta screen and animated with
Seedance 2.5 image-to-video; loops pass the same image as first and last frame so the cycle closes.
Effects (fx_*) first get a still from GPT Image 2.5. The videos are then cut into frames, keyed
locally (linear unmixing against the magenta, so steam and smoke keep soft alpha), cropped so the
machine lines up exactly with its static sprite, and packed into sheets.

Usage: animate.py gen [name ...]     generate missing videos (or the named ones again)
       animate.py sheets [name ...]  build sheets + frontend/public/assets/process/anim/anims.json
Needs Pillow and numpy.
"""
import json, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).parent
RAW, ANIM = HERE / "raw", HERE / "anim"
SRC, VID, FRAMES = ANIM / "src", ANIM / "vid", ANIM / "frames"
OUT = HERE.parent / "frontend/public/assets/process/anim"
STATIC = HERE.parent / "frontend/public/assets/process/buildings"
S = 1024
KEY = (255, 0, 255)

FX_STILL = {
    "fx_explosion": "A compact bright orange-white fireball just starting to burst, with a few flying sparks",
    "fx_fire": "A small patch of orange flames burning on the ground",
    "fx_leak": "A short jet of white pressurised gas spraying to the right, starting at the left edge of the subject",
    "fx_sparks": "A small burst of blue-white electric sparks around a crackling arc",
    "fx_build": "A small puff of grey construction dust with a few bright welding sparks, low on the ground",
    "fx_spill": "A small flat puddle of spilled dark liquid on the ground with a splash rising from it",
    "fx_toxic": "A low drifting cloud of sickly yellow-green toxic gas",
    # Variants, so repeated events don't look identical.
    "fx_explosion2": "A compact white-hot flash with a ring of orange fire and flying metal debris just starting to burst",
    "fx_fire2": "A small cluster of tall yellow-orange flames with dark smoke, burning on the ground",
    "fx_sparks2": "A tight cluster of bright white-yellow electric sparks spraying from a short arc",
}
# Characters are posed from one reference so every direction is the same person.
CHAR_REF = {"char": ANIM / "char/engineer.png", "alien": ANIM / "char/alien.png"}
CHAR_STILL = {
    "char_walk_se": "facing towards the lower right of the image (towards the viewer and to the right), mid-stride",
    "char_walk_ne": "seen from behind, facing away towards the upper right of the image, mid-stride",
    "char_idle_se": "facing towards the lower right of the image (towards the viewer and to the right), standing relaxed",
    "char_idle_ne": "seen from behind, facing away towards the upper right of the image, standing relaxed",
    "char_build_se": "facing towards the lower right of the image, crouching slightly and holding a large wrench, working",
    "char_build_ne": "seen from behind, facing away towards the upper right of the image, holding a large wrench, working",
    "alien_attack_se": "facing towards the lower right of the image, rearing up with front claws raised to strike",
    "alien_attack_ne": "seen from behind, facing away towards the upper right of the image, rearing up with front claws raised",
    "alien_walk_se": "facing and crawling towards the lower right of the image, legs mid-step",
    "alien_walk_ne": "seen from behind, facing away and crawling towards the upper right of the image, legs mid-step",
}
CHAR_STYLE = ("The same character as in the reference image, same outfit and colours, full body, {pose}. Seen from "
              "above at a 2:1 isometric game angle. Detailed painted Factorio-like style, soft top-left light. Small in "
              "the frame: the body takes up the middle half of the image height, with a wide empty margin all around. "
              "The background is a perfectly flat uniform pure magenta (#FF00FF) colour, no ground, no shadow, no text.")
# Standing height of a character in sprite pixels (128 per tile).
CHAR_HEIGHT = {"char": 120, "alien": 70}
FX_STYLE = ("Isometric game visual effect, detailed painted Factorio-like style, centred in the lower half of the "
            "frame with lots of empty space around it. The background is a perfectly flat uniform pure magenta "
            "(#FF00FF) colour with no gradient, no ground and no shadow. No text.")
# Cell widths for effects, in sprite pixels (128 per tile).
FX_WIDTH = {"fx_explosion": 448, "fx_fire": 128, "fx_leak": 192, "fx_sparks": 128, "fx_build": 256, "fx_spill": 192,
            "fx_toxic": 320, "fx_explosion2": 448, "fx_fire2": 128, "fx_sparks2": 128}
NEGATIVE = ("Camera locked: no camera movement, no zoom, no pan. The machine itself never moves, deforms or "
            "changes; only the described motion happens. The background stays a perfectly flat uniform magenta "
            "screen the whole time. Nothing else appears.")
CHAR_NEGATIVE = ("Camera locked: no camera movement, no zoom, no pan. The character stays on the same spot and keeps "
                 "facing exactly the same direction the whole time, never turning. The background stays a perfectly "
                 "flat uniform magenta screen. Nothing else appears.")


def rows():
    for line in (HERE / "anims.tsv").read_text().splitlines():
        if line.strip() and not line.startswith("#"):
            name, plume, mode, motion = line.split("\t")
            yield name, plume == "1", mode, motion


def run_json(args):
    out = subprocess.run(args, capture_output=True, text=True)
    job = json.JSONDecoder().raw_decode(out.stdout.strip())[0][0] if out.stdout.strip() else {}
    if job.get("status") != "completed":
        raise RuntimeError((out.stderr or out.stdout)[-300:])
    return job["result_url"]


def prepare(name, plume):
    """The first frame: the sprite on magenta, with headroom for plumes."""
    if name.startswith(("char_", "alien_")):
        walk = SRC / f"{name.replace('idle', 'walk')}.png"
        if "idle" in name and walk.exists():
            # Idle from the walking pose, so standing and walking face exactly the same way.
            Image.open(walk).save(SRC / f"{name}.png")
        if not (SRC / f"{name}.png").exists():
            url = run_json(["higgsfield", "generate", "create", "gpt_image_2_5", "--image", str(CHAR_REF[name.split("_")[0]]), "--prompt",
                            CHAR_STYLE.format(pose=CHAR_STILL[name]), "--quality", "xhigh", "--aspect_ratio", "1:1",
                            "--wait", "--json"])
            urllib.request.urlretrieve(url, SRC / f"{name}.png")
            Image.open(SRC / f"{name}.png").convert("RGB").resize((S, S), Image.LANCZOS).save(SRC / f"{name}.png")
        return
    if name.startswith("fx_"):
        still = SRC / f"{name}_still.png"
        if not still.exists():
            url = run_json(["higgsfield", "generate", "create", "gpt_image_2_5", "--prompt",
                            f"{FX_STILL[name]}. {FX_STYLE}", "--quality", "xhigh", "--aspect_ratio", "1:1",
                            "--wait", "--json"])
            urllib.request.urlretrieve(url, still)
        # Shrunk into the middle of the screen so the effect has room to grow without hitting the edges.
        im = Image.open(still).convert("RGB").resize((S // 2, S // 2), Image.LANCZOS)
        bg = Image.new("RGB", (S, S), KEY)
        bg.paste(im, (S // 4, S // 3))
        bg.save(SRC / f"{name}.png")
        return
    im = Image.open(RAW / f"{name}.png").convert("RGBA")
    im = im.crop(im.getbbox())
    w, h = im.size
    k = min((0.78 * S) / w, (0.52 if plume else 0.8) * S / h)
    im = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
    x0, y0 = (S - im.width) // 2, round(0.93 * S) - im.height
    bg = Image.new("RGBA", (S, S), KEY + (255,))
    bg.alpha_composite(im, (x0, y0))
    bg.convert("RGB").save(SRC / f"{name}.png")


def gen(row):
    name, plume, mode, motion = row
    try:
        prepare(name, plume)
        img = str(SRC / f"{name}.png")
        args = ["higgsfield", "generate", "create", "seedance_2_5", "--mode", "omni_reference", "--start-image", img,
                "--duration", "4", "--resolution", "720p", "--aspect_ratio", "1:1",
                "--prompt", f"{motion} {CHAR_NEGATIVE if name.startswith(('char_', 'alien_')) else NEGATIVE}", "--wait", "--wait-timeout", "25m", "--json"]
        if mode == "loop":
            args[6:6] = ["--end-image", img]
        urllib.request.urlretrieve(run_json(args), VID / f"{name}.mp4")
        return f"ok {name}"
    except Exception as e:
        return f"FAILED {name}: {e}"


# --- keying and sheets ---------------------------------------------------------------------------

def alpha_of(px, key):
    """Opacity by linear unmixing: the subject has no magenta cast, the screen is all magenta."""
    mag = lambda c: np.minimum(c[..., 0], c[..., 2]) - c[..., 1]
    m = mag(px)
    mk = max(float(mag(key)), 1.0)
    a = 1.0 - (m - 25.0) / (mk - 25.0 - 20.0)
    return np.clip(a, 0.0, 1.0)


def screen_colour(px):
    border = np.concatenate([px[:6].reshape(-1, 3), px[-6:].reshape(-1, 3), px[:, :6].reshape(-1, 3),
                             px[:, -6:].reshape(-1, 3)])
    return np.median(border, axis=0)


# Effects whose own colour sits next to magenta, where the video model leaves pink fringes.
STRONG_DESPILL = {"fx_toxic", "fx_spill"}


def key_frame(px, key, edge, strong=False):
    a = alpha_of(px, key)
    a[a < 0.05] = 0.0
    safe = np.maximum(a, 1e-3)[..., None]
    rgb = np.clip((px - (1.0 - a[..., None]) * key) / safe, 0, 255)
    # Despill: the video model tints smoke and steam with the screen, so pull any magenta cast back to grey.
    spill = np.maximum((np.maximum if strong else np.minimum)(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0)
    rgb[..., 0] -= spill
    rgb[..., 2] -= spill
    return np.dstack([rgb, a * edge * 255]).astype(np.uint8)


def sheet(name, plume, mode):
    vid = VID / f"{name}.mp4"
    if not vid.exists():
        return None
    fdir = FRAMES / name
    fdir.mkdir(parents=True, exist_ok=True)
    for f in fdir.glob("*.png"):
        f.unlink()
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(vid), "-fps_mode", "passthrough", str(fdir / "%04d.png")], check=True)
    files = sorted(fdir.glob("*.png"))
    count = 24
    idx = np.unique(np.round(np.linspace(0, len(files) - 1, count + (1 if mode == "loop" else 0))).astype(int))
    if mode == "loop":
        idx = idx[:-1]  # the last frame repeats the first
    raw = [np.asarray(Image.open(files[i]).convert("RGB"), dtype=np.float32) for i in idx]
    # The screen colour comes from the first frame: later ones may be full of smoke to the edges.
    key = screen_colour(raw[0])
    vw = raw[0].shape[1]
    # Fade out near the video's edges so anything the frame clipped doesn't end in a hard line.
    ramp = np.clip(np.minimum(np.arange(vw), np.arange(vw)[::-1]) / 140.0, 0, 1)
    edge = np.minimum.outer(ramp, ramp)
    frames = [key_frame(px, key, edge, name in STRONG_DESPILL) for px in raw]
    if mode == "once":
        # One-shots end by dissolving, whatever the video did in its last second.
        n = len(frames)
        for i, fr in enumerate(frames):
            fade = np.clip((n - 1 - i) / (0.3 * n), 0, 1)
            fr[..., 3] = (fr[..., 3] * fade).astype(np.uint8)
    # Where the subject sits, measured on the first frame (the video model may reframe a little).
    ys, xs = np.nonzero(frames[0][..., 3] > 128)
    bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    cx = (bx0 + bx1) / 2
    # Keep what moves within reach of the machine: a window around it, tall if it has a plume.
    half = (bx1 - bx0) * (1.3 if plume else 0.62)
    win = (int(max(0, cx - half)), 0 if plume else int(max(0, by0 - 0.12 * (by1 - by0))),
           int(min(vw, cx + half)), int(min(vw, by1 + 4)))
    if name.startswith(("fx_", "char_", "alien_")):
        win = (0, 0, vw, vw)  # effects grow well past their first frame
    union = None
    for fr in frames:
        a = fr[win[1]:win[3], win[0]:win[2], 3]
        ys, xs = np.nonzero(a > 48)
        if len(xs):
            b = (xs.min() + win[0], ys.min() + win[1], xs.max() + 1 + win[0], ys.max() + 1 + win[1])
            union = b if union is None else (min(union[0], b[0]), min(union[1], b[1]), max(union[2], b[2]), max(union[3], b[3]))
    # Symmetric about the machine's centre so the anchor is easy to place, and down to its base.
    hw = max(cx - union[0], union[2] - cx)
    crop = (int(cx - hw), int(union[1]), int(cx + hw), int(max(union[3], by1)))
    if name.startswith("fx_"):
        scale = FX_WIDTH[name] / (crop[2] - crop[0])
    elif name.startswith(("char_", "alien_")):
        scale = CHAR_HEIGHT[name.split("_")[0]] / (by1 - by0)
    else:
        scale = Image.open(STATIC / f"{name}.png").width / (bx1 - bx0)
    cw, ch = round((crop[2] - crop[0]) * scale), round((crop[3] - crop[1]) * scale)
    cells = [Image.fromarray(fr).crop(crop).resize((cw, ch), Image.LANCZOS) for fr in frames]
    cols = int(np.ceil(np.sqrt(len(cells))))
    rows_ = int(np.ceil(len(cells) / cols))
    out = Image.new("RGBA", (cols * cw, rows_ * ch), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        out.paste(c, ((i % cols) * cw, (i // cols) * ch))
    OUT.mkdir(parents=True, exist_ok=True)
    out.save(OUT / f"{name}.webp", quality=88, method=6)
    return {
        "frames": len(cells), "w": cw, "h": ch, "fps": 12 if mode == "once" else 8, "loop": mode == "loop",
        # Where the static sprite's bottom-centre anchor falls in a cell, as a fraction.
        "ox": round((cx - crop[0]) / (crop[2] - crop[0]), 4), "oy": round((by1 - crop[1]) / (crop[3] - crop[1]), 4),
    }


def main():
    cmd, wanted = sys.argv[1], sys.argv[2:]
    for d in (SRC, VID, FRAMES):
        d.mkdir(parents=True, exist_ok=True)
    if wanted:
        todo = [r for r in rows() if r[0] in wanted]
    else:
        todo = [r for r in rows() if cmd == "sheets" or not (VID / f"{r[0]}.mp4").exists()]
    if cmd == "gen":
        with ThreadPoolExecutor(6) as ex:
            for line in ex.map(gen, todo):
                print(line, flush=True)
    else:
        manifest_path = OUT / "anims.json"
        manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
        for name, plume, mode, _ in todo:
            meta = sheet(name, plume, mode)
            if meta:
                manifest[name] = meta
                print(name, meta, flush=True)
        manifest_path.write_text(json.dumps(manifest, indent=1, sort_keys=True))


if __name__ == "__main__":
    main()
