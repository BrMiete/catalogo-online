import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Search, Send, Plus, Minus } from 'lucide-react';

// REEMPLAZA CON LA URL QUE OBTUVISTE DE GOOGLE APPS SCRIPT
const API_URL = "https://script.google.com/macros/s/AKfycbw95pT8Lmv9CVWw6kPCkcUiQAh4lV1yUqmIiY-a751ubtk5iEKWPgewWVJatq0IEH2l/exec";
// REEMPLAZA CON EL NÚMERO DEL NEGOCIO (Código de país + número, sin signos ni espacios)
const WHATSAPP_PHONE = "595985832001"; 

export default function App() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState(() => {
    const saved = localStorage.getItem("carrito_comercio");
    return saved ? JSON.parse(saved) : [];
  });
  const [abrirCarrito, setAbrirCarrito] = useState(false);

  // Guardar carrito en LocalStorage
  useEffect(() => {
    localStorage.setItem("carrito_comercio", JSON.stringify(carrito));
  }, [carrito]);

  // Cargar productos con caché de sesión
  useEffect(() => {
    const cache = sessionStorage.getItem("catalogo_productos");
    if (cache) {
      setProductos(JSON.parse(cache));
      setCargando(false);
      return;
    }

    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setProductos(data);
        sessionStorage.setItem("catalogo_productos", JSON.stringify(data));
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error cargando inventario:", err);
        setCargando(false);
      });
  }, []);

  // Manejo del carrito
  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: Math.min(item.cantidad + 1, item.stock) }
            : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const modificarCantidad = (id, delta) => {
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nuevaCantidad = item.cantidad + delta;
            return nuevaCantidad > 0 ? { ...item, cantidad: Math.min(nuevaCantidad, item.stock) } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  // Formatear mensaje y redirigir a WhatsApp
  const enviarPorWhatsApp = () => {
    if (carrito.length === 0) return;

    let mensaje = "¡Hola! Estoy interesado en los siguientes productos de su catálogo:\n\n";
    carrito.forEach((item) => {
      mensaje += `• ${item.cantidad}x ${item.nombre} - $${(item.precio * item.cantidad).toLocaleString()}\n`;
    });
    mensaje += `\n*Total estimado: $${total.toLocaleString()}*\n\n¿Tienen disponibilidad para coordinar la entrega/retiro?`;

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const categorias = ["Todos", ...new Set(productos.map((p) => p.categoria).filter(Boolean))];

  const productosFiltrados = productos.filter((p) => {
    const matchCat = categoriaSeleccionada === "Todos" || p.categoria === categoriaSeleccionada;
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusqueda;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Catálogo Familiar</h1>
            <p className="text-xs text-gray-500">Pedidos directos a nuestro WhatsApp</p>
          </div>
          <button
            onClick={() => setAbrirCarrito(!abrirCarrito)}
            className="relative p-2 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
          >
            <ShoppingCart className="w-6 h-6" />
            {carrito.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {carrito.reduce((acc, cur) => acc + cur.cantidad, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto p-4 flex-1 w-full">
        {/* Barra de búsqueda y Categorías */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  categoriaSeleccionada === cat
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Productos */}
        {cargando ? (
          <div className="text-center py-20 text-gray-500 font-medium">Cargando productos...</div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No se encontraron productos.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {productosFiltrados.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <img
                    src={item.imagen_url || "https://placehold.co/400x300?text=Sin+Imagen"}
                    alt={item.nombre}
                    className="w-full h-40 object-cover bg-gray-100"
                    loading="lazy"
                  />
                  <div className="p-3">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">{item.categoria}</span>
                    <h3 className="font-semibold text-gray-800 text-sm mt-0.5 line-clamp-1">{item.nombre}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.descripcion}</p>
                  </div>
                </div>
                <div className="p-3 pt-0 flex items-center justify-between mt-2">
                  <span className="font-bold text-gray-900 text-base">${item.precio.toLocaleString()}</span>
                  <button
                    onClick={() => agregarAlCarrito(item)}
                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                    title="Añadir al carrito"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Drawer / Modal del Carrito */}
      {abrirCarrito && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-800">Tu Pedido</h2>
              <button onClick={() => setAbrirCarrito(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {carrito.length === 0 ? (
                <div className="text-center py-20 text-gray-400">El carrito está vacío</div>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{item.nombre}</h4>
                      <p className="text-xs text-gray-500">${(item.precio * item.cantidad).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => modificarCantidad(item.id, -1)} className="p-1 border rounded hover:bg-gray-50">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.cantidad}</span>
                      <button onClick={() => modificarCantidad(item.id, 1)} className="p-1 border rounded hover:bg-gray-50">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 space-y-3">
              <div className="flex justify-between font-bold text-gray-900 text-lg">
                <span>Total Estimado:</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <button
                onClick={enviarPorWhatsApp}
                disabled={carrito.length === 0}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition disabled:opacity-50"
              >
                <Send className="w-5 h-5" /> Enviar Pedido por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}