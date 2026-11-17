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
    w.place(4, "power_pole", -1, 2, 0).unwrap(); // its 5×5 area reaches both the array and the well
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
    assert_eq!(w.grids.len(), 1);
    assert!(w.grids[0].load_w > 0.0 && !w.grids[0].blackout, "{:?}", w.grids[0].load_w);
    let mut fs = vec![];
    for _ in 0..40 {
        w.advance(0.05);
        fs.push(w.grids[0].frequency);
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
    // A substation wires the battery to the blower.
    w.place(8, "substation", -5, -3, 0).unwrap();
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
    // Substations wire the turbine, condenser, heater and battery into one network.
    w.place(6, "substation", 5, 0, 0).unwrap();
    w.place(7, "substation", 21, 17, 0).unwrap();
    w.place(8, "substation", -7, -7, 0).unwrap();
    w.place(9, "substation", 14, 10, 0).unwrap();
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
    assert_eq!(w.grids.len(), 1);
    assert!((w.grids[0].frequency - 50.0).abs() < 0.5, "{}", w.grids[0].frequency);
    assert!(!w.grids[0].blackout);
    // The condenser collects condensate.
    let cond = &w.net.vessels[w.entities[&3].net_vessels[0]];
    assert!(cond.liquid_volume() > 0.0, "condenser holds no liquid");
}

#[test]
fn buildings_out_of_reach_of_a_pole_get_no_power() {
    let mut w = world();
    w.place(1, "solar_array", 0, 0, 0).unwrap();
    w.place(2, "electric_heater", 3, 0, 0).unwrap();
    w.place(3, "electric_heater", 30, 0, 0).unwrap();
    w.place(4, "power_pole", 2, 2, 0).unwrap();
    w.time = DAY * 0.25; // noon
    for _ in 0..100 {
        w.advance(0.1);
    }
    let snap = w.snapshot();
    let heater = |id| snap.entities.iter().find(|e| e.id == id).unwrap();
    assert!(heater(2).power_w > 0.0, "the wired heater runs");
    assert_eq!(heater(3).power_w, 0.0, "the distant heater has no grid");
    assert_eq!(heater(3).network, None);
}

#[test]
fn poles_out_of_wire_reach_make_separate_grids() {
    let mut w = world();
    w.place(1, "power_pole", 0, 0, 0).unwrap();
    w.place(2, "power_pole", 7, 0, 0).unwrap(); // 7 tiles: within 7.5
    w.place(3, "power_pole", 30, 0, 0).unwrap();
    w.advance(0.0);
    assert_eq!(w.grids.len(), 2);
    assert_eq!(w.wires, vec![(1, 2)]);
}

#[test]
fn a_flare_burns_methane_to_co2() {
    let mut out = [0.0; NS];
    out[index_of("ch4").unwrap()] = 1.0;
    burn_off(&mut out);
    assert_eq!(out[index_of("ch4").unwrap()], 0.0);
    assert_eq!(out[index_of("co2").unwrap()], 1.0);
    assert_eq!(out[index_of("h2o").unwrap()], 2.0);
}

#[test]
fn a_cstr_runs_the_reaction_it_is_given() {
    let mut w = world();
    w.place(1, "cstr", 0, 0, 0).unwrap();
    w.advance(0.0);
    w.set_reaction(1, "wgs");
    assert_eq!(w.net.vessels[w.entities[&1].net_vessels[0]].reactions, vec![reaction("wgs").unwrap()]);
    w.set_reaction(1, "none");
    assert!(w.net.vessels[w.entities[&1].net_vessels[0]].reactions.is_empty());
}

#[test]
fn a_burner_generator_runs_on_its_fuel() {
    let mut w = world();
    w.place(1, "burner_generator", 0, 0, 0).unwrap();
    w.place(2, "electric_heater", 3, 0, 0).unwrap();
    w.place(3, "power_pole", 2, 2, 0).unwrap();
    w.set_demand(1, 1.0);
    for _ in 0..50 {
        w.advance(0.1);
    }
    let snap = w.snapshot();
    let gen = snap.entities.iter().find(|e| e.id == 1).unwrap().generation_w;
    assert!(gen > 100e3, "{gen}");
    w.set_demand(1, 0.0);
    for _ in 0..50 {
        w.advance(0.1);
    }
    let snap = w.snapshot();
    assert!(snap.entities.iter().find(|e| e.id == 1).unwrap().generation_w < 1e3);
}

