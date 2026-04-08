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

  let screen = <TurnBattleScreen />;

  if (currentScreen === "menu") {
    screen = <TurnMenuScreen />;
  }

  if (currentScreen === "creation") {
    screen = <TurnSetupScreen />;
  }

  if (currentScreen === "results") {
    screen = <TurnEndScreen />;
  }

  return (
    <div className="relative min-h-[100dvh] w-full">
      {screen}

      <div className="landscape-required-overlay">
        <div className="landscape-required-card">
          <p className="landscape-required-title">Modo horizontal recomendado</p>
          <p className="landscape-required-text">
            Gira tu celular para jugar en horizontal y tener mejor visibilidad.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
