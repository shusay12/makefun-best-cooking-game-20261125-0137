// Keyboard and mouse for the chef: WASD or arrows to walk, E or Space to
// use the nearest station, click a floor spot to walk there, click a
// station to walk to it and use it on arrival.
import { STATIONS, stationCentre } from './config.js';

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    up: false, down: false, left: false, right: false,
    interact: false,
    target: null,
    interactTarget: null,
  };
  const codeFor = (code) => {
    if (code === 'KeyW' || code === 'ArrowUp') return 'up';
    if (code === 'KeyS' || code === 'ArrowDown') return 'down';
    if (code === 'KeyA' || code === 'ArrowLeft') return 'left';
    if (code === 'KeyD' || code === 'ArrowRight') return 'right';
    return null;
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const dir = codeFor(event.code);
    if (dir !== null) {
      keys.add(dir);
      event.preventDefault();
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      input.interact = true;
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    const dir = codeFor(event.code);
    if (dir !== null) keys.delete(dir);
  });

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    let clicked = null;
    for (const station of STATIONS) {
      if (point.x >= station.x && point.x <= station.x + station.w &&
          point.y >= station.y && point.y <= station.y + station.h) {
        clicked = station;
        break;
      }
    }
    if (clicked !== null) {
      const centre = stationCentre(clicked);
      input.target = { x: centre.x, y: Math.min(centre.y + clicked.h / 2 + 34, 690) };
      input.interactTarget = clicked;
    } else {
      input.target = point;
      input.interactTarget = null;
    }
  });

  // Read the live state once per frame; `interact` is an edge that the
  // caller consumes.
  input.poll = () => {
    input.up = keys.has('up');
    input.down = keys.has('down');
    input.left = keys.has('left');
    input.right = keys.has('right');
    if (input.target !== null) {
      input.up = false; input.down = false; input.left = false; input.right = false;
    }
  };
  input.consumeInteract = () => {
    const value = input.interact;
    input.interact = false;
    return value;
  };
  return input;
}
