/**
 * Items, recipes and the research tree.
 *
 * Solids are the frontend's business: you mine and smelt metals, craft parts by hand or in
 * assemblers, and spend them on buildings. Fluids stay in the process engine; the chemical plant
 * is where the two meet, turning piped-in chemicals into solid products.
 */

export interface Item {
  id: string;
  name: string;
  /** Icon under assets/process/icons/. */
  icon: string;
  stack: number;
  /** Fuel value [J] for burner buildings. */
  fuel?: number;
  /** The building it places. */
  places?: string;
  /** Gear slot it goes in. */
  gear?: 'armor' | 'weapon' | 'ammo';
}

const item = (id: string, name: string, stack = 100, extra: Partial<Item> = {}): Item =>
  ({ id, name, icon: `item_${id}`, stack, ...extra });
const building = (id: string, name: string, stack = 50): Item => ({ id, name, icon: `b_${id}`, stack, places: id });

export const ITEMS: Record<string, Item> = Object.fromEntries([
  item('wood', 'Wood', 100, { fuel: 15e6 }),
  item('stone', 'Stone', 50),
  item('iron_ore', 'Iron ore', 50),
  item('copper_ore', 'Copper ore', 50),
  item('silicon_ore', 'Silica sand', 50),
  item('sulfur', 'Sulfur', 50),
  item('iron_plate', 'Iron plate'),
  item('copper_plate', 'Copper plate'),
  item('steel_plate', 'Steel plate'),
  item('silicon', 'Silicon'),
  item('stone_brick', 'Stone brick'),
  item('iron_gear', 'Iron gear wheel'),
  item('copper_cable', 'Copper cable', 200),
  item('circuit', 'Electronic circuit', 200),
  item('plastic', 'Plastic bar'),
  item('solid_fuel', 'Solid fuel', 50, { fuel: 45e6 }),
  item('ammo', 'Firearm magazine', 200, { gear: 'ammo' }),
  item('ammo_piercing', 'Piercing magazine', 200, { gear: 'ammo' }),
  item('pistol', 'Pistol', 5, { gear: 'weapon' }),
  item('smg', 'Submachine gun', 5, { gear: 'weapon' }),
  item('armor_light', 'Light armor', 1, { gear: 'armor' }),
  item('armor_heavy', 'Heavy armor', 1, { gear: 'armor' }),
  item('repair_pack', 'Repair pack'),
  item('science_red', 'Automation science pack', 200),
  item('science_green', 'Logistic science pack', 200),
  item('science_blue', 'Chemical science pack', 200),
  { ...item('pipe', 'Pipe'), places: 'pipe' },
  ...[
    ['transport_belt', 'Transport belt'], ['underground_belt', 'Underground belt'], ['splitter', 'Splitter'],
    ['inserter', 'Inserter'], ['burner_inserter', 'Burner inserter'], ['wooden_chest', 'Wooden chest'], ['iron_chest', 'Iron chest'],
    ['burner_drill', 'Burner mining drill'], ['electric_drill', 'Electric mining drill'],
    ['stone_furnace', 'Stone furnace'], ['electric_furnace', 'Electric furnace'], ['assembler', 'Assembling machine'],
    ['chemical_plant', 'Chemical plant'], ['lab', 'Lab'], ['gun_turret', 'Gun turret'], ['laser_turret', 'Laser turret'],
    ['power_pole', 'Power pole'], ['substation', 'Substation'], ['burner_generator', 'Burner generator'],
    ['valve', 'Gate valve'], ['check_valve', 'Check valve'], ['pump', 'Centrifugal pump'], ['compressor', 'Gas compressor'],
    ['storage_tank', 'Storage tank'], ['gas_sphere', 'Pressure sphere'], ['water_well', 'Water well'], ['gas_well', 'Gas well'],
    ['air_intake', 'Air blower'], ['vent', 'Atmospheric vent'], ['flare_stack', 'Flare stack'], ['fired_boiler', 'Fired boiler'],
    ['steam_turbine', 'Steam turbine'], ['condenser', 'Air-cooled condenser'], ['solar_array', 'Solar array'],
    ['battery_bank', 'Battery bank'], ['heat_exchanger', 'Heat exchanger'], ['electric_heater', 'Electric heater'],
    ['flash_drum', 'Flash drum'], ['smr_reformer', 'Steam methane reformer'], ['shift_reactor', 'Shift reactor'],
    ['ammonia_converter', 'Ammonia converter'], ['methanol_reactor', 'Methanol reactor'], ['cracker_furnace', 'Cracking furnace'],
    ['electrolyser', 'Electrolyser'], ['cstr', 'Jacketed CSTR'],
  ].map(([id, name]) => building(id, name)),
].map(i => [i.id, ['transport_belt', 'underground_belt', 'splitter'].includes(i.id) ? { ...i, icon: `item_${i.id}` }
  : i.id === 'burner_inserter' ? { ...i, icon: 'b_inserter' } : i]));

