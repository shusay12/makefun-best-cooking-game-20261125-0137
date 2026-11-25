// Sizzle & Serve — the kitchen's rules: orders, cooking, plating, serving.
// No drawing here: this file only moves the state forward, one fixed step
// at a time, so a scripted playthrough replays exactly.
import {
  CHEF, COOK, INGREDIENTS, MAX_ORDERS, MAX_STRIKES, RECIPES, SHIFT_SECONDS,
  STATIONS, ingredientReady, stationById, stationCentre,
} from './config.js';
import { makeRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const FLOOR = { left: 244, top: 76, right: 1272, bottom: 704 };

export function createWorld(seed = 1) {
  return {
    seed,
    random: makeRandom(seed),
    screen: SCREEN_TITLE,
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    strikes: 0,
    combo: 0,
    bestCombo: 0,
    overReason: '',
    message: '',
    messageUntil: 0,
    orders: [],
    nextOrderId: 1,
    spawnIn: 2,
    chef: { x: 640, y: 500, face: 1, carry: null, moveTarget: null },
    board: { item: null, progress: 0 },
    grill: [null, null],
    counterPlate: null,
    passPlate: null,
    sizzle: false,
  };
}

/** Start the shift: clear the title screen and open the first orders. */
export function startShift(world) {
  world.screen = SCREEN_PLAY;
  world.elapsed = 0;
  world.shiftLeft = SHIFT_SECONDS;
  world.coins = 0;
  world.served = 0;
  world.strikes = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.overReason = '';
  world.orders = [];
  world.spawnIn = 0.5;
  world.board = { item: null, progress: 0 };
  world.grill = [null, null];
  world.counterPlate = null;
  world.passPlate = null;
  world.chef.carry = null;
  world.chef.x = 640;
  world.chef.y = 500;
  world.chef.moveTarget = null;
}

function say(world, text) {
  world.message = text;
  world.messageUntil = world.elapsed + 2.2;
}

function pickRecipe(world) {
  const index = Math.floor(world.random() * RECIPES.length);
  return RECIPES[index];
}

function spawnOrder(world) {
  const rush = world.shiftLeft <= COOK.rushAtSecondsLeft;
  const lifetime = rush ? COOK.rushOrderLifetime : COOK.orderLifetime;
  const recipe = pickRecipe(world);
  world.orders.push({
    id: world.nextOrderId,
    recipe,
    timeLeft: lifetime,
    total: lifetime,
  });
  world.nextOrderId += 1;
}

function plateItems(plate) {
  return plate.items.map((item) => item.kind).sort();
}

function orderMatchesPlate(order, plate) {
  const wanted = [...order.recipe.items].sort();
  const held = plateItems(plate);
  if (wanted.length !== held.length) return false;
  return wanted.every((kind, i) => kind === held[i]);
}

function findMatchingOrder(world, plate) {
  return world.orders.find((order) => orderMatchesPlate(order, plate)) ?? null;
}

function servePlate(world, plate) {
  const order = findMatchingOrder(world, plate);
  if (order === null) return false;
  const tip = Math.round(order.timeLeft * COOK.tipPerSecondLeft);
  world.coins += order.recipe.price + tip;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.spawnIn = Math.min(world.spawnIn, 2);
  return true;
}

function endShift(world, reason) {
  world.screen = SCREEN_OVER;
  world.overReason = reason;
  world.chef.moveTarget = null;
}

function distanceToStation(chef, station) {
  const cx = Math.max(station.x, Math.min(chef.x, station.x + station.w));
  const cy = Math.max(station.y, Math.min(chef.y, station.y + station.h));
  return Math.hypot(chef.x - cx, chef.y - cy);
}

function nearestStation(world) {
  let best = null;
  let bestDistance = Infinity;
  for (const station of STATIONS) {
    const d = distanceToStation(world.chef, station);
    if (d < bestDistance) {
      bestDistance = d;
      best = station;
    }
  }
  return bestDistance <= CHEF.interactRange ? best : null;
}

function hitsStation(x, y) {
  for (const station of STATIONS) {
    if (
      x > station.x - CHEF.radius && x < station.x + station.w + CHEF.radius &&
      y > station.y - CHEF.radius && y < station.y + station.h + CHEF.radius
    ) return true;
  }
  return false;
}

function moveChef(world, dx, dy, dt) {
  const chef = world.chef;
  const length = Math.hypot(dx, dy);
  if (length === 0) return;
  const nx = chef.x + (dx / length) * CHEF.speed * dt;
  const ny = chef.y + (dy / length) * CHEF.speed * dt;
  const clampedX = Math.max(FLOOR.left + CHEF.radius, Math.min(FLOOR.right - CHEF.radius, nx));
  const clampedY = Math.max(FLOOR.top + CHEF.radius, Math.min(FLOOR.bottom - CHEF.radius, ny));
  if (!hitsStation(clampedX, chef.y)) chef.x = clampedX;
  if (!hitsStation(chef.x, clampedY)) chef.y = clampedY;
  if (dx !== 0) chef.face = dx > 0 ? 1 : -1;
}

function addToPlate(world, kind, state) {
  const carry = world.chef.carry;
  if (carry === null || carry.type !== 'plate') return false;
  carry.items.push({ kind, state });
  return true;
}

function tryInteract(world) {
  const chef = world.chef;
  const station = nearestStation(world);
  if (station === null) return null;
  const carry = chef.carry;

  if (station.kind === 'crate') {
    const kind = station.ingredient;
    if (carry === null) {
      chef.carry = { type: 'item', kind, state: 'raw' };
      return 'grab';
    }
    if (carry.type === 'plate' && INGREDIENTS[kind].needs === 'ready') {
      addToPlate(world, kind, 'raw');
      return 'plate';
    }
    if (carry.type === 'plate') {
      say(world, `${INGREDIENTS[kind].label} needs the board or grill first!`);
      return 'deny';
    }
    say(world, 'Hands full!');
    return 'deny';
  }

  if (station.kind === 'board') {
    const board = world.board;
    if (board.item !== null && board.item.state === 'chopped') {
      if (carry === null) {
        chef.carry = { type: 'item', kind: board.item.kind, state: 'chopped' };
        board.item = null;
        board.progress = 0;
        return 'grab';
      }
      if (carry.type === 'plate') {
        addToPlate(world, board.item.kind, 'chopped');
        board.item = null;
        board.progress = 0;
        return 'plate';
      }
      say(world, 'Hands full!');
      return 'deny';
    }
    if (board.item === null && carry !== null && carry.type === 'item' &&
        INGREDIENTS[carry.kind].needs === 'chop' && carry.state === 'raw') {
      board.item = { kind: carry.kind, state: 'chopping' };
      board.progress = 0;
      chef.carry = null;
      return 'chop-start';
    }
    if (board.item !== null) {
      say(world, 'Still chopping…');
      return 'deny';
    }
    say(world, 'Nothing to chop here.');
    return 'deny';
  }

  if (station.kind === 'grill') {
    const slot = world.grill.findIndex((s) => s !== null && s.state === 'grilled');
    const free = world.grill.findIndex((s) => s === null);
    if (carry !== null && carry.type === 'item' && carry.kind === 'patty' && carry.state === 'raw' && free !== -1) {
      world.grill[free] = { kind: 'patty', state: 'grilling', cookTime: 0 };
      chef.carry = null;
      return 'grill-start';
    }
    if (slot !== -1) {
      const patty = world.grill[slot];
      if (carry === null) {
        chef.carry = { type: 'item', kind: 'patty', state: 'grilled' };
        world.grill[slot] = null;
        return 'grab';
      }
      if (carry.type === 'plate') {
        addToPlate(world, 'patty', 'grilled');
        world.grill[slot] = null;
        return 'plate';
      }
    }
    const burnt = world.grill.findIndex((s) => s !== null && s.state === 'burnt');
    if (burnt !== -1 && carry === null) {
      chef.carry = { type: 'item', kind: 'patty', state: 'burnt' };
      world.grill[burnt] = null;
      return 'grab';
    }
    if (carry !== null && carry.type === 'item') {
      say(world, 'Only raw patties go on the grill.');
      return 'deny';
    }
    say(world, 'Nothing ready on the grill.');
    return 'deny';
  }

  if (station.kind === 'plate') {
    if (world.counterPlate !== null && carry === null) {
      chef.carry = { type: 'plate', items: world.counterPlate.items };
      world.counterPlate = null;
      return 'grab';
    }
    if (world.counterPlate !== null && carry !== null && carry.type === 'item' &&
        ingredientReady(carry.kind, carry.state)) {
      world.counterPlate.items.push({ kind: carry.kind, state: carry.state });
      chef.carry = null;
      return 'plate';
    }
    if (world.counterPlate === null && carry === null) {
      world.counterPlate = { items: [] };
      return 'plate-new';
    }
    if (world.counterPlate === null && carry !== null && carry.type === 'plate') {
      world.counterPlate = { items: carry.items };
      chef.carry = null;
      return 'plate-down';
    }
    say(world, 'That cannot go on the plate yet.');
    return 'deny';
  }

  if (station.kind === 'pass') {
    if (carry !== null && carry.type === 'plate') {
      if (servePlate(world, carry)) {
        chef.carry = null;
        return 'serve';
      }
      world.passPlate = { items: carry.items };
      chef.carry = null;
      say(world, 'No order wants this plate — take it back!');
      return 'park';
    }
    if (carry === null && world.passPlate !== null) {
      chef.carry = { type: 'plate', items: world.passPlate.items };
      world.passPlate = null;
      return 'grab';
    }
    say(world, 'Serve a finished plate here.');
    return 'deny';
  }

  if (station.kind === 'trash') {
    if (carry !== null) {
      chef.carry = null;
      return 'trash';
    }
    say(world, 'Nothing to throw away.');
    return 'deny';
  }
  return null;
}

function cookStations(world, dt) {
  const chef = world.chef;
  const boardStation = stationById('board');
  const grillStation = stationById('grill');
  const nearBoard = distanceToStation(chef, boardStation) <= CHEF.interactRange;
  const nearGrill = distanceToStation(chef, grillStation) <= CHEF.interactRange;
  world.sizzle = false;

  if (world.board.item !== null && world.board.item.state === 'chopping' && nearBoard) {
    world.board.progress += dt / COOK.chopSeconds;
    if (world.board.progress >= 1) {
      world.board.item.state = 'chopped';
      world.board.progress = 1;
    }
  }
  for (const slot of world.grill) {
    if (slot === null) continue;
    world.sizzle = true;
    slot.cookTime += dt;
    if (slot.state === 'grilling' && slot.cookTime >= COOK.grillSeconds) slot.state = 'grilled';
    if (slot.cookTime >= COOK.grillBurnSeconds) slot.state = 'burnt';
  }
  return nearGrill;
}

function tickOrders(world, dt) {
  const rush = world.shiftLeft <= COOK.rushAtSecondsLeft;
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < MAX_ORDERS) {
    spawnOrder(world);
    world.spawnIn = rush ? COOK.rushSpawnSeconds : COOK.spawnSeconds;
  }
  let expired = false;
  for (const order of world.orders) order.timeLeft -= dt;
  const kept = [];
  for (const order of world.orders) {
    if (order.timeLeft <= 0) {
      expired = true;
    } else {
      kept.push(order);
    }
  }
  world.orders = kept;
  if (expired) {
    world.strikes += 1;
    world.combo = 0;
    say(world, 'An order walked out!');
    if (world.strikes >= MAX_STRIKES) endShift(world, 'strikes');
  }
}

