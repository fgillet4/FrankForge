use super::*;

fn world() -> World {
    World::new(293.15)
}

fn pipe_line(w: &mut World, next_id: &mut u32, from: Tile, to: Tile) {
    let (mut x, mut y) = from;
    loop {
        w.place(*next_id, "pipe", x, y, 0).unwrap();
        *next_id += 1;
        if (x, y) == to {
            break;
        }
        if x != to.0 {
            x += (to.0 - x).signum();
        } else {
            y += (to.1 - y).signum();
        }
    }
}

fn vessel_of(w: &World, id: u32) -> &Vessel {
    &w.net.vessels[w.entities[&id].net_vessels[0]]
}

#[test]
fn a_solar_powered_well_fills_a_tank_with_water() {
    let mut w = world();
    let mut id = 100;
    w.place(1, "solar_array", -4, 0, 0).unwrap();
    w.place(2, "water_well", 0, 0, 0).unwrap(); // port at (2, 0)
    pipe_line(&mut w, &mut id, (2, 0), (6, 0));
    w.place(3, "storage_tank", 7, -1, 0).unwrap(); // west port (rot 0, (-1, 1)) lands on (6, 0)
    w.advance(0.0);
    assert_eq!(w.segments.len(), 1);
    for _ in 0..600 {
        w.advance(0.1);
    }
    let tank = vessel_of(&w, 3);
    let water = tank.n[index_of("h2o").unwrap()] * 0.018;
    assert!(water > 50.0, "{water} kg");
    assert!(tank.level() > 0.0);
    // The pump only ran because the sun was up, and the inverters settle rather than hunt.
    assert!(w.grid.load_w > 0.0 && !w.grid.blackout, "{:?}", w.grid.load_w);
    let mut fs = vec![];
    for _ in 0..40 {
        w.advance(0.05);
        fs.push(w.grid.frequency);
    }
    let spread = fs.iter().cloned().fold(f64::MIN, f64::max) - fs.iter().cloned().fold(f64::MAX, f64::min);
    assert!(spread < 0.05, "frequency hunting over {spread} Hz: {fs:?}");
}

#[test]
fn natural_gas_into_an_atmospheric_tank_bursts_it() {
    let mut w = world();
    let mut id = 100;
    w.place(1, "gas_well", 0, 0, 0).unwrap();
    pipe_line(&mut w, &mut id, (2, 0), (6, 0));
    w.place(3, "storage_tank", 7, -1, 0).unwrap();
    let mut events = vec![];
    for _ in 0..1200 {
        w.advance(0.1);
        events.extend(w.snapshot().events);
        if !events.is_empty() {
            break;
        }
    }
    assert!(events.iter().any(|e| e.contains("Storage tank ruptured")), "{events:?}");
}

#[test]
fn venting_gas_counts_as_emissions_and_pipe_contents_survive_rebuilds() {
    let mut w = world();
    let mut id = 100;
    w.place(1, "gas_well", 0, 0, 0).unwrap();
    pipe_line(&mut w, &mut id, (2, 0), (5, 0));
    w.place(2, "vent", 5, 1, 2).unwrap(); // rotated half a turn: its port points north onto (5, 0)
    for _ in 0..100 {
        w.advance(0.1);
    }
    let ch4 = w.snapshot().emitted_kg.get("ch4").copied().unwrap_or(0.0);
    assert!(ch4 > 1.0, "{ch4}");
    // Shut the well and add a pipe tile elsewhere: the line's gas is kept, not reset.
    w.set_opening(1, 0.0);
    w.remove(2);
    w.advance(0.5);
    let before = w.net.vessels[w.segments[0].vessel].moles();
    w.place(99, "pipe", 20, 20, 0).unwrap();
    w.advance(0.05);
    let seg = w.segments.iter().find(|s| s.tiles.contains(&(3, 0))).unwrap();
    let after = w.net.vessels[seg.vessel].moles();
    assert!((after / before - 1.0).abs() < 0.02, "{before} {after}");
}

