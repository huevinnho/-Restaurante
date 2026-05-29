import { useState } from "react";
import api from "../../services/api";

// ─── Paleta (igual que el resto de la app) ───────────────────────────────────
const C = {
  bg: "#0f0e0c", surface: "#1a1916", card: "#232220",
  border: "#2e2c29", accent: "#e8a43a", muted: "#6b6a66",
  text: "#f0ede6", danger: "#e05c4b", success: "#4caf7d", info: "#4a9edd",
};

const Spinner = ({ size = 14 }) => (
  <span style={{
    display: "inline-block", width: size, height: size,
    border: "2px solid currentColor", borderTopColor: "transparent",
    borderRadius: "50%", animation: "spin .7s linear infinite",
  }} />
);

// ─── Métodos de pago disponibles ─────────────────────────────────────────────
const METODOS = [
  {
    id: "Efectivo",
    label: "Efectivo",
    icon: "💵",
    desc: "Pagas en caja o al mesero al recibir tu pedido.",
  },
  {
    id: "Tarjeta",
    label: "Tarjeta",
    icon: "💳",
    desc: "Débito o crédito. El datáfono se acerca a tu mesa.",
  },
  {
    id: "App móvil",
    label: "App móvil",
    icon: "📱",
    desc: "Nequi, Daviplata, Bancolombia u otra app de pagos.",
  },
];

// ─── ModalPago ────────────────────────────────────────────────────────────────
/**
 * Props:
 *   pedido        — objeto del pedido (necesita id_pedido, items, factura?)
 *   onClose       — fn para cerrar sin pagar
 *   onPagado      — fn que se llama tras confirmar el pago exitosamente
 */
