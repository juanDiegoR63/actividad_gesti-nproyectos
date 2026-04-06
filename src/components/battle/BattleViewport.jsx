import React, { useEffect, useMemo, useRef, useState } from "react";

export function BattleViewport({
  phaseIndex,
  encounterTitle,
  isBoss,
  activeTurnToken,
  team,
  enemies,
}) {
  const hostRef = useRef(null);
  const canvasMountRef = useRef(null);
  const sceneRef = useRef(null);
  const latestSnapshotRef = useRef(null);
  const [sceneStatus, setSceneStatus] = useState("loading");

  const snapshot = useMemo(
    () => ({
      phaseIndex,
      encounterTitle,
      isBoss,
      activeTurnToken,
      team,
      enemies,
    }),
    [phaseIndex, encounterTitle, isBoss, activeTurnToken, team, enemies],
  );

  useEffect(() => {
    latestSnapshotRef.current = snapshot;
    sceneRef.current?.sync(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (!canvasMountRef.current) {
      return undefined;
    }

    let disposed = false;
    setSceneStatus("loading");

    (async () => {
      try {
        const module = await import("../../render/pixi/BattleScene.js");
        if (disposed) {
          return;
        }

        const scene = new module.BattleScene();
        sceneRef.current = scene;

        await scene.mount(canvasMountRef.current);

        if (disposed) {
          scene.destroy();
          return;
        }

        if (latestSnapshotRef.current) {
          scene.sync(latestSnapshotRef.current);
        }

        setSceneStatus("ready");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("No se pudo inicializar la escena Pixi", error);
        if (!disposed) {
          setSceneStatus("error");
        }
      }
    })();

    return () => {
      disposed = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div className="border-2 border-slate-700 bg-slate-950 p-2">
      <div className="relative h-[380px] w-full overflow-hidden border border-slate-700 bg-slate-900" ref={hostRef}>
        <div className="absolute inset-0" ref={canvasMountRef} />
        {sceneStatus !== "ready" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 p-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
            {sceneStatus === "loading"
              ? "Cargando cabina de combate pixel..."
              : "No se pudo cargar la escena de combate"}
          </div>
        )}
      </div>
    </div>
  );
}