/** Where a recipe can be made. Hand recipes can also be made in an assembler. */
export type Station = 'hand' | 'smelt' | 'chem';

export interface Recipe {
  id: string;
  out: string;
  count: number;
  in: Record<string, number>;
  /** Fluids the chemical plant draws from its vessel [mol]. */
  fluids?: Record<string, number>;
  time: number;
  station: Station;
}

const r = (out: string, count: number, inputs: Record<string, number>, time: number, station: Station = 'hand', id = out): Recipe =>
  ({ id, out, count, in: inputs, time, station });

export const RECIPES: Record<string, Recipe> = Object.fromEntries(([
  // Smelting.
  r('iron_plate', 1, { iron_ore: 1 }, 3.2, 'smelt'),
  r('copper_plate', 1, { copper_ore: 1 }, 3.2, 'smelt'),
  r('stone_brick', 1, { stone: 2 }, 3.2, 'smelt'),
  r('steel_plate', 1, { iron_plate: 5 }, 16, 'smelt'),
  r('silicon', 1, { silicon_ore: 2 }, 6.4, 'smelt'),
  // Intermediates.
  r('iron_gear', 1, { iron_plate: 2 }, 0.5),
  r('copper_cable', 2, { copper_plate: 1 }, 0.5),
  r('circuit', 1, { iron_plate: 1, copper_cable: 3 }, 0.5),
  r('pipe', 1, { iron_plate: 1 }, 0.5),
  // From the process plant: ~1 kg of product per batch of feed gas.
  { id: 'plastic', out: 'plastic', count: 1, in: {}, fluids: { c2h4: 36 }, time: 1, station: 'chem' },
  { id: 'solid_fuel', out: 'solid_fuel', count: 1, in: {}, fluids: { ch4: 60 }, time: 2, station: 'chem' },
  // Combat and gear.
  r('ammo', 1, { iron_plate: 4 }, 1),
  r('ammo_piercing', 1, { ammo: 1, steel_plate: 1, copper_plate: 5 }, 3),
  r('pistol', 1, { iron_plate: 5, copper_plate: 5 }, 5),
  r('smg', 1, { iron_gear: 10, copper_plate: 5, iron_plate: 10 }, 10),
  r('armor_light', 1, { iron_plate: 40 }, 3),
  r('armor_heavy', 1, { copper_plate: 100, steel_plate: 50 }, 8),
  r('repair_pack', 1, { circuit: 2, iron_gear: 2 }, 0.5),
  // Science.
  r('science_red', 1, { copper_plate: 1, iron_gear: 1 }, 5),
  r('science_green', 1, { inserter: 1, transport_belt: 1 }, 6),
  r('science_blue', 2, { plastic: 2, sulfur: 1, circuit: 3 }, 10),
  // Logistics.
  r('transport_belt', 2, { iron_gear: 1, iron_plate: 1 }, 0.5),
  r('underground_belt', 2, { iron_plate: 10, transport_belt: 5 }, 1),
  r('splitter', 1, { circuit: 5, iron_plate: 5, transport_belt: 4 }, 1),
  r('inserter', 1, { circuit: 1, iron_gear: 1, iron_plate: 1 }, 0.5),
  r('burner_inserter', 1, { iron_gear: 1, iron_plate: 1 }, 0.5),
  r('wooden_chest', 1, { wood: 2 }, 0.5),
  r('iron_chest', 1, { iron_plate: 8 }, 0.5),
  // Production.
  r('burner_drill', 1, { iron_gear: 3, stone_furnace: 1, iron_plate: 3 }, 2),
  r('electric_drill', 1, { circuit: 3, iron_gear: 5, iron_plate: 10 }, 2),
  r('stone_furnace', 1, { stone: 5 }, 0.5),
  r('electric_furnace', 1, { steel_plate: 10, circuit: 5, stone_brick: 10 }, 5),
  r('assembler', 1, { circuit: 3, iron_gear: 5, iron_plate: 9 }, 0.5),
  r('chemical_plant', 1, { steel_plate: 5, iron_gear: 5, circuit: 5, pipe: 5 }, 5),
  r('lab', 1, { circuit: 10, iron_gear: 10, transport_belt: 4 }, 2),
  r('gun_turret', 1, { iron_gear: 10, copper_plate: 10, iron_plate: 20 }, 8),
  r('laser_turret', 1, { steel_plate: 20, circuit: 20, plastic: 10 }, 20),
  // Power.
  r('power_pole', 2, { wood: 1, copper_cable: 2 }, 0.5),
  r('burner_generator', 1, { iron_gear: 5, stone_furnace: 1, copper_cable: 10, pipe: 2 }, 3),
  r('substation', 1, { steel_plate: 5, circuit: 5, copper_plate: 5 }, 5),
  r('solar_array', 1, { steel_plate: 5, circuit: 15, copper_plate: 5, silicon: 5 }, 10),
  r('battery_bank', 1, { circuit: 5, copper_plate: 10, sulfur: 10, iron_plate: 10 }, 5),
  r('steam_turbine', 1, { iron_gear: 20, copper_plate: 10, pipe: 10, steel_plate: 5 }, 5),
  r('condenser', 1, { pipe: 10, iron_gear: 10, iron_plate: 10 }, 3),
  r('fired_boiler', 1, { pipe: 10, stone_brick: 5, iron_plate: 10 }, 3),
  r('electric_heater', 1, { copper_cable: 10, iron_plate: 5, circuit: 2 }, 2),
  // Fluids.
  r('valve', 1, { pipe: 2, iron_gear: 1 }, 0.5),
  r('check_valve', 1, { pipe: 2, iron_gear: 1 }, 0.5),
  r('pump', 1, { pipe: 2, iron_gear: 2, circuit: 1 }, 2),
  r('compressor', 1, { iron_gear: 10, steel_plate: 5, circuit: 5 }, 5),
  r('water_well', 1, { iron_gear: 10, pipe: 5, circuit: 2 }, 3),
  r('gas_well', 1, { iron_gear: 5, pipe: 10, iron_plate: 10 }, 3),
  r('air_intake', 1, { iron_gear: 5, circuit: 2, iron_plate: 5 }, 2),
  r('vent', 1, { pipe: 3 }, 0.5),
  r('flare_stack', 1, { pipe: 5, steel_plate: 10 }, 3),
  r('storage_tank', 1, { iron_plate: 20, steel_plate: 5 }, 3),
  r('gas_sphere', 1, { steel_plate: 30, pipe: 5 }, 5),
  r('heat_exchanger', 1, { pipe: 10, copper_plate: 10, steel_plate: 5 }, 3),
  r('flash_drum', 1, { steel_plate: 10, pipe: 5 }, 3),
  // Reactors.
  r('smr_reformer', 1, { steel_plate: 30, stone_brick: 20, pipe: 10, circuit: 10 }, 10),
  r('shift_reactor', 1, { steel_plate: 15, pipe: 5 }, 5),
  r('ammonia_converter', 1, { steel_plate: 40, circuit: 10, pipe: 10 }, 10),
  r('methanol_reactor', 1, { steel_plate: 20, circuit: 10, pipe: 5 }, 8),
  r('cracker_furnace', 1, { steel_plate: 20, stone_brick: 20, pipe: 10 }, 8),
  r('electrolyser', 1, { copper_plate: 20, steel_plate: 10, circuit: 10 }, 8),
  r('cstr', 1, { steel_plate: 15, pipe: 10, circuit: 5, iron_gear: 5 }, 8),
] as Recipe[]).map(x => [x.id, x]));

