import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, RotateCcw, Timer, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Score } from "../backend.d";
import { useLeaderboard, useSubmitScore } from "../hooks/useQueries";

// ── Types ──────────────────────────────────────────────────────────────────
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Vec2 {
  x: number;
  y: number;
}
interface GuardState {
  x: number;
  y: number;
  angle: number;
  waypoints: Vec2[];
  currentPoint: number;
  speed: number;
}
interface PlayerState {
  x: number;
  y: number;
  angle: number;
}

// ── Constants ──────────────────────────────────────────────────────────────
const CW = 800;
const CH = 600;
const PLAYER_RADIUS = 8;
const GUARD_RADIUS = 10;
const CONE_RANGE = 150;
const CONE_HALF_ANGLE = Math.PI / 4;
const PROXIMITY_CATCH = 30;
const WIN_DISTANCE = 45;
const WALK_SPEED = 120;
const RUN_SPEED = 200;
const GUARD_SPEED = 60;
const WAYPOINT_REACH = 3;

const WALLS: Rect[] = [
  { x: 50, y: 30, w: 160, h: 100 },
  { x: 290, y: 30, w: 200, h: 90 },
  { x: 570, y: 30, w: 170, h: 110 },
  { x: 50, y: 200, w: 110, h: 150 },
  { x: 250, y: 190, w: 150, h: 110 },
  { x: 490, y: 170, w: 120, h: 100 },
  { x: 660, y: 200, w: 110, h: 160 },
  { x: 50, y: 430, w: 200, h: 110 },
  { x: 370, y: 395, w: 180, h: 165 },
];

const HEDGES: Rect[] = [
  { x: 222, y: 145, w: 60, h: 16 },
  { x: 445, y: 138, w: 55, h: 16 },
  { x: 175, y: 378, w: 60, h: 16 },
  { x: 612, y: 348, w: 70, h: 16 },
  { x: 340, y: 316, w: 50, h: 16 },
];

const ALL_OBSTACLES = [...WALLS, ...HEDGES];

const EXIT_GATE: Rect = { x: 698, y: 498, w: 68, h: 42 };

const BUILDING_LABELS: { rect: Rect; label: string }[] = [
  { rect: WALLS[0], label: "DORM A" },
  { rect: WALLS[1], label: "LECTURE HALL" },
  { rect: WALLS[2], label: "LAB" },
  { rect: WALLS[3], label: "ADMIN" },
  { rect: WALLS[4], label: "CAFETERIA" },
  { rect: WALLS[5], label: "GYM" },
  { rect: WALLS[6], label: "LIBRARY" },
  { rect: WALLS[7], label: "STUDENT CENTER" },
  { rect: WALLS[8], label: "SCIENCE BLDG" },
];

function makeGuards(): GuardState[] {
  return [
    {
      x: 200,
      y: 158,
      angle: 0,
      waypoints: [
        { x: 200, y: 158 },
        { x: 460, y: 158 },
        { x: 460, y: 140 },
        { x: 200, y: 140 },
      ],
      currentPoint: 0,
      speed: GUARD_SPEED,
    },
    {
      x: 430,
      y: 318,
      angle: Math.PI,
      waypoints: [
        { x: 430, y: 318 },
        { x: 640, y: 318 },
        { x: 640, y: 390 },
        { x: 430, y: 390 },
      ],
      currentPoint: 0,
      speed: GUARD_SPEED - 5,
    },
    {
      x: 600,
      y: 455,
      angle: -Math.PI / 2,
      waypoints: [
        { x: 600, y: 455 },
        { x: 690, y: 455 },
        { x: 690, y: 380 },
        { x: 600, y: 380 },
      ],
      currentPoint: 0,
      speed: GUARD_SPEED + 5,
    },
  ];
}

function makePlayer(): PlayerState {
  return { x: 120, y: 548, angle: -Math.PI / 2 };
}

// ── Geometry helpers ───────────────────────────────────────────────────────
function pushOutOfRect(cx: number, cy: number, r: number, rect: Rect): Vec2 {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 < r * r && d2 > 0) {
    const d = Math.sqrt(d2);
    const ov = r - d;
    return { x: cx + (dx / d) * ov, y: cy + (dy / d) * ov };
  }
  return { x: cx, y: cy };
}

