import React from "react";

type BoletoPayload = {
  valor: number;
  vencimento: string; 
  linha_digitavel: string;
  codigo_barras: string;
  banco?: string; 
  itau?: {
    id_boleto?: string;
    nosso_numero?: string;
    codigo_carteira?: string;
  };
  invoice_id?: number;

  pagador_nome?: string;
  pagador_doc?: string;       
  pagador_endereco?: string;
};

function formatBRL(v: number) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  } catch {
    return `R$ ${String(v)}`;
  }
}

function formatDateBR(d: string) {

  if (!d) return "";
  const [y, m, day] = d.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !day) return d;
  const dt = new Date(y, m - 1, day);
  return dt.toLocaleDateString("pt-BR");
}

export default function BoletoItauLayout({ data }: { data: BoletoPayload }) {
  const bancoCodigo = "341-7"; // Itaú
  const showLinha = Boolean(data?.linha_digitavel);

  return (
    <div style={{ fontFamily: "Arimo, sans-serif", fontSize: 14, color: "#000", width: "100%" }}>
      {/* RECIBO DO PAGADOR */}
      <div style={{ position: "relative", width: "100%", marginBottom: 8 }}>
        <div style={{ backgroundColor: "#003767", height: 5, width: "100%" }} />
        <div style={{ textAlign: "center", fontWeight: 700, marginTop: 6 }}>RECIBO DO PAGADOR</div>
      </div>

      {/* CABEÇALHO (logo + banco + linha digitável) */}
      <div style={{ border: "1px solid #000", padding: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 140 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{data?.banco || "Itaú"}</div>
            <div style={{ fontSize: 11, color: "#333" }}>Banco emissor</div>
          </div>

          <div
            style={{
              width: 70,
              textAlign: "center",
              borderLeft: "2px solid #000",
              borderRight: "2px solid #000",
              padding: "6px 10px",
              fontWeight: 800,
            }}
          >
            {bancoCodigo}
          </div>

          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#333" }}>Linha Digitável</div>
            <div style={{ fontSize: 18, fontWeight: 800, whiteSpace: "nowrap" }}>
              {showLinha ? data.linha_digitavel : "Linha Digitável Pendente"}
            </div>
          </div>
        </div>
      </div>

      {/* TABELA “TRADUZIDA” (resumo dos campos principais) */}
      <div style={{ border: "1px solid #000" }}>
        <Row
          left={
            <>
              <Field label="Local de pagamento" value="Pague pelo aplicativo, internet ou em agências e correspondentes." />
            </>
          }
          right={
            <Field
              label="Vencimento"
              value={formatDateBR(data.vencimento)}
              align="right"
              bg="#eee"
              strong
            />
          }
        />

        <Divider />

        <Row
          left={
            <Field
              label="Beneficiário"
              value={`PROSPERA SOLUCOES E TECNOLOGIA S.A - CNPJ: 31.648.992/0001-91\nALAMEDA MADEIRA, 162, A11 SALA 1104 A, 06454010 - BARUERI - SP`}
              pre
              strong
            />
          }
          right={
            <Field
              label="Agência/Código Beneficiário"
              value={"1446/88125-0"}
              align="right"
              strong
            />
          }
        />

        <Divider />

        <Row
          cols={[
            <Field key="docdate" label="Data do documento" value={"—"} />,
            <Field key="docnum" label="Núm. do documento" value={data.invoice_id ? String(data.invoice_id) : "—"} strong />,
            <Field key="espdoc" label="Espécie Doc." value={"DM"} />,
            <Field key="aceite" label="Aceite" value={"N"} />,
            <Field key="proc" label="Data Processamento" value={"—"} />,
            <Field
              key="nosso"
              label="Nosso Número"
              value={data?.itau?.nosso_numero || "—"}
              align="right"
              strong
            />,
          ]}
        />

        <Divider />

        <Row
          cols={[
            <Field key="uso" label="Uso do Banco" value={""} />,
            <Field key="cart" label="Carteira" value={data?.itau?.codigo_carteira || "—"} strong />,
            <Field key="esp" label="Espécie" value={"R$"} />,
            <Field key="qtd" label="Quantidade" value={""} />,
            <Field key="valor" label="Valor" value={""} />,
            <Field
              key="valdoc"
              label="(=) Valor do Documento"
              value={formatBRL(Number(data.valor || 0))}
              align="right"
              bg="#eee"
              strong
            />,
          ]}
        />

        <Divider />

        <Row
          left={
            <Field
              label="Instruções"
              value={"Instruções de responsabilidade do BENEFICIÁRIO. Qualquer dúvida sobre este boleto contate o BENEFICIÁRIO."}
              pre
              strong
            />
          }
          right={
            <>
              <Field label="(-) Descontos/Abatimento" value={""} align="right" />
              <Field label="(+) Juros/Multa" value={""} align="right" />
              <Field label="(=) Valor Cobrado" value={""} align="right" bg="#eee" strong />
            </>
          }
        />

        <Divider />

        <Row
          left={
            <Field
              label="Pagador"
              value={`${data?.pagador_nome || "—"} — CPF/CNPJ: ${data?.pagador_doc || "—"}\n${data?.pagador_endereco || "—"}`}
              pre
              strong
            />
          }
          right={
            <Field
              label="Código de Barras (número)"
              value={data.codigo_barras || "—"}
              align="right"
              strong
            />
          }
        />
      </div>

      {/* Rodapé */}
      <div style={{ marginTop: 10, fontSize: 10, color: "#333", borderTop: "1px solid #434343", paddingTop: 6 }}>
        Em caso de dúvidas, de posse do comprovante, contate seu gerente ou a Central. (texto do rodapé do Itaú aqui, se você quiser copiar)
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid #000" }} />;
}

function Row({
  left,
  right,
  cols,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  cols?: React.ReactNode[];
}) {
  if (cols && cols.length) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
        {cols.map((c, i) => (
          <div key={i} style={{ borderRight: i === cols.length - 1 ? "none" : "1px solid #000", padding: 8 }}>
            {c}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px" }}>
      <div style={{ borderRight: "1px solid #000", padding: 8 }}>{left}</div>
      <div style={{ padding: 8 }}>{right}</div>
    </div>
  );
}

function Field({
  label,
  value,
  align,
  bg,
  strong,
  pre,
}: {
  label: string;
  value: string;
  align?: "left" | "right" | "center";
  bg?: string;
  strong?: boolean;
  pre?: boolean;
}) {
  return (
    <div style={{ background: bg || "transparent", padding: bg ? 6 : 0 }}>
      <div style={{ fontSize: 11, color: "#333", marginBottom: 2 }}>{label}</div>
      <div
        style={{
          fontSize: 12,
          fontWeight: strong ? 800 : 600,
          textAlign: align || "left",
          whiteSpace: pre ? "pre-line" : "normal",
          minHeight: 16,
        }}
      >
        {value}
      </div>
    </div>
  );
}
