import { useCallback, useEffect, useRef, useState } from "react";
import { useSubmitScore } from "../hooks/useQueries";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Vec2 {
  x: number;
  y: number;
}
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Player {
  x: number;
  y: number;
  angle: number;
  hp: number;
  armor: number;
  speed: number;
  inCar: number | null;
}

interface Car {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  hp: number;
  color: string;
  isPolice: boolean;
  occupiedByPlayer: boolean;
  occupiedByPolice: boolean;
  alive: boolean;
  explodeTimer: number;
}

interface NPC {
  x: number;
  y: number;
  angle: number;
  hp: number;
  state: "wander" | "flee" | "dead";
  targetX: number;
  targetY: number;
  color: string;
  wanderTimer: number;
}

interface PoliceOfficer {
  x: number;
  y: number;
  hp: number;
  shootTimer: number;
  state: "patrol" | "chase" | "dead";
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  fromPlayer: boolean;
}

interface Pickup {
  x: number;
  y: number;
  type: "health" | "ammo" | "pistol";
  active: boolean;
  respawnTimer: number;
}

interface Notification {
  text: string;
  alpha: number;
  timer: number;
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface WorldData {
  blockRects: Rect[];
  parkRects: Rect[];
  buildingRects: Rect[];
  roadLineSegs: { x1: number; y1: number; x2: number; y2: number }[];
  buildingColors: string[];
}

interface GameState {
  player: Player;
  cars: Car[];
  npcs: NPC[];
  policeOfficers: PoliceOfficer[];
  bullets: Bullet[];
  pickups: Pickup[];
  notifications: Notification[];
  explosions: ExplosionParticle[];
  wantedLevel: number;
  maxWantedReached: number;
  ammo: number;
  maxAmmo: number;
  hasWeapon: boolean;
  fireCooldown: number;
  reloading: boolean;
  evasionTimer: number;
  cameraX: number;
  cameraY: number;
  mouseX: number;
  mouseY: number;
  world: WorldData;
  startTime: number;
  lastTime: number;
}

const VIEWPORT_W = 900;
const VIEWPORT_H = 650;
const WORLD_W = 3200;
const WORLD_H = 3200;
const ROAD_W = 64;
const BLOCK_SIZE = 256;
const PLAYER_RADIUS = 10;
const CAR_W = 38;
const CAR_H = 18;
const BULLET_SPEED = 650;
const BULLET_LIFE = 1.4;
const NPC_COUNT = 20;
const CAR_COLORS = [
  "#E84040",
  "#4080FF",
  "#FFD700",
  "#00FFFF",
  "#FFFFFF",
  "#FF8C00",
  "#CC44FF",
  "#44FF88",
  "#FF4499",
  "#88AAFF",
];

// ─── World Generation ─────────────────────────────────────────────────────────

function generateCity(): WorldData {
  const blockRects: Rect[] = [];
  const parkRects: Rect[] = [];
  const buildingRects: Rect[] = [];
  const buildingColors: string[] = [];
  const roadLineSegs: { x1: number; y1: number; x2: number; y2: number }[] = [];

  const STEP = BLOCK_SIZE + ROAD_W;
  const COLS = Math.floor(WORLD_W / STEP);
  const ROWS = Math.floor(WORLD_H / STEP);

  const BCOLORS = [
    "#1e2035",
    "#252540",
    "#1a1a30",
    "#20203a",
    "#181828",
    "#2a2a45",
    "#16162a",
  ];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const bx = col * STEP + ROAD_W;
      const by = row * STEP + ROAD_W;
      const isPark = (row + col * 3) % 7 === 0;
      const r = { x: bx, y: by, w: BLOCK_SIZE, h: BLOCK_SIZE };
      blockRects.push(r);
      if (isPark) {
        parkRects.push(r);
      } else {
        // building slightly inset from block edge
        const inset = 6;
        buildingRects.push({
          x: bx + inset,
          y: by + inset,
          w: BLOCK_SIZE - inset * 2,
          h: BLOCK_SIZE - inset * 2,
        });
        buildingColors.push(BCOLORS[(row * COLS + col) % BCOLORS.length]);
      }
    }
  }

  // road dashes - horizontal
  for (let row = 0; row <= ROWS; row++) {
    const y = row * STEP + ROAD_W / 2;
    for (let x = 0; x < WORLD_W; x += 40) {
      roadLineSegs.push({ x1: x, y1: y, x2: x + 22, y2: y });
    }
  }
  // road dashes - vertical
  for (let col = 0; col <= COLS; col++) {
    const x = col * STEP + ROAD_W / 2;
    for (let y = 0; y < WORLD_H; y += 40) {
      roadLineSegs.push({ x1: x, y1: y, x2: x, y2: y + 22 });
    }
  }

  return { blockRects, parkRects, buildingRects, roadLineSegs, buildingColors };
}

function getRoadPositions(): Vec2[] {
  const positions: Vec2[] = [];
  const STEP = BLOCK_SIZE + ROAD_W;
  const COLS = Math.floor(WORLD_W / STEP);
  const ROWS = Math.floor(WORLD_H / STEP);
  // intersections
  for (let row = 0; row <= ROWS; row++) {
    for (let col = 0; col <= COLS; col++) {
      positions.push({
        x: col * STEP + ROAD_W / 2,
        y: row * STEP + ROAD_W / 2,
      });
    }
  }
  return positions;
}

function circleRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nearX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearX;
  const dy = cy - nearY;
  return dx * dx + dy * dy < r * r;
}

function rectRect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ─── Drawing ─────────────────────────────────────────────────────────────────