export interface Tech {
  id: string;
  name: string;
  description: string;
  /** Science packs per unit, units, and seconds per unit. */
  packs: string[];
  units: number;
  time: number;
  prereqs: string[];
  /** Recipes it unlocks. */
  unlocks: string[];
  /** Other effects, applied by the game. */
  effects?: { damage?: number; inventory?: number; reach?: number };
}

const t = (id: string, name: string, description: string, packs: string[], units: number, prereqs: string[], unlocks: string[], effects?: Tech['effects']): Tech =>
  ({ id, name, description, packs, units, time: packs.length > 2 ? 30 : packs.length > 1 ? 15 : 10, prereqs, unlocks, effects });

const R = ['science_red'];
const RG = ['science_red', 'science_green'];
const RGB = ['science_red', 'science_green', 'science_blue'];

export const TECHS: Tech[] = [
  t('automation', 'Automation', 'Assembling machines craft for you.', R, 10, [], ['assembler']),
  t('logistics', 'Logistics', 'Underground belts and splitters.', R, 20, [], ['underground_belt', 'splitter']),
  t('turrets', 'Turrets', 'Gun turrets defend your base with magazines.', R, 10, [], ['gun_turret']),
  t('military', 'Military', 'The submachine gun.', R, 10, [], ['smg']),
  t('weapons_1', 'Weapon damage 1', 'Bullets do 25 % more damage.', R, 20, ['military'], [], { damage: 0.25 }),
  t('steel', 'Steel processing', 'Smelt iron plates into steel.', R, 50, [], ['steel_plate']),
  t('fluid_handling', 'Fluid handling', 'Pumps, compressors, tanks and drums.', R, 50, ['steel'],
    ['pump', 'compressor', 'storage_tank', 'gas_sphere', 'flash_drum', 'heat_exchanger', 'flare_stack']),
  t('logistic_science', 'Logistic science', 'Logistic science packs.', R, 75, ['logistics'], ['science_green']),
  t('toolbelt', 'Toolbelt', '20 more inventory slots.', RG, 50, ['logistic_science'], [], { inventory: 20 }),
  t('electric_energy', 'Electric energy distribution', 'Substations, batteries and electric heaters.', RG, 75, ['logistic_science', 'steel'],
    ['substation', 'battery_bank', 'electric_heater']),
  t('solar', 'Solar energy', 'Smelt silicon and build solar arrays.', RG, 100, ['electric_energy'], ['silicon', 'solar_array']),
  t('advanced_smelting', 'Advanced material processing', 'Electric furnaces.', RG, 75, ['logistic_science', 'steel'], ['electric_furnace']),
  t('military_2', 'Military 2', 'Piercing magazines and heavy armor.', RG, 50, ['logistic_science', 'military', 'steel'], ['ammo_piercing', 'armor_heavy']),
  t('weapons_2', 'Weapon damage 2', 'Bullets do 25 % more damage.', RG, 75, ['weapons_1', 'logistic_science'], [], { damage: 0.25 }),
  t('chemistry', 'Chemistry', 'The chemical plant, the cracking furnace, plastic and solid fuel.', RG, 100, ['fluid_handling', 'logistic_science'],
    ['chemical_plant', 'cracker_furnace', 'plastic', 'solid_fuel']),
  t('reforming', 'Reforming', 'Steam methane reforming, water–gas shift and electrolysis for hydrogen.', RG, 100, ['fluid_handling', 'logistic_science'],
    ['smr_reformer', 'shift_reactor', 'electrolyser']),
  t('reactor_engineering', 'Reactor engineering', 'The jacketed CSTR.', RG, 100, ['reforming'], ['cstr']),
  t('chemical_science', 'Chemical science', 'Chemical science packs, from plastic and sulfur.', RG, 75, ['chemistry'], ['science_blue']),
  t('synthesis', 'Synthesis loops', 'Ammonia and methanol converters.', RGB, 100, ['chemical_science', 'reforming'], ['ammonia_converter', 'methanol_reactor']),
  t('lasers', 'Laser turrets', 'Turrets that burn grid power instead of ammunition.', RGB, 100, ['chemical_science', 'turrets', 'electric_energy'], ['laser_turret']),
  t('weapons_3', 'Weapon damage 3', 'Bullets do 50 % more damage.', RGB, 150, ['weapons_2', 'chemical_science'], [], { damage: 0.5 }),
  t('long_reach', 'Long reach', 'Build and mine 4 tiles further away.', RGB, 100, ['chemical_science'], [], { reach: 4 }),
];

export const TECH: Record<string, Tech> = Object.fromEntries(TECHS.map(x => [x.id, x]));

/** Recipes no research is needed for. */
export const STARTING_RECIPES = Object.keys(RECIPES).filter(id => !TECHS.some(t => t.unlocks.includes(id)));

/** The recipe that makes an item, if any. */
export function recipeFor(itemId: string): Recipe | undefined {
  return RECIPES[itemId] ?? Object.values(RECIPES).find(x => x.out === itemId);
}

/** Where an item's icon is. */
export function iconUrl(itemId: string): string {
  return `assets/process/icons/${ITEMS[itemId]?.icon ?? itemId}.png`;
}
