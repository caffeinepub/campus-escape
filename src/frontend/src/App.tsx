import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import GTAGame from "./components/GTAGame";
import LandingPage from "./components/LandingPage";

export type Screen = "landing" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      {screen === "landing" ? (
        <LandingPage onPlay={() => setScreen("game")} />
      ) : (
        <GTAGame onBackToMenu={() => setScreen("landing")} />
      )}
    </div>
  );
}