function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  camX: number,
  camY: number,
) {
  ctx.save();
  ctx.translate(-camX, -camY);

  // Road background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Sidewalk border on blocks
  ctx.fillStyle = "#28283c";
  for (const b of world.blockRects) {
    ctx.fillRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
  }

  // Park blocks
  ctx.fillStyle = "#1a3020";
  for (const p of world.parkRects) {
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // park details
    ctx.fillStyle = "#1e3a24";
    ctx.fillRect(p.x + 20, p.y + 20, 30, 30);
    ctx.fillRect(p.x + p.w - 50, p.y + p.h - 50, 30, 30);
    ctx.fillStyle = "#1a3020";
  }

  // Buildings
  for (let i = 0; i < world.buildingRects.length; i++) {
    const b = world.buildingRects[i];
    ctx.fillStyle = world.buildingColors[i];
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // windows
    ctx.fillStyle = "rgba(255,220,100,0.25)";
    for (let wy = b.y + 12; wy < b.y + b.h - 12; wy += 20) {
      for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 16) {
        if ((wx + wy) % 3 !== 0) ctx.fillRect(wx, wy, 8, 10);
      }
    }
  }

  // Road dashes
  ctx.strokeStyle = "rgba(255,220,40,0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  for (const seg of world.roadLineSegs) {
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCarShape(
  ctx: CanvasRenderingContext2D,
  car: Car,
  camX: number,
  camY: number,
) {
  const sx = car.x - camX;
  const sy = car.y - camY;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(car.angle);

  if (!car.alive) {
    // Wreck
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.roundRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, 4);
    ctx.fill();
    ctx.strokeStyle = "#FF4400";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Body
    ctx.fillStyle = car.isPolice ? "#1040A0" : car.color;
    ctx.beginPath();
    ctx.roundRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, 4);
    ctx.fill();

    // Police light bar
    if (car.isPolice) {
      const t = Date.now() / 200;
      ctx.fillStyle = Math.floor(t) % 2 === 0 ? "#FF2020" : "#2060FF";
      ctx.fillRect(-8, -CAR_H / 2 - 3, 16, 4);
    }

    // Windshield
    ctx.fillStyle = "rgba(150,220,255,0.4)";
    ctx.fillRect(2, -CAR_H / 2 + 3, 10, CAR_H - 6);

    // Headlights
    ctx.fillStyle = "rgba(255,255,180,0.9)";
    ctx.fillRect(CAR_W / 2 - 4, -CAR_H / 2 + 2, 4, 5);
    ctx.fillRect(CAR_W / 2 - 4, CAR_H / 2 - 7, 4, 5);
  }
  ctx.restore();
}