function resolveCollisions(cx: number, cy: number, r: number): Vec2 {
  let px = cx;
  let py = cy;
  for (const rect of ALL_OBSTACLES) {
    const out = pushOutOfRect(px, py, r, rect);
    px = out.x;
    py = out.y;
  }
  return { x: px, y: py };
}

function inVisionCone(guard: GuardState, player: PlayerState): boolean {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > CONE_RANGE) return false;
  const atP = Math.atan2(dy, dx);
  let diff = atP - guard.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= CONE_HALF_ANGLE;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ── Drawing ────────────────────────────────────────────────────────────────
function drawScene(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  guards: GuardState[],
  pulsePhase: number,
) {
  ctx.fillStyle = "#0B0F12";
  ctx.fillRect(0, 0, CW, CH);

  // Ground grid
  ctx.strokeStyle = "rgba(30,42,49,0.4)";
  ctx.lineWidth = 0.5;
  for (let gx = 0; gx < CW; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, CH);
    ctx.stroke();
  }
  for (let gy = 0; gy < CH; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(CW, gy);
    ctx.stroke();
  }

  // Buildings
  for (const w of WALLS) {
    ctx.fillStyle = "#1A2530";
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = "#1E2A31";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = "rgba(30,42,49,0.6)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(w.x + 4, w.y + 4, w.w - 8, w.h - 8);
  }

  // Building labels
  ctx.font = "bold 7px 'GeneralSans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const { rect, label } of BUILDING_LABELS) {
    ctx.fillStyle = "rgba(168,176,183,0.4)";
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  // Hedges
  for (const h of HEDGES) {
    ctx.fillStyle = "#1A3020";
    ctx.fillRect(h.x, h.y, h.w, h.h);
    ctx.strokeStyle = "#1E3826";
    ctx.lineWidth = 1;
    ctx.strokeRect(h.x, h.y, h.w, h.h);
  }

  // Vision cones
  for (const guard of guards) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(
      guard.x,
      guard.y,
      CONE_RANGE,
      guard.angle - CONE_HALF_ANGLE,
      guard.angle + CONE_HALF_ANGLE,
    );
    ctx.closePath();
    ctx.fillStyle = "rgba(242, 224, 74, 0.13)";
    ctx.fill();
    ctx.strokeStyle = "rgba(242, 224, 74, 0.25)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  // Exit gate
  const glow = 0.5 + 0.5 * Math.sin(pulsePhase);
  const eg = EXIT_GATE;
  ctx.save();
  ctx.shadowColor = "#7CFF2A";
  ctx.shadowBlur = 15 + glow * 20;
  ctx.fillStyle = `rgba(124, 255, 42, ${0.7 + glow * 0.3})`;
  ctx.fillRect(eg.x, eg.y, eg.w, eg.h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#7CFF2A";
  ctx.lineWidth = 2;
  ctx.strokeRect(eg.x, eg.y, eg.w, eg.h);
  ctx.fillStyle = "#0B0F12";
  ctx.font = "bold 9px 'GeneralSans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXIT", eg.x + eg.w / 2, eg.y + eg.h / 2);
  ctx.restore();

  // Guards
  for (const guard of guards) {
    ctx.save();
    ctx.shadowColor = "#FF6B35";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#FF6B35";
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(
      guard.x + Math.cos(guard.angle) * (GUARD_RADIUS - 3),
      guard.y + Math.sin(guard.angle) * (GUARD_RADIUS - 3),
      2.5,
      0,
      2 * Math.PI,
    );
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // Player
  ctx.save();
  ctx.shadowColor = "#4A9EFF";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#4A9EFF";
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, 2 * Math.PI);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(
    player.x + Math.cos(player.angle) * (PLAYER_RADIUS - 3),
    player.y + Math.sin(player.angle) * (PLAYER_RADIUS - 3),
    2.5,
    0,
    2 * Math.PI,
  );
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

