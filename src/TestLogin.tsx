import { useEffect, useState } from "react";

export default function TestLogin() {
  const [logs, setLogs] = useState<string[]>([]);
  const [jsonResult, setJsonResult] = useState<any>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  // Função que inicia o fluxo
  const handleLogin = async () => {
    try {
      addLog("Pedindo URL de login ao Backend...");
      // Ajuste a porta se seu backend não for 8787 (ex: 3000)
      const res = await fetch("http://localhost:8787/api/oauth/google/redirect_url"); 
      const data = await res.json();
      
      addLog(`Redirecionando para: ${data.redirectUrl}`);
      window.location.href = data.redirectUrl;
    } catch (e: any) {
      addLog(`ERRO: ${e.message}`);
    }
  };

  useEffect(() => {
    // Verifica se voltamos do Google com um código
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      addLog("CÓDIGO DETECTADO! Trocando por sessão...");
      
      // Troca o código pela sessão no backend
      fetch("http://localhost:8787/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      .then(async (res) => {
        const data = await res.json();
        setJsonResult(data);
        if (res.ok) {
          addLog("SUCESSO! Cookie gravado. Usuário logado:");
        } else {
          addLog(`ERRO BACKEND: ${res.status}`);
        }
      })
      .catch(err => addLog(`ERRO DE REDE: ${err.message}`));
    }
  }, []);

  return (
    <div style={{ 
      backgroundColor: "#1e1e1e", 
      color: "#0f0", 
      fontFamily: "monospace", 
      padding: "20px", 
      minHeight: "100vh" 
    }}>
      <h1>🧪 TESTE DE LOGIN GOOGLE</h1>
      
      {/* Se não tiver resultado ainda, mostra o botão */}
      {!jsonResult && (
        <button 
          onClick={handleLogin}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginBottom: "20px",
            borderRadius: "5px"
          }}
        >
          INICIAR LOGIN COM GOOGLE
        </button>
      )}

      {/* Área de Logs */}
      <div style={{ marginBottom: "20px", borderTop: "1px solid #333", paddingTop: "10px" }}>
        {logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>

      {/* Mostra o JSON bonitão se der certo */}
      {jsonResult && (
        <div style={{ 
          backgroundColor: "#000", 
          border: "1px solid #333", 
          padding: "15px",
          borderRadius: "5px"
        }}>
          <h3>RESPOSTA DO BACKEND:</h3>
          <pre style={{ overflowX: "auto" }}>
            {JSON.stringify(jsonResult, null, 2)}
          </pre>
          <br/>
          <a href="/dashboard" style={{ color: "yellow", fontSize: "20px" }}>
            👉 IR PARA O DASHBOARD AGORA
          </a>
        </div>
      )}
    </div>
  );
}