/**
 * Advance the kitchen one fixed step. `input` is { up, down, left, right,
 * interact, target } where target is a clicked floor point to walk to.
 * Returns the list of events this step produced, for sounds and flashes.
 */
export function stepWorld(world, dt, input) {
  const events = [];
  if (world.screen !== SCREEN_PLAY) return events;
  world.elapsed += dt;
  world.shiftLeft -= dt;
  if (world.shiftLeft <= 0) {
    world.shiftLeft = 0;
    endShift(world, 'shift');
    events.push('shift-end');
    return events;
  }

  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const chef = world.chef;
  if (input.target !== null && input.target !== undefined) {
    const tx = input.target.x - chef.x;
    const ty = input.target.y - chef.y;
    if (Math.hypot(tx, ty) < 14) {
      chef.moveTarget = null;
    } else {
      dx = tx;
      dy = ty;
    }
  }
  moveChef(world, dx, dy, dt);

  if (input.interact) {
    const result = tryInteract(world);
    if (result === 'serve') events.push('serve');
    else if (result === 'grab') events.push('grab');
    else if (result === 'plate' || result === 'plate-new' || result === 'plate-down') events.push('plate');
    else if (result === 'chop-start') events.push('chop-start');
    else if (result === 'grill-start') events.push('grill-start');
    else if (result === 'trash') events.push('trash');
    else if (result === 'deny') events.push('deny');
    else if (result === 'park') events.push('park');
  }

  cookStations(world, dt);
  const strikesBefore = world.strikes;
  tickOrders(world, dt);
  if (world.strikes > strikesBefore) events.push('expire');
  if (world.screen === SCREEN_OVER && world.overReason === 'strikes') events.push('game-over');
  return events;
}

export function gradeFor(coins, served) {
  if (served >= 8 && coins >= 110) return 'S';
  if (served >= 6 && coins >= 80) return 'A';
  if (served >= 4 && coins >= 50) return 'B';
  if (served >= 2) return 'C';
  return 'D';
}