// ── Component ──────────────────────────────────────────────────────────────
interface Props {
  onBackToMenu: () => void;
}

type OverlayState = "playing" | "caught" | "won";

export default function GameCanvas({ onBackToMenu }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<PlayerState>(makePlayer());
  const guardsRef = useRef<GuardState[]>(makeGuards());
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<Vec2>({ x: CW / 2, y: CH / 2 });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const pulseRef = useRef<number>(0);
  const elapsedMsRef = useRef<number>(0);

  const [overlay, setOverlay] = useState<OverlayState>("playing");
  const [elapsedDisplay, setElapsedDisplay] = useState("00:00");
  const [finalTime, setFinalTime] = useState("");
  const [finalMs, setFinalMs] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: leaderboard, refetch: refetchLB } = useLeaderboard();
  const submitScore = useSubmitScore();

  const resetGame = useCallback(() => {
    playerRef.current = makePlayer();
    guardsRef.current = makeGuards();
    keysRef.current.clear();
    mouseRef.current = { x: CW / 2, y: CH / 2 };
    startTimeRef.current = Date.now();
    elapsedMsRef.current = 0;
    setOverlay("playing");
    setElapsedDisplay("00:00");
    setSubmitted(false);
    setPlayerName("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
      if (e.key === "Escape" && overlay === "playing") onBackToMenu();
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [overlay, onBackToMenu]);

  // Mouse listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) * (CW / rect.width),
        y: (e.clientY - rect.top) * (CH / rect.height),
      };
    };
    canvas.addEventListener("mousemove", onMove);
    return () => canvas.removeEventListener("mousemove", onMove);
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    function tick(timestamp: number) {
      if (!running) return;

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      pulseRef.current += dt * 3;

      const overlayState = overlay;

      if (overlayState === "playing") {
        const now = Date.now();
        elapsedMsRef.current = now - startTimeRef.current;
        setElapsedDisplay(formatTime(elapsedMsRef.current));

        const keys = keysRef.current;
        const isRunning = keys.has("Shift");
        const speed = (isRunning ? RUN_SPEED : WALK_SPEED) * dt;

        let mx = 0;
        let my = 0;
        if (keys.has("w") || keys.has("W") || keys.has("ArrowUp")) my -= 1;
        if (keys.has("s") || keys.has("S") || keys.has("ArrowDown")) my += 1;
        if (keys.has("a") || keys.has("A") || keys.has("ArrowLeft")) mx -= 1;
        if (keys.has("d") || keys.has("D") || keys.has("ArrowRight")) mx += 1;

        if (mx !== 0 || my !== 0) {
          const len = Math.sqrt(mx * mx + my * my);
          let nx = playerRef.current.x + (mx / len) * speed;
          let ny = playerRef.current.y + (my / len) * speed;
          nx = Math.max(PLAYER_RADIUS, Math.min(CW - PLAYER_RADIUS, nx));
          ny = Math.max(PLAYER_RADIUS, Math.min(CH - PLAYER_RADIUS, ny));
          const resolved = resolveCollisions(nx, ny, PLAYER_RADIUS);
          playerRef.current.x = resolved.x;
          playerRef.current.y = resolved.y;
        }

        // Mouse look
        const mdx = mouseRef.current.x - playerRef.current.x;
        const mdy = mouseRef.current.y - playerRef.current.y;
        if (Math.abs(mdx) > 2 || Math.abs(mdy) > 2) {
          playerRef.current.angle = Math.atan2(mdy, mdx);
        }

        // Guard patrol
        for (const guard of guardsRef.current) {
          const target = guard.waypoints[guard.currentPoint];
          const gdx = target.x - guard.x;
          const gdy = target.y - guard.y;
          const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
          if (gdist < WAYPOINT_REACH) {
            guard.currentPoint =
              (guard.currentPoint + 1) % guard.waypoints.length;
          } else {
            const gspd = guard.speed * dt;
            guard.x += (gdx / gdist) * gspd;
            guard.y += (gdy / gdist) * gspd;
            guard.angle = Math.atan2(gdy, gdx);
          }
        }

        // Detection
        for (const guard of guardsRef.current) {
          const pdx = playerRef.current.x - guard.x;
          const pdy = playerRef.current.y - guard.y;
          const prox = Math.sqrt(pdx * pdx + pdy * pdy);
          if (
            prox < PROXIMITY_CATCH ||
            inVisionCone(guard, playerRef.current)
          ) {
            setOverlay("caught");
            setTimeout(() => {
              resetGame();
            }, 1500);
            break;
          }
        }

        // Win
        const egcx = EXIT_GATE.x + EXIT_GATE.w / 2;
        const egcy = EXIT_GATE.y + EXIT_GATE.h / 2;
        const wdx = playerRef.current.x - egcx;
        const wdy = playerRef.current.y - egcy;
        if (Math.sqrt(wdx * wdx + wdy * wdy) < WIN_DISTANCE) {
          const ms = elapsedMsRef.current;
          setFinalMs(ms);
          setFinalTime(formatTime(ms));
          setOverlay("won");
          refetchLB();
        }
      }

      drawScene(
        ctx as CanvasRenderingContext2D,
        playerRef.current,
        guardsRef.current,
        pulseRef.current,
      );
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame((ts) => {
      lastTimeRef.current = ts;
      startTimeRef.current = Date.now();
      tick(ts);
    });

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [overlay, resetGame, refetchLB]);

  const handleSubmitScore = async () => {
    if (!playerName.trim()) return;
    try {
      await submitScore.mutateAsync({
        playerName: playerName.trim(),
        escapeTime: BigInt(finalMs),
        levelReached: BigInt(1),
      });
      setSubmitted(true);
      refetchLB();
    } catch {
      // ignore
    }
  };

  const sortedLeaderboard: Score[] = leaderboard
    ? [...leaderboard]
        .sort((a, b) => Number(a.escapeTime) - Number(b.escapeTime))
        .slice(0, 10)
    : [];

  return (
    <div className="fixed inset-0 bg-[#0B0F12] flex flex-col items-center justify-center overflow-hidden">
      {/* HUD */}
      {overlay === "playing" && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 bg-[#0B0F12]/80 border-b border-[#1E2A31] backdrop-blur-sm">
          <div
            className="flex items-center gap-2 text-neon font-display font-800 text-xs tracking-[0.2em]"
            data-ocid="hud.panel"
          >
            <span className="text-[#A8B0B7]">LEVEL</span>
            <span>01</span>
            <span className="mx-1 text-[#1E2A31]">·</span>
            <span className="text-[#A8B0B7]">CAMPUS GROUNDS</span>
          </div>
          <div
            className="flex items-center gap-2 text-white font-display font-800 text-sm tracking-widest"
            data-ocid="hud.panel"
          >
            <Timer size={14} className="text-neon" />
            {elapsedDisplay}
          </div>
          <button
            type="button"
            onClick={onBackToMenu}
            className="text-[10px] font-display tracking-[0.15em] text-[#A8B0B7] hover:text-white transition-colors"
            data-ocid="hud.secondary_button"
          >
            ESC = MENU
          </button>
        </div>
      )}

      {/* Canvas wrapper */}
      <div
        className="relative"
        style={{
          width: "min(800px, 100vw)",
          aspectRatio: "800/600",
          marginTop: overlay === "playing" ? "44px" : 0,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className="block w-full h-full"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Controls hint */}
        <AnimatePresence>
          {showHint && overlay === "playing" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0E1418]/90 border border-[#1E2A31] rounded-lg px-4 py-2 text-xs font-display tracking-wider text-[#A8B0B7] whitespace-nowrap"
            >
              WASD to move\u00a0·\u00a0Shift to run\u00a0·\u00a0Avoid
              guards\u00a0·\u00a0Reach the exit
            </motion.div>
          )}
        </AnimatePresence>

        {/* CAUGHT overlay */}
        <AnimatePresence>
          {overlay === "caught" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/70 backdrop-blur-sm"
              data-ocid="caught.dialog"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="mb-4 text-6xl">🚨</div>
                <h2 className="font-display font-extrabold text-5xl uppercase tracking-widest text-white mb-2">
                  CAUGHT!
                </h2>
                <p className="text-red-200 font-display tracking-[0.2em] text-sm">
                  Restarting...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WON overlay */}
        <AnimatePresence>
          {overlay === "won" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F12]/92 backdrop-blur-md overflow-y-auto"
              data-ocid="won.dialog"
            >
              <motion.div
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-full max-w-sm px-6 py-8 flex flex-col items-center gap-5"
              >
                <div className="text-5xl">🏁</div>
                <h2
                  className="font-display font-extrabold text-5xl uppercase tracking-widest"
                  style={{
                    color: "#7CFF2A",
                    textShadow: "0 0 30px rgba(124,255,42,0.5)",
                  }}
                >
                  ESCAPED!
                </h2>
                <div className="flex items-center gap-2 text-white font-display text-2xl">
                  <Timer size={20} className="text-neon" />
                  {finalTime}
                </div>

                {!submitted ? (
                  <div className="w-full flex flex-col gap-3">
                    <p className="text-[#A8B0B7] text-xs font-display tracking-wider text-center">
                      ENTER YOUR NAME FOR THE LEADERBOARD
                    </p>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSubmitScore()
                      }
                      placeholder="Your name..."
                      maxLength={20}
                      className="bg-[#121A1F] border-[#1E2A31] text-white placeholder:text-[#A8B0B7]/50 text-center font-display tracking-wider"
                      data-ocid="won.input"
                    />
                    <Button
                      onClick={handleSubmitScore}
                      disabled={!playerName.trim() || submitScore.isPending}
                      className="w-full bg-neon text-[#0B0F12] font-display font-800 tracking-[0.15em] uppercase hover:shadow-neon"
                      data-ocid="won.submit_button"
                    >
                      {submitScore.isPending ? "SUBMITTING..." : "SUBMIT SCORE"}
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 text-neon font-display text-xs tracking-wider"
                    data-ocid="won.success_state"
                  >
                    \u2713 Score submitted!
                  </div>
                )}

                {/* Leaderboard */}
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={14} className="text-neon" />
                    <span className="font-display font-800 text-xs tracking-[0.2em] text-white uppercase">
                      Top Scores
                    </span>
                  </div>
                  {sortedLeaderboard.length === 0 ? (
                    <p
                      className="text-[#A8B0B7] text-xs text-center py-2"
                      data-ocid="leaderboard.empty_state"
                    >
                      No scores yet \u2014 be the first!
                    </p>
                  ) : (
                    <div className="space-y-1" data-ocid="leaderboard.table">
                      {sortedLeaderboard.map((score, i) => (
                        <div
                          key={`${score.playerName}-${i}`}
                          className="flex items-center justify-between text-xs px-3 py-1.5 rounded bg-[#121A1F] border border-[#1E2A31]"
                          data-ocid={`leaderboard.item.${i + 1}`}
                        >
                          <span
                            className={`font-display font-800 w-5 ${
                              i === 0
                                ? "text-yellow-400"
                                : i === 1
                                  ? "text-gray-300"
                                  : i === 2
                                    ? "text-amber-600"
                                    : "text-[#A8B0B7]"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="flex-1 px-2 text-white font-display truncate">
                            {score.playerName}
                          </span>
                          <span className="text-neon font-display tracking-wider">
                            {formatTime(Number(score.escapeTime))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full">
                  <Button
                    onClick={resetGame}
                    className="flex-1 bg-neon text-[#0B0F12] font-display font-800 tracking-[0.1em] uppercase hover:shadow-neon"
                    data-ocid="won.primary_button"
                  >
                    <RotateCcw size={14} className="mr-1" />
                    PLAY AGAIN
                  </Button>
                  <Button
                    onClick={onBackToMenu}
                    variant="outline"
                    className="flex-1 border-[#1E2A31] text-white font-display font-800 tracking-[0.1em] uppercase hover:bg-[#121A1F]"
                    data-ocid="won.secondary_button"
                  >
                    <Home size={14} className="mr-1" />
                    MENU
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
