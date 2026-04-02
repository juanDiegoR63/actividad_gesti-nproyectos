import { useProjectEngine } from "./hooks/useProjectEngine";
import { SetupScreen } from "./screens/SetupScreen";
import { GameScreen } from "./screens/GameScreen";
import { EndScreen } from "./screens/EndScreen";

function App() {
  const engine = useProjectEngine();

  if (engine.estado.faseActual === 0) {
    return <SetupScreen engine={engine} />;
  }

  if (engine.estado.faseActual > 4) {
    return <EndScreen engine={engine} />;
  }

  return <GameScreen engine={engine} />;
}

export default App;
