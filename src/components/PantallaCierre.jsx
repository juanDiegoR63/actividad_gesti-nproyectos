import React, { useState } from "react";

export function PantallaCierre({ estado, resultado, reiniciar, enviarDrive }) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const feedbackTiempo =
    estado.ap >= 0
      ? "Lograste contener satisfactoriamente el cronograma."
      : "Se rebasó fuertemente el tiempo esperado.";
  const feedbackCosto =
    estado.hp >= 0
      ? "Respetaste el presupuesto de línea base."
      : "Incurriste en sobrecostos excesivos.";
  const feedbackCalidadRiesgo =
    estado.falloCritico > 40 && estado.ac < 80
      ? "Te enfrentaste a un espiral negativo con los riesgos."
      : "Hubo un equilibrio decente entre riesgos y calidad.";

  const valorAgile = estado.historico.some(
    (h) =>
      h.decision &&
      (h.decision.toLowerCase().includes("ágil") ||
        h.decision.toLowerCase().includes("agil") ||
        h.decision.toLowerCase().includes("valor")),
  );

  const isBancarrota = resultado.veredicto.includes("BANCARROTA");
  const isPmp = resultado.puntaje >= 85;

  const handleEnviar = async () => {
    setEnviando(true);
    try {
      await enviarDrive(resultado);
      setEnviado(true);
    } catch (e) {
      // Error manejado
    } finally {
      setEnviando(false);
    }
  };

  if (isBancarrota) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-900/30 border border-red-500 rounded-lg max-w-2xl mx-auto mt-10">
        <h1 className="text-4xl font-bold text-red-500 mb-4 uppercase tracking-widest">
          💰 Quiebra Declarada
        </h1>
        <div className="bg-white text-black p-8 rounded shadow-2xl font-serif max-w-lg mb-6 relative">
          <div className="absolute top-2 right-4 text-gray-400 text-xs italic">
            Sponsor Corporativo
          </div>
          <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-4">
            CARTA DE RESCISIÓN DE CONTRATO
          </h2>
          <p className="mb-4">
            Para el equipo: <strong>{estado.equipo}</strong>
          </p>
          <p className="mb-4 text-justify">
            Por medio de la presente, se les notifica la terminación inmediata
            de su contrato y disolución de su Gremio debido a mala gestión y
            quiebra de la viabilidad del proyecto. Han fallado en equilibrar las
            restricciones fundamentales del PMBOK.
          </p>
          <p className="mb-8 text-justify">
            El proyecto queda clasificado como <strong>FRACASO CRÍTICO</strong>.
            Por favor, devuelvan sus equipos de trabajo.
          </p>
          <div className="border-t border-black pt-4">
            Firma,
            <br />
            Director de PMO
          </div>
        </div>
        <button
          onClick={handleEnviar}
          disabled={enviando || enviado}
          className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded font-bold transition mx-2 mb-4"
        >
          {enviando
            ? "Enviando Reporte..."
            : enviado
              ? "Reporte Enviado"
              : "Enviar Bitácora a Recursos Humanos"}
        </button>
        <button
          onClick={reiniciar}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition mx-2"
        >
          Volver a intentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      {isPmp ? (
        <div className="bg-gradient-to-br from-yellow-300 to-yellow-600 text-black p-8 rounded-lg shadow-2xl text-center mb-8 border-4 border-yellow-700 relative overflow-hidden">
          <div className="absolute opacity-10 text-9xl top-0 right-0 pointer-events-none">
            🏆
          </div>
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">
            Certificación PMP
          </h1>
          <h2 className="text-2xl font-bold text-yellow-900 mb-6 border-b-2 border-yellow-800 inline-block px-8 pb-2">
            Sello:{" "}
            {valorAgile
              ? "Maestros de la Colcha (Ágil)"
              : "Arquitectos del Puzzle (Predictivo)"}
          </h2>
          <p className="text-xl mb-4">
            Otorgado al Gremio: <strong>{estado.equipo}</strong>
          </p>
          <p className="max-w-2xl mx-auto italic font-medium">
            Por su demostrada excelencia en la gestión del proyecto, sorteando
            eficazmente la triple restricción y liderando el cambio con éxito.
          </p>
        </div>
      ) : (
        <div className="fase-header bg-gray-800 p-6 rounded text-center mb-8">
          <h2 className="text-3xl text-yellow-500 font-bold mb-2">
            Fase Final: Cierre del Proyecto
          </h2>
          <p className="text-gray-300 text-lg">
            Balance ejecutivo para el equipo {estado.equipo}
          </p>
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
        <h3
          className={`text-2xl font-bold mb-4 ${resultado.puntaje >= 70 ? "text-green-400" : "text-red-400"}`}
        >
          Resultado: {resultado.veredicto}
        </h3>
        <p className="text-gray-300 mb-8">{resultado.mensaje}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-4 rounded text-center">
            <div className="text-sm text-gray-400">Presupuesto Remaining</div>
            <div
              className={`text-2xl font-bold ${estado.hp >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              ${Math.floor(estado.hp).toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded text-center">
            <div className="text-sm text-gray-400">Cronograma</div>
            <div
              className={`text-2xl font-bold ${estado.ap >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {estado.ap} Sem
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded text-center">
            <div className="text-sm text-gray-400">Calidad</div>
            <div className="text-2xl font-bold text-zinc-300">{estado.ac}%</div>
          </div>
          <div className="bg-gray-900 p-4 rounded text-center">
            <div className="text-sm text-gray-400">Puntaje</div>
            <div className="text-2xl font-bold text-yellow-500">
              {resultado.puntaje}/100
            </div>
          </div>
        </div>

        <h3 className="text-xl text-yellow-400 font-bold mb-4 border-b border-gray-600 pb-2">
          Retroalimentación Táctica:
        </h3>
        <ul className="space-y-3 text-gray-300 mb-8 bg-gray-900/50 p-4 rounded">
          <li>
            ⏱️ <strong>Área de Cronograma:</strong> {feedbackTiempo}
          </li>
          <li>
            💰 <strong>Área de Costos:</strong> {feedbackCosto}
          </li>
          <li>
            🛡️ <strong>Área de Riesgos y Calidad:</strong>{" "}
            {feedbackCalidadRiesgo}
          </li>
        </ul>

        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded font-bold transition"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || enviado}
            className={`px-6 py-2 font-bold text-white rounded transition ${enviado ? "bg-green-600" : "bg-blue-600 hover:bg-blue-500"}`}
          >
            {enviando
              ? "⏳ Enviando..."
              : enviado
                ? "✅ Reporte Enviado a Drive"
                : "📤 Enviar a PMO (Drive)"}
          </button>
          <button
            onClick={reiniciar}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition"
          >
            🔄 Nuevo Proyecto
          </button>
        </div>
      </div>
    </div>
  );
}
