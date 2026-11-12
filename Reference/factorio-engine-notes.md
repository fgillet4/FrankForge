# Factorio 2.0 engine behaviour (clean-room notes)

Observed from the Factorio 2.0.76 headless Linux binary (symbols + disassembly of a few
functions, via REA/objdump, 2026-11-12). These notes describe *behaviour* only, so FrankForge can
decide where to follow it and where to replace it with real physics. No code was copied.

## Fluids — `FluidSegmentManager`, `FluidFlowManager`, `FluidBuffer::performFlow`
- Connected pipes merge into a **segment** that shares one fluid buffer (`FluidSegment::merge`,
  `tryToSplitSegments` on removal). The per-tile pipe simulation of 1.x is gone.
- Each tick `FluidFlowManager::update` walks every fluid box; each box *pushes* into its output
  connections and *pulls* from its input connections with `performFlow(from, to)`.
- `performFlow` moves `min(fill_from × 100, (1 − fill_to) × 100, available, free_space)` units per
  tick, where fill = amount / capacity, `MAX_FLOW` = 100 and the floor is 0.1/tick. Amounts are
  40.24 fixed point. A buffer may hold back a reserved fraction of its capacity.
- So flow is driven by **fill ratio**, not pressure: no viscosity, pipe diameter, elevation,
  compressibility, phase or mixtures (one fluid + one temperature per box).

## Heat — `HeatBuffer::update`, `HeatBuffer::transferTo`
- Energy and temperature: T = default_T + E / specific_heat.
- `update` recurses depth-first from hot to cold neighbours (each buffer updated once per tick),
  then `transferTo` moves a fixed fraction of the energy difference toward equilibrium (1/2.5
  between different prototypes, 0.2 between the same), capped by `max_transfer` and capacity.
- No thermal conductance, no losses to the environment, and effectively instant propagation.

## Electricity — `ElectricNetwork::update`
- Per sub-network: compares `getDemand` with `getAvailableProduction` and accumulators, then sets one
  satisfaction ratio for every consumer. There's no frequency, inertia, governor or line loss.

## What FrankForge does instead (rust/src)
| Factorio | FrankForge |
|---|---|
| Segment = one buffer | Kept: pipe runs merge into one vessel node (cheap), but each connection is a real pipe |
| Fill-ratio flow | Darcy–Weisbach flow with pipe inertia, Swamee–Jain friction, hydrostatic head, choked gas flow |
| One fluid + temperature | Multicomponent moles + internal energy; T, P and phase split from a Peng–Robinson VT/UV flash |
| Recipe converts fluids | Reaction kinetics limited by Gibbs equilibrium (K from Shomate ΔG°); heat of reaction falls out of enthalpy conservation |
| Heat: DFS fraction transfer | Conductance network (G = kA/L), heat capacity, convective and radiative losses to ambient |
| Electric satisfaction ratio | Swing-equation grid frequency, generator inertia, droop governors, under-frequency load shedding |
