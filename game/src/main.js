// Sizzle & Serve — entry point: the frame loop, the screens, the sounds,
// and the deterministic ?shot= / ?test= modes the screenshots and the
// self-checks use.
import { CHEF, STEP, VIEW } from './config.js';
import { createInput } from './input.js';
import { createWorld, startShift, stepWorld } from './world.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';
import { runTests } from './tests.js';
import { playSound, setMuted, startMusic, stopMusic, unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? '1') || 1;
const world = createWorld(seed);

function playEventSounds(events, before) {
  for (const event of events) {
    if (event === 'serve') {
      playSound('serve');
      playSound('coin');
    } else if (event === 'grab') playSound('grab');
    else if (event === 'plate') playSound('plate');
    else if (event === 'chop-start') playSound('chop-start');
    else if (event === 'grill-start') playSound('grill-start');
    else if (event === 'trash') playSound('plate');
    else if (event === 'deny' || event === 'park') playSound('deny');
    else if (event === 'expire') playSound('expire');
    else if (event === 'game-over') playSound('game-over');
    else if (event === 'shift-end') playSound(world.coins > 0 ? 'win' : 'game-over');
  }
  // Cooking finished while the chef was away: one ding each.
  if (before.boardChopping && world.board.item !== null && world.board.item.state === 'chopped') {
    playSound('chop-done');
  }
  for (let i = 0; i < 2; i += 1) {
    const was = before.grill[i];
    const now = world.grill[i];
    if (was === 'grilling' && now !== null && now.state === 'grilled') playSound('chop-done');
    if (was !== 'burnt' && now !== null && now.state === 'burnt') playSound('burn');
  }
}

function snapshotCooking(world) {
  return {
    boardChopping: world.board.item !== null && world.board.item.state === 'chopping',
    grill: world.grill.map((slot) => (slot === null ? null : slot.state)),
  };
}

if (params.get('test') === '1') {
  // Self-check mode: no animation, just the verdict in the page title.
  setMuted(true);
  const results = runTests();
  document.title = JSON.stringify(results);
} else if (params.has('shot')) {
  // Screenshot mode: stage the scene synchronously, draw it once.
  setMuted(true);
  const staged = stageShot(params.get('shot'), world);
  drawGame(ctx, world);
  document.title = `SHOT-READY:${params.get('shot')}:${staged.staged ? 'staged' : 'FAILED'}`;
} else {
  const input = createInput(canvas);
  let last = performance.now();
  let accumulator = 0;

  function beginShift() {
    unlockAudio();
    startShift(world);
    startMusic();
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' && !event.repeat) {
      if (world.screen === 'title' || world.screen === 'over') beginShift();
    }
  });
  canvas.addEventListener('pointerdown', () => {
    if (world.screen === 'title' || world.screen === 'over') beginShift();
  });

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (world.screen === 'play') {
      accumulator += dt;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        input.poll();
        // A clicked station is used on arrival.
        if (input.interactTarget !== null) {
          const station = input.interactTarget;
          const cx = Math.max(station.x, Math.min(world.chef.x, station.x + station.w));
          const cy = Math.max(station.y, Math.min(world.chef.y, station.y + station.h));
          if (Math.hypot(world.chef.x - cx, world.chef.y - cy) <= CHEF.interactRange) {
            input.interact = true;
            input.interactTarget = null;
          }
        }
        const before = snapshotCooking(world);
        const events = stepWorld(world, STEP, {
          up: input.up,
          down: input.down,
          left: input.left,
          right: input.right,
          interact: input.consumeInteract(),
          target: input.target,
        });
        if (input.target !== null) {
          const dx = input.target.x - world.chef.x;
          const dy = input.target.y - world.chef.y;
          if (Math.hypot(dx, dy) < 14) input.target = null;
        }
        playEventSounds(events, before);
        if (world.screen === 'over') stopMusic();
      }
    } else {
      // Title and end screens still animate (blinking prompts).
      world.elapsed += dt;
      input.consumeInteract();
    }
    drawGame(ctx, world);
    requestAnimationFrame(frame);
  }
  drawGame(ctx, world);
  requestAnimationFrame(frame);
}
