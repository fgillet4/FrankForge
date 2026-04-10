#!/usr/bin/env python3
"""
FrankForge Asset Server
-----------------------
• Upload / manage PNG/SVG/WAV/MP3 game assets
• Built-in browser pixel-art drawing app (isometric tile editor)
• REST API for the game to fetch asset manifests

Usage:
    pip install flask pillow
    python server.py                   # starts on http://localhost:5050
"""

import os
import io
import json
import hashlib
import shutil
from pathlib import Path
from datetime import datetime

from flask import (
    Flask, request, jsonify, send_from_directory,
    send_file, abort, render_template_string,
)
from PIL import Image

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR   = Path(__file__).parent
ASSET_DIR  = BASE_DIR / "assets"
UPLOAD_DIR = ASSET_DIR / "uploads"
SPRITE_DIR = ASSET_DIR / "sprites"
AUDIO_DIR  = ASSET_DIR / "audio"
TILE_DIR   = ASSET_DIR / "tiles"

DATA_DIR   = BASE_DIR / "data"

for d in [UPLOAD_DIR, SPRITE_DIR, AUDIO_DIR, TILE_DIR, DATA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

NPC_FILE   = DATA_DIR / "npcs.json"
QUEST_FILE = DATA_DIR / "quests.json"

def _load_json(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {}

def _save_json(path: Path, data: dict):
    path.write_text(json.dumps(data, indent=2))

ALLOWED_IMAGE = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}
ALLOWED_AUDIO = {".wav", ".mp3", ".ogg"}
ALLOWED_ALL   = ALLOWED_IMAGE | ALLOWED_AUDIO

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def asset_meta(path: Path) -> dict:
    stat = path.stat()
    return {
        "name":     path.name,
        "path":     "/" + path.relative_to(BASE_DIR).as_posix(),
        "size":     stat.st_size,
        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "type":     path.suffix.lstrip("."),
    }


def category_dir(filename: str) -> Path:
    suffix = Path(filename).suffix.lower()
    if suffix in ALLOWED_AUDIO:
        return AUDIO_DIR
    return SPRITE_DIR


# ---------------------------------------------------------------------------
# REST API
# ---------------------------------------------------------------------------

@app.route("/api/assets", methods=["GET"])
def list_assets():
    """Return a manifest of all assets grouped by category."""
    result = {}
    for folder in [SPRITE_DIR, AUDIO_DIR, TILE_DIR, UPLOAD_DIR]:
        category = folder.name
        result[category] = []
        for f in sorted(folder.rglob("*")):
            if f.is_file() and f.suffix.lower() in ALLOWED_ALL:
                result[category].append(asset_meta(f))
    return jsonify(result)


@app.route("/api/assets/<category>", methods=["GET"])
def list_category(category):
    folder = ASSET_DIR / category
    if not folder.exists():
        return jsonify([])
    files = [
        asset_meta(f) for f in sorted(folder.rglob("*"))
        if f.is_file() and f.suffix.lower() in ALLOWED_ALL
    ]
    return jsonify(files)


@app.route("/api/upload", methods=["POST"])
def upload():
    """Upload one or more files. Accepts multipart/form-data."""
    if "files" not in request.files:
        return jsonify({"error": "No files field"}), 400

    saved = []
    for file in request.files.getlist("files"):
        if not file.filename:
            continue
        suffix = Path(file.filename).suffix.lower()
        if suffix not in ALLOWED_ALL:
            continue
        dest_dir = category_dir(file.filename)
        dest = dest_dir / file.filename
        # Avoid collisions
        if dest.exists():
            stem = dest.stem
            dest = dest_dir / f"{stem}_{int(datetime.now().timestamp())}{suffix}"
        file.save(dest)
        saved.append(asset_meta(dest))

    return jsonify({"saved": saved})


@app.route("/api/delete", methods=["DELETE"])
def delete_asset():
    """Delete an asset by relative path."""
    data = request.get_json(force=True) or {}
    rel  = data.get("path", "").lstrip("/")
    path = BASE_DIR / rel
    # Safety: must be inside ASSET_DIR
    try:
        path.resolve().relative_to(ASSET_DIR.resolve())
    except ValueError:
        return jsonify({"error": "Forbidden"}), 403
    if not path.exists():
        return jsonify({"error": "Not found"}), 404
    path.unlink()
    return jsonify({"deleted": rel})


@app.route("/api/save_tile", methods=["POST"])
def save_tile():
    """
    Save a pixel-art tile drawn in the browser.
    Body: { "name": "grass.png", "dataURL": "data:image/png;base64,..." }
    """
    data = request.get_json(force=True) or {}
    name    = data.get("name", "tile.png")
    dataURL = data.get("dataURL", "")

    if not dataURL.startswith("data:image/png;base64,"):
        return jsonify({"error": "Only PNG dataURLs accepted"}), 400

    import base64
    b64 = dataURL.split(",", 1)[1]
    img_bytes = base64.b64decode(b64)
    img = Image.open(io.BytesIO(img_bytes))

    dest = TILE_DIR / name
    img.save(dest, "PNG")
    return jsonify({"saved": asset_meta(dest)})


@app.route("/api/resize", methods=["POST"])
def resize_asset():
    """Resize an image asset. Body: { "path": "...", "width": 64, "height": 32 }"""
    data   = request.get_json(force=True) or {}
    rel    = data.get("path", "").lstrip("/")
    width  = int(data.get("width",  64))
    height = int(data.get("height", 32))
    path   = BASE_DIR / rel
    try:
        path.resolve().relative_to(ASSET_DIR.resolve())
    except ValueError:
        return jsonify({"error": "Forbidden"}), 403
    if path.suffix.lower() not in ALLOWED_IMAGE - {".svg"}:
        return jsonify({"error": "Not resizable"}), 400
    img = Image.open(path).resize((width, height), Image.NEAREST)
    img.save(path)
    return jsonify({"resized": str(rel), "width": width, "height": height})


# Serve actual asset files
@app.route("/assets/<path:filename>")
def serve_asset(filename):
    return send_from_directory(ASSET_DIR, filename)


# ---------------------------------------------------------------------------
# NPC API
# ---------------------------------------------------------------------------

@app.route("/api/npcs", methods=["GET"])
def list_npcs():
    return jsonify(list(_load_json(NPC_FILE).values()))

@app.route("/api/npcs/<npc_id>", methods=["GET"])
def get_npc(npc_id):
    npcs = _load_json(NPC_FILE)
    return jsonify(npcs.get(npc_id)) or (jsonify({"error": "Not found"}), 404)

@app.route("/api/npcs", methods=["POST"])
def save_npc():
    npc = request.get_json(force=True) or {}
    if not npc.get("id"):
        return jsonify({"error": "id required"}), 400
    npcs = _load_json(NPC_FILE)
    npcs[npc["id"]] = npc
    _save_json(NPC_FILE, npcs)
    return jsonify(npc)

@app.route("/api/npcs/<npc_id>", methods=["DELETE"])
def delete_npc(npc_id):
    npcs = _load_json(NPC_FILE)
    npcs.pop(npc_id, None)
    _save_json(NPC_FILE, npcs)
    return jsonify({"deleted": npc_id})


# ---------------------------------------------------------------------------
# Quest API
# ---------------------------------------------------------------------------

@app.route("/api/quests", methods=["GET"])
def list_quests():
    return jsonify(list(_load_json(QUEST_FILE).values()))

@app.route("/api/quests/<quest_id>", methods=["GET"])
def get_quest(quest_id):
    quests = _load_json(QUEST_FILE)
    return jsonify(quests.get(quest_id)) or (jsonify({"error": "Not found"}), 404)

@app.route("/api/quests", methods=["POST"])
def save_quest():
    quest = request.get_json(force=True) or {}
    if not quest.get("id"):
        return jsonify({"error": "id required"}), 400
    quests = _load_json(QUEST_FILE)
    quests[quest["id"]] = quest
    _save_json(QUEST_FILE, quests)
    return jsonify(quest)

@app.route("/api/quests/<quest_id>", methods=["DELETE"])
def delete_quest(quest_id):
    quests = _load_json(QUEST_FILE)
    quests.pop(quest_id, None)
    _save_json(QUEST_FILE, quests)
    return jsonify({"deleted": quest_id})


# ---------------------------------------------------------------------------
# Animations API
# ---------------------------------------------------------------------------

ANIM_FILE = DATA_DIR / "animations.json"

@app.route("/api/animations", methods=["GET"])
def list_animations():
    return jsonify(_load_json(ANIM_FILE))

@app.route("/api/animations", methods=["POST"])
def save_animations():
    data = request.get_json(force=True) or {}
    _save_json(ANIM_FILE, data)
    return jsonify(data)


# ---------------------------------------------------------------------------
# Shaders API
# ---------------------------------------------------------------------------

SHADER_DIR = ASSET_DIR / "shaders"
SHADER_DIR.mkdir(exist_ok=True)

@app.route("/api/shaders", methods=["GET"])
def list_shaders():
    files = [{"name": f.name, "path": "/assets/shaders/" + f.name}
             for f in sorted(SHADER_DIR.glob("*.glsl"))]
    return jsonify(files)

@app.route("/api/shaders/<name>", methods=["GET"])
def get_shader(name):
    path = SHADER_DIR / name
    if not path.exists():
        return jsonify({"error": "Not found"}), 404
    return path.read_text(), 200, {"Content-Type": "text/plain"}

@app.route("/api/shaders/<name>", methods=["POST"])
def save_shader(name):
    if not name.endswith(".glsl"):
        name += ".glsl"
    code = request.get_data(as_text=True)
    (SHADER_DIR / name).write_text(code)
    return jsonify({"saved": name})

@app.route("/api/shaders/<name>", methods=["DELETE"])
def delete_shader(name):
    path = SHADER_DIR / name
    if path.exists():
        path.unlink()
    return jsonify({"deleted": name})


# ---------------------------------------------------------------------------
# Drawing App (served from /)
# ---------------------------------------------------------------------------

DRAW_APP_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>FrankForge Asset Studio</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:monospace;background:#1a1a2e;color:#ccc;display:flex;flex-direction:column;height:100vh;overflow:hidden}
    header{background:#16213e;padding:10px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #0f3460;flex-shrink:0}
    header h1{font-size:1.1rem;color:#3498db}
    nav a{color:#aaa;text-decoration:none;padding:6px 10px;border-radius:4px;font-size:.85rem}
    nav a.active,nav a:hover{background:#0f3460;color:#fff}
    main{display:flex;flex:1;overflow:hidden}
    /* ---- Sidebar ---- */
    aside{width:220px;background:#16213e;border-right:1px solid #0f3460;padding:10px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;flex-shrink:0}
    aside h3{font-size:.8rem;color:#3498db;text-transform:uppercase;letter-spacing:1px}
    .tool-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
    .tool-btn{background:#0f3460;border:2px solid transparent;color:#fff;padding:6px;border-radius:4px;cursor:pointer;font-size:.8rem;text-align:center}
    .tool-btn.active{border-color:#3498db}
    .tool-btn:hover{background:#1a4a7a}
    label{font-size:.75rem;color:#aaa;display:flex;flex-direction:column;gap:2px}
    input[type=color]{width:100%;height:28px;border:none;background:none;cursor:pointer}
    input[type=range]{width:100%}
    input[type=number]{width:100%;background:#0f3460;border:1px solid #1a4a7a;color:#fff;padding:3px 6px;border-radius:3px}
    .color-row{display:grid;grid-template-columns:repeat(8,1fr);gap:2px;margin-top:4px}
    .swatch{width:100%;aspect-ratio:1;border-radius:2px;cursor:pointer;border:1px solid #333}
    .swatch:hover{transform:scale(1.1)}
    button.action{width:100%;background:#0f3460;border:1px solid #1a4a7a;color:#fff;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:.8rem;margin-top:2px}
    button.action:hover{background:#1a4a7a}
    button.danger{background:#5c1a1a;border-color:#8b2020}
    button.primary{background:#0d47a1;border-color:#1565c0}
    /* ---- Canvas area ---- */
    .canvas-area{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0d0d1a;position:relative;overflow:auto;padding:20px}
    canvas#drawCanvas{image-rendering:pixelated;cursor:crosshair;border:1px solid #0f3460}
    canvas#gridCanvas{position:absolute;pointer-events:none;image-rendering:pixelated}
    .canvas-wrap{position:relative;display:inline-block}
    /* ---- Asset panel ---- */
    .asset-panel{width:260px;background:#16213e;border-left:1px solid #0f3460;display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
    .asset-panel h3{font-size:.8rem;color:#3498db;text-transform:uppercase;padding:8px 10px;border-bottom:1px solid #0f3460}
    .asset-list{flex:1;overflow-y:auto;padding:8px}
    .asset-item{display:flex;align-items:center;gap:6px;padding:5px;border-radius:4px;cursor:pointer;margin-bottom:4px;background:#0f1a2e}
    .asset-item:hover{background:#1a4a7a}
    .asset-item img{width:32px;height:32px;image-rendering:pixelated;border:1px solid #333;object-fit:contain;background:#000}
    .asset-item .meta{flex:1;overflow:hidden}
    .asset-item .meta .name{font-size:.75rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .asset-item .meta .size{font-size:.65rem;color:#666}
    .asset-item .del{color:#e74c3c;cursor:pointer;padding:2px 5px;border-radius:3px;font-size:.75rem;background:#2c0000}
    .asset-item .del:hover{background:#5c1a1a}
    .upload-zone{border:2px dashed #1a4a7a;padding:16px;text-align:center;border-radius:6px;margin-bottom:8px;cursor:pointer;font-size:.8rem;color:#888}
    .upload-zone:hover,.upload-zone.drag{border-color:#3498db;color:#3498db}
    #fileInput{display:none}
    .cat-tabs{display:flex;border-bottom:1px solid #0f3460;flex-shrink:0}
    .cat-tab{flex:1;padding:6px;text-align:center;font-size:.75rem;cursor:pointer;color:#aaa}
    .cat-tab.active{color:#3498db;border-bottom:2px solid #3498db}
    .status{font-size:.75rem;color:#aaa;padding:4px 10px;border-top:1px solid #0f3460;flex-shrink:0}
    .iso-preview{position:absolute;bottom:10px;right:10px;background:#0d0d1a;border:1px solid #0f3460;padding:6px;border-radius:6px}
    .iso-preview canvas{image-rendering:pixelated}
    .iso-preview label{font-size:.7rem;color:#888;text-align:center}

    /* ---- World / NPC / Quest tab ---- */
    .world-layout{display:flex;flex:1;overflow:hidden}
    .world-sidebar{width:220px;background:#16213e;border-right:1px solid #0f3460;display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
    .world-sidebar .sub-tabs{display:flex;border-bottom:1px solid #0f3460}
    .sub-tab{flex:1;padding:6px;text-align:center;font-size:.75rem;cursor:pointer;color:#aaa}
    .sub-tab.active{color:#3498db;border-bottom:2px solid #3498db}
    .world-list{flex:1;overflow-y:auto;padding:6px}
    .world-item{padding:6px 8px;border-radius:4px;cursor:pointer;font-size:.8rem;margin-bottom:3px;background:#0f1a2e;display:flex;align-items:center;gap:6px}
    .world-item:hover,.world-item.active{background:#1a4a7a}
    .world-item .badge{font-size:.65rem;padding:1px 5px;border-radius:10px;background:#0f3460;color:#aaa}
    .world-editor{flex:1;padding:16px;overflow-y:auto;background:#0d0d1a}
    .world-editor h3{color:#3498db;margin-bottom:12px;font-size:1rem}
    .form-row{display:flex;flex-direction:column;gap:3px;margin-bottom:10px}
    .form-row label{font-size:.75rem;color:#aaa}
    .form-row input,.form-row select,.form-row textarea{background:#0f3460;border:1px solid #1a4a7a;color:#fff;padding:5px 8px;border-radius:4px;font-family:monospace;font-size:.85rem;width:100%}
    .form-row textarea{min-height:60px;resize:vertical}
    .form-row select option{background:#0f3460}
    .section-header{display:flex;align-items:center;justify-content:space-between;margin:14px 0 6px;border-top:1px solid #0f3460;padding-top:10px}
    .section-header h4{font-size:.8rem;color:#3498db;text-transform:uppercase;letter-spacing:1px}
    .btn-sm{background:#0d47a1;border:1px solid #1565c0;color:#fff;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:.75rem}
    .btn-sm:hover{background:#1565c0}
    .btn-sm.danger{background:#5c1a1a;border-color:#8b2020}
    .btn-sm.danger:hover{background:#8b2020}
    .dialog-node{background:#0f1a2e;border:1px solid #1a4a7a;border-radius:5px;margin-bottom:8px;overflow:hidden}
    .dialog-node-header{display:flex;align-items:center;gap:6px;padding:5px 8px;background:#0f3460;cursor:pointer}
    .dialog-node-header span{font-size:.75rem;flex:1;font-family:monospace;color:#3498db}
    .dialog-node-body{padding:8px}
    .choice-row{display:flex;gap:5px;align-items:center;margin-bottom:4px}
    .choice-row input{flex:1;background:#0a1428;border:1px solid #1a4a7a;color:#fff;padding:3px 6px;border-radius:3px;font-size:.8rem}
    .choice-row select{background:#0a1428;border:1px solid #1a4a7a;color:#fff;padding:3px;border-radius:3px;font-size:.75rem}
    .obj-row{display:flex;gap:5px;align-items:center;margin-bottom:4px;flex-wrap:wrap}
    .obj-row input{background:#0a1428;border:1px solid #1a4a7a;color:#fff;padding:3px 6px;border-radius:3px;font-size:.8rem;min-width:60px}
    .obj-row select{background:#0a1428;border:1px solid #1a4a7a;color:#fff;padding:3px;border-radius:3px;font-size:.75rem}
    .btn-row{display:flex;gap:6px;margin-top:14px;flex-wrap:wrap}

    /* ---- Animate tab ---- */
    .animate-layout{display:flex;flex:1;overflow:hidden}
    .anim-sidebar{width:240px;background:#16213e;border-right:1px solid #0f3460;display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;padding:10px;gap:10px}
    .anim-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
    .anim-sheet{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:10px;align-items:flex-start;background:#0d0d1a}
    .anim-preview-bar{height:120px;background:#16213e;border-top:1px solid #0f3460;display:flex;align-items:center;gap:16px;padding:10px 16px;flex-shrink:0}
    #sheetCanvas{image-rendering:pixelated;cursor:pointer;border:1px solid #0f3460}
    .frame-strip{display:flex;gap:4px;flex-wrap:nowrap;overflow-x:auto;flex:1}
    .frame-thumb{border:2px solid #0f3460;cursor:pointer;image-rendering:pixelated}
    .frame-thumb.sel{border-color:#3498db}
    .clip-item{padding:5px 8px;border-radius:4px;cursor:pointer;font-size:.8rem;margin-bottom:3px;background:#0f1a2e}
    .clip-item:hover,.clip-item.active{background:#1a4a7a}

    /* ---- Shaders tab ---- */
    .shader-layout{display:flex;flex:1;overflow:hidden}
    .shader-editor-col{flex:1;display:flex;flex-direction:column;border-right:1px solid #0f3460;overflow:hidden}
    .shader-toolbar{display:flex;gap:6px;align-items:center;padding:6px 10px;background:#16213e;border-bottom:1px solid #0f3460;flex-shrink:0}
    .shader-toolbar input{background:#0f3460;border:1px solid #1a4a7a;color:#fff;padding:3px 8px;border-radius:4px;font-size:.8rem;width:180px}
    #glslEditor{flex:1;background:#0a0a14;color:#aef;font-family:monospace;font-size:.8rem;padding:12px;border:none;outline:none;resize:none;line-height:1.5;tab-size:2}
    .shader-error{background:#2c0000;color:#ff8888;font-size:.75rem;padding:4px 10px;font-family:monospace;min-height:24px;flex-shrink:0}
    .shader-preview-col{width:380px;display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
    #shaderCanvas{width:100%;flex:1;background:#000}
    .uniform-panel{background:#16213e;border-top:1px solid #0f3460;padding:10px;overflow-y:auto;max-height:200px;flex-shrink:0}
    .uniform-panel h4{font-size:.75rem;color:#3498db;margin-bottom:6px;text-transform:uppercase}
    .uniform-row{display:flex;gap:5px;align-items:center;margin-bottom:4px;font-size:.75rem}
    .uniform-row span{color:#aaa;width:80px;flex-shrink:0;font-family:monospace}
    .uniform-row input{flex:1;background:#0f3460;border:1px solid #1a4a7a;color:#fff;padding:2px 5px;border-radius:3px;font-size:.75rem}
    .shader-list-col{width:180px;background:#16213e;border-left:1px solid #0f3460;display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
    .shader-list-col h4{font-size:.75rem;color:#3498db;padding:8px 10px;border-bottom:1px solid #0f3460;text-transform:uppercase}
    .shader-list{flex:1;overflow-y:auto;padding:6px}
    .shader-item{padding:5px 8px;border-radius:4px;cursor:pointer;font-size:.75rem;margin-bottom:3px;background:#0f1a2e;font-family:monospace}
    .shader-item:hover,.shader-item.active{background:#1a4a7a}
  </style>
</head>
<body>
<header>
  <h1>🎮 FrankForge Asset Studio</h1>
  <nav>
    <a href="#draw"    class="active" id="tab-draw"    onclick="showTab('draw',this)">✏️ Draw</a>
    <a href="#assets"  id="tab-assets"  onclick="showTab('assets',this)">🗂 Assets</a>
    <a href="#world"   id="tab-world"   onclick="showTab('world',this)">🌍 World</a>
    <a href="#animate" id="tab-animate" onclick="showTab('animate',this)">🎬 Animate</a>
    <a href="#shaders" id="tab-shaders" onclick="showTab('shaders',this)">✨ Shaders</a>
  </nav>
</header>

<main id="draw-view">
  <!-- Sidebar: tools -->
  <aside>
    <div>
      <h3>Canvas</h3>
      <label>Width <input type="number" id="canvasW" value="64" min="1" max="512"></label>
      <label>Height <input type="number" id="canvasH" value="32" min="1" max="512"></label>
      <label>Zoom
        <input type="range" id="zoomSlider" min="1" max="20" value="8" oninput="setZoom(this.value)">
        <span id="zoomLabel">8×</span>
      </label>
      <button class="action primary" onclick="applyCanvasSize()">Resize Canvas</button>
      <button class="action" onclick="clearCanvas()">Clear</button>
    </div>

    <div>
      <h3>Tools</h3>
      <div class="tool-grid">
        <button class="tool-btn active" id="tool-pencil"  onclick="setTool('pencil')">✏️</button>
        <button class="tool-btn"        id="tool-eraser"  onclick="setTool('eraser')">⬜</button>
        <button class="tool-btn"        id="tool-fill"    onclick="setTool('fill')">🪣</button>
        <button class="tool-btn"        id="tool-eyedrop" onclick="setTool('eyedrop')">💉</button>
        <button class="tool-btn"        id="tool-rect"    onclick="setTool('rect')">▭</button>
        <button class="tool-btn"        id="tool-line"    onclick="setTool('line')">╱</button>
        <button class="tool-btn"        id="tool-mirror"  onclick="toggleMirror()" id="tool-mirror">⟺</button>
        <button class="tool-btn"        id="tool-iso"     onclick="toggleIsoGuide()" title="Iso grid">◆</button>
      </div>
      <label style="margin-top:6px">Brush size
        <input type="range" id="brushSize" min="1" max="16" value="1">
      </label>
    </div>

    <div>
      <h3>Color</h3>
      <input type="color" id="colorPicker" value="#7ab317">
      <label style="margin-top:4px">Opacity
        <input type="range" id="alphaSlider" min="1" max="255" value="255">
      </label>
      <div class="color-row" id="palette"></div>
    </div>

    <div>
      <h3>Layers</h3>
      <label>Layer <select id="layerSelect" style="background:#0f3460;color:#fff;border:none;width:100%">
        <option>Background</option>
        <option>Main</option>
        <option>Details</option>
      </select></label>
    </div>

    <div>
      <h3>Export</h3>
      <label>Filename <input type="text" id="exportName" value="tile.png" style="background:#0f3460;border:1px solid #1a4a7a;color:#fff;padding:3px 6px;border-radius:3px;width:100%"></label>
      <button class="action primary" onclick="saveTile()">💾 Save to Server</button>
      <button class="action" onclick="downloadPNG()">⬇ Download PNG</button>
    </div>
  </aside>

  <!-- Canvas -->
  <div class="canvas-area" id="canvasArea">
    <div class="canvas-wrap" id="canvasWrap">
      <canvas id="drawCanvas"></canvas>
      <canvas id="gridCanvas"></canvas>
    </div>
    <div class="iso-preview">
      <canvas id="isoPreview" width="96" height="64"></canvas>
      <label>Iso preview</label>
    </div>
  </div>

  <!-- Asset panel -->
  <div class="asset-panel">
    <div class="cat-tabs">
      <div class="cat-tab active" onclick="loadCategory('sprites',this)">Sprites</div>
      <div class="cat-tab" onclick="loadCategory('tiles',this)">Tiles</div>
      <div class="cat-tab" onclick="loadCategory('audio',this)">Audio</div>
    </div>
    <div style="padding:8px">
      <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()">
        Drop files here or click to upload
      </div>
      <input type="file" id="fileInput" multiple accept="image/*,audio/*">
    </div>
    <div class="asset-list" id="assetList"></div>
    <div class="status" id="statusBar">Ready</div>
  </div>
</main>

<main id="assets-view" style="display:none;padding:16px;overflow-y:auto">
  <h2 style="color:#3498db;margin-bottom:12px">All Assets</h2>
  <div id="allAssets" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px"></div>
</main>

<!-- ===== WORLD TAB (NPCs + Quests) ===== -->
<main id="world-view" style="display:none" class="world-layout">
  <div class="world-sidebar">
    <div class="sub-tabs">
      <div class="sub-tab active" id="st-npcs"   onclick="switchWorldSub('npcs',this)">NPCs</div>
      <div class="sub-tab"        id="st-quests" onclick="switchWorldSub('quests',this)">Quests</div>
    </div>
    <div class="world-list" id="worldList"></div>
    <div style="padding:8px;border-top:1px solid #0f3460">
      <button class="action primary" onclick="newWorldItem()" style="margin-top:0">+ New</button>
    </div>
  </div>

  <!-- NPC editor -->
  <div class="world-editor" id="npc-editor" style="display:none">
    <h3>🧑 NPC Editor</h3>
    <div class="form-row"><label>ID (slug)</label><input id="npc-id" placeholder="old_frank"></div>
    <div class="form-row"><label>Name</label><input id="npc-name" placeholder="Old Frank"></div>
    <div class="form-row"><label>Role</label>
      <select id="npc-role">
        <option>merchant</option><option>quest_giver</option><option>enemy</option>
        <option>ally</option><option>neutral</option><option>boss</option>
      </select>
    </div>
    <div class="form-row"><label>Sprite</label><select id="npc-sprite"><option value="">— none —</option></select></div>
    <div class="form-row"><label>Description</label><textarea id="npc-desc" rows="2"></textarea></div>

    <div class="section-header">
      <h4>Dialog Tree</h4>
      <button class="btn-sm" onclick="addDialogNode()">+ Node</button>
    </div>
    <div id="dialogNodes"></div>

    <div class="btn-row">
      <button class="action primary" onclick="saveNpc()">💾 Save NPC</button>
      <button class="action danger"  onclick="deleteNpc()">🗑 Delete</button>
    </div>
  </div>

  <!-- Quest editor -->
  <div class="world-editor" id="quest-editor" style="display:none">
    <h3>📜 Quest Editor</h3>
    <div class="form-row"><label>ID (slug)</label><input id="q-id" placeholder="gather_methane"></div>
    <div class="form-row"><label>Name</label><input id="q-name" placeholder="Gather Methane"></div>
    <div class="form-row"><label>Description</label><textarea id="q-desc" rows="2"></textarea></div>
    <div class="form-row"><label>Giver NPC</label><select id="q-giver"><option value="">— none —</option></select></div>
    <div class="form-row"><label>Status</label>
      <select id="q-status"><option>available</option><option>active</option><option>completed</option><option>failed</option></select>
    </div>

    <div class="section-header">
      <h4>Objectives</h4>
      <button class="btn-sm" onclick="addObjective()">+ Add</button>
    </div>
    <div id="questObjectives"></div>

    <div class="section-header"><h4>Rewards</h4></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="form-row"><label>Energy</label><input type="number" id="r-energy" value="0" min="0"></div>
      <div class="form-row"><label>Iron</label><input type="number" id="r-iron" value="0" min="0"></div>
      <div class="form-row"><label>Copper</label><input type="number" id="r-copper" value="0" min="0"></div>
      <div class="form-row"><label>Methane</label><input type="number" id="r-methane" value="0" min="0"></div>
      <div class="form-row"><label>XP (exploration)</label><input type="number" id="r-xp" value="0" min="0"></div>
    </div>

    <div class="btn-row">
      <button class="action primary" onclick="saveQuest()">💾 Save Quest</button>
      <button class="action danger"  onclick="deleteQuest()">🗑 Delete</button>
    </div>
  </div>

  <div class="world-editor" id="world-empty" style="display:flex;align-items:center;justify-content:center;color:#444;font-size:.9rem">
    Select or create an NPC / Quest →
  </div>
</main>

<!-- ===== ANIMATE TAB ===== -->
<main id="animate-view" style="display:none" class="animate-layout">
  <div class="anim-sidebar">
    <div>
      <h3 style="font-size:.8rem;color:#3498db;text-transform:uppercase;margin-bottom:6px">Sprite Sheet</h3>
      <div class="form-row"><label>Sprite</label><select id="anim-sprite-src" onchange="loadSheet()"><option value="">— pick sprite —</option></select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="form-row"><label>Cols</label><input type="number" id="anim-cols" value="4" min="1" max="64" onchange="loadSheet()"></div>
        <div class="form-row"><label>Rows</label><input type="number" id="anim-rows" value="4" min="1" max="64" onchange="loadSheet()"></div>
        <div class="form-row"><label>W px</label><input type="number" id="anim-fw" value="32" min="1" onchange="loadSheet()"></div>
        <div class="form-row"><label>H px</label><input type="number" id="anim-fh" value="32" min="1" onchange="loadSheet()"></div>
      </div>
    </div>
    <div>
      <h3 style="font-size:.8rem;color:#3498db;text-transform:uppercase;margin-bottom:6px">Clips</h3>
      <div id="animClipList" style="margin-bottom:6px"></div>
      <button class="action primary" style="margin-top:0" onclick="newClip()">+ New Clip</button>
    </div>
    <div id="clipEditor" style="display:none;border-top:1px solid #0f3460;padding-top:8px">
      <div class="form-row"><label>Clip Name</label><input id="clip-name" value="idle"></div>
      <div class="form-row"><label>FPS</label><input type="number" id="clip-fps" value="8" min="1" max="60"></div>
      <label style="font-size:.75rem;display:flex;align-items:center;gap:5px;margin-bottom:6px">
        <input type="checkbox" id="clip-loop" checked> Loop
      </label>
      <div class="form-row"><label>Frames (click sheet to toggle)</label>
        <div id="clip-frames-display" style="font-family:monospace;font-size:.75rem;color:#3498db;min-height:18px"></div>
      </div>
      <button class="action primary" style="margin-top:0" onclick="saveClip()">💾 Save Clip</button>
    </div>
    <button class="action" onclick="saveAnimations()">💾 Export animations.json</button>
  </div>
  <div class="anim-main">
    <div class="anim-sheet" id="animSheet">
      <p style="color:#444;font-size:.8rem">Select a sprite sheet above</p>
      <canvas id="sheetCanvas" style="display:none"></canvas>
    </div>
    <div class="anim-preview-bar">
      <div>
        <div style="font-size:.7rem;color:#aaa;margin-bottom:4px">Preview</div>
        <canvas id="animPreview" width="64" height="64" style="image-rendering:pixelated;border:1px solid #0f3460;background:#000"></canvas>
      </div>
      <div class="frame-strip" id="frameStrip"></div>
      <div>
        <button class="btn-sm" onclick="toggleAnimPlay()" id="animPlayBtn">▶ Play</button>
      </div>
    </div>
  </div>
</main>

<!-- ===== SHADERS TAB ===== -->
<main id="shaders-view" style="display:none" class="shader-layout">
  <div class="shader-editor-col">
    <div class="shader-toolbar">
      <input id="shaderName" value="new_shader.glsl" placeholder="filename.glsl">
      <button class="btn-sm" onclick="compileShader()">▶ Compile</button>
      <button class="btn-sm" onclick="saveShader()">💾 Save</button>
      <button class="btn-sm danger" onclick="deleteShader()">🗑</button>
      <span id="shaderStatus" style="font-size:.75rem;color:#aaa;margin-left:4px"></span>
    </div>
    <textarea id="glslEditor" spellcheck="false">precision mediump float;
uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_mouse;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 col = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col, 1.0);
}</textarea>
    <div class="shader-error" id="shaderError"></div>
  </div>

  <div class="shader-preview-col">
    <canvas id="shaderCanvas"></canvas>
    <div class="uniform-panel">
      <h4>Uniforms (auto: u_time, u_resolution, u_mouse)</h4>
      <div id="uniformRows">
        <div class="uniform-row"><span>u_time</span><input value="auto" disabled style="color:#666"></div>
        <div class="uniform-row"><span>u_resolution</span><input value="auto" disabled style="color:#666"></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:6px">
        <input id="newUniformName" placeholder="myParam" style="background:#0f3460;border:1px solid #1a4a7a;color:#fff;padding:3px 6px;border-radius:3px;font-size:.75rem;flex:1">
        <button class="btn-sm" onclick="addUniform()">+ Uniform</button>
      </div>
    </div>
  </div>

  <div class="shader-list-col">
    <h4>Saved Shaders</h4>
    <div class="shader-list" id="shaderList"></div>
  </div>
</main>

<script>
// -------------------------------------------------------------------------
// State
// -------------------------------------------------------------------------
let cw = 64, ch = 32, zoom = 8;
let tool = 'pencil';
let mirrorX = false;
let isoGuide = false;
let painting = false;
let startPx = null;
let drawCtx, gridCtx, isoCtx;
const dc = () => document.getElementById('drawCanvas');
const gc = () => document.getElementById('gridCanvas');

const PALETTE = [
  '#ffffff','#aaaaaa','#555555','#000000',
  '#e74c3c','#e67e22','#f1c40f','#2ecc71',
  '#1abc9c','#3498db','#9b59b6','#e91e63',
  '#7ab317','#3e7924','#0a3b5c','#0e6ba8',
  '#bf62a6','#39848b','#e4d6a7','#8d8778',
];

// -------------------------------------------------------------------------
// Init
// -------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  buildPalette();
  initCanvas(cw, ch);
  loadCategory('sprites', document.querySelector('.cat-tab.active'));
  setupDrop();
  document.getElementById('fileInput').addEventListener('change', handleFileInput);
});

function buildPalette() {
  const el = document.getElementById('palette');
  PALETTE.forEach(c => {
    const s = document.createElement('div');
    s.className = 'swatch';
    s.style.background = c;
    s.title = c;
    s.onclick = () => { document.getElementById('colorPicker').value = c; };
    el.appendChild(s);
  });
}

// -------------------------------------------------------------------------
// Canvas
// -------------------------------------------------------------------------
function initCanvas(w, h) {
  cw = w; ch = h;
  const draw = dc();
  draw.width  = w; draw.height = h;
  draw.style.width  = (w * zoom) + 'px';
  draw.style.height = (h * zoom) + 'px';
  drawCtx = draw.getContext('2d');
  drawCtx.imageSmoothingEnabled = false;

  const grid = gc();
  grid.width  = w * zoom; grid.height = h * zoom;
  grid.style.width  = (w * zoom) + 'px';
  grid.style.height = (h * zoom) + 'px';
  grid.style.top = '0'; grid.style.left = '0';
  gridCtx = grid.getContext('2d');

  isoCtx = document.getElementById('isoPreview').getContext('2d');

  drawGrid();
  setupMouseEvents(draw);
  renderIsoPreview();
}

function applyCanvasSize() {
  const w = Math.max(1, Math.min(512, parseInt(document.getElementById('canvasW').value)));
  const h = Math.max(1, Math.min(512, parseInt(document.getElementById('canvasH').value)));
  // Copy existing pixels
  const tmp = document.createElement('canvas');
  tmp.width = cw; tmp.height = ch;
  tmp.getContext('2d').drawImage(dc(), 0, 0);
  initCanvas(w, h);
  drawCtx.drawImage(tmp, 0, 0);
  renderIsoPreview();
}

function setZoom(v) {
  zoom = parseInt(v);
  document.getElementById('zoomLabel').textContent = zoom + '×';
  dc().style.width  = (cw * zoom) + 'px';
  dc().style.height = (ch * zoom) + 'px';
  const grid = gc();
  grid.width  = cw * zoom; grid.height = ch * zoom;
  grid.style.width  = (cw * zoom) + 'px';
  grid.style.height = (ch * zoom) + 'px';
  gridCtx = grid.getContext('2d');
  drawGrid();
}

function drawGrid() {
  if (!gridCtx) return;
  gridCtx.clearRect(0, 0, cw * zoom, ch * zoom);
  if (zoom < 4) return;
  gridCtx.strokeStyle = 'rgba(255,255,255,0.08)';
  gridCtx.lineWidth = 1;
  for (let x = 0; x <= cw; x++) {
    gridCtx.beginPath(); gridCtx.moveTo(x * zoom, 0); gridCtx.lineTo(x * zoom, ch * zoom); gridCtx.stroke();
  }
  for (let y = 0; y <= ch; y++) {
    gridCtx.beginPath(); gridCtx.moveTo(0, y * zoom); gridCtx.lineTo(cw * zoom, y * zoom); gridCtx.stroke();
  }
  if (isoGuide) drawIsoGuide();
}

function drawIsoGuide() {
  gridCtx.strokeStyle = 'rgba(52,152,219,0.4)';
  gridCtx.lineWidth = 1;
  const cx = (cw * zoom) / 2, cy = 0;
  const tw = cw * zoom, th = ch * zoom;
  gridCtx.beginPath();
  gridCtx.moveTo(cx, cy);
  gridCtx.lineTo(tw, th / 2);
  gridCtx.lineTo(cx, th);
  gridCtx.lineTo(0, th / 2);
  gridCtx.closePath();
  gridCtx.stroke();
}

// -------------------------------------------------------------------------
// Mouse events
// -------------------------------------------------------------------------
function setupMouseEvents(canvas) {
  canvas.addEventListener('mousedown', e => { painting = true; startPx = getPixel(e); applyTool(e); });
  canvas.addEventListener('mousemove', e => { if (painting) applyTool(e); });
  canvas.addEventListener('mouseup',   () => { painting = false; startPx = null; renderIsoPreview(); });
  canvas.addEventListener('mouseleave',() => { painting = false; startPx = null; });
  canvas.addEventListener('contextmenu', e => { e.preventDefault(); tool === 'pencil' && pickColor(e); });
}

function getPixel(e) {
  const r = dc().getBoundingClientRect();
  return {
    x: Math.floor((e.clientX - r.left) / zoom),
    y: Math.floor((e.clientY - r.top) / zoom),
  };
}

function applyTool(e) {
  const p = getPixel(e);
  const color = getColor();
  const size  = parseInt(document.getElementById('brushSize').value);

  if (tool === 'pencil') {
    drawPixels(p.x, p.y, color, size);
    if (mirrorX) drawPixels(cw - 1 - p.x, p.y, color, size);
  } else if (tool === 'eraser') {
    drawPixels(p.x, p.y, 'rgba(0,0,0,0)', size, true);
    if (mirrorX) drawPixels(cw - 1 - p.x, p.y, 'rgba(0,0,0,0)', size, true);
  } else if (tool === 'fill' && e.type === 'mousedown') {
    floodFill(p.x, p.y, color);
  } else if (tool === 'eyedrop' && e.type === 'mousedown') {
    pickColor(e);
  } else if (tool === 'rect' && e.type === 'mouseup' && startPx) {
    drawRect(startPx, p, color, size);
  } else if (tool === 'line' && e.type === 'mouseup' && startPx) {
    drawLine(startPx, p, color, size);
  }
}

function getColor() {
  const hex = document.getElementById('colorPicker').value;
  const alpha = parseInt(document.getElementById('alphaSlider').value);
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha/255})`;
}

function drawPixels(x, y, color, size, clear = false) {
  if (clear) drawCtx.clearRect(x, y, size, size);
  else { drawCtx.fillStyle = color; drawCtx.fillRect(x, y, size, size); }
}

function drawRect(a, b, color, size) {
  const x1 = Math.min(a.x, b.x), y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x, b.x), y2 = Math.max(a.y, b.y);
  drawCtx.strokeStyle = color;
  drawCtx.lineWidth = size;
  drawCtx.strokeRect(x1 + .5, y1 + .5, x2 - x1, y2 - y1);
}

function drawLine(a, b, color, size) {
  drawCtx.strokeStyle = color;
  drawCtx.lineWidth = size;
  drawCtx.beginPath();
  drawCtx.moveTo(a.x + .5, a.y + .5);
  drawCtx.lineTo(b.x + .5, b.y + .5);
  drawCtx.stroke();
}

function floodFill(px, py, fillColor) {
  const imgData = drawCtx.getImageData(0, 0, cw, ch);
  const d = imgData.data;
  const idx = (x, y) => (y * cw + x) * 4;
  const target = d.slice(idx(px, py), idx(px, py) + 4);
  const [fr, fg, fb, fa] = parseRgba(fillColor);
  if (target[0] === fr && target[1] === fg && target[2] === fb && target[3] === fa) return;
  const stack = [[px, py]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= cw || y < 0 || y >= ch) continue;
    const i = idx(x, y);
    if (d[i]!==target[0] || d[i+1]!==target[1] || d[i+2]!==target[2] || d[i+3]!==target[3]) continue;
    d[i]=fr; d[i+1]=fg; d[i+2]=fb; d[i+3]=fa;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  drawCtx.putImageData(imgData, 0, 0);
}

function parseRgba(s) {
  const m = s.match(/rgba?\((\d+),(\d+),(\d+),?([\d.]+)?\)/);
  if (!m) return [0,0,0,255];
  return [+m[1], +m[2], +m[3], Math.round((+m[4] ?? 1) * 255)];
}

function pickColor(e) {
  const p = getPixel(e);
  const [r, g, b] = drawCtx.getImageData(p.x, p.y, 1, 1).data;
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2,'0')).join('');
  document.getElementById('colorPicker').value = hex;
}

// -------------------------------------------------------------------------
// Isometric preview
// -------------------------------------------------------------------------
function renderIsoPreview() {
  const src = dc();
  const ic = document.getElementById('isoPreview');
  const ctx = isoCtx;
  ctx.clearRect(0, 0, 96, 64);

  // Draw image as isometric top-face diamond
  // For a diamond: top=(48,0), right=(96,32), bottom=(48,64), left=(0,32)
  // We use a CSS skew approximation by drawing with a 2D transform
  ctx.save();
  ctx.transform(1, 0.5, -1, 0.5, 48, 0);
  ctx.drawImage(src, 0, 0, 48, 32);
  ctx.restore();
}

// -------------------------------------------------------------------------
// Tools toggle
// -------------------------------------------------------------------------
function setTool(t) {
  tool = t;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tool-' + t);
  if (btn) btn.classList.add('active');
}

function toggleMirror() {
  mirrorX = !mirrorX;
  document.getElementById('tool-mirror').classList.toggle('active', mirrorX);
}

function toggleIsoGuide() {
  isoGuide = !isoGuide;
  document.getElementById('tool-iso').classList.toggle('active', isoGuide);
  drawGrid();
}

function clearCanvas() {
  drawCtx.clearRect(0, 0, cw, ch);
  renderIsoPreview();
}

// -------------------------------------------------------------------------
// Save / Download
// -------------------------------------------------------------------------
async function saveTile() {
  const name = document.getElementById('exportName').value || 'tile.png';
  const dataURL = dc().toDataURL('image/png');
  setStatus('Saving…');
  try {
    const res = await fetch('/api/save_tile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dataURL }),
    });
    const j = await res.json();
    setStatus(`Saved: ${j.saved?.path}`);
    loadCategory('tiles', null);
  } catch (err) {
    setStatus('Error: ' + err.message);
  }
}

function downloadPNG() {
  const a = document.createElement('a');
  a.href = dc().toDataURL('image/png');
  a.download = document.getElementById('exportName').value || 'tile.png';
  a.click();
}

// -------------------------------------------------------------------------
// Asset panel
// -------------------------------------------------------------------------
let currentCategory = 'sprites';

async function loadCategory(cat, tabEl) {
  currentCategory = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  setStatus('Loading…');
  try {
    const res = await fetch('/api/assets/' + cat);
    const items = await res.json();
    renderAssetList(items);
    setStatus(`${items.length} assets`);
  } catch (e) {
    setStatus('Error loading assets');
  }
}

function renderAssetList(items) {
  const el = document.getElementById('assetList');
  el.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'asset-item';
    div.title = item.name;
    const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(item.name);
    div.innerHTML = `
      ${isImage ? `<img src="${item.path}?t=${Date.now()}" alt="${item.name}">` : `<div style="width:32px;height:32px;background:#0d1a2e;display:flex;align-items:center;justify-content:center;font-size:1.2rem">🔊</div>`}
      <div class="meta">
        <div class="name">${item.name}</div>
        <div class="size">${(item.size/1024).toFixed(1)} KB</div>
      </div>
      <span class="del" onclick="deleteAsset('${item.path}',this.closest('.asset-item'))">✕</span>
    `;
    if (isImage) {
      div.querySelector('img').onclick = () => loadIntoCanvas(item.path);
    }
    el.appendChild(div);
  });
}

async function loadIntoCanvas(path) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    document.getElementById('canvasW').value = img.width;
    document.getElementById('canvasH').value = img.height;
    applyCanvasSize();
    drawCtx.drawImage(img, 0, 0);
    renderIsoPreview();
    setStatus(`Loaded: ${path}`);
  };
  img.src = path + '?t=' + Date.now();
}

async function deleteAsset(path, el) {
  if (!confirm('Delete ' + path + '?')) return;
  const res = await fetch('/api/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (res.ok) { el.remove(); setStatus('Deleted'); }
}

// -------------------------------------------------------------------------
// Upload
// -------------------------------------------------------------------------
function setupDrop() {
  const zone = document.getElementById('uploadZone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag');
    uploadFiles(e.dataTransfer.files);
  });
}

function handleFileInput(e) { uploadFiles(e.target.files); e.target.value = ''; }

async function uploadFiles(files) {
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  setStatus('Uploading…');
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const j = await res.json();
    setStatus(`Uploaded ${j.saved.length} file(s)`);
    loadCategory(currentCategory, null);
  } catch (e) {
    setStatus('Upload failed: ' + e.message);
  }
}

// -------------------------------------------------------------------------
// Tab switching
// -------------------------------------------------------------------------
function showTab(name, a) {
  document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));
  a.classList.add('active');
  const tabs = ['draw','assets','world','animate','shaders'];
  tabs.forEach(t => {
    const el = document.getElementById(t + '-view');
    if (el) el.style.display = (t === name) ? 'flex' : 'none';
  });
  if (name === 'assets')  loadAllAssets();
  if (name === 'world')   initWorldTab();
  if (name === 'animate') initAnimateTab();
  if (name === 'shaders') initShadersTab();
  return false;
}

// =========================================================================
// WORLD TAB – NPCs & Quests
// =========================================================================
let worldSub = 'npcs';   // 'npcs' or 'quests'
let allNpcs = {};
let allQuests = {};
let editingNpcId = null;
let editingQuestId = null;

async function initWorldTab() {
  const [nr, qr] = await Promise.all([fetch('/api/npcs'), fetch('/api/quests')]);
  const npcArr   = await nr.json();
  const questArr = await qr.json();
  allNpcs   = Object.fromEntries(npcArr.map(n => [n.id, n]));
  allQuests = Object.fromEntries(questArr.map(q => [q.id, q]));
  await loadSpriteOptions('npc-sprite');
  await loadNpcOptions('q-giver');
  renderWorldList();
}

async function loadSpriteOptions(selectId) {
  const res = await fetch('/api/assets/sprites');
  const items = await res.json();
  const sel = document.getElementById(selectId);
  const cur = sel.value;
  sel.innerHTML = '<option value="">— none —</option>';
  items.forEach(i => {
    const o = document.createElement('option');
    o.value = i.path; o.textContent = i.name;
    sel.appendChild(o);
  });
  sel.value = cur;
}

async function loadNpcOptions(selectId) {
  const sel = document.getElementById(selectId);
  const cur = sel.value;
  sel.innerHTML = '<option value="">— none —</option>';
  Object.values(allNpcs).forEach(n => {
    const o = document.createElement('option');
    o.value = n.id; o.textContent = n.name;
    sel.appendChild(o);
  });
  sel.value = cur;
}

function switchWorldSub(sub, el) {
  worldSub = sub;
  document.querySelectorAll('.sub-tab').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  editingNpcId = null; editingQuestId = null;
  document.getElementById('npc-editor').style.display   = 'none';
  document.getElementById('quest-editor').style.display = 'none';
  document.getElementById('world-empty').style.display  = 'flex';
  renderWorldList();
}

function renderWorldList() {
  const el = document.getElementById('worldList');
  el.innerHTML = '';
  const items = worldSub === 'npcs' ? Object.values(allNpcs) : Object.values(allQuests);
  items.forEach(item => {
    const d = document.createElement('div');
    d.className = 'world-item' + (
      (worldSub === 'npcs'   && item.id === editingNpcId)   ||
      (worldSub === 'quests' && item.id === editingQuestId) ? ' active' : '');
    d.innerHTML = `<span style="flex:1">${item.name || item.id}</span>
      <span class="badge">${worldSub === 'npcs' ? (item.role||'npc') : (item.status||'?')}</span>`;
    d.onclick = () => worldSub === 'npcs' ? openNpc(item.id) : openQuest(item.id);
    el.appendChild(d);
  });
}

function newWorldItem() {
  if (worldSub === 'npcs')   openNpc(null);
  else                       openQuest(null);
}

// ---------- NPC Editor ----------
function openNpc(id) {
  editingNpcId = id;
  document.getElementById('npc-editor').style.display   = 'block';
  document.getElementById('quest-editor').style.display = 'none';
  document.getElementById('world-empty').style.display  = 'none';
  renderWorldList();
  const npc = id ? (allNpcs[id] || {}) : {};
  document.getElementById('npc-id').value   = npc.id   || '';
  document.getElementById('npc-name').value = npc.name || '';
  document.getElementById('npc-role').value = npc.role || 'merchant';
  document.getElementById('npc-sprite').value = npc.sprite || '';
  document.getElementById('npc-desc').value = npc.description || '';
  renderDialogNodes(npc.dialog || { root: { text: 'Hello!', choices: [] } });
}

let dialogData = {};

function renderDialogNodes(dialog) {
  dialogData = JSON.parse(JSON.stringify(dialog));
  const container = document.getElementById('dialogNodes');
  container.innerHTML = '';
  Object.entries(dialogData).forEach(([nodeId, node]) => {
    container.appendChild(buildNodeEl(nodeId, node));
  });
}

function buildNodeEl(nodeId, node) {
  const wrap = document.createElement('div');
  wrap.className = 'dialog-node';
  wrap.id = 'dn-' + nodeId;

  const nodeIds = Object.keys(dialogData);
  const choicesHtml = (node.choices || []).map((c, i) => `
    <div class="choice-row">
      <input value="${escHtml(c.text)}" oninput="dialogData['${nodeId}'].choices[${i}].text=this.value" placeholder="Choice text…">
      <select onchange="dialogData['${nodeId}'].choices[${i}].next=this.value">
        <option value="">end</option>
        ${nodeIds.map(nid => `<option value="${nid}" ${c.next===nid?'selected':''}>${nid}</option>`).join('')}
      </select>
      <button class="btn-sm danger" onclick="removeChoice('${nodeId}',${i})">✕</button>
    </div>`).join('');

  wrap.innerHTML = `
    <div class="dialog-node-header">
      <span>${nodeId}</span>
      ${nodeId !== 'root' ? `<button class="btn-sm danger" style="padding:1px 5px" onclick="removeDialogNode('${nodeId}')">✕</button>` : ''}
    </div>
    <div class="dialog-node-body">
      <div class="form-row" style="margin-bottom:6px">
        <label>Text</label>
        <textarea rows="2" oninput="dialogData['${nodeId}'].text=this.value">${escHtml(node.text||'')}</textarea>
      </div>
      <div id="choices-${nodeId}">${choicesHtml}</div>
      <button class="btn-sm" onclick="addChoice('${nodeId}')">+ Choice</button>
    </div>`;
  return wrap;
}

function addDialogNode() {
  const id = 'node_' + Date.now().toString(36);
  dialogData[id] = { text: '', choices: [] };
  document.getElementById('dialogNodes').appendChild(buildNodeEl(id, dialogData[id]));
}

function removeDialogNode(nodeId) {
  delete dialogData[nodeId];
  document.getElementById('dn-' + nodeId)?.remove();
}

function addChoice(nodeId) {
  dialogData[nodeId].choices = dialogData[nodeId].choices || [];
  dialogData[nodeId].choices.push({ text: '', next: '' });
  renderDialogNodes(dialogData);
}

function removeChoice(nodeId, idx) {
  dialogData[nodeId].choices.splice(idx, 1);
  renderDialogNodes(dialogData);
}

async function saveNpc() {
  const id = document.getElementById('npc-id').value.trim().replace(/\s+/g,'_');
  if (!id) { alert('ID required'); return; }
  const npc = {
    id,
    name:        document.getElementById('npc-name').value.trim(),
    role:        document.getElementById('npc-role').value,
    sprite:      document.getElementById('npc-sprite').value,
    description: document.getElementById('npc-desc').value.trim(),
    dialog:      dialogData,
  };
  await fetch('/api/npcs', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(npc) });
  allNpcs[id] = npc;
  editingNpcId = id;
  renderWorldList();
  await loadNpcOptions('q-giver');
  setStatus('NPC saved: ' + id);
}

async function deleteNpc() {
  if (!editingNpcId || !confirm('Delete NPC?')) return;
  await fetch('/api/npcs/' + editingNpcId, { method:'DELETE' });
  delete allNpcs[editingNpcId];
  editingNpcId = null;
  document.getElementById('npc-editor').style.display  = 'none';
  document.getElementById('world-empty').style.display = 'flex';
  renderWorldList();
}

// ---------- Quest Editor ----------
function openQuest(id) {
  editingQuestId = id;
  document.getElementById('quest-editor').style.display = 'block';
  document.getElementById('npc-editor').style.display   = 'none';
  document.getElementById('world-empty').style.display  = 'none';
  renderWorldList();
  const q = id ? (allQuests[id] || {}) : {};
  document.getElementById('q-id').value     = q.id     || '';
  document.getElementById('q-name').value   = q.name   || '';
  document.getElementById('q-desc').value   = q.description || '';
  document.getElementById('q-giver').value  = q.giver_npc  || '';
  document.getElementById('q-status').value = q.status     || 'available';
  document.getElementById('r-energy').value  = q.reward?.resources?.energy  || 0;
  document.getElementById('r-iron').value    = q.reward?.resources?.iron    || 0;
  document.getElementById('r-copper').value  = q.reward?.resources?.copper  || 0;
  document.getElementById('r-methane').value = q.reward?.resources?.methane || 0;
  document.getElementById('r-xp').value      = q.reward?.skills?.exploration || 0;
  renderObjectives(q.objectives || []);
}

let objectivesData = [];
function renderObjectives(objs) {
  objectivesData = JSON.parse(JSON.stringify(objs));
  const el = document.getElementById('questObjectives');
  el.innerHTML = '';
  objectivesData.forEach((o, i) => {
    const row = document.createElement('div');
    row.className = 'obj-row';
    row.innerHTML = `
      <input value="${escHtml(o.description)}" placeholder="Description"
        oninput="objectivesData[${i}].description=this.value" style="flex:2;min-width:120px">
      <select onchange="objectivesData[${i}].type=this.value">
        ${['collect','build','discover','interact'].map(t =>
          `<option ${o.type===t?'selected':''}>${t}</option>`).join('')}
      </select>
      <input value="${escHtml(o.target)}" placeholder="target"
        oninput="objectivesData[${i}].target=this.value" style="width:70px">
      <input type="number" value="${o.quantity||1}" min="1"
        oninput="objectivesData[${i}].quantity=+this.value" style="width:50px">
      <button class="btn-sm danger" onclick="objectivesData.splice(${i},1);renderObjectives(objectivesData)">✕</button>`;
    el.appendChild(row);
  });
}

function addObjective() {
  objectivesData.push({ id:'obj'+Date.now(), description:'', type:'collect', target:'', quantity:1, progress:0, completed:false });
  renderObjectives(objectivesData);
}

async function saveQuest() {
  const id = document.getElementById('q-id').value.trim().replace(/\s+/g,'_');
  if (!id) { alert('ID required'); return; }
  const quest = {
    id,
    name:        document.getElementById('q-name').value.trim(),
    description: document.getElementById('q-desc').value.trim(),
    giver_npc:   document.getElementById('q-giver').value,
    status:      document.getElementById('q-status').value,
    objectives:  objectivesData,
    reward: {
      resources: {
        energy:  +document.getElementById('r-energy').value,
        iron:    +document.getElementById('r-iron').value,
        copper:  +document.getElementById('r-copper').value,
        methane: +document.getElementById('r-methane').value,
      },
      skills: { exploration: +document.getElementById('r-xp').value },
    },
  };
  await fetch('/api/quests', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(quest) });
  allQuests[id] = quest;
  editingQuestId = id;
  renderWorldList();
  setStatus('Quest saved: ' + id);
}

async function deleteQuest() {
  if (!editingQuestId || !confirm('Delete quest?')) return;
  await fetch('/api/quests/' + editingQuestId, { method:'DELETE' });
  delete allQuests[editingQuestId];
  editingQuestId = null;
  document.getElementById('quest-editor').style.display = 'none';
  document.getElementById('world-empty').style.display  = 'flex';
  renderWorldList();
}

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// =========================================================================
// ANIMATE TAB
// =========================================================================
let sheetImg = null;
let animCols = 4, animRows = 4, animFW = 32, animFH = 32;
let allAnimations = {};
let editingClip = null;
let selectedFrames = [];
let animPlaying = false;
let animFrame = 0;
let animInterval = null;

async function initAnimateTab() {
  const res = await fetch('/api/assets/sprites');
  const items = await res.json();
  const sel = document.getElementById('anim-sprite-src');
  const cur = sel.value;
  sel.innerHTML = '<option value="">— pick sprite —</option>';
  items.forEach(i => {
    const o = document.createElement('option');
    o.value = i.path; o.textContent = i.name;
    sel.appendChild(o);
  });
  sel.value = cur;
  const ar = await fetch('/api/animations');
  allAnimations = await ar.json();
  renderClipList();
}

function loadSheet() {
  const src = document.getElementById('anim-sprite-src').value;
  animCols = +document.getElementById('anim-cols').value || 4;
  animRows = +document.getElementById('anim-rows').value || 4;
  animFW   = +document.getElementById('anim-fw').value || 32;
  animFH   = +document.getElementById('anim-fh').value || 32;
  if (!src) return;
  sheetImg = new Image();
  sheetImg.crossOrigin = 'anonymous';
  sheetImg.onload = drawSheet;
  sheetImg.src = src + '?t=' + Date.now();
}

function drawSheet() {
  const canvas = document.getElementById('sheetCanvas');
  canvas.style.display = 'block';
  document.querySelector('#animSheet p').style.display = 'none';
  const w = animCols * animFW, h = animRows * animFH;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(sheetImg, 0, 0);
  // Draw grid
  ctx.strokeStyle = 'rgba(52,152,219,0.4)'; ctx.lineWidth = 1;
  for (let c = 0; c <= animCols; c++) { ctx.beginPath(); ctx.moveTo(c*animFW,0); ctx.lineTo(c*animFW,h); ctx.stroke(); }
  for (let r = 0; r <= animRows; r++) { ctx.beginPath(); ctx.moveTo(0,r*animFH); ctx.lineTo(w,r*animFH); ctx.stroke(); }
  // Highlight selected frames
  if (editingClip) {
    ctx.fillStyle = 'rgba(52,152,219,0.35)';
    selectedFrames.forEach(f => {
      const c = f % animCols, r = Math.floor(f / animCols);
      ctx.fillRect(c*animFW, r*animFH, animFW, animFH);
    });
  }
  updateFrameStrip();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sheetCanvas').addEventListener('click', e => {
    if (!editingClip) return;
    const rect = e.target.getBoundingClientRect();
    const scale = e.target.width / rect.width;
    const col = Math.floor((e.clientX - rect.left) * scale / animFW);
    const row = Math.floor((e.clientY - rect.top)  * scale / animFH);
    const f = row * animCols + col;
    const idx = selectedFrames.indexOf(f);
    if (idx >= 0) selectedFrames.splice(idx, 1);
    else selectedFrames.push(f);
    selectedFrames.sort((a,b) => a-b);
    document.getElementById('clip-frames-display').textContent = '[' + selectedFrames.join(', ') + ']';
    drawSheet();
  });
});

function updateFrameStrip() {
  if (!editingClip || !sheetImg) return;
  const strip = document.getElementById('frameStrip');
  strip.innerHTML = '';
  const thumb = 40;
  selectedFrames.forEach(f => {
    const c = document.createElement('canvas');
    c.width = animFW; c.height = animFH;
    c.style.width = thumb + 'px'; c.style.height = thumb + 'px';
    c.className = 'frame-thumb';
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const col = f % animCols, row = Math.floor(f / animCols);
    ctx.drawImage(sheetImg, col*animFW, row*animFH, animFW, animFH, 0, 0, animFW, animFH);
    strip.appendChild(c);
  });
}

function renderClipList() {
  const el = document.getElementById('animClipList');
  el.innerHTML = '';
  Object.entries(allAnimations).forEach(([name, clip]) => {
    const d = document.createElement('div');
    d.className = 'clip-item' + (editingClip === name ? ' active' : '');
    d.textContent = name + ' (' + (clip.frames||[]).length + ' frames)';
    d.onclick = () => openClip(name);
    el.appendChild(d);
  });
}

function newClip() { openClip(null); }

function openClip(name) {
  editingClip = name;
  document.getElementById('clipEditor').style.display = 'block';
  const clip = name ? (allAnimations[name] || {}) : {};
  document.getElementById('clip-name').value = name || 'new_clip';
  document.getElementById('clip-fps').value  = clip.fps  || 8;
  document.getElementById('clip-loop').checked = clip.loop !== false;
  selectedFrames = [...(clip.frames || [])];
  document.getElementById('clip-frames-display').textContent = '[' + selectedFrames.join(', ') + ']';
  renderClipList();
  if (sheetImg) drawSheet();
}

function saveClip() {
  const name = document.getElementById('clip-name').value.trim();
  if (!name) return;
  allAnimations[name] = {
    frames: [...selectedFrames],
    fps: +document.getElementById('clip-fps').value,
    loop: document.getElementById('clip-loop').checked,
    sprite: document.getElementById('anim-sprite-src').value,
    frameWidth: animFW, frameHeight: animFH, cols: animCols,
  };
  editingClip = name;
  renderClipList();
}

async function saveAnimations() {
  await fetch('/api/animations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(allAnimations),
  });
  setStatus('animations.json saved');
}

function toggleAnimPlay() {
  animPlaying = !animPlaying;
  document.getElementById('animPlayBtn').textContent = animPlaying ? '⏹ Stop' : '▶ Play';
  if (animPlaying) {
    animFrame = 0;
    const clip = allAnimations[editingClip];
    if (!clip || !clip.frames.length || !sheetImg) { animPlaying = false; return; }
    const fps = clip.fps || 8;
    animInterval = setInterval(() => {
      animFrame = (animFrame + 1) % clip.frames.length;
      const f = clip.frames[animFrame];
      const col = f % animCols, row = Math.floor(f / animCols);
      const pc = document.getElementById('animPreview');
      const ctx = pc.getContext('2d');
      ctx.clearRect(0, 0, pc.width, pc.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheetImg, col*animFW, row*animFH, animFW, animFH, 0, 0, pc.width, pc.height);
    }, 1000 / fps);
  } else {
    clearInterval(animInterval);
  }
}

// =========================================================================
// SHADERS TAB
// =========================================================================
let shaderGL = null;
let shaderProg = null;
let shaderRAF = null;
let shaderStartTime = Date.now();
let customUniforms = {};

const VERT_SRC = `attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0,1);}`;

async function initShadersTab() {
  const canvas = document.getElementById('shaderCanvas');
  resizeShaderCanvas();
  shaderGL = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!shaderGL) { document.getElementById('shaderError').textContent = 'WebGL not supported'; return; }
  setupShaderGeometry();
  compileShader();
  loadShaderList();
  window.addEventListener('resize', resizeShaderCanvas);
}

function resizeShaderCanvas() {
  const c = document.getElementById('shaderCanvas');
  const col = c.parentElement;
  if (col) { c.width = col.clientWidth || 380; c.height = col.clientHeight - 220 || 200; }
}

function setupShaderGeometry() {
  const gl = shaderGL;
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
}

function compileShader() {
  const gl = shaderGL;
  if (!gl) return;
  const fragSrc = document.getElementById('glslEditor').value;
  const errEl   = document.getElementById('shaderError');

  const vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vert, VERT_SRC);
  gl.compileShader(vert);

  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(frag, fragSrc);
  gl.compileShader(frag);

  if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    errEl.textContent = '⚠ ' + gl.getShaderInfoLog(frag);
    return;
  }
  errEl.textContent = '';

  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    errEl.textContent = '⚠ Link error: ' + gl.getProgramInfoLog(prog);
    return;
  }

  if (shaderProg) gl.deleteProgram(shaderProg);
  shaderProg = prog;
  document.getElementById('shaderStatus').textContent = '✓ compiled';

  if (!shaderRAF) renderShaderLoop();
}

function renderShaderLoop() {
  const gl = shaderGL;
  if (!gl || !shaderProg) { shaderRAF = null; return; }
  const c = document.getElementById('shaderCanvas');
  gl.viewport(0, 0, c.width, c.height);
  gl.useProgram(shaderProg);

  const pos = gl.getAttribLocation(shaderProg, 'a_pos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const t = (Date.now() - shaderStartTime) / 1000;
  const setf = (name, val) => { const loc = gl.getUniformLocation(shaderProg, name); if (loc) gl.uniform1f(loc, val); };
  const set2 = (name, a, b) => { const loc = gl.getUniformLocation(shaderProg, name); if (loc) gl.uniform2f(loc, a, b); };

  setf('u_time', t);
  set2('u_resolution', c.width, c.height);
  set2('u_mouse', mouseX / c.width, 1 - mouseY / c.height);

  Object.entries(customUniforms).forEach(([name, val]) => setf(name, parseFloat(val) || 0));

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  shaderRAF = requestAnimationFrame(renderShaderLoop);
}

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

function addUniform() {
  const name = document.getElementById('newUniformName').value.trim();
  if (!name) return;
  customUniforms[name] = 0;
  document.getElementById('newUniformName').value = '';
  const row = document.createElement('div');
  row.className = 'uniform-row';
  row.innerHTML = `<span>${name}</span>
    <input type="number" step="0.01" value="0" oninput="customUniforms['${name}']=this.value">
    <button class="btn-sm danger" onclick="delete customUniforms['${name}'];this.parentElement.remove()">✕</button>`;
  document.getElementById('uniformRows').appendChild(row);
}

async function loadShaderList() {
  const res = await fetch('/api/shaders');
  const list = await res.json();
  const el = document.getElementById('shaderList');
  el.innerHTML = '';
  list.forEach(s => {
    const d = document.createElement('div');
    d.className = 'shader-item';
    d.textContent = s.name;
    d.onclick = async () => {
      document.querySelectorAll('.shader-item').forEach(e => e.classList.remove('active'));
      d.classList.add('active');
      const code = await fetch('/api/shaders/' + s.name).then(r => r.text());
      document.getElementById('glslEditor').value = code;
      document.getElementById('shaderName').value = s.name;
      compileShader();
    };
    el.appendChild(d);
  });
}

async function saveShader() {
  let name = document.getElementById('shaderName').value.trim();
  if (!name.endsWith('.glsl')) name += '.glsl';
  const code = document.getElementById('glslEditor').value;
  await fetch('/api/shaders/' + name, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: code,
  });
  document.getElementById('shaderStatus').textContent = '💾 saved';
  loadShaderList();
}

async function deleteShader() {
  const name = document.getElementById('shaderName').value.trim();
  if (!name || !confirm('Delete ' + name + '?')) return;
  await fetch('/api/shaders/' + name, { method: 'DELETE' });
  loadShaderList();
}

async function loadAllAssets() {
  const res = await fetch('/api/assets');
  const all = await res.json();
  const el  = document.getElementById('allAssets');
  el.innerHTML = '';
  for (const [cat, items] of Object.entries(all)) {
    if (!items.length) continue;
    const h = document.createElement('div');
    h.style.cssText = 'grid-column:1/-1;color:#3498db;font-weight:bold;margin-top:8px';
    h.textContent = cat.toUpperCase();
    el.appendChild(h);
    items.forEach(item => {
      const isImg = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(item.name);
      const card = document.createElement('div');
      card.style.cssText = 'background:#0f1a2e;border-radius:6px;padding:8px;text-align:center;cursor:pointer';
      card.innerHTML = isImg
        ? `<img src="${item.path}" style="width:80px;height:80px;object-fit:contain;image-rendering:pixelated">`
        : `<div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:2rem">🔊</div>`;
      const n = document.createElement('div');
      n.textContent = item.name;
      n.style.cssText = 'font-size:.65rem;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      card.appendChild(n);
      el.appendChild(card);
    });
  }
}

// -------------------------------------------------------------------------
// Status
// -------------------------------------------------------------------------
function setStatus(msg) { document.getElementById('statusBar').textContent = msg; }
</script>
</body>
</html>"""


@app.route("/")
def index():
    return render_template_string(DRAW_APP_HTML)


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("FrankForge Asset Server")
    print(f"  Assets dir : {ASSET_DIR}")
    print(f"  URL        : http://localhost:5050")
    print()
    app.run(host="0.0.0.0", port=5050, debug=True)
