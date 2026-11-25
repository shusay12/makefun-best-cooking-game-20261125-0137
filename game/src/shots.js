// Deterministic screenshot scenes. A tiny scripted pilot plays the real
// rules forward from a fresh world — walk to a station, use it, wait for
// the chop or the grill — so every frame is what a short game really
// looks like, and the same seed always gives the same frame.
import { STEP } from './config.js';
import { RECIPES, stationById, stationCentre } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, createWorld, startShift, stepWorld } from './world.js';

const IDLE = { up: false, down: false, left: false, right: false, interact: false, target: null };

function approachPoint(station) {
  const centre = stationCentre(station);
  if (station.kind === 'crate' || station.kind === 'trash') {
    return { x: centre.x, y: station.y - 34 };
  }
  return { x: centre.x, y: station.y + station.h + 34 };
}

function makeOrder(id, recipeId, secondsLeft) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id, recipe, timeLeft: secondsLeft, total: secondsLeft };
}

/**
 * Run one scripted step list against the world. Each step is:
 *  { goto: '<station id>' } — walk to its approach point
 *  { moveTo: { x, y } }     — walk to a floor point and stop
 *  { use: true }            — one interact press at the nearest station
 *  { wait: seconds }        — stand still
 *  { waitChop: true }       — stand at the board until the chop finishes
 *  { waitGrill: seconds }   — wait while the grill cooks
 * Returns true when the whole script finished, false on a step cap.
 */
function runScript(world, script) {
  const maxSteps = 40000;
  let used = 0;
  for (const step of script) {
    delete step._left;
    let done = false;
    let guard = 0;
    while (!done) {
      if (used >= maxSteps || guard >= maxSteps) return false;
      const input = { ...IDLE };
      if (step.goto !== undefined) {
        const station = stationById(step.goto);
        const point = approachPoint(station);
        const dx = point.x - world.chef.x;
        const dy = point.y - world.chef.y;
        if (Math.hypot(dx, dy) < 26) {
          done = true;
        } else {
          input.target = point;
        }
      } else if (step.moveTo !== undefined) {
        const dx = step.moveTo.x - world.chef.x;
        const dy = step.moveTo.y - world.chef.y;
        if (Math.hypot(dx, dy) < 20) done = true;
        else input.target = step.moveTo;
      } else if (step.use === true) {
        input.interact = true;
        done = true;
      } else if (step.wait !== undefined) {
        step._left = (step._left ?? step.wait) - STEP;
        if (step._left <= 0) done = true;
      } else if (step.waitChop === true) {
        if (world.board.item === null || world.board.item.state === 'chopped') done = true;
      } else if (step.waitGrill !== undefined) {
        step._left = (step._left ?? step.waitGrill) - STEP;
        if (step._left <= 0) done = true;
      }
      stepWorld(world, STEP, input);
      used += 1;
      guard += 1;
    }
  }
  return true;
}

// The shared assembly: build one burger on the plating counter and leave
// it there, plated and complete. The chef ends empty-handed at the counter.
const BUILD_BURGER = [
  { goto: 'plate' }, { use: true },
  { goto: 'crate-bun' }, { use: true },
  { goto: 'plate' }, { use: true },
  { goto: 'crate-patty' }, { use: true },
  { goto: 'grill' }, { use: true },
  { waitGrill: 7.6 },
  { goto: 'grill' }, { use: true },
  { goto: 'plate' }, { use: true },
  { goto: 'crate-lettuce' }, { use: true },
  { goto: 'board' }, { use: true },
  { waitChop: true },
  { goto: 'board' }, { use: true },
  { goto: 'plate' }, { use: true },
  { goto: 'crate-tomato' }, { use: true },
  { goto: 'board' }, { use: true },
  { waitChop: true },
  { goto: 'board' }, { use: true },
  { goto: 'plate' }, { use: true },
];

