import { createContext, useContext, useState } from "react";

const RestauranteContext = createContext(null);

const MESAS_INIT = [
  { id: 1, numero: 1, cap: 4, estado: "ocupada",    mesero: "Andrés Torres" },
  { id: 2, numero: 2, cap: 2, estado: "disponible", mesero: null },
  { id: 3, numero: 3, cap: 6, estado: "ocupada",    mesero: "Andrés Torres" },
  { id: 4, numero: 4, cap: 4, estado: "reservada",  mesero: null },
  { id: 5, numero: 5, cap: 2, estado: "disponible", mesero: null },
  { id: 6, numero: 6, cap: 8, estado: "ocupada",    mesero: "Carlos Ruiz" },
  { id: 7, numero: 7, cap: 4, estado: "disponible", mesero: null },
  { id: 8, numero: 8, cap: 6, estado: "reservada",  mesero: null },
];

const PEDIDOS_INIT = [
  {
    id: 101, mesa: 3, mesero: "Andrés Torres",
    hora: "12:14", estado: "pendiente",
    alergias: ["Lactosa"],
    items: [
      { id: 1, nombre: "Lomo al trapo",    precio: 42000, cantidad: 2, obs: "término medio" },
      { id: 6, nombre: "Limonada de coco", precio: 9000,  cantidad: 2, obs: "sin azúcar" },
    ],
  },
  {
    id: 102, mesa: 1, mesero: "Andrés Torres",
    hora: "12:08", estado: "en_preparacion",
    alergias: [],
    items: [
      { id: 3, nombre: "Salmón al horno",   precio: 38000, cantidad: 1, obs: "sin sal" },
      { id: 8, nombre: "Risotto de hongos", precio: 32000, cantidad: 2, obs: "" },
    ],
  },
  {
    id: 103, mesa: 6, mesero: "Carlos Ruiz",
    hora: "11:55", estado: "en_preparacion",
    alergias: ["Gluten", "Mariscos"],
    items: [
      { id: 2, nombre: "Carpaccio de res",   precio: 28000, cantidad: 2, obs: "" },
      { id: 10, nombre: "Mousse de maracuyá",precio: 14000, cantidad: 2, obs: "" },
    ],
  },
];

export function RestauranteProvider({ children }) {
  const [mesas,   setMesas]   = useState(MESAS_INIT);
  const [pedidos, setPedidos] = useState(PEDIDOS_INIT);

  // Agregar nuevo pedido
  const agregarPedido = (pedido) => {
    setPedidos(prev => [...prev, {
      ...pedido,
      id: Date.now(),
      hora: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      estado: "pendiente",
    }]);
    // Marcar mesa como ocupada
    setMesas(prev => prev.map(m =>
      m.id === pedido.mesaId ? { ...m, estado: "ocupada", mesero: pedido.mesero } : m
    ));
  };

  // Avanzar estado de un pedido (cocinero)
  const avanzarEstadoPedido = (id) => {
    const NEXT = { pendiente: "en_preparacion", en_preparacion: "listo" };
    setPedidos(prev => prev.map(p =>
      p.id === id && NEXT[p.estado] ? { ...p, estado: NEXT[p.estado] } : p
    ));
  };

  // Marcar pedido como entregado (mesero)
  const entregarPedido = (id) => {
    setPedidos(prev => prev.map(p =>
      p.id === id ? { ...p, estado: "entregado" } : p
    ));
  };

  return (
    <RestauranteContext.Provider value={{
      mesas, setMesas,
      pedidos, setPedidos,
      agregarPedido,
      avanzarEstadoPedido,
      entregarPedido,
    }}>
      {children}
    </RestauranteContext.Provider>
  );
}

export const useRestaurante = () => useContext(RestauranteContext);