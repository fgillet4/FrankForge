/**
 * Survival goals: one at a time, in the order the tech tree opens up, so a new player always has
 * a next step. A goal counts as met the moment the world shows it, and stays met.
 */

export interface GoalWorld {
  /** Items in the pockets. */
  has(item: string): number;
  /** Buildings of a kind standing in the world. */
  built(kind: string): number;
  researched(tech: string): boolean;
  kills: number;
}

export interface Goal {
  title: string;
  hint: string;
  /** Progress towards it, 0 to 1. */
  progress(w: GoalWorld): number;
}

const count = (n: number, of: number) => Math.min(1, n / of);
const any = (...p: number[]) => Math.max(...p);

export const GOALS: Goal[] = [
  { title: 'Chop 10 wood', hint: 'Hold right-click on a tree.', progress: w => count(w.has('wood'), 10) },
  { title: 'Break rocks for 10 stone', hint: 'Hold right-click on a rock.', progress: w => count(w.has('stone'), 10) },
  { title: 'Put down your burner drill', hint: 'Over iron ore, facing a furnace. Pick it from the bar or press E.',
    progress: w => count(w.built('burner_drill'), 1) },
  { title: 'Put down a stone furnace', hint: 'Where the drill drops its ore. Ctrl/⌘-click it to load fuel.',
    progress: w => count(w.built('stone_furnace'), 1) },
  { title: 'Make 20 iron plates', hint: 'Fuel the drill and furnace with wood; Ctrl/⌘-click the furnace to collect.',
    progress: w => count(w.has('iron_plate'), 20) },
  { title: 'Craft and place an inserter', hint: 'Burner inserters move items between belts, chests and machines.',
    progress: w => count(w.built('burner_inserter') + w.built('inserter'), 1) },
  { title: 'Run 3 drills', hint: 'More drills, more ore. Belts carry it to the furnaces.',
    progress: w => count(w.built('burner_drill') + w.built('electric_drill'), 3) },
  { title: 'Lay 20 belts', hint: 'Drag to lay a line of belt; R turns it.', progress: w => count(w.built('transport_belt'), 20) },
  { title: 'Get power flowing', hint: 'A burner generator and power poles. Buildings need to be inside a pole\'s area.',
    progress: w => (count(w.built('burner_generator'), 1) + count(w.built('power_pole'), 2)) / 2 },
  { title: 'Research Automation', hint: 'Build a lab, put red science in it and pick a tech with T.',
    progress: w => w.researched('automation') ? 1 : count(w.built('lab'), 1) * 0.5 },
  { title: 'Build an assembler', hint: 'Click it to set a recipe; inserters feed it.', progress: w => count(w.built('assembler'), 1) },
  { title: 'Defend yourself', hint: 'Research Turrets and load a gun turret with magazines.',
    progress: w => any(count(w.built('gun_turret'), 1), w.researched('turrets') ? 0.5 : 0) },
  { title: 'Kill 10 aliens', hint: 'Hold Space to shoot. Pollution draws them in.', progress: w => count(w.kills, 10) },
  { title: 'Research Steel processing', hint: 'Steel is the key to pressure vessels.', progress: w => w.researched('steel') ? 1 : 0 },
  { title: 'Research Logistic science', hint: 'Green science opens the second half of the tree.',
    progress: w => w.researched('logistic_science') ? 1 : 0 },
  { title: 'Research Fluid handling', hint: 'Pumps, compressors, tanks: the start of the process plant.',
    progress: w => w.researched('fluid_handling') ? 1 : 0 },
  { title: 'Tap a gas well', hint: 'On a natural-gas deposit. Pipe it to storage.', progress: w => count(w.built('gas_well'), 1) },
  { title: 'Research Chemistry', hint: 'Crack ethane into ethylene in the cracking furnace.', progress: w => w.researched('chemistry') ? 1 : 0 },
  { title: 'Make 10 plastic', hint: 'In a chemical plant fed with ethylene.', progress: w => count(w.has('plastic'), 10) },
  { title: 'Research Chemical science', hint: 'Blue science, from plastic and sulfur.',
    progress: w => w.researched('chemical_science') ? 1 : 0 },
  { title: 'Research Synthesis loops', hint: 'Ammonia and methanol: a real chemical plant.', progress: w => w.researched('synthesis') ? 1 : 0 },
  { title: 'Make ammonia', hint: 'Hydrogen from reforming, nitrogen from the air, a converter at pressure.',
    progress: w => count(w.built('ammonia_converter'), 1) },
];
