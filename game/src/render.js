// Sizzle & Serve — every pixel the player sees: the kitchen floor, the
// order board, the stations, the chef, the HUD and the title/end screens.
// All art is drawn with canvas shapes; there are no image files.
import {
  CHEF, COOK, INGREDIENTS, MAX_STRIKES, RECIPES, STATIONS, VIEW,
  ingredientReady, stationById,
} from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, gradeFor } from './world.js';

const CREAM = '#fff8e7';
const INK = '#3a2a1a';
const HUD_BG = '#2b2118';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

/** One ingredient, drawn as food: bun dome, patty, leaves, slices, cheese, rings. */
export function drawIngredient(ctx, kind, state, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = '#e8b25c';
    ctx.beginPath();
    ctx.arc(0, 2, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c98f3e';
    ctx.fillRect(-r, 2, r * 2, r * 0.35);
    ctx.fillStyle = '#fff3d0';
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.35, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.55, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'patty') {
    const color = state === 'burnt' ? '#241d18' : state === 'grilled' ? '#7a3b2e' : state === 'grilling' ? '#a85a44' : '#c46a5a';
    ctx.fillStyle = color;
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.fill();
    if (state !== 'burnt') {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(-r * 0.7, -r * 0.4, r * 1.4, r * 0.22);
    }
    if (state === 'burnt') {
      ctx.strokeStyle = 'rgba(120,120,120,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.6);
      ctx.quadraticCurveTo(-r * 0.2, -r * 1.3, 0, -r * 0.7);
      ctx.moveTo(r * 0.4, -r * 0.6);
      ctx.quadraticCurveTo(r * 0.7, -r * 1.4, r * 0.9, -r * 0.8);
      ctx.stroke();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = state === 'chopped' ? '#69b455' : '#4e9a3e';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.5 + i * r * 0.5, (i % 2) * r * 0.2, r * 0.55, r * 0.4, (i - 1) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#3f7d31';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0);
    ctx.quadraticCurveTo(0, r * 0.3, r * 0.7, 0);
    ctx.stroke();
  } else if (kind === 'tomato') {
    const slices = state === 'chopped' ? 2 : 1;
    for (let i = 0; i < slices; i += 1) {
      const ox = (i - (slices - 1) / 2) * r * 0.9;
      ctx.fillStyle = '#e05244';
      ctx.beginPath();
      ctx.arc(ox, 0, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2827a';
      ctx.beginPath();
      ctx.arc(ox, 0, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd9d4';
      ctx.beginPath();
      ctx.arc(ox, 0, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f2c531';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.5);
    ctx.lineTo(r, r * 0.5);
    ctx.lineTo(r, -r * 0.1);
    ctx.lineTo(0, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c99a12';
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.1, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.2, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'onion') {
    ctx.strokeStyle = '#efe6f2';
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#9b7fb0';
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#efe6f2';
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** A white plate with its items laid out in a row. */
export function drawPlate(ctx, items, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#f4f0e6';
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9bfa5';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e3dcc8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  const n = items.length;
  items.forEach((item, i) => {
    const ox = n === 1 ? 0 : -30 + (60 * i) / (n - 1);
    drawIngredient(ctx, item.kind, item.state, ox, -2, 13);
  });
  ctx.restore();
}

function drawProgressBar(ctx, x, y, w, h, fraction, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  const fw = Math.max(0, Math.min(1, fraction)) * w;
  if (fw > 0) {
    roundRect(ctx, x, y, fw, h, h / 2);
    ctx.fill();
  }
}

function drawKitchenFloor(ctx) {
  ctx.fillStyle = '#e8c9a0';
  ctx.fillRect(0, 64, VIEW.width, VIEW.height - 64);
  ctx.fillStyle = '#dfb98c';
  const tile = 64;
  for (let y = 64; y < VIEW.height; y += tile) {
    for (let x = 244 + ((y / tile) % 2) * tile; x < VIEW.width; x += tile * 2) {
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.fillStyle = '#f6e3c5';
  ctx.fillRect(244, 64, VIEW.width - 244, 10);
  ctx.fillStyle = '#d9b380';
  ctx.fillRect(236, 64, 8, VIEW.height - 64);
}

function drawOrderBoard(ctx, world) {
  ctx.fillStyle = '#b98a5a';
  roundRect(ctx, 8, 76, 228, 628, 12);
  ctx.fill();
  ctx.fillStyle = '#8a5f36';
  roundRect(ctx, 8, 76, 228, 40, 12);
  ctx.fill();
  ctx.fillRect(8, 104, 228, 12);
  text(ctx, 'ORDER BOARD', 122, 103, 17, CREAM, 'center');
  let y = 132;
  for (const order of world.orders) {
    const urgent = order.timeLeft < 12;
    ctx.fillStyle = CREAM;
    roundRect(ctx, 16, y, 212, 128, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#d23b2e' : '#c9bfa5';
    ctx.lineWidth = urgent ? 3 : 1.5;
    roundRect(ctx, 16, y, 212, 128, 8);
    ctx.stroke();
    text(ctx, order.recipe.name, 28, y + 24, 16, INK);
    text(ctx, `$${order.recipe.price}`, 216, y + 24, 16, '#2e7d32', 'right');
    order.recipe.items.forEach((kind, i) => {
      drawIngredient(ctx, kind, kind === 'patty' ? 'grilled' : kind === 'lettuce' || kind === 'tomato' || kind === 'onion' ? 'chopped' : 'raw', 44 + i * 34, y + 62, 13);
    });
    const frac = order.timeLeft / order.total;
    drawProgressBar(ctx, 28, y + 92, 188, 12, frac, frac > 0.5 ? '#4e9a3e' : frac > 0.25 ? '#e8a13c' : '#d23b2e');
    text(ctx, `${Math.ceil(order.timeLeft)}s`, 122, y + 120, 13, urgent ? '#d23b2e' : '#6b5a44', 'center');
    y += 140;
  }
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet —', 122, 220, 15, '#6b5a44', 'center');
    text(ctx, 'the lunch rush is coming!', 122, 242, 15, '#6b5a44', 'center');
  }
  text(ctx, 'Serve the plate that', 122, 640, 13, '#f3e2c2', 'center');
  text(ctx, 'matches an order ticket.', 122, 660, 13, '#f3e2c2', 'center');
  text(ctx, 'Tips grow with time left!', 122, 682, 13, '#f3e2c2', 'center');
}

function drawStationBase(ctx, station, topColor, frontColor, labelOverride) {
  ctx.fillStyle = frontColor;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = topColor;
  roundRect(ctx, station.x, station.y, station.w, 26, 10);
  ctx.fill();
  ctx.fillRect(station.x, station.y + 16, station.w, 10);
  text(ctx, labelOverride ?? station.label, station.x + station.w / 2, station.y + station.h - 10, 12, '#f3e2c2', 'center');
}

/** Small dark pill behind a hint line so it reads on any counter top. */
function drawHint(ctx, value, x, y) {
  ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  const w = ctx.measureText(value).width + 20;
  ctx.fillStyle = 'rgba(43,33,24,0.85)';
  roundRect(ctx, x - w / 2, y - 14, w, 20, 10);
  ctx.fill();
  text(ctx, value, x, y + 1, 12, '#ffe9b0', 'center');
}

function drawStations(ctx, world) {
  for (const station of STATIONS) {
    if (station.kind === 'board') {
      drawStationBase(ctx, station, '#e0b070', '#8a5a2e');
      ctx.fillStyle = '#f3d9a8';
      roundRect(ctx, station.x + 14, station.y + 30, station.w - 28, 34, 6);
      ctx.fill();
      const item = world.board.item;
      if (item !== null) {
        drawIngredient(ctx, item.kind, item.state, station.x + station.w / 2, station.y + 47, 15);
        if (item.state === 'chopping') {
          drawProgressBar(ctx, station.x + 20, station.y + 56, station.w - 40, 6, world.board.progress, '#e8a13c');
        }
      }
      // A little knife resting on the board.
      ctx.strokeStyle = '#5a5148';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(station.x + station.w - 34, station.y + 34);
      ctx.lineTo(station.x + station.w - 18, station.y + 52);
      ctx.stroke();
    } else if (station.kind === 'grill') {
      drawStationBase(ctx, station, '#4a4f55', '#2e3236');
      for (let i = 0; i < 2; i += 1) {
        const cx = station.x + 58 + i * 100;
        const cy = station.y + 48;
        ctx.fillStyle = '#1d1f22';
        roundRect(ctx, cx - 42, cy - 20, 84, 40, 8);
        ctx.fill();
        ctx.strokeStyle = '#6a7076';
        ctx.lineWidth = 2;
        for (let g = -1; g <= 1; g += 1) {
          ctx.beginPath();
          ctx.moveTo(cx - 38, cy + g * 11);
          ctx.lineTo(cx + 38, cy + g * 11);
          ctx.stroke();
        }
        const slot = world.grill[i];
        if (slot !== null) {
          drawIngredient(ctx, 'patty', slot.state, cx, cy, 16);
          const frac = Math.min(1, slot.cookTime / COOK.grillSeconds);
          const color = slot.state === 'burnt' ? '#d23b2e' : slot.state === 'grilled' ? '#4e9a3e' : '#e8a13c';
          drawProgressBar(ctx, cx - 36, cy + 13, 72, 6, slot.state === 'burnt' ? 1 : frac, color);
          if (slot.state === 'grilled') text(ctx, 'READY!', cx, station.y - 8, 12, '#2e7d32', 'center');
          if (slot.state === 'burnt') text(ctx, 'BURNT!', cx, station.y - 8, 12, '#d23b2e', 'center');
        }
      }
    } else if (station.kind === 'plate') {
      drawStationBase(ctx, station, '#c98f4e', '#8a5a2e');
      // A stack of clean plates waiting at the right end; the plate being
      // built sits at the left end, clear of the chef standing in front.
      ctx.fillStyle = '#f4f0e6';
      ctx.beginPath();
      ctx.ellipse(station.x + station.w - 34, station.y + 46, 22, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9bfa5';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (world.counterPlate !== null) {
        drawPlate(ctx, world.counterPlate.items, station.x + 62, station.y + 48, 1);
      } else {
        drawHint(ctx, 'take a plate', station.x + 110, station.y + 52);
      }
    } else if (station.kind === 'pass') {
      const hasPlate = world.passPlate !== null;
      drawStationBase(ctx, station, '#7fb069', '#4e7d3a', hasPlate ? 'READY TO SERVE' : undefined);
      ctx.fillStyle = '#fff3d0';
      roundRect(ctx, station.x + 12, station.y + 30, station.w - 24, 40, 6);
      ctx.fill();
      if (hasPlate) {
        drawPlate(ctx, world.passPlate.items, station.x + station.w / 2, station.y + 50, 1);
      } else {
        drawHint(ctx, 'serve finished plates here', station.x + station.w / 2, station.y + 54);
      }
    } else if (station.kind === 'crate') {
      drawStationBase(ctx, station, '#a4713a', '#7a4a22');
      drawIngredient(ctx, station.ingredient, station.ingredient === 'patty' ? 'raw' : 'raw', station.x + station.w / 2, station.y + 44, 17);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(station.x + station.w / 2, station.y + 62, 26, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (station.kind === 'trash') {
      drawStationBase(ctx, station, '#5a5148', '#3a352f');
      ctx.fillStyle = '#2e2a26';
      roundRect(ctx, station.x + 28, station.y + 30, 48, 36, 6);
      ctx.fill();
      ctx.strokeStyle = '#8a8178';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(station.x + 36, station.y + 42);
      ctx.lineTo(station.x + 68, station.y + 42);
      ctx.moveTo(station.x + 44, station.y + 42);
      ctx.lineTo(station.x + 46, station.y + 58);
      ctx.moveTo(station.x + 60, station.y + 42);
      ctx.lineTo(station.x + 58, station.y + 58);
      ctx.stroke();
    }
  }
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const x = chef.x;
  const y = chef.y;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + CHEF.radius + 4, CHEF.radius + 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron, teal shirt.
  ctx.fillStyle = '#2e7d7b';
  ctx.beginPath();
  ctx.arc(x, y, CHEF.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4f0e6';
  roundRect(ctx, x - 13, y - 4, 26, 22, 8);
  ctx.fill();
  ctx.strokeStyle = '#c9bfa5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 4);
  ctx.lineTo(x - 6, y + 12);
  ctx.moveTo(x + 10, y - 4);
  ctx.lineTo(x + 6, y + 12);
  ctx.stroke();
  // Head and toque.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(x, y - 8, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 8, y - 20, 7, 0, Math.PI * 2);
  ctx.arc(x, y - 24, 8, 0, Math.PI * 2);
  ctx.arc(x + 8, y - 20, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 13, y - 22, 26, 6);
  // Face looks where the chef walks.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x + chef.face * 5, y - 8, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // What the chef carries rides overhead.
  const carry = chef.carry;
  if (carry !== null) {
    if (carry.type === 'plate') {
      drawPlate(ctx, carry.items, x, y - 52, 0.85);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x, y - 50, 18, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, carry.kind, carry.state, x, y - 50, 14);
    }
  }
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawHud(ctx, world) {
  ctx.fillStyle = HUD_BG;
  ctx.fillRect(0, 0, VIEW.width, 64);
  text(ctx, 'SIZZLE & SERVE', 20, 42, 26, '#f2c531');
  const low = world.shiftLeft < 30;
  text(ctx, formatTime(world.shiftLeft), 640, 44, 30, low ? '#ff8a7a' : CREAM, 'center');
  text(ctx, 'SHIFT', 640, 18, 11, '#b9a98c', 'center');
  text(ctx, `$${world.coins}`, 900, 42, 22, '#ffd76a');
  if (world.combo >= 2) text(ctx, `COMBO ×${world.combo}`, 1040, 42, 20, '#ff9d5c');
  // Strikes: three pans; a lost one is crossed out.
  for (let i = 0; i < MAX_STRIKES; i += 1) {
    const x = 1180 + i * 30;
    const lost = i < world.strikes;
    ctx.fillStyle = lost ? '#5a5148' : '#f4f0e6';
    ctx.beginPath();
    ctx.arc(x, 32, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lost ? '#5a5148' : '#c9bfa5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, 32);
    ctx.lineTo(x + 18, 32);
    ctx.stroke();
    if (lost) {
      ctx.strokeStyle = '#d23b2e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, 26);
      ctx.lineTo(x + 6, 38);
      ctx.moveTo(x + 6, 26);
      ctx.lineTo(x - 6, 38);
      ctx.stroke();
    }
  }
  if (world.shiftLeft <= COOK.rushAtSecondsLeft && world.screen === SCREEN_PLAY) {
    const pulse = 0.6 + 0.4 * Math.sin(world.elapsed * 6);
    ctx.fillStyle = `rgba(210,59,46,${pulse.toFixed(2)})`;
    roundRect(ctx, 480, 70, 320, 26, 13);
    ctx.fill();
    text(ctx, 'RUSH HOUR — ORDERS COME FASTER!', 640, 89, 14, '#ffffff', 'center');
  }
  if (world.message !== '' && world.elapsed < world.messageUntil) {
    ctx.fillStyle = 'rgba(43,33,24,0.9)';
    const w = ctx.measureText(world.message).width + 36;
    roundRect(ctx, 640 - w / 2, 104, w, 30, 15);
    ctx.fill();
    text(ctx, world.message, 640, 125, 15, '#ffe9b0', 'center');
  }
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(43,33,24,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = CREAM;
  roundRect(ctx, 290, 110, 700, 500, 18);
  ctx.fill();
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 4;
  roundRect(ctx, 290, 110, 700, 500, 18);
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 185, 52, '#c25e2e', 'center');
  text(ctx, 'A tiny kitchen. A hungry lunch rush. One very busy chef — you.', 640, 220, 17, '#6b5a44', 'center');
  const lines = [
    'WASD / arrows — walk the kitchen    •    E / Space — grab, chop, grill, plate',
    'Click a station — walk there and use it    •    Click the floor — walk there',
    'Chop lettuce, tomato & onion on the board. Grill patties — pull them',
    'before they burn! Build each plate to match an order ticket, then',
    'serve it at the green pass. Tips grow with time left on the ticket.',
    'Three walked-out orders end the shift. Serve fast, serve right!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 268 + i * 26, 15, INK, 'center', 'normal'));
  text(ctx, 'MENU', 640, 446, 16, '#c25e2e', 'center');
  RECIPES.forEach((recipe, i) => {
    const y = 474 + i * 19;
    text(ctx, `${recipe.name} — $${recipe.price}`, 480, y, 14, INK, 'left', 'normal');
    recipe.items.forEach((kind, j) => {
      drawIngredient(ctx, kind, kind === 'patty' ? 'grilled' : 'raw', 800 + j * 26, y - 5, 9);
    });
  });
  const blink = 0.55 + 0.45 * Math.sin(world.elapsed * 4);
  ctx.fillStyle = `rgba(194,94,46,${blink.toFixed(2)})`;
  roundRect(ctx, 490, 566, 300, 36, 18);
  ctx.fill();
  text(ctx, 'PRESS ENTER OR CLICK TO COOK', 640, 590, 16, '#ffffff', 'center');
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(43,33,24,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = CREAM;
  roundRect(ctx, 340, 130, 600, 440, 18);
  ctx.fill();
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 4;
  roundRect(ctx, 340, 130, 600, 440, 18);
  ctx.stroke();
  const title = world.overReason === 'strikes' ? 'TOO MANY WALK-OUTS!' : 'SHIFT OVER!';
  text(ctx, title, 640, 205, 40, '#c25e2e', 'center');
  text(ctx, world.overReason === 'strikes'
    ? 'Three customers left hungry. The kitchen closes early.'
    : 'The lunch rush is done. Time to count the till.', 640, 238, 16, '#6b5a44', 'center');
  const grade = gradeFor(world.coins, world.served);
  text(ctx, grade, 640, 378, 110, grade === 'S' ? '#e8a13c' : '#2e7d7b', 'center');
  text(ctx, 'SHIFT GRADE', 640, 268, 14, '#6b5a44', 'center');
  const rows = [
    [`Dishes served`, `${world.served}`],
    [`Coins earned`, `$${world.coins}`],
    [`Best combo`, `×${world.bestCombo}`],
    [`Orders lost`, `${world.strikes}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 400 + i * 30;
    text(ctx, label, 480, y, 17, INK, 'left', 'normal');
    text(ctx, value, 800, y, 17, INK, 'right');
  });
  const blink = 0.55 + 0.45 * Math.sin(world.elapsed * 4);
  ctx.fillStyle = `rgba(194,94,46,${blink.toFixed(2)})`;
  roundRect(ctx, 490, 520, 300, 40, 20);
  ctx.fill();
  text(ctx, 'PRESS ENTER TO COOK AGAIN', 640, 546, 16, '#ffffff', 'center');
}

/** Draw the whole game for this frame. */
export function drawGame(ctx, world) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawKitchenFloor(ctx);
  drawOrderBoard(ctx, world);
  drawStations(ctx, world);
  drawChef(ctx, world);
  drawHud(ctx, world);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_OVER) drawGameOver(ctx, world);
}
