// Sizzle & Serve — kitchen layout, recipes and tuning in one place.
// Every number the rules use lives here so a balance change is one edit.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const MAX_STRIKES = 3;
export const MAX_ORDERS = 3;

export const CHEF = { radius: 22, speed: 265, interactRange: 78 };

// One entry per ingredient: what the crate hands out, what it needs before
// it may go on a plate, and how it is drawn.
export const INGREDIENTS = {
  bun: { label: 'Bun', needs: 'ready', color: '#e8b25c', dark: '#b97f2e' },
  patty: { label: 'Patty', needs: 'grill', color: '#c46a5a', dark: '#7a3b2e' },
  lettuce: { label: 'Lettuce', needs: 'chop', color: '#69b455', dark: '#3f7d31' },
  tomato: { label: 'Tomato', needs: 'chop', color: '#e05244', dark: '#a02c22' },
  cheese: { label: 'Cheese', needs: 'ready', color: '#f2c531', dark: '#c99a12' },
  onion: { label: 'Onion', needs: 'chop', color: '#efe6f2', dark: '#9b7fb0' },
};
// An ingredient is "ready to plate" when its state matches its need:
// ready ingredients are plated raw, chopped ones after the board, grilled
// ones after the grill. A burnt patty is never plated.
export function ingredientReady(kind, state) {
  if (state === 'burnt') return false;
  const need = INGREDIENTS[kind].needs;
  if (need === 'ready') return state === 'raw';
  if (need === 'chop') return state === 'chopped';
  return state === 'grilled';
}

// Recipes: the order board's menu. `items` is the exact multiset a plate
// must hold to serve that order.
export const RECIPES = [
  { id: 'burger', name: 'Classic Burger', price: 12, items: ['bun', 'patty', 'lettuce', 'tomato'] },
  { id: 'melt', name: 'Cheese Melt', price: 10, items: ['bun', 'patty', 'cheese'] },
  { id: 'salad', name: 'Garden Salad', price: 8, items: ['lettuce', 'tomato', 'onion'] },
  { id: 'stack', name: 'Deluxe Stack', price: 16, items: ['bun', 'patty', 'cheese', 'lettuce', 'tomato'] },
  { id: 'sunny', name: 'Sunny Stack', price: 11, items: ['bun', 'cheese', 'tomato', 'onion'] },
];

export const COOK = {
  chopSeconds: 1.6,
  grillSeconds: 7,
  grillBurnSeconds: 12,
  orderLifetime: 52,
  rushOrderLifetime: 38,
  spawnSeconds: 14,
  rushSpawnSeconds: 8,
  rushAtSecondsLeft: 60,
  tipPerSecondLeft: 0.25,
};

// Stations on the kitchen floor. `kind` drives the interaction rules;
// `label` is what the floor sign shows.
export const STATIONS = [
  { id: 'board', kind: 'board', label: 'CHOPPING BOARD', x: 268, y: 296, w: 150, h: 92 },
  { id: 'grill', kind: 'grill', label: 'GRILL', x: 452, y: 296, w: 216, h: 92 },
  { id: 'plate', kind: 'plate', label: 'PLATING', x: 702, y: 296, w: 216, h: 92 },
  { id: 'pass', kind: 'pass', label: 'SERVING PASS', x: 952, y: 296, w: 252, h: 92 },
  { id: 'crate-bun', kind: 'crate', ingredient: 'bun', label: 'BUNS', x: 268, y: 596, w: 104, h: 84 },
  { id: 'crate-patty', kind: 'crate', ingredient: 'patty', label: 'PATTIES', x: 388, y: 596, w: 104, h: 84 },
  { id: 'crate-lettuce', kind: 'crate', ingredient: 'lettuce', label: 'LETTUCE', x: 508, y: 596, w: 104, h: 84 },
  { id: 'crate-tomato', kind: 'crate', ingredient: 'tomato', label: 'TOMATO', x: 628, y: 596, w: 104, h: 84 },
  { id: 'crate-cheese', kind: 'crate', ingredient: 'cheese', label: 'CHEESE', x: 748, y: 596, w: 104, h: 84 },
  { id: 'crate-onion', kind: 'crate', ingredient: 'onion', label: 'ONION', x: 868, y: 596, w: 104, h: 84 },
  { id: 'trash', kind: 'trash', label: 'TRASH', x: 1004, y: 596, w: 104, h: 84 },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) ?? null;
}
export function stationCentre(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}