#[test]
fn a_governed_burner_generator_holds_fifty_hertz() {
    let mut w = world();
    w.place(1, "burner_generator", 0, 0, 0).unwrap();
    w.place(2, "air_intake", 3, 0, 0).unwrap(); // 100 kW of fans, well within 250 kW
    w.place(3, "power_pole", 2, 2, 0).unwrap();
    w.set_demand(1, 1.0);
    for _ in 0..300 {
        w.advance(0.1);
    }
    assert!((w.grids[0].frequency - 50.0).abs() < 0.1, "{}", w.grids[0].frequency);
}

#[test]
fn slowing_a_pump_with_its_vfd_cuts_flow_and_power() {
    let mut w = world();
    let mut id = 100;
    // Tank → pump → tank, the pump on a solar array.
    w.place(1, "storage_tank", 0, 0, 0).unwrap(); // east bottom nozzle on (3, 1)
    pipe_line(&mut w, &mut id, (3, 1), (4, 1));
    w.place(2, "pump", 5, 1, 0).unwrap(); // suction (4, 1), discharge (6, 1)
    pipe_line(&mut w, &mut id, (6, 1), (7, 1));
    w.place(3, "storage_tank", 8, 0, 0).unwrap(); // top nozzle on (7, 1)
    w.place(4, "solar_array", 4, 4, 0).unwrap();
    w.place(5, "power_pole", 5, 3, 0).unwrap();
    w.advance(0.0);
    w.fill(1, "h2o", 4.0e6, 293.15);
    // The far tank is blanketed with nitrogen at 2.5 bar, so the pump has a head to work against.
    w.fill(3, "n2", 2.5e5 * 150.0 / (8.314 * 293.15), 293.15);
    let run = |w: &mut World| {
        for _ in 0..100 {
            w.advance(0.1);
        }
        match w.net.pipes[w.entities[&2].net_pipes[0]].kind {
            PipeKind::Pump { q, dp, eff_now, n, power_used, .. } => (q, dp, eff_now, n, power_used),
            _ => panic!("not a pump"),
        }
    };
    let (q1, dp1, eff1, n1, p1) = run(&mut w);
    assert!(q1 > 0.0 && dp1 > 0.0 && eff1 > 0.3, "operating point {q1} m³/s, {dp1} Pa, η {eff1}, n {n1}");
    w.set_pump(2, 1.0, 0.6);
    let (q2, _, _, n2, p2) = run(&mut w);
    assert!(n2 < n1 && (n2 - 0.6 * n1.min(1.0) / n1.min(1.0)).abs() < 0.05, "{n1} → {n2}");
    assert!(q2 < q1 * 0.8, "slower pump, less flow: {q1} → {q2}");
    assert!(p2 < p1 * 0.5, "and much less power: {p1} → {p2}");
    // The setting survives a rebuild of the network.
    w.place(6, "pipe", 20, 20, 0).unwrap();
    let (_, _, _, n3, _) = run(&mut w);
    assert!((n3 - n2).abs() < 0.02, "{n2} → {n3}");
}

#[test]
fn a_pump_starved_of_npsh_cavitates_and_wears_its_impeller() {
    // Tank → pump → tank, as above; the suction tank holds water at `t`, under air or nothing.
    let setup = |t: f64, evacuate: bool| {
        let mut w = world();
        let mut id = 100;
        w.place(1, "storage_tank", 0, 0, 0).unwrap();
        pipe_line(&mut w, &mut id, (3, 1), (4, 1));
        w.place(2, "pump", 5, 1, 0).unwrap();
        pipe_line(&mut w, &mut id, (6, 1), (7, 1));
        w.place(3, "storage_tank", 8, 0, 0).unwrap();
        w.place(4, "solar_array", 4, 4, 0).unwrap();
        w.place(5, "power_pole", 5, 3, 0).unwrap();
        w.advance(0.0);
        // Nothing over the water but its own vapour: pump the air out first.
        for gas in ["n2", "o2", "ar", "co2"] {
            if evacuate {
                w.take(1, gas, 1e6);
            }
        }
        w.fill(1, "h2o", 1.5e6, t);
        w
    };
    let pump = |w: &World| match w.net.pipes[w.entities[&2].net_pipes[0]].kind {
        PipeKind::Pump { q, npsha, npshr, cavitation, wear, .. } => (q, npsha, npshr, cavitation, wear),
        _ => panic!("not a pump"),
    };
    // Cold water under air: plenty of margin, no harm done.
    let mut cold = setup(293.15, false);
    for _ in 0..100 {
        cold.advance(0.1);
    }
    let (_, a, r, c, wear) = pump(&cold);
    assert!(a > r && c == 0.0 && wear < 1e-3, "cold: NPSHa {a}, NPSHr {r}, cavitation {c}, wear {wear}");
    // Hot water with only its own vapour over it: just the liquid's height to work with.
    let mut hot = setup(370.0, true);
    for _ in 0..100 {
        hot.advance(0.1);
    }
    let (q, a, r, c, wear) = pump(&hot);
    assert!(q > 0.0 && a < r && c > 0.0 && wear > 0.0, "hot: q {q}, NPSHa {a}, NPSHr {r}, cavitation {c}, wear {wear}");
    // Wear is kept through a rebuild, and a worn-through impeller pumps nothing.
    hot.place(6, "pipe", 20, 20, 0).unwrap();
    hot.advance(0.1);
    assert!(pump(&hot).4 >= wear);
    hot.set_pump_wear(2, 1.0);
    for _ in 0..100 {
        hot.advance(0.1);
    }
    // Liquid may still pass through it, but the pump adds no head.
    let dp = match hot.net.pipes[hot.entities[&2].net_pipes[0]].kind {
        PipeKind::Pump { dp, .. } => dp,
        _ => unreachable!(),
    };
    assert!(dp.abs() < 1e3, "worn through, yet {dp} Pa");
    assert!(hot.events.iter().any(|e| e.contains("worn its impeller through")) || hot.entities[&2].wear >= 1.0);
}

#[test]
fn a_wider_pipe_run_carries_more_for_the_same_push() {
    // Tank → pump → tank; how much it moves with the standard bore, then with the runs re-bored.
    let flow = |d: Option<f64>| {
        let mut w = world();
        let mut id = 100;
        w.place(1, "storage_tank", 0, 0, 0).unwrap();
        pipe_line(&mut w, &mut id, (3, 1), (4, 1));
        w.place(2, "pump", 5, 1, 0).unwrap();
        pipe_line(&mut w, &mut id, (6, 1), (7, 1));
        w.place(3, "storage_tank", 8, 0, 0).unwrap();
        w.place(4, "solar_array", 4, 4, 0).unwrap();
        w.place(5, "power_pole", 5, 3, 0).unwrap();
        w.advance(0.0);
        if let Some(d) = d {
            w.set_pipe_diameter(100, d);
            w.set_pipe_diameter(102, d);
            // A pipe added to a run takes its bore.
            w.place(200, "pipe", 4, 2, 0).unwrap();
            assert_eq!(w.entities[&200].diameter, d);
        }
        w.fill(1, "h2o", 4.0e6, 293.15);
        w.fill(3, "n2", 2.5e5 * 150.0 / (8.314 * 293.15), 293.15);
        for _ in 0..100 {
            w.advance(0.1);
        }
        let snap = w.snapshot();
        assert!(snap.segments.iter().all(|s| (s.diameter - d.unwrap_or(PIPE_DIAMETER)).abs() < 1e-9));
        match w.net.pipes[w.entities[&2].net_pipes[0]].kind {
            PipeKind::Pump { q, .. } => q,
            _ => unreachable!(),
        }
    };
    let (narrow, wide) = (flow(Some(0.05)), flow(None));
    assert!(narrow > 0.0 && narrow < wide * 0.8, "a 50 mm line throttles the pump: {narrow} vs {wide} m³/s");
}

#[test]
fn a_switched_off_pump_stops_the_flow() {
    let mut w = world();
    let mut id = 100;
    w.place(1, "storage_tank", 0, 0, 0).unwrap();
    pipe_line(&mut w, &mut id, (3, 1), (4, 1));
    w.place(2, "pump", 5, 1, 0).unwrap();
    pipe_line(&mut w, &mut id, (6, 1), (7, 1));
    w.place(3, "storage_tank", 8, 0, 0).unwrap();
    w.place(4, "solar_array", 4, 4, 0).unwrap();
    w.place(5, "power_pole", 5, 3, 0).unwrap();
    w.advance(0.0);
    // A full tank beside an empty one: the water's own head would drain it across.
    w.fill(1, "h2o", 4.0e6, 293.15);
    let flow = |w: &mut World| {
        for _ in 0..100 {
            w.advance(0.1);
        }
        w.net.pipes[w.entities[&2].net_pipes[0]].mdot
    };
    let on = flow(&mut w);
    assert!(on > 1.0, "{on} kg/s, {:?}", w.net.pipes[w.entities[&2].net_pipes[0]].kind);
    w.set_enabled(2, false);
    assert!(flow(&mut w).abs() < 1e-6, "still flowing when off");
    w.set_enabled(2, true);
    assert!(flow(&mut w) > 1.0, "and runs again when switched back on");
}

#[test]
fn rack_pipe_crosses_over_ground_pipe_and_joins_it_only_at_risers() {
    let mut w = world();
    // A line along y = 5 on the ground from x 0 to 6, and one that rises at x 3, y 2, runs over
    // it on the low rack to y 8, and comes down again; a second crossing on the high rack.
    let mut id = 100;
    pipe_line(&mut w, &mut id, (0, 5), (6, 5));
    w.place(200, "pipe_riser", 3, 2, 0).unwrap();
    for y in 3..=7 {
        w.place(201 + y as u32, "pipe_rack", 3, y, 0).unwrap();
    }
    w.place(220, "pipe_riser", 3, 8, 0).unwrap();
    for y in 3..=7 {
        w.place(230 + y as u32, "pipe_rack_high", 5, y, 0).unwrap();
    }
    // The rack's tile over the ground pipe is free on the ground, taken on the rack.
    assert!(w.place(300, "pipe_rack", 3, 5, 0).is_err());
    assert!(w.place(301, "pipe_rack_high", 3, 5, 0).is_ok());
    assert!(w.place(302, "pipe_riser", 3, 5, 0).is_err(), "a riser needs the ground free");
    assert_eq!(w.rack_at(3, 5, 1), Some(206));
    w.advance(0.0);
    let seg = |w: &World, n: Node| w.node_seg[&n];
    let ground = seg(&w, (0, (3, 5)));
    let rack = seg(&w, (1, (3, 5)));
    assert_ne!(ground, rack, "the rack passes over without joining");
    assert_eq!(seg(&w, (0, (3, 2))), rack, "a riser joins the ground to the rack");
    assert_eq!(seg(&w, (0, (3, 8))), rack);
    assert_ne!(seg(&w, (2, (5, 5))), ground, "the high rack passes over the ground line too");
    assert_ne!(seg(&w, (2, (5, 5))), rack);
    let s = &w.segments[rack];
    assert_eq!(s.tiles.len(), 2, "two risers on the ground");
    assert!(s.racks.len() >= 5 + 4, "five rack tiles and the risers' upper nodes");
}

#[test]
fn rotating_a_building_turns_its_ports_and_keeps_its_contents() {
    let mut w = world();
    w.place(1, "storage_tank", 0, 0, 0).unwrap();
    w.advance(0.0);
    w.fill(1, "h2o", 1.0e6, 293.15);
    w.advance(0.1);
    let before = w.entities[&1].port_tile(0).0;
    let mass = w.snapshot().entities.iter().find(|e| e.id == 1).unwrap().vessels[0].mass;
    assert!(w.rotate(1));
    w.advance(0.1);
    assert_ne!(w.entities[&1].port_tile(0).0, before, "the port moved round");
    let after = w.snapshot().entities.iter().find(|e| e.id == 1).unwrap().vessels[0].mass;
    assert!((after - mass).abs() < mass * 1e-3, "{mass} → {after} kg");
}