export default function ModalPago({ pedido, onClose, onPagado }) {
  const [metodo, setMetodo] = useState(null);
  const [propina, setPropina] = useState(0);
  const [propinaCustom, setPropinaCustom] = useState("");
  const [paso, setPaso] = useState("metodo"); // "metodo" | "confirmar" | "exito"
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  if (!pedido) return null;

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const subtotal = pedido.items?.reduce(
    (s, i) => s + (Number(i.precio_unitario || 0) * i.cantidad), 0
  ) ?? 0;

  const IVA_PCT = pedido.factura?.iva_porcentaje ?? 19;
  const iva = Math.round(subtotal * IVA_PCT / 100);

  const propinaOpts = [
    { label: "Sin propina", value: 0 },
    { label: "5%", value: Math.round(subtotal * 0.05) },
    { label: "10%", value: Math.round(subtotal * 0.10) },
    { label: "Otro", value: "custom" },
  ];

  const propinaFinal = propina === "custom"
    ? (Number(propinaCustom.replace(/\D/g, "")) || 0)
    : Number(propina);

  const total = subtotal + iva + propinaFinal;

  // ── Confirmar pago ────────────────────────────────────────────────────────
  const confirmarPago = async () => {
    if (!metodo) return;
    setEnviando(true);
    setError("");
    try {
      await api.pagarPedido({
        id_pedido: pedido.id_pedido,
        metodo_pago: metodo,
        propina: propinaFinal,
      });
      setPaso("exito");
      setTimeout(() => {
        onPagado?.();
        onClose();
      }, 2800);
    } catch (err) {
      setError(err?.message || "No se pudo procesar el pago. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (paso === "exito") return (
    <Overlay>
      <ModalBox>
        <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: C.success, marginBottom: 8 }}>
            ¡Pago confirmado!
          </h2>
          <p style={{ color: C.muted, fontSize: 14 }}>
            Pedido #{pedido.id_pedido} · {metodo}
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: C.accent, marginTop: 12 }}>
            ${total.toLocaleString("es-CO")}
          </p>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
            Tu factura estará disponible en la sección Facturas.
          </p>
        </div>
      </ModalBox>
    </Overlay>
  );

  // ── Pantalla de confirmación ──────────────────────────────────────────────
  if (paso === "confirmar") return (
    <Overlay>
      <ModalBox>
        <Header title="Confirmar pago" onClose={onClose} />

        <div style={{ marginBottom: 20 }}>
          {/* Resumen método */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: C.surface, borderRadius: 10, padding: "12px 16px",
            border: `1px solid ${C.accent}44`, marginBottom: 16,
          }}>
            <span style={{ fontSize: 28 }}>{METODOS.find(m => m.id === metodo)?.icon}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{metodo}</p>
              <p style={{ fontSize: 12, color: C.muted }}>
                {METODOS.find(m => m.id === metodo)?.desc}
              </p>
            </div>
          </div>

          {/* Desglose */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {[
              ["Subtotal", subtotal],
              [`IVA (${IVA_PCT}%)`, iva],
              propinaFinal > 0 && ["Propina", propinaFinal],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 13, color: C.muted,
              }}>
                <span>{k}</span>
                <span>${Number(v).toLocaleString("es-CO")}</span>
              </div>
            ))}
            <div style={{
              display: "flex", justifyContent: "space-between",
              paddingTop: 10, marginTop: 4, borderTop: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Total</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: C.accent }}>
                ${total.toLocaleString("es-CO")}
              </span>
            </div>
          </div>

          {/* Items */}
          <div style={{ background: C.surface, borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 8 }}>DETALLE</p>
            {pedido.items?.map((it, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 12, marginBottom: 4,
              }}>
                <span style={{ color: C.text }}>{it.cantidad}× {it.plato_nombre}</span>
                <span style={{ color: C.accent }}>
                  ${(it.cantidad * Number(it.precio_unitario)).toLocaleString("es-CO")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: C.danger + "18", border: `1px solid ${C.danger}44`,
            borderRadius: 8, padding: "8px 12px", fontSize: 12,
            color: C.danger, marginBottom: 14,
          }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setPaso("metodo")}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 8, fontSize: 13,
              background: "transparent", color: C.muted,
              border: `1px solid ${C.border}`, cursor: "pointer",
            }}
          >
            ← Volver
          </button>
          <button
            onClick={confirmarPago}
            disabled={enviando}
            style={{
              flex: 2, padding: "11px 0", borderRadius: 8, fontSize: 13,
              fontWeight: 600, background: C.accent, color: "#0f0e0c",
              border: "none", cursor: enviando ? "not-allowed" : "pointer",
              opacity: enviando ? .7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {enviando ? <><Spinner /> Procesando…</> : "✅ Confirmar pago"}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );

  // ── Paso 1: elegir método + propina ───────────────────────────────────────
  return (
    <Overlay>
      <ModalBox>
        <Header title={`Pagar pedido #${pedido.id_pedido}`} onClose={onClose} />

        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
          Mesa {pedido.mesa_numero} · Elige cómo quieres pagar
        </p>

        {/* Métodos */}
        <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 10 }}>
          MÉTODO DE PAGO
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          {METODOS.map(m => (
            <button
              key={m.id}
              onClick={() => setMetodo(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: metodo === m.id ? C.accent + "18" : C.surface,
                border: `1px solid ${metodo === m.id ? C.accent : C.border}`,
                borderRadius: 10, padding: "12px 16px",
                cursor: "pointer", transition: "all .15s", textAlign: "left",
              }}
            >
              <span style={{ fontSize: 26, flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: 14, fontWeight: 500,
                  color: metodo === m.id ? C.accent : C.text,
                }}>{m.label}</p>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.desc}</p>
              </div>
              {metodo === m.id && (
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: C.accent, color: "#0f0e0c",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Propina */}
        <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 10 }}>
          PROPINA (OPCIONAL)
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: propina === "custom" ? 10 : 22 }}>
          {propinaOpts.map(opt => (
            <button
              key={opt.label}
              onClick={() => {
                setPropina(opt.value);
                if (opt.value !== "custom") setPropinaCustom("");
              }}
              style={{
                background: propina === opt.value ? C.success + "18" : C.surface,
                color: propina === opt.value ? C.success : C.muted,
                border: `1px solid ${propina === opt.value ? C.success : C.border}`,
                borderRadius: 20, padding: "5px 14px", fontSize: 12,
                cursor: "pointer", transition: "all .15s",
              }}
            >
              {opt.label}
              {opt.value !== "custom" && opt.value > 0 && (
                <span style={{ marginLeft: 4, opacity: .7, fontSize: 10 }}>
                  (${opt.value.toLocaleString("es-CO")})
                </span>
              )}
            </button>
          ))}
        </div>

        {propina === "custom" && (
          <div style={{ marginBottom: 22 }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ingresa el valor de propina..."
              value={propinaCustom}
              onChange={e => setPropinaCustom(e.target.value.replace(/\D/g, ""))}
              style={{
                background: C.surface, border: `1px solid ${C.border}`,
                color: C.text, borderRadius: 8, padding: "9px 14px",
                fontSize: 13, width: "100%", outline: "none",
              }}
            />
          </div>
        )}

        {/* Resumen rápido */}
        <div style={{
          background: C.surface, borderRadius: 10,
          padding: "12px 16px", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: 11, color: C.muted }}>TOTAL A PAGAR</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: C.accent }}>
              ${total.toLocaleString("es-CO")}
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: C.muted }}>
            <p>Subtotal: ${subtotal.toLocaleString("es-CO")}</p>
            <p>IVA ({IVA_PCT}%): ${iva.toLocaleString("es-CO")}</p>
            {propinaFinal > 0 && <p>Propina: ${propinaFinal.toLocaleString("es-CO")}</p>}
          </div>
        </div>

        <button
          onClick={() => { if (metodo) setPaso("confirmar"); }}
          disabled={!metodo}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 8, fontSize: 14,
            fontWeight: 600, background: metodo ? C.accent : C.border,
            color: metodo ? "#0f0e0c" : C.muted,
            border: "none", cursor: metodo ? "pointer" : "not-allowed",
            transition: "all .2s",
          }}
        >
          Continuar →
        </button>
      </ModalBox>
    </Overlay>
  );
}

// ─── Sub-componentes internos ─────────────────────────────────────────────────
function Overlay({ children }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.82)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, zIndex: 4000,
      backdropFilter: "blur(4px)",
    }}>
      {children}
    </div>
  );
}

function ModalBox({ children }) {
  return (
    <div style={{
      width: "100%", maxWidth: 480,
      background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: 20, padding: 28,
      maxHeight: "90vh", overflowY: "auto",
      animation: "fadeUp .3s ease",
    }}>
      {children}
    </div>
  );
}

function Header({ title, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent }}>
        {title}
      </h2>
      <button onClick={onClose} style={{
        background: "transparent", border: "none",
        color: C.muted, fontSize: 22, cursor: "pointer", lineHeight: 1,
      }}>×</button>
    </div>
  );
}
