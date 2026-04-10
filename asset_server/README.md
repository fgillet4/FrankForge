# FrankForge Asset Server

A local Flask server for uploading, managing, and drawing game assets.

## Setup

```bash
cd frankforge/asset_server
pip install -r requirements.txt
python server.py
```

Then open **http://localhost:5050**

## Features

### Drawing App (`/`)
- Pixel-art canvas editor with zoom (1×–20×)
- Tools: pencil, eraser, flood-fill, eyedropper, rectangle, line
- Mirror-X for symmetric isometric sprites
- Isometric diamond guide overlay (◆ button)
- Built-in color palette + custom color picker
- Isometric tile preview (bottom-right corner)
- Save directly to server or download PNG

### REST API
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/assets` | Full asset manifest (all categories) |
| GET | `/api/assets/<category>` | Assets in one category (`sprites`, `tiles`, `audio`, `uploads`) |
| POST | `/api/upload` | Upload files (multipart, field: `files`) |
| DELETE | `/api/delete` | Delete by path `{"path": "/assets/sprites/foo.png"}` |
| POST | `/api/save_tile` | Save drawn tile `{"name": "grass.png", "dataURL": "data:image/png;..."}` |
| POST | `/api/resize` | Resize image `{"path": "...", "width": 64, "height": 32}` |
| GET | `/assets/<path>` | Serve raw asset files |

## Asset directories

```
asset_server/
└── assets/
    ├── sprites/    ← character / building sprites
    ├── tiles/      ← isometric tiles saved from the drawing app
    ├── audio/      ← WAV / MP3 / OGG sound files
    └── uploads/    ← drag-and-drop uploads
```

Copy files from `asset_server/assets/` into `frontend/public/assets/` to use them in-game.
