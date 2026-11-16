# FrankForge

Build a chemical plant on an alien world. It plays like Factorio (walk around, place buildings, lay pipe,
keep the lights on), but the fluids, heat, chemistry and power grid behave like a real plant.

## The process engine

The plant simulation lives in `rust/` and runs in the browser as WebAssembly.

- **Real fluids.** Every vessel holds a mixture (moles of 11 species plus internal energy) and is
  flashed with the Peng–Robinson equation of state for temperature, pressure, and the liquid/vapour
  split. Water boils at the right temperature; closed drums sit on the saturation curve.
- **Pressure-driven flow.** Pipes carry flow with inertia, Darcy–Weisbach friction, hydrostatic head and
  choked gas flow, solved implicitly across the whole network. Pumps follow curves, valves have
  equal-percentage trim, compressors heat the gas, turbines expand steam isentropically.
- **Chemistry.** Reactions run at Arrhenius rates and stop at Gibbs equilibrium. Heat of reaction isn't
  scripted; it comes out of energy conservation.
- **Consequences.** Vessels burst at 1.5× their rating. Vented gas counts as emissions.
- **The grid.** Frequency follows the swing equation. Governors, batteries and solar curtailment respond
  to it, under-frequency relays shed load, and a collapse is a blackout that needs a black start.

How Factorio's own engine does it (and why we don't) is in `Reference/factorio-engine-notes.md`.

## Running it

Needs Node.js, Rust with the `wasm32-unknown-unknown` target, and `wasm-bindgen-cli`.

```bash
cd rust && cargo test --release --lib       # engine tests
cd frontend && npm install && npm run wasm  # build the engine
npm run dev                                 # play
```

`npm run build` builds the engine and a production bundle; `npm run check` type-checks the frontend.

## Playing

The main menu continues your saved world or lands on a new one: survival or sandbox, with aliens or
peaceful. Worlds are generated from a seed, planet type, size and resource richness, and the same settings
always make the same world, so a save (in the browser's local storage) is those settings plus what you've
built, carried, mined and researched.

**Survival** starts you with a burner drill, a stone furnace and a few plates. Chop trees and break rocks by
hand (hold right-click), dig ore, smelt it, and craft your way up (E): belts, inserters, drills, furnaces,
assemblers, a burner generator and power poles, labs and science packs. Research (T) unlocks steel, fluid
handling, power distribution, solar, chemistry, reforming, the jacketed CSTR and the synthesis loops, so
the process plant arrives as you earn it. Blue science needs plastic and sulfur, which means cracking ethane
and running a chemical plant. **Sandbox** has everything researched and free.

Power works like Factorio's: poles wire to each other within reach and power the buildings inside their
supply area, and each connected set of poles is its own grid with its own frequency. Extraction buildings
must stand mostly on their deposit. Pollution (vented gas, smoke from burners) draws attacks from alien
nests; shoot back with Space, and build gun or laser turrets. Production graphs are on P, the minimap is in
the corner (M to enlarge), and Tab / Shift-Tab change the simulation speed. Esc has the full controls.

## Code

```
frontend/src/
├── main.ts                 Phaser game: MenuScene → GroundScene (terrain) + WorldScene
├── scenes/MenuScene.ts     asset loading, main menu and the animated plant behind it
├── ui/menu.ts              DOM menus: new world, how to play, settings, pause
├── ui/hud.ts               survival HUD: inventory, crafting, machines, research, graphs, minimap
├── lib/game/               items and recipes, research, inventories, the factory (belts, inserters,
│                           drills, furnaces, assemblers, labs), combat, nature, and their renderer
├── lib/save.ts             saves, settings and world generation from a seed
├── lib/mapGenerator.ts     seeded planet maps
├── lib/phaser/             world scene, ground, iso maths, characters, aliens
└── lib/process/            engine bindings, plant rendering and the build/inspect overlay
rust/                       the process engine
art/                        asset generation and packing
```

## Art

Art and sound come from `art/generate.py` (prompts in `art/prompts.tsv`) and are packed for the game by
`art/process.py`. Animations come from `art/animate.py` (motions in `art/anims.tsv`): each sprite is
animated on a magenta screen with Seedance image-to-video, then keyed and packed into sprite sheets under
`frontend/public/assets/process/anim/` with an `anims.json` manifest. Buildings animate only while running;
explosions, fires, spills, leaks, toxic clouds and sparks follow what the engine reports; the engineer and the
alien crawlers walk, idle, build and attack in the four isometric diagonals.

## License

MIT
