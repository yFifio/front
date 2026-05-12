import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

console.log("🚀 Iniciando aplicação...");

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Elemento raiz não encontrado");
  }

  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );

  console.log("✅ Aplicação iniciada com sucesso");
} catch (error) {
  console.error("❌ Falha ao iniciar aplicação:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #f8d7da; color: #721c24; font-family: Arial;">
      <h1>Erro ao iniciar aplicação</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
    </div>
  `;
}

