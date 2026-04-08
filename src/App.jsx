import { useEffect } from "react";
import { useGameStore } from "./core/store/gameStore";
import { TurnMenuScreen } from "./screens/TurnMenuScreen";
import { TurnSetupScreen } from "./screens/TurnSetupScreen";
import { TurnBattleScreen } from "./screens/TurnBattleScreen";
import { TurnEndScreen } from "./screens/TurnEndScreen";
import { audioService } from "./core/services/audioService";

function App() {
  const currentScreen = useGameStore((state) => state.currentScreen);

  useEffect(() => {
    const unlockAudio = () => {
      void audioService.unlock();
    };

    globalThis.addEventListener("pointerdown", unlockAudio, { once: true });
    globalThis.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      globalThis.removeEventListener("pointerdown", unlockAudio);
      globalThis.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  if (currentScreen === "menu") {
    return <TurnMenuScreen />;
  }

  if (currentScreen === "creation") {
    return <TurnSetupScreen />;
  }

  if (currentScreen === "results") {
    return <TurnEndScreen />;
  }

  return <TurnBattleScreen />;
}

export default App;
