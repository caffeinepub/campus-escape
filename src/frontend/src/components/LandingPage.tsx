import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLeaderboard } from "../hooks/useQueries";

interface LandingPageProps {
  onPlay: () => void;
}

const CONTROLS = [
  { key: "WASD", desc: "Move / Drive" },
  { key: "SHIFT", desc: "Sprint" },
  { key: "MOUSE", desc: "Aim" },
  { key: "LMB / F", desc: "Shoot" },
  { key: "E", desc: "Enter / Exit Car" },
  { key: "R", desc: "Reload" },
  { key: "ESC", desc: "Main Menu" },
];

function formatTime(ms: bigint): string {
  const s = Number(ms) / 1000;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function LandingPage({ onPlay }: LandingPageProps) {
  const { data: leaderboard, isLoading } = useLeaderboard();

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(255,40,40,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(40,80,255,0.15) 0%, transparent 50%), #080810",
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Neon scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4 py-16 max-w-5xl w-full">
        {/* Title */}
        <div className="text-center">
          <div
            className="text-8xl md:text-[9rem] font-black leading-none tracking-tighter uppercase"
            style={{
              fontFamily: "BricolageGrotesque, system-ui, sans-serif",
              color: "#fff",
              textShadow:
                "0 0 30px rgba(255,60,60,0.9), 0 0 60px rgba(255,60,60,0.5), 0 0 120px rgba(255,60,60,0.3)",
              letterSpacing: "-0.04em",
            }}
          >
            STREET
          </div>
          <div
            className="text-8xl md:text-[9rem] font-black leading-none tracking-tighter uppercase"
            style={{
              fontFamily: "BricolageGrotesque, system-ui, sans-serif",
              color: "#FF3C3C",
              textShadow:
                "0 0 30px rgba(255,60,60,0.9), 0 0 60px rgba(255,60,60,0.6), 0 0 100px rgba(255,60,60,0.4)",
              letterSpacing: "-0.04em",
            }}
          >
            KINGS
          </div>
          <p
            className="mt-4 text-lg md:text-xl tracking-[0.35em] uppercase"
            style={{
              color: "rgba(255,255,255,0.55)",
              fontFamily: "GeneralSans, system-ui",
            }}
          >
            Open World Crime Simulator
          </p>
        </div>

        {/* Play button */}
        <button
          type="button"
          onClick={onPlay}
          data-ocid="landing.primary_button"
          className="group relative mt-2 px-16 py-5 text-2xl font-black uppercase tracking-widest transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #FF3C3C 0%, #FF6B00 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            boxShadow:
              "0 0 30px rgba(255,60,60,0.6), 0 0 60px rgba(255,60,60,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
            fontFamily: "BricolageGrotesque, system-ui, sans-serif",
            letterSpacing: "0.15em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 50px rgba(255,60,60,0.9), 0 0 100px rgba(255,60,60,0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 30px rgba(255,60,60,0.6), 0 0 60px rgba(255,60,60,0.3), inset 0 1px 0 rgba(255,255,255,0.2)";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          ▶ PLAY NOW
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
          {/* Controls */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            <h3
              className="text-lg font-bold uppercase tracking-widest mb-4"
              style={{
                color: "#FF3C3C",
                fontFamily: "BricolageGrotesque, system-ui",
              }}
            >
              Controls
            </h3>
            <div className="flex flex-col gap-2">
              {CONTROLS.map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <span
                    className="px-3 py-1 rounded text-sm font-bold font-mono"
                    style={{
                      background: "rgba(255,60,60,0.15)",
                      border: "1px solid rgba(255,60,60,0.3)",
                      color: "#FF6B6B",
                    }}
                  >
                    {key}
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.9rem",
                    }}
                  >
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            <h3
              className="text-lg font-bold uppercase tracking-widest mb-4"
              style={{
                color: "#FF3C3C",
                fontFamily: "BricolageGrotesque, system-ui",
              }}
            >
              🏆 Top Criminals
            </h3>
            {isLoading ? (
              <div
                style={{ color: "rgba(255,255,255,0.4)" }}
                data-ocid="leaderboard.loading_state"
              >
                Loading...
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div
                style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}
                data-ocid="leaderboard.empty_state"
              >
                No scores yet. Be the first!
              </div>
            ) : (
              <ScrollArea className="h-48">
                <div
                  className="flex flex-col gap-2"
                  data-ocid="leaderboard.list"
                >
                  {leaderboard.slice(0, 10).map((score, i) => (
                    <div
                      key={`${score.playerName}-${i}`}
                      className="flex items-center justify-between py-2"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                      data-ocid={`leaderboard.item.${i + 1}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm font-bold w-6 text-center"
                          style={{
                            color: i < 3 ? "#FFD700" : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span style={{ color: "#fff", fontWeight: 600 }}>
                          {score.playerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          style={{
                            background: "rgba(255,60,60,0.2)",
                            border: "1px solid rgba(255,60,60,0.4)",
                            color: "#FF6B6B",
                            fontSize: "0.7rem",
                          }}
                        >
                          ★ {score.levelReached.toString()}
                        </Badge>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "0.8rem",
                          }}
                        >
                          {formatTime(score.escapeTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <Separator
          style={{ borderColor: "rgba(255,255,255,0.06)", marginTop: 8 }}
        />

        <footer
          className="text-center"
          style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}
        >
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(255,100,100,0.6)",
              textDecoration: "underline",
            }}
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