function stageCover(world) {
  startShift(world);
  world.spawnIn = 99999;
  // A full burger, parked on the serving pass: no burger order is on the
  // board, so the pass holds it as a plate ready to serve.
  const ok = runScript(world, [
    ...BUILD_BURGER,
    { goto: 'plate' }, { use: true },
    { goto: 'pass' }, { use: true },
    // A second burger, mid-assembly: bun, grilled patty and chopped
    // lettuce on the plate, the chef carrying the chopped tomato, and a
    // fresh patty halfway through grilling. (BUILD_BURGER steps 1..24 end
    // with the lettuce on the plate and the chef empty-handed.)
    ...BUILD_BURGER.slice(0, 24),
    { goto: 'crate-patty' }, { use: true },
    { goto: 'grill' }, { use: true },
    { waitGrill: 4 },
    { goto: 'crate-tomato' }, { use: true },
    { goto: 'board' }, { use: true },
    { waitChop: true },
    { goto: 'board' }, { use: true },
    // Stop a step south of the counter so the carried tomato clears the
    // PLATING sign instead of covering it.
    { moveTo: { x: 810, y: 472 } },
  ]);
  if (!ok) return { screen: SCREEN_PLAY, best: 0, staged: false };
  world.orders = [makeOrder(1, 'burger', 45), makeOrder(2, 'melt', 32), makeOrder(3, 'salad', 18)];
  world.shiftLeft = 107;
  world.coins = 34;
  world.combo = 2;
  world.bestCombo = 2;
  world.message = '';
  world.messageUntil = 0;
  return { screen: SCREEN_PLAY, best: 34, staged: true };
}

function stagePrep(world) {
  startShift(world);
  world.spawnIn = 99999;
  const ok = runScript(world, [
    { goto: 'crate-patty' }, { use: true },
    { goto: 'grill' }, { use: true },
    { goto: 'crate-lettuce' }, { use: true },
    { goto: 'board' }, { use: true },
    { wait: 0.8 },
  ]);
  if (!ok) return { screen: SCREEN_PLAY, best: 0, staged: false };
  world.orders = [makeOrder(1, 'burger', 45), makeOrder(2, 'salad', 40)];
  world.shiftLeft = 132;
  world.message = '';
  world.messageUntil = 0;
  return { screen: SCREEN_PLAY, best: 0, staged: true };
}

function stageRush(world) {
  startShift(world);
  world.spawnIn = 99999;
  // A burnt patty on the grill, a finished salad on a plate in hand.
  const ok = runScript(world, [
    { goto: 'crate-patty' }, { use: true },
    { goto: 'grill' }, { use: true },
    { waitGrill: 13 },
    { goto: 'plate' }, { use: true },
    { goto: 'crate-lettuce' }, { use: true },
    { goto: 'board' }, { use: true },
    { waitChop: true },
    { goto: 'board' }, { use: true },
    { goto: 'plate' }, { use: true },
    { goto: 'crate-tomato' }, { use: true },
    { goto: 'board' }, { use: true },
    { waitChop: true },
    { goto: 'board' }, { use: true },
    { goto: 'plate' }, { use: true },
    { goto: 'crate-onion' }, { use: true },
    { goto: 'board' }, { use: true },
    { waitChop: true },
    { goto: 'board' }, { use: true },
    { goto: 'plate' }, { use: true },
    { goto: 'plate' }, { use: true },
    { moveTo: { x: 900, y: 470 } },
  ]);
  if (!ok) return { screen: SCREEN_PLAY, best: 0, staged: false };
  world.orders = [makeOrder(1, 'salad', 10), makeOrder(2, 'stack', 7), makeOrder(3, 'melt', 14)];
  world.shiftLeft = 38;
  world.coins = 58;
  world.combo = 3;
  world.bestCombo = 3;
  world.message = '';
  world.messageUntil = 0;
  return { screen: SCREEN_PLAY, best: 58, staged: true };
}

function stageSummary(world) {
  startShift(world);
  world.screen = SCREEN_OVER;
  world.overReason = 'shift';
  world.served = 7;
  world.coins = 96;
  world.bestCombo = 4;
  world.combo = 2;
  world.strikes = 1;
  world.shiftLeft = 0;
  world.orders = [];
  return { screen: SCREEN_OVER, best: 96, staged: true };
}

/**
 * Set `world` to the named scene (cover, prep, rush or summary; any other
 * name is the title screen) and return the screen to draw and the best
 * score to show.
 */
export function stageShot(name, world) {
  if (name === 'cover') return stageCover(world);
  if (name === 'prep') return stagePrep(world);
  if (name === 'rush') return stageRush(world);
  if (name === 'summary') return stageSummary(world);
  return { screen: SCREEN_TITLE, best: 0, staged: true };
}

/** A fresh world for interactive play (used by main.js and the tests). */
export function freshWorld(seed) {
  return createWorld(seed);
}
