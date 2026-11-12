# 🧪 FrankForge 🔥

> *"In the beginning, there was chaos... then came the Engineer."*

![FrankForge](https://api.placeholder.com/800/300?text=FrankForge)

## 🚀 Welcome to the Strange New World

On a distant alien planet rich with exotic resources, you've crash-landed with nothing but your wits and engineering knowledge. **FrankForge** challenges you to master the mysterious elements of this world, building industrial solutions to real world problems!
Want to experience the engineering challenge of life on mars? 

Will you tame the volatile xenocrystals? Can you harness the planet's corrosive atmosphere? The future of this world—and your survival—depends on your chemical genius!

## ⚙️ The Process Engine (real physics, Factorio-style play)

The plant simulation lives in `rust/` and runs in the browser as WebAssembly. It plays like Factorio
(place buildings, lay pipe, keep the lights on) but the fluids, heat and power behave like a real plant:

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

```bash
cd rust && cargo test --release --lib     # engine tests
cd frontend && npm run wasm && npm run dev  # build the engine, then play
```

Art and sound come from `art/generate.py` (prompts in `art/prompts.tsv`) and are packed for the game by
`art/process.py`. Animations come from `art/animate.py` (motions in `art/anims.tsv`): each sprite is
animated on a magenta screen with Seedance image-to-video, then keyed and packed into sprite sheets under
`frontend/public/assets/process/anim/` with an `anims.json` manifest. Buildings animate only while running;
explosions, fires, spills, leaks, toxic clouds and sparks follow what the engine reports; the engineer and the
alien crawlers walk, idle, build and attack in the four isometric diagonals.

## ✨ Unleash Your Inner Mad Scientist

- 🧪 **Concoct Mind-Bending Reactions** - Balance chemical equations that would make your old professor faint
- 🌋 **Master the Elements** - Control heat, pressure, and exotic catalysts in a delicate dance of creation
- 🏭 **Build Industrial Empires** - From humble methane extractors to towering nuclear reactors
- 💥 **Face the Consequences** - One miscalculation and... BOOM! (Don't worry, you'll respawn)
- 💾 **Cloud Saves** - Your creations persist across the cosmos (or at least across devices)

## 🛠️ The Alchemy of Technology

This digital cauldron is brewed with:

- ⚡ **Svelte + TypeScript** - For lightning-fast interfaces
- 🦀 **Rust via WebAssembly** - Conjuring blazing performance from the void
- 🗄️ **Supabase** - Where your creations are immortalized
- 🌐 **Web Application** - Playable across dimensions (or just different browsers)

## 🗺️ The Grand Expedition

### 🌱 Phase 1: First Contact (2-3 weeks)
Your initial days on the alien world, establishing basic survival systems...

### 🔍 Phase 2: Strange Discoveries (4-6 weeks)
Venture deeper into the planet's secrets, unlocking new elements and reactions...

### 🏗️ Phase 3: Industrial Revolution (3-4 weeks)
As your understanding grows, so do your creations...

### ✨ Phase 4: Transcendence (3-4 weeks)
Master the planet's most exotic phenomena and bend physics to your will...

## 🌌 Alien Resources Awaiting Discovery

### 🔮 Basic Elements
- 🔥 **Methane (CH₄)** - Bubbling from mysterious vents
- 💨 **Oxygen (O₂)** - Rarer than you'd expect
- 💧 **Water (H₂O)** - The universal solvent, with unusual properties here
- ☁️ **Carbon Dioxide (CO₂)** - Waste or resource? You decide
- ⚡ **Hydrogen (H₂)** - The universe's building block
- 🟡 **Sulfur (S)** - Yellow crystals with pungent power

### 💎 Advanced Elements
- 🧪 **Sulfuric Acid (H₂SO₄)** - Handle with extreme care!
- 🌫️ **Ammonia (NH₃)** - A stinky but crucial compound
- 🟢 **Methanol (CH₃OH)** - Potent and versatile
- ✨ **Xenocrystals** - Mysterious alien formations that defy Earth chemistry
- 🔮 **Alien Enzymes** - Living catalysts with unpredictable properties

## 🏗️ Construct Remarkable Machines

### Resource Extraction
Extract the planet's bounty with specialized harvesters...

### Processing Wonders
Transform raw materials into industrial marvels...

### Storage & Transportation
Move resources through your growing empire...

### Power Generation
From simple combustion to exotic alien energy sources...

### Utility Structures
Support buildings that enhance your entire operation...

## 🧙‍♂️ Join the Experiment

### 📋 Prerequisites
- Node.js (v16+) - *The Conductor*
- Rust (1.65+) - *The Alchemist*
- wasm-pack - *The Translator*
- Supabase account - *The Archivist*

### 🔮 Summoning the Project

1. **Clone the ancient texts:**
   ```bash
   git clone https://github.com/your-username/frankforge.git
   cd frankforge
   ```

2. **Perform the initialization ritual:**
   ```bash
   ./setup.sh
   ```

3. **Connect to the ethereal plane (Supabase):**
   ```
   VITE_SUPABASE_URL=your_mystical_portal
   VITE_SUPABASE_ANON_KEY=your_arcane_key
   ```

4. **Awaken the development spirits:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Forge the WASM artifacts:**
   ```bash
   cd rust
   wasm-pack build --target web
   ```

## 🧩 The Architecture of Madness

```
frankforge/
├── frontend/                  # The Interface to Your Creation
├── rust/                      # The Beating Heart of the Simulation
└── supabase/                  # The Memory of Your World
```

## 🤝 Join Our Coven of Contributors

Have ideas for exotic new reactions? Discovered a bug in the space-time continuum? Contributions are welcome! Fork the repository, make your changes, and submit a Pull Request to join our mad science experiment!

## 📜 The Fine Print

This project is licensed under the MIT License - may your creations bring wonder, not destruction, to the universe.

## 💭 Mysterious Notes

*"The planet's atmosphere seems to react strangely during the third moon's eclipse..."*

*"Has anyone else noticed the xenocrystals glowing when exposed to methane gas?"*

*"Day 372: I've created something... unexpected. It moves on its own now..."*