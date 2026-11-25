// Scripted self-checks (?test=1&seed=1): drive the real rules through
// stepWorld and report a JSON object on the page title. No rendering is
// needed, so the checks run in a headless browser in under a second.
import { STEP, stationById, stationCentre } from './config.js';
import { createWorld, startShift, stepWorld } from './world.js';

const IDLE = { up: false, down: false, left: false, right: false, interact: false, target: null };

function near(world, stationId) {
  const station = stationById(stationId);
  const centre = stationCentre(station);
  if (station.kind === 'crate' || station.kind === 'trash') {
    world.chef.x = centre.x;
    world.chef.y = station.y - 40;
  } else {
    world.chef.x = centre.x;
    world.chef.y = station.y + station.h + 40;
  }
  world.chef.moveTarget = null;
}

function use(world) {
  stepWorld(world, STEP, { ...IDLE, interact: true });
}

function idle(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) stepWorld(world, STEP, IDLE);
}

function move(world, direction, seconds) {
  const input = { ...IDLE, [direction]: true };
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) stepWorld(world, STEP, input);
}

export function runTests() {
  const results = {};
  const world = createWorld(1);
  startShift(world);
  world.spawnIn = 99999;
  world.orders = [{ id: 1, recipe: { id: 'burger', name: 'Classic Burger', price: 12, items: ['bun', 'patty', 'lettuce', 'tomato'] }, timeLeft: 50, total: 50 }];

  // Movement: the chef walks right and down.
  const x0 = world.chef.x;
  const y0 = world.chef.y;
  move(world, 'right', 0.5);
  move(world, 'down', 0.5);
  results.movedRight = world.chef.x > x0 + 50;
  results.movedDown = world.chef.y > y0 + 50;

  // Grab a bun from its crate.
  near(world, 'crate-bun');
  use(world);
  results.grabBun = world.chef.carry !== null && world.chef.carry.kind === 'bun';

  // A raw bun cannot go on the grill.
  near(world, 'grill');
  use(world);
  results.bunRefusedOnGrill = world.grill[0] === null && world.grill[1] === null && world.chef.carry !== null;

  // Toss the bun, start a plate, put a fresh bun on it.
  near(world, 'trash');
  use(world);
  results.trashBun = world.chef.carry === null;
  near(world, 'plate');
  use(world);
  results.newPlate = world.counterPlate !== null;
  near(world, 'crate-bun');
  use(world);
  near(world, 'plate');
  use(world);
  results.bunOnPlate = world.counterPlate !== null && world.counterPlate.items.length === 1;

  // Chop lettuce: raw on the board, chopped after standing by it.
  near(world, 'crate-lettuce');
  use(world);
  near(world, 'board');
  use(world);
  results.lettuceOnBoard = world.board.item !== null && world.board.item.state === 'chopping';
  idle(world, 2);
  results.lettuceChopped = world.board.item !== null && world.board.item.state === 'chopped';
  use(world);
  results.grabChoppedLettuce = world.chef.carry !== null && world.chef.carry.state === 'chopped';
  near(world, 'plate');
  use(world);
  results.lettuceOnPlate = world.counterPlate.items.length === 2;

  // Grill a patty: raw on the grill, grilled after 7s, burnt after 12s.
  near(world, 'crate-patty');
  use(world);
  near(world, 'grill');
  use(world);
  results.pattyOnGrill = world.grill[0] !== null && world.grill[0].state === 'grilling';
  idle(world, 7.5);
  results.pattyGrilled = world.grill[0] !== null && world.grill[0].state === 'grilled';
  idle(world, 5);
  results.pattyBurnt = world.grill[0] !== null && world.grill[0].state === 'burnt';
  use(world);
  results.grabBurntPatty = world.chef.carry !== null && world.chef.carry.state === 'burnt';
  near(world, 'trash');
  use(world);
  results.trashBurntPatty = world.chef.carry === null;

  // Finish the burger: grill a fresh patty, chop a tomato, serve the plate.
  near(world, 'crate-patty');
  use(world);
  near(world, 'grill');
  use(world);
  idle(world, 7.5);
  use(world);
  near(world, 'plate');
  use(world);
  results.pattyOnPlate = world.counterPlate.items.length === 3;
  near(world, 'crate-tomato');
  use(world);
  near(world, 'board');
  use(world);
  idle(world, 2);
  use(world);
  near(world, 'plate');
  use(world);
  results.burgerComplete = world.counterPlate.items.length === 4;
  const coinsBefore = world.coins;
  use(world); // pick the plate up
  results.pickUpPlate = world.chef.carry !== null && world.chef.carry.type === 'plate';
  near(world, 'pass');
  use(world);
  results.servedBurger = world.served === 1 && world.coins > coinsBefore && world.chef.carry === null;

  // A plate that matches no order parks on the pass instead of serving.
  world.orders = [{ id: 2, recipe: { id: 'salad', name: 'Garden Salad', price: 8, items: ['lettuce', 'tomato', 'onion'] }, timeLeft: 50, total: 50 }];
  near(world, 'plate');
  use(world);
  near(world, 'crate-cheese');
  use(world);
  near(world, 'plate');
  use(world);
  use(world);
  near(world, 'pass');
  use(world);
  results.wrongPlateParks = world.passPlate !== null && world.served === 1;
  use(world);
  results.takeBackParkedPlate = world.chef.carry !== null && world.passPlate === null;

  // An order that runs out costs a strike.
  world.orders = [{ id: 3, recipe: { id: 'melt', name: 'Cheese Melt', price: 10, items: ['bun', 'patty', 'cheese'] }, timeLeft: 0.5, total: 50 }];
  const strikesBefore = world.strikes;
  idle(world, 1);
  results.orderExpiryStrikes = world.strikes === strikesBefore + 1 && world.orders.length === 0;

  // The shift ends when the timer runs out, with a grade.
  world.shiftLeft = 0.5;
  idle(world, 1);
  results.shiftEnds = world.screen === 'over' && world.overReason === 'shift';

  results.pass = Object.values(results).every(Boolean);
  return results;
}