#[test]
fn a_gas_fired_boiler_raises_steam() {
    let mut w = world();
    let mut id = 1000;
    w.place(1, "battery_bank", -10, -10, 0).unwrap();
    // Fuel: gas well → valve (throttled) → boiler fuel port at (-1, 0) of a boiler at (10, 0).
    w.place(2, "gas_well", 0, 0, 0).unwrap();
    pipe_line(&mut w, &mut id, (2, 0), (5, 0));
    w.place(3, "valve", 6, 0, 0).unwrap();
    pipe_line(&mut w, &mut id, (7, 0), (9, 0));
    // Air: blower at (0, 4) → (2, 4) … up to the air port at (9, 2).
    w.place(4, "air_intake", 0, 4, 0).unwrap();
    pipe_line(&mut w, &mut id, (2, 4), (9, 2));
    w.place(5, "fired_boiler", 10, 0, 0).unwrap();
    // Flue: one pipe tile on the boiler's north port (11, -1), and a stack feeding off it.
    w.place(6, "pipe", 11, -1, 0).unwrap();
    w.place(7, "vent", 11, -2, 0).unwrap();
    w.set_opening(3, 0.15);
    // Fill the drum with water.
    w.fill(5, "h2o", 0.0, 293.15);
    let drum = w.entities[&5].net_vessels[1];
    let mut n = [0.0; NS];
    n[index_of("h2o").unwrap()] = 150_000.0; // 2.7 t
    w.net.fill(drum, n, 293.15);
    let started = std::time::Instant::now();
    for _ in 0..600 {
        w.advance(0.1);
    }
    let fire = vessel_of(&w, 5);
    let steam = &w.net.vessels[drum];
    // Fast enough to run many times faster than real time.
    assert!(started.elapsed().as_secs_f64() < 6.0, "{:?}", started.elapsed());
    // Flue gas leaves as fast as fuel and air arrive.
    let flows: Vec<f64> = w.entities[&5].net_pipes.iter().map(|&pi| w.net.pipes[pi].mdot).collect();
    assert!((flows[0] + flows[1] + flows[2]).abs() < 0.05 * flows[2].abs(), "{flows:?}");
    // A few MW for a minute warms 2.7 t of water by over 10 K.
    assert!(steam.t() > 303.0, "drum {}", steam.t());
    let co2 = fire.n[index_of("co2").unwrap()];
    assert!(co2 > 0.0);
}

#[test]
fn a_steam_turbine_carries_the_grid_under_governor_control() {
    let mut w = world();
    let mut id = 1000;
    // A big drum of saturated water at ~30 bar stands in for the boiler.
    w.place(1, "gas_sphere", 0, 0, 0).unwrap(); // ports: top (1, -1), bottom (1, 3)
    pipe_line(&mut w, &mut id, (1, -1), (1, -3));
    pipe_line(&mut w, &mut id, (2, -3), (3, -3));
    w.place(2, "steam_turbine", 5, -4, 0).unwrap(); // in-port (-1, 1) → (4, -3)
    w.place(id, "pipe", 4, -3, 0).unwrap();
    id += 1;
    pipe_line(&mut w, &mut id, (8, -3), (10, -3)); // exhaust port (3, 1) → (8, -3)
    w.place(3, "condenser", 10, -2, 0).unwrap(); // steam port (1, -1) → (11, -3)
    w.place(id, "pipe", 11, -3, 0).unwrap();
    id += 1;
    // 2 MW of electric heating as the load, fed from the condensate side so it does something.
    w.place(4, "electric_heater", 20, 20, 0).unwrap();
    w.place(5, "battery_bank", -10, -10, 0).unwrap();
    w.advance(0.0);
    let sphere = w.entities[&1].net_vessels[0];
    let mut n = [0.0; NS];
    n[index_of("h2o").unwrap()] = 1_100_000.0; // ~20 t in 40 m³
    w.net.fill(sphere, n, 507.0);
    let p0 = w.net.vessels[sphere].p();
    assert!(p0 > 25e5 && p0 < 35e5, "{p0}");
    for _ in 0..600 {
        w.advance(0.1);
    }
    let turbine_power = match &w.net.pipes[w.entities[&2].net_pipes[0]].kind {
        PipeKind::Turbine { power_out, .. } => *power_out,
        _ => 0.0,
    };
    // The heater (1 MW) and condenser fans are carried, mostly by the turbine.
    assert!(turbine_power > 0.5e6, "{turbine_power}");
    assert!((w.grid.frequency - 50.0).abs() < 0.5, "{}", w.grid.frequency);
    assert!(!w.grid.blackout);
    // The condenser collects condensate.
    let cond = &w.net.vessels[w.entities[&3].net_vessels[0]];
    assert!(cond.liquid_volume() > 0.0, "condenser holds no liquid");
}