function drawEntities(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  camX: number,
  camY: number,
) {
  ctx.save();

  // NPCs
  for (const npc of gs.npcs) {
    const sx = npc.x - camX;
    const sy = npc.y - camY;
    if (sx < -30 || sx > VIEWPORT_W + 30 || sy < -30 || sy > VIEWPORT_H + 30)
      continue;

    if (npc.state === "dead") {
      ctx.strokeStyle = "#FF4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 7, sy - 7);
      ctx.lineTo(sx + 7, sy + 7);
      ctx.moveTo(sx + 7, sy - 7);
      ctx.lineTo(sx - 7, sy + 7);
      ctx.stroke();
    } else {
      ctx.fillStyle = npc.color;
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();
      // direction
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.arc(
        sx + Math.cos(npc.angle) * 4,
        sy + Math.sin(npc.angle) * 4,
        3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  // Police Officers
  for (const po of gs.policeOfficers) {
    const sx = po.x - camX;
    const sy = po.y - camY;
    if (sx < -30 || sx > VIEWPORT_W + 30 || sy < -30 || sy > VIEWPORT_H + 30)
      continue;
    if (po.state === "dead") {
      ctx.strokeStyle = "#0088FF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 7, sy - 7);
      ctx.lineTo(sx + 7, sy + 7);
      ctx.moveTo(sx + 7, sy - 7);
      ctx.lineTo(sx - 7, sy + 7);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#2255CC";
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#88AAFF";
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cars
  for (const car of gs.cars) {
    const sx = car.x - camX;
    const sy = car.y - camY;
    if (sx < -60 || sx > VIEWPORT_W + 60 || sy < -60 || sy > VIEWPORT_H + 60)
      continue;
    drawCarShape(ctx, car, camX, camY);
  }

  // Pickups
  for (const pk of gs.pickups) {
    if (!pk.active) continue;
    const sx = pk.x - camX;
    const sy = pk.y - camY;
    if (sx < -20 || sx > VIEWPORT_W + 20 || sy < -20 || sy > VIEWPORT_H + 20)
      continue;
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
    if (pk.type === "health") {
      ctx.shadowColor = "#FF4444";
      ctx.shadowBlur = 12 * pulse;
      ctx.fillStyle = "#FF4444";
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", sx, sy);
    } else if (pk.type === "ammo") {
      ctx.shadowColor = "#FFAA00";
      ctx.shadowBlur = 10 * pulse;
      ctx.fillStyle = "#FFAA00";
      ctx.fillRect(sx - 9, sy - 9, 18, 18);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("A", sx, sy);
    } else {
      ctx.shadowColor = "#FFE020";
      ctx.shadowBlur = 14 * pulse;
      ctx.fillStyle = "#FFE020";
      ctx.beginPath();
      ctx.arc(sx, sy, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", sx, sy);
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }

  // Bullets
  for (const b of gs.bullets) {
    const sx = b.x - camX;
    const sy = b.y - camY;
    ctx.fillStyle = b.fromPlayer ? "#FFEE44" : "#FF4488";
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Explosions
  for (const p of gs.explosions) {
    const a = p.life / p.maxLife;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - camX, p.y - camY, 4 + (1 - a) * 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Player (if on foot)
  const p = gs.player;
  if (p.inCar === null) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(
      sx + 3,
      sy + 3,
      PLAYER_RADIUS,
      PLAYER_RADIUS * 0.6,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Body
    ctx.fillStyle = "#44AAFF";
    ctx.shadowColor = "#44AAFF";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(sx, sy, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Direction dot
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(
      sx + Math.cos(p.angle) * 6,
      sy + Math.sin(p.angle) * 6,
      4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Aim line when armed
    if (gs.hasWeapon) {
      ctx.strokeStyle = "rgba(255,220,50,0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(p.angle) * 80, sy + Math.sin(p.angle) * 80);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, gs: GameState) {
  ctx.save();
  ctx.font = "bold 13px 'GeneralSans', monospace";

  // ─ Top-left: Wanted stars ─
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(10, 10, 180, 56);
  ctx.strokeStyle = "rgba(255,60,60,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 180, 56);

  for (let i = 0; i < 5; i++) {
    const filled = i < gs.wantedLevel;
    ctx.fillStyle = filled ? "#FFD700" : "rgba(255,255,255,0.15)";
    if (filled) {
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 8;
    }
    ctx.font = "bold 20px monospace";
    ctx.fillText("★", 18 + i * 32, 40);
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "bold 11px monospace";
  ctx.fillText("WANTED", 18, 58);

  // ─ Top-right: HP + Armor ─
  const hpX = VIEWPORT_W - 175;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(hpX - 10, 10, 175, 70);
  ctx.strokeStyle = "rgba(255,60,60,0.3)";
  ctx.strokeRect(hpX - 10, 10, 175, 70);

  const hpPct = Math.max(0, gs.player.hp) / 100;
  ctx.fillStyle = "rgba(80,0,0,0.8)";
  ctx.fillRect(hpX, 20, 150, 14);
  ctx.fillStyle =
    hpPct > 0.5 ? "#44FF44" : hpPct > 0.25 ? "#FFAA00" : "#FF2222";
  ctx.fillRect(hpX, 20, 150 * hpPct, 14);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px monospace";
  ctx.fillText(`HP  ${Math.ceil(gs.player.hp)}/100`, hpX, 48);

  const armorPct = Math.max(0, gs.player.armor) / 100;
  ctx.fillStyle = "rgba(0,0,80,0.8)";
  ctx.fillRect(hpX, 52, 150, 10);
  ctx.fillStyle = "#4488FF";
  ctx.fillRect(hpX, 52, 150 * armorPct, 10);
  ctx.fillStyle = "rgba(150,180,255,0.8)";
  ctx.font = "bold 10px monospace";
  ctx.fillText(`ARM ${Math.ceil(gs.player.armor)}/100`, hpX, 74);

  // ─ Bottom-left: Weapon ─
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(10, VIEWPORT_H - 48, 160, 38);
  ctx.strokeStyle = "rgba(255,200,0,0.3)";
  ctx.strokeRect(10, VIEWPORT_H - 48, 160, 38);
  ctx.fillStyle = gs.hasWeapon ? "#FFE020" : "rgba(255,255,255,0.3)";
  ctx.font = "bold 13px monospace";
  ctx.fillText(
    gs.hasWeapon ? `GUN  ${gs.ammo}/${gs.maxAmmo}` : "UNARMED",
    18,
    VIEWPORT_H - 24,
  );

  // ─ Center top: Notifications ─
  let notifY = 90;
  for (const n of gs.notifications) {
    ctx.globalAlpha = n.alpha;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.font = "bold 18px 'BricolageGrotesque', monospace";
    const w = ctx.measureText(n.text).width;
    ctx.fillRect(VIEWPORT_W / 2 - w / 2 - 10, notifY - 20, w + 20, 28);
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "center";
    ctx.fillText(n.text, VIEWPORT_W / 2, notifY);
    ctx.textAlign = "left";
    notifY += 36;
  }
  ctx.globalAlpha = 1;

  // ─ Minimap ─
  drawMinimap(ctx, gs);

  ctx.restore();
}

function drawMinimap(ctx: CanvasRenderingContext2D, gs: GameState) {
  const MM_W = 160;
  const MM_H = 160;
  const MM_X = VIEWPORT_W - MM_W - 10;
  const MM_Y = VIEWPORT_H - MM_H - 10;
  const SCALE = MM_W / WORLD_W;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.fillRect(MM_X, MM_Y, MM_W, MM_H);
  ctx.strokeRect(MM_X, MM_Y, MM_W, MM_H);

  ctx.beginPath();
  ctx.rect(MM_X, MM_Y, MM_W, MM_H);
  ctx.clip();

  // Blocks
  ctx.fillStyle = "#2a2a3e";
  for (const b of gs.world.blockRects) {
    ctx.fillRect(
      MM_X + b.x * SCALE,
      MM_Y + b.y * SCALE,
      b.w * SCALE,
      b.h * SCALE,
    );
  }

  // NPCs
  ctx.fillStyle = "#AAAAAA";
  for (const npc of gs.npcs) {
    if (npc.state === "dead") continue;
    ctx.fillRect(MM_X + npc.x * SCALE - 1, MM_Y + npc.y * SCALE - 1, 2, 2);
  }

  // Police officers
  ctx.fillStyle = "#FF4444";
  for (const po of gs.policeOfficers) {
    if (po.state === "dead") continue;
    ctx.fillRect(MM_X + po.x * SCALE - 2, MM_Y + po.y * SCALE - 2, 4, 4);
  }

  // Police cars
  for (const car of gs.cars) {
    if (!car.isPolice || !car.alive) continue;
    ctx.fillStyle = "#FF4444";
    ctx.fillRect(MM_X + car.x * SCALE - 2, MM_Y + car.y * SCALE - 2, 4, 4);
  }

  // Player
  ctx.fillStyle = "#44AAFF";
  ctx.shadowColor = "#44AAFF";
  ctx.shadowBlur = 6;
  const px =
    gs.player.inCar !== null
      ? (gs.cars[gs.player.inCar]?.x ?? gs.player.x)
      : gs.player.x;
  const py =
    gs.player.inCar !== null
      ? (gs.cars[gs.player.inCar]?.y ?? gs.player.y)
      : gs.player.y;
  ctx.beginPath();
  ctx.arc(MM_X + px * SCALE, MM_Y + py * SCALE, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ─── Initial State ────────────────────────────────────────────────────────────

function createInitialState(world: WorldData): GameState {
  const roadPositions = getRoadPositions();

  // Cars
  const cars: Car[] = [];
  const usedPositions: Vec2[] = [];
  const CAR_COUNT = 15;
  for (let i = 0; i < CAR_COUNT; i++) {
    let pos = roadPositions[Math.floor(Math.random() * roadPositions.length)];
    // offset from intersection
    pos = {
      x: pos.x + (Math.random() - 0.5) * 120,
      y: pos.y + (Math.random() - 0.5) * 120,
    };
    // clamp
    pos.x = Math.max(80, Math.min(WORLD_W - 80, pos.x));
    pos.y = Math.max(80, Math.min(WORLD_H - 80, pos.y));
    usedPositions.push(pos);
    const isPolice = i >= CAR_COUNT - 4;
    cars.push({
      x: pos.x,
      y: pos.y,
      angle: Math.random() * Math.PI * 2,
      vx: 0,
      vy: 0,
      hp: 100,
      color: CAR_COLORS[i % CAR_COLORS.length],
      isPolice,
      occupiedByPlayer: false,
      occupiedByPolice: false,
      alive: true,
      explodeTimer: 0,
    });
  }

  // NPCs
  const npcs: NPC[] = [];
  const NPC_COLORS = [
    "#FF8888",
    "#88FF88",
    "#FFCC88",
    "#FF88FF",
    "#88CCFF",
    "#FFFFAA",
  ];
  for (let i = 0; i < NPC_COUNT; i++) {
    const rp = roadPositions[Math.floor(Math.random() * roadPositions.length)];
    npcs.push({
      x: rp.x + (Math.random() - 0.5) * 60,
      y: rp.y + (Math.random() - 0.5) * 60,
      angle: Math.random() * Math.PI * 2,
      hp: 100,
      state: "wander",
      targetX: rp.x,
      targetY: rp.y,
      color: NPC_COLORS[i % NPC_COLORS.length],
      wanderTimer: Math.random() * 4 + 1,
    });
  }

  // Pickups
  const pickups: Pickup[] = [];
  const pickupPosBase = [
    { x: 400, y: 400 },
    { x: 1600, y: 800 },
    { x: 800, y: 1600 },
    { x: 2400, y: 400 },
    { x: 400, y: 2400 },
    { x: 1200, y: 1200 },
    { x: 2000, y: 2000 },
    { x: 2800, y: 1600 },
    { x: 1600, y: 2400 },
    { x: 2800, y: 2800 },
    { x: 600, y: 600 },
    { x: 2200, y: 600 },
    { x: 600, y: 2200 },
    { x: 1200, y: 2800 },
    { x: 2800, y: 400 },
    { x: 1000, y: 1000 },
    { x: 2600, y: 1000 },
    { x: 1000, y: 2600 },
  ];
  for (let i = 0; i < 5; i++) {
    pickups.push({
      ...pickupPosBase[i],
      type: "health",
      active: true,
      respawnTimer: 0,
    });
  }
  for (let i = 5; i < 10; i++) {
    pickups.push({
      ...pickupPosBase[i],
      type: "ammo",
      active: true,
      respawnTimer: 0,
    });
  }
  for (let i = 10; i < 18; i++) {
    pickups.push({
      ...pickupPosBase[i],
      type: "pistol",
      active: true,
      respawnTimer: 0,
    });
  }

  return {
    player: {
      x: WORLD_W / 2,
      y: WORLD_H / 2,
      angle: 0,
      hp: 100,
      armor: 0,
      speed: 150,
      inCar: null,
    },
    cars,
    npcs,
    policeOfficers: [],
    bullets: [],
    pickups,
    notifications: [],
    explosions: [],
    wantedLevel: 0,
    maxWantedReached: 0,
    ammo: 0,
    maxAmmo: 60,
    hasWeapon: false,
    fireCooldown: 0,
    reloading: false,
    evasionTimer: 0,
    cameraX: WORLD_W / 2 - VIEWPORT_W / 2,
    cameraY: WORLD_H / 2 - VIEWPORT_H / 2,
    mouseX: VIEWPORT_W / 2,
    mouseY: VIEWPORT_H / 2,
    world,
    startTime: Date.now(),
    lastTime: Date.now(),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface GTAGameProps {
  onBackToMenu: () => void;
}

export default function GTAGame({ onBackToMenu }: GTAGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({
    x: VIEWPORT_W / 2,
    y: VIEWPORT_H / 2,
    down: false,
  });
  const rafRef = useRef<number>(0);
  const worldRef = useRef<WorldData | null>(null);

  const [_wantedHUD, setWantedHUD] = useState(0);
  const [gameScreen, setGameScreen] = useState<"playing" | "wasted">("playing");
  const [wastedStats, setWastedStats] = useState({
    timeSurvived: 0,
    maxStars: 0,
  });
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submitScore = useSubmitScore();

  const addNotification = useCallback((gs: GameState, text: string) => {
    gs.notifications.push({ text, alpha: 1, timer: 2.5 });
    if (gs.notifications.length > 4) gs.notifications.shift();
  }, []);

  const spawnExplosion = useCallback((gs: GameState, x: number, y: number) => {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      gs.explosions.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: ["#FF6600", "#FFAA00", "#FF3300", "#FFDD00", "#FF8800"][
          Math.floor(Math.random() * 5)
        ],
      });
    }
  }, []);

  const updatePoliceCount = useCallback((gs: GameState) => {
    const wanted = gs.wantedLevel;
    // Assign police cars
    let targetPoliceCars =
      wanted >= 5 ? 6 : wanted >= 3 ? 4 : wanted >= 1 ? 2 : 0;
    let activePoliceCars = gs.cars.filter((c) => c.isPolice && c.alive).length;
    // spawn officer waves at 5 stars
    if (
      wanted >= 5 &&
      gs.policeOfficers.filter((p) => p.state !== "dead").length < 4
    ) {
      const px =
        gs.player.inCar !== null
          ? (gs.cars[gs.player.inCar]?.x ?? gs.player.x)
          : gs.player.x;
      const py =
        gs.player.inCar !== null
          ? (gs.cars[gs.player.inCar]?.y ?? gs.player.y)
          : gs.player.y;
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 350 + Math.random() * 150;
        gs.policeOfficers.push({
          x: px + Math.cos(angle) * r,
          y: py + Math.sin(angle) * r,
          hp: 100,
          shootTimer: 1.5 + i * 0.5,
          state: "chase",
        });
      }
    }
    // Activate police cars
    for (const car of gs.cars) {
      if (!car.isPolice) continue;
      if (!car.alive) continue;
      if (targetPoliceCars > 0) {
        car.occupiedByPolice = true;
        targetPoliceCars--;
      } else {
        car.occupiedByPolice = false;
      }
    }
    void activePoliceCars;
  }, []);

  const gameLoop = useCallback(() => {
    const gs = gsRef.current;
    if (!gs) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = Date.now();
    const dt = Math.min((now - gs.lastTime) / 1000, 0.05);
    gs.lastTime = now;

    const keys = keysRef.current;
    const mouse = mouseRef.current;

    // Update mouse position in game state
    gs.mouseX = mouse.x;
    gs.mouseY = mouse.y;

    const playerCar =
      gs.player.inCar !== null ? gs.cars[gs.player.inCar] : null;
    const playerX = playerCar ? playerCar.x : gs.player.x;
    const playerY = playerCar ? playerCar.y : gs.player.y;

    // ─── Player aim ───
    const worldMouseX = mouse.x + gs.cameraX;
    const worldMouseY = mouse.y + gs.cameraY;
    gs.player.angle = Math.atan2(worldMouseY - playerY, worldMouseX - playerX);

    // ─── Player on foot ───
    if (gs.player.inCar === null) {
      const sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
      const speed = sprint ? 250 : 150;
      let dx = 0;
      let dy = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp")) dy -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) dy += 1;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
      }
      let nx = gs.player.x + dx * speed * dt;
      let ny = gs.player.y + dy * speed * dt;
      // collision
      let blocked = false;
      for (const b of gs.world.buildingRects) {
        if (circleRect(nx, ny, PLAYER_RADIUS + 2, b)) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        nx = Math.max(PLAYER_RADIUS, Math.min(WORLD_W - PLAYER_RADIUS, nx));
        ny = Math.max(PLAYER_RADIUS, Math.min(WORLD_H - PLAYER_RADIUS, ny));
        gs.player.x = nx;
        gs.player.y = ny;
      }
    }

    // ─── Car driving ───
    if (playerCar && gs.player.inCar !== null) {
      const car = playerCar;
      const maxSpeed = car.isPolice ? 300 : 280;
      const turnRate = 2.0;
      const accel = 400;
      const accelF =
        keys.has("KeyW") || keys.has("ArrowUp")
          ? 1
          : keys.has("KeyS") || keys.has("ArrowDown")
            ? -0.6
            : 0;
      const turnF =
        keys.has("KeyA") || keys.has("ArrowLeft")
          ? -1
          : keys.has("KeyD") || keys.has("ArrowRight")
            ? 1
            : 0;
      const spd = Math.sqrt(car.vx * car.vx + car.vy * car.vy);
      const normalizedSpd = Math.min(spd / maxSpeed, 1);

      // Acceleration
      car.vx += Math.cos(car.angle) * accel * accelF * dt;
      car.vy += Math.sin(car.angle) * accel * accelF * dt;

      // Steering
      if (spd > 20) {
        car.angle += turnF * turnRate * normalizedSpd * dt;
      }

      // Friction
      car.vx *= 0.96 ** (dt * 60);
      car.vy *= 0.96 ** (dt * 60);

      // Speed cap
      const newSpd = Math.sqrt(car.vx * car.vx + car.vy * car.vy);
      if (newSpd > maxSpeed) {
        car.vx = (car.vx / newSpd) * maxSpeed;
        car.vy = (car.vy / newSpd) * maxSpeed;
      }

      // Move
      let nx = car.x + car.vx * dt;
      let ny = car.y + car.vy * dt;
      nx = Math.max(30, Math.min(WORLD_W - 30, nx));
      ny = Math.max(30, Math.min(WORLD_H - 30, ny));

      // Car collision with buildings
      const carRect: Rect = {
        x: nx - CAR_W / 2,
        y: ny - CAR_H / 2,
        w: CAR_W,
        h: CAR_H,
      };
      let carBlocked = false;
      for (const b of gs.world.buildingRects) {
        if (
          rectRect(carRect, { x: b.x - 2, y: b.y - 2, w: b.w + 4, h: b.h + 4 })
        ) {
          carBlocked = true;
          // damage on high speed collision
          if (newSpd > 100) {
            car.hp -= newSpd * 0.05;
            car.vx *= -0.3;
            car.vy *= -0.3;
          } else {
            car.vx = 0;
            car.vy = 0;
          }
          break;
        }
      }
      if (!carBlocked) {
        car.x = nx;
        car.y = ny;
      }

      // Sync player pos
      gs.player.x = car.x;
      gs.player.y = car.y;
      car.angle = gs.player.inCar !== null ? car.angle : car.angle;
    }

    // ─── Shooting ───
    gs.fireCooldown = Math.max(0, gs.fireCooldown - dt);
    const wantShoot =
      (mouse.down || keys.has("KeyF")) && gs.hasWeapon && gs.ammo > 0;
    if (wantShoot && gs.fireCooldown === 0) {
      gs.fireCooldown = 0.3;
      gs.ammo--;
      const bx = playerX + Math.cos(gs.player.angle) * 20;
      const by = playerY + Math.sin(gs.player.angle) * 20;
      gs.bullets.push({
        x: bx,
        y: by,
        vx: Math.cos(gs.player.angle) * BULLET_SPEED,
        vy: Math.sin(gs.player.angle) * BULLET_SPEED,
        lifetime: BULLET_LIFE,
        fromPlayer: true,
      });
      // Wanted: shooting in public
      if (gs.wantedLevel < 5) {
        for (const npc of gs.npcs) {
          if (npc.state !== "dead" && dist(bx, by, npc.x, npc.y) < 300) {
            gs.wantedLevel = Math.min(5, gs.wantedLevel + 1);
            gs.maxWantedReached = Math.max(gs.maxWantedReached, gs.wantedLevel);
            setWantedHUD(gs.wantedLevel);
            updatePoliceCount(gs);
            break;
          }
        }
      }
    }

    // ─── Bullets ───
    for (let i = gs.bullets.length - 1; i >= 0; i--) {
      const b = gs.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.lifetime -= dt;
      if (b.lifetime <= 0) {
        gs.bullets.splice(i, 1);
        continue;
      }

      // Hit buildings
      let hitWall = false;
      for (const bld of gs.world.buildingRects) {
        if (
          b.x >= bld.x &&
          b.x <= bld.x + bld.w &&
          b.y >= bld.y &&
          b.y <= bld.y + bld.h
        ) {
          hitWall = true;
          break;
        }
      }
      if (hitWall) {
        gs.bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer) {
        // Hit NPCs
        let hitSomething = false;
        for (const npc of gs.npcs) {
          if (npc.state === "dead") continue;
          if (dist(b.x, b.y, npc.x, npc.y) < 12) {
            npc.hp -= 25;
            if (npc.hp <= 0) {
              npc.state = "dead";
              gs.wantedLevel = Math.min(5, gs.wantedLevel + 2);
              gs.maxWantedReached = Math.max(
                gs.maxWantedReached,
                gs.wantedLevel,
              );
              setWantedHUD(gs.wantedLevel);
              addNotification(gs, "CIVILIAN DOWN!");
              updatePoliceCount(gs);
            } else {
              npc.state = "flee";
            }
            hitSomething = true;
            break;
          }
        }
        if (hitSomething) {
          gs.bullets.splice(i, 1);
          continue;
        }

        // Hit police officers
        for (let j = 0; j < gs.policeOfficers.length; j++) {
          const po = gs.policeOfficers[j];
          if (po.state === "dead") continue;
          if (dist(b.x, b.y, po.x, po.y) < 12) {
            po.hp -= 40;
            if (po.hp <= 0) po.state = "dead";
            gs.wantedLevel = Math.min(5, gs.wantedLevel + 1);
            gs.maxWantedReached = Math.max(gs.maxWantedReached, gs.wantedLevel);
            setWantedHUD(gs.wantedLevel);
            updatePoliceCount(gs);
            hitSomething = true;
            break;
          }
        }
        if (hitSomething) {
          gs.bullets.splice(i, 1);
          continue;
        }

        // Hit police cars
        for (const car of gs.cars) {
          if (!car.isPolice || !car.alive) continue;
          const cr: Rect = {
            x: car.x - CAR_W / 2,
            y: car.y - CAR_H / 2,
            w: CAR_W,
            h: CAR_H,
          };
          if (
            b.x >= cr.x &&
            b.x <= cr.x + cr.w &&
            b.y >= cr.y &&
            b.y <= cr.y + cr.h
          ) {
            car.hp -= 20;
            gs.wantedLevel = Math.min(5, gs.wantedLevel + 1);
            gs.maxWantedReached = Math.max(gs.maxWantedReached, gs.wantedLevel);
            setWantedHUD(gs.wantedLevel);
            if (car.hp <= 0) {
              car.alive = false;
              spawnExplosion(gs, car.x, car.y);
              addNotification(gs, "POLICE CAR DESTROYED!");
            }
            updatePoliceCount(gs);
            hitSomething = true;
            break;
          }
        }
        if (hitSomething) {
          gs.bullets.splice(i, 1);
        }
      } else {
        // Police bullet hits player
        if (dist(b.x, b.y, playerX, playerY) < PLAYER_RADIUS + 4) {
          let dmg = 15;
          if (gs.player.armor > 0) {
            const absorbed = Math.min(dmg * 0.6, gs.player.armor);
            gs.player.armor -= absorbed;
            dmg -= absorbed;
          }
          gs.player.hp -= dmg;
          gs.bullets.splice(i, 1);
        }
      }
    }

    // ─── NPCs ───
    for (const npc of gs.npcs) {
      if (npc.state === "dead") continue;

      if (npc.state === "flee") {
        // Flee from player
        const angle = Math.atan2(npc.y - playerY, npc.x - playerX);
        npc.x += Math.cos(angle) * 120 * dt;
        npc.y += Math.sin(angle) * 120 * dt;
        npc.angle = angle;
        npc.x = Math.max(20, Math.min(WORLD_W - 20, npc.x));
        npc.y = Math.max(20, Math.min(WORLD_H - 20, npc.y));
      } else {
        // Wander
        npc.wanderTimer -= dt;
        if (npc.wanderTimer <= 0) {
          const rp = getRoadPositions();
          const pick = rp[Math.floor(Math.random() * rp.length)];
          npc.targetX = pick.x + (Math.random() - 0.5) * 60;
          npc.targetY = pick.y + (Math.random() - 0.5) * 60;
          npc.wanderTimer = 3 + Math.random() * 2;
        }
        const dx = npc.targetX - npc.x;
        const dy = npc.targetY - npc.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 10) {
          npc.angle = Math.atan2(dy, dx);
          npc.x += (dx / d) * 55 * dt;
          npc.y += (dy / d) * 55 * dt;
        }
        // Flee if player nearby and wanted
        if (gs.wantedLevel > 0 && dist(npc.x, npc.y, playerX, playerY) < 200) {
          npc.state = "flee";
        }
      }
    }

    // ─── Police Officers AI ───
    for (const po of gs.policeOfficers) {
      if (po.state === "dead") continue;
      const dx = playerX - po.x;
      const dy = playerY - po.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 5) {
        po.x += (dx / d) * 90 * dt;
        po.y += (dy / d) * 90 * dt;
      }
      // Shoot at player
      po.shootTimer -= dt;
      if (po.shootTimer <= 0 && d < 350) {
        po.shootTimer = 2;
        const angle = Math.atan2(dy, dx);
        gs.bullets.push({
          x: po.x + Math.cos(angle) * 15,
          y: po.y + Math.sin(angle) * 15,
          vx: Math.cos(angle) * BULLET_SPEED * 0.8,
          vy: Math.sin(angle) * BULLET_SPEED * 0.8,
          lifetime: BULLET_LIFE,
          fromPlayer: false,
        });
      }
    }

    // ─── Police Cars AI ───
    for (const car of gs.cars) {
      if (!car.isPolice || !car.alive || !car.occupiedByPolice) continue;
      const dx = playerX - car.x;
      const dy = playerY - car.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const targetAngle = Math.atan2(dy, dx);
      // Steer toward player
      let angleDiff = targetAngle - car.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      car.angle +=
        Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 2.5 * dt);
      // Accelerate toward player
      const maxSpd = 300;
      car.vx += Math.cos(car.angle) * 350 * dt;
      car.vy += Math.sin(car.angle) * 350 * dt;
      car.vx *= 0.97 ** (dt * 60);
      car.vy *= 0.97 ** (dt * 60);
      const spd = Math.sqrt(car.vx ** 2 + car.vy ** 2);
      if (spd > maxSpd) {
        car.vx = (car.vx / spd) * maxSpd;
        car.vy = (car.vy / spd) * maxSpd;
      }
      car.x += car.vx * dt;
      car.y += car.vy * dt;
      car.x = Math.max(30, Math.min(WORLD_W - 30, car.x));
      car.y = Math.max(30, Math.min(WORLD_H - 30, car.y));
      void d;
    }

    // ─── E: Enter/Exit car ───
    // (handled in keydown)

    // ─── Pickups ───
    for (const pk of gs.pickups) {
      if (!pk.active) {
        pk.respawnTimer -= dt;
        if (pk.respawnTimer <= 0) pk.active = true;
        continue;
      }
      if (dist(playerX, playerY, pk.x, pk.y) < 20) {
        if (pk.type === "health") {
          gs.player.hp = Math.min(100, gs.player.hp + 50);
          addNotification(gs, "+50 HEALTH!");
        } else if (pk.type === "ammo") {
          gs.ammo = Math.min(gs.maxAmmo, gs.ammo + 15);
          addNotification(gs, "+15 AMMO!");
        } else {
          gs.hasWeapon = true;
          gs.ammo = Math.min(gs.maxAmmo, gs.ammo + 15);
          addNotification(gs, "PISTOL PICKED UP!");
        }
        pk.active = false;
        pk.respawnTimer = 30;
      }
    }

    // ─── Evasion system ───
    if (gs.wantedLevel > 0) {
      let seen = false;
      for (const po of gs.policeOfficers) {
        if (po.state !== "dead" && dist(playerX, playerY, po.x, po.y) < 400) {
          seen = true;
          break;
        }
      }
      if (!seen) {
        for (const car of gs.cars) {
          if (
            car.isPolice &&
            car.alive &&
            car.occupiedByPolice &&
            dist(playerX, playerY, car.x, car.y) < 400
          ) {
            seen = true;
            break;
          }
        }
      }
      if (!seen) {
        gs.evasionTimer += dt;
        if (gs.evasionTimer >= 8) {
          gs.wantedLevel = Math.max(0, gs.wantedLevel - 1);
          gs.evasionTimer = 0;
          setWantedHUD(gs.wantedLevel);
          if (gs.wantedLevel === 0) {
            addNotification(gs, "EVADED POLICE!");
            // deactivate police
            for (const car of gs.cars) {
              if (car.isPolice) car.occupiedByPolice = false;
            }
          }
        }
      } else {
        gs.evasionTimer = 0;
      }
    }

    // ─── Notifications ───
    for (let i = gs.notifications.length - 1; i >= 0; i--) {
      const n = gs.notifications[i];
      n.timer -= dt;
      n.alpha = Math.min(1, n.timer);
      if (n.timer <= 0) gs.notifications.splice(i, 1);
    }

    // ─── Explosions ───
    for (let i = gs.explosions.length - 1; i >= 0; i--) {
      const p = gs.explosions[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= dt * 1.8;
      if (p.life <= 0) gs.explosions.splice(i, 1);
    }

    // ─── Camera ───
    const targetCamX = playerX - VIEWPORT_W / 2;
    const targetCamY = playerY - VIEWPORT_H / 2;
    gs.cameraX += (targetCamX - gs.cameraX) * 0.1;
    gs.cameraY += (targetCamY - gs.cameraY) * 0.1;
    gs.cameraX = Math.max(0, Math.min(WORLD_W - VIEWPORT_W, gs.cameraX));
    gs.cameraY = Math.max(0, Math.min(WORLD_H - VIEWPORT_H, gs.cameraY));

    // ─── Death check ───
    if (gs.player.hp <= 0) {
      const survived = Date.now() - gs.startTime;
      setWastedStats({ timeSurvived: survived, maxStars: gs.maxWantedReached });
      setGameScreen("wasted");
      // Draw final frame then return
      drawFrame(ctx, gs);
      return;
    }

    // ─── Draw ───
    drawFrame(ctx, gs);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [addNotification, spawnExplosion, updatePoliceCount]);

  function drawFrame(ctx: CanvasRenderingContext2D, gs: GameState) {
    ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H);
    drawWorld(ctx, gs.world, gs.cameraX, gs.cameraY);
    drawEntities(ctx, gs, gs.cameraX, gs.cameraY);
    drawHUD(ctx, gs);
  }

  // ─── Setup ───
  useEffect(() => {
    const world = generateCity();
    worldRef.current = world;
    gsRef.current = createInitialState(world);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);

      const gs = gsRef.current;
      if (!gs) return;

      if (e.code === "Escape") {
        cancelAnimationFrame(rafRef.current);
        onBackToMenu();
        return;
      }

      if (e.code === "KeyR" && gs.hasWeapon) {
        gs.ammo = gs.maxAmmo;
        addNotification(gs, "RELOADED!");
      }

      if (e.code === "KeyE") {
        const playerX = gs.player.x;
        const playerY = gs.player.y;
        if (gs.player.inCar !== null) {
          // Exit car
          const car = gs.cars[gs.player.inCar];
          gs.player.x = car.x + 30;
          gs.player.y = car.y + 30;
          car.occupiedByPlayer = false;
          gs.player.inCar = null;
          addNotification(gs, "EXIT VEHICLE");
        } else {
          // Enter nearest car
          let nearestIdx = -1;
          let nearestDist = 45;
          for (let i = 0; i < gs.cars.length; i++) {
            const car = gs.cars[i];
            if (!car.alive) continue;
            const d = dist(playerX, playerY, car.x, car.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearestIdx = i;
            }
          }
          if (nearestIdx >= 0) {
            const car = gs.cars[nearestIdx];
            gs.player.inCar = nearestIdx;
            car.occupiedByPlayer = true;
            if (!car.isPolice) {
              gs.wantedLevel = Math.min(5, gs.wantedLevel + 1);
              gs.maxWantedReached = Math.max(
                gs.maxWantedReached,
                gs.wantedLevel,
              );
              setWantedHUD(gs.wantedLevel);
              addNotification(gs, "CAR STOLEN! +1 STAR");
              updatePoliceCount(gs);
            } else {
              addNotification(gs, "POLICE CAR ENTERED");
            }
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.down = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.down = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gameLoop, addNotification, updatePoliceCount, onBackToMenu]);

  // Resume loop after wasted
  const handleRespawn = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    const fresh = createInitialState(world);
    gsRef.current = fresh;
    setGameScreen("playing");
    setWantedHUD(0);
    setSubmitted(false);
    setPlayerName("");
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const handleSubmitScore = useCallback(() => {
    if (!playerName.trim()) return;
    const { timeSurvived, maxStars } = wastedStats;
    submitScore.mutate({
      playerName: playerName.trim(),
      escapeTime: BigInt(timeSurvived),
      levelReached: BigInt(maxStars),
    });
    setSubmitted(true);
  }, [playerName, wastedStats, submitScore]);

  function formatTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div
        className="relative"
        style={{ width: VIEWPORT_W, height: VIEWPORT_H }}
      >
        <canvas
          ref={canvasRef}
          width={VIEWPORT_W}
          height={VIEWPORT_H}
          className="block"
          style={{
            cursor: "crosshair",
            display: "block",
            outline: "2px solid rgba(255,60,60,0.4)",
          }}
        />

        {gameScreen === "wasted" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              background: "rgba(180,0,0,0.82)",
              backdropFilter: "blur(4px)",
            }}
            data-ocid="wasted.modal"
          >
            <div
              className="text-7xl font-black tracking-widest mb-2"
              style={{
                fontFamily: "BricolageGrotesque, system-ui",
                color: "#fff",
                textShadow:
                  "0 0 40px rgba(255,60,60,1), 0 0 80px rgba(255,0,0,0.7)",
                letterSpacing: "0.15em",
              }}
            >
              WASTED
            </div>
            <div
              className="text-white/70 text-lg mb-6"
              style={{ fontFamily: "GeneralSans, system-ui" }}
            >
              You survived:{" "}
              <strong>{formatTime(wastedStats.timeSurvived)}</strong>{" "}
              &nbsp;|&nbsp; Max wanted: <strong>{wastedStats.maxStars}★</strong>
            </div>

            {!submitted ? (
              <div className="flex flex-col items-center gap-3 mb-6">
                <p className="text-white/60 text-sm">Submit your score:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your name..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.code === "Enter" && handleSubmitScore()}
                    maxLength={20}
                    className="px-4 py-2 rounded text-black font-bold text-base"
                    style={{ minWidth: 180 }}
                    data-ocid="wasted.input"
                  />
                  <button
                    type="button"
                    onClick={handleSubmitScore}
                    className="px-5 py-2 rounded font-bold text-white"
                    style={{
                      background: "#FF3C3C",
                      border: "none",
                      cursor: "pointer",
                    }}
                    data-ocid="wasted.submit_button"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="text-green-400 font-bold mb-6"
                data-ocid="wasted.success_state"
              >
                Score submitted! ✓
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleRespawn}
                className="px-8 py-3 rounded font-black text-lg uppercase tracking-wider text-white"
                style={{
                  background: "linear-gradient(135deg, #FF3C3C, #FF6B00)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "BricolageGrotesque, system-ui",
                  boxShadow: "0 0 20px rgba(255,60,60,0.5)",
                }}
                data-ocid="wasted.confirm_button"
              >
                TRY AGAIN
              </button>
              <button
                type="button"
                onClick={onBackToMenu}
                className="px-8 py-3 rounded font-black text-lg uppercase tracking-wider"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  color: "#fff",
                  fontFamily: "BricolageGrotesque, system-ui",
                }}
                data-ocid="wasted.cancel_button"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        className="mt-3 text-center text-sm"
        style={{
          color: "rgba(255,255,255,0.25)",
          fontFamily: "GeneralSans, system-ui",
        }}
      >
        WASD: Move &nbsp;|&nbsp; SHIFT: Sprint &nbsp;|&nbsp; F/Click: Shoot
        &nbsp;|&nbsp; E: Enter/Exit Car &nbsp;|&nbsp; R: Reload &nbsp;|&nbsp;
        ESC: Menu
      </div>

      <div
        className="mt-1 text-center text-xs"
        style={{ color: "rgba(255,255,255,0.15)" }}
      >
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(255,100,100,0.4)" }}
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
