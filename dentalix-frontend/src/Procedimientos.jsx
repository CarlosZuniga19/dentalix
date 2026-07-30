import { useState, useEffect } from 'react';
import { Search, Plus, X, Edit2 } from 'lucide-react';

export default function Procedimientos() {
  const [procedimientos, setProcedimientos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado añadido para rastrear si editamos o creamos
  const [procEditando, setProcEditando] = useState(null);
  const [nuevoProc, setNuevoProc] = useState({ nombre: '', precio_base: '', color_hex: '#8B5CF6' });
  const [cargando, setCargando] = useState(true);

  // URL de tu API real en Hostinger
  const API_URL = 'https://dentalix.lat/api.php';

  // Cargar desde la base de datos al abrir la pantalla
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setProcedimientos(data);
        setCargando(false);
      })
      .catch(error => console.error("Error al cargar:", error));
  }, []);

  const filtrados = procedimientos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Abrir modal para crear uno NUEVO
  const abrirModalNuevo = () => {
    setProcEditando(null);
    setNuevoProc({ nombre: '', precio_base: '', color_hex: '#8B5CF6' });
    setIsModalOpen(true);
  };

  // Abrir modal para EDITAR
  const abrirModalEdicion = (proc) => {
    setProcEditando(proc.id);
    setNuevoProc({ nombre: proc.nombre, precio_base: proc.precio_base, color_hex: proc.color_hex || '#8B5CF6' });
    setIsModalOpen(true);
  };

  // Enviar a la base de datos de Hostinger
  const guardarProcedimiento = () => {
    if(!nuevoProc.nombre || !nuevoProc.precio_base) return;

    // Si estamos editando, agregamos el ID al paquete de datos
    const payload = { ...nuevoProc };
    if (procEditando) {
      payload.id = procEditando;
    }

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if(data.mensaje || data.success) {
        
        if (procEditando) {
          // Si editamos, actualizamos solo ese elemento en el arreglo visual
          setProcedimientos(procedimientos.map(p => 
            p.id === procEditando ? { ...payload, precio_base: parseFloat(payload.precio_base) } : p
          ));
        } else {
          // Si es nuevo, lo empujamos al final con su nuevo ID
          setProcedimientos([...procedimientos, { ...payload, id: data.id, precio_base: parseFloat(payload.precio_base) }]);
        }

        setIsModalOpen(false);
        setNuevoProc({ nombre: '', precio_base: '', color_hex: '#8B5CF6' });
        setProcEditando(null);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto pb-6">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Procedimientos</h1>
        <button 
          onClick={abrirModalNuevo}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Agregar procedimiento</span>
          <span className="sm:hidden">Agregar</span>
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-muted" />
        </div>
        <input
          type="text"
          placeholder="Buscar procedimientos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm text-dark"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[200px]">
        {cargando ? (
          <div className="p-8 text-center text-muted font-medium">Cargando base de datos...</div>
        ) : filtrados.length > 0 ? (
          filtrados.map((proc, index) => (
            <div 
              key={proc.id} 
              onClick={() => abrirModalEdicion(proc)}
              className={`flex justify-between items-center p-4 ${index !== filtrados.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-surface transition-colors cursor-pointer group`}
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: proc.color_hex }}></div>
                <span className="font-medium text-dark group-hover:text-primary transition-colors">{proc.nombre}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted font-medium">${parseFloat(proc.precio_base).toFixed(2)}</span>
                <button className="text-gray-300 group-hover:text-primary transition-colors" title="Editar">
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted">No se encontraron coincidencias.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-dark/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-dark">
                {procEditando ? "Editar Procedimiento" : "Nuevo Procedimiento"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-danger transition-colors p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-muted mb-1 ml-2">Nombre</label>
                <input 
                  type="text" 
                  value={nuevoProc.nombre}
                  onChange={e => setNuevoProc({...nuevoProc, nombre: e.target.value})}
                  className="w-full p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark"
                  placeholder="Ej. Limpieza dental"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1 ml-2">Color del Diagnóstico</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={nuevoProc.color_hex}
                    onChange={e => setNuevoProc({...nuevoProc, color_hex: e.target.value})}
                    className="w-14 h-14 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={nuevoProc.color_hex}
                    onChange={e => setNuevoProc({...nuevoProc, color_hex: e.target.value})}
                    className="flex-1 p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark uppercase font-mono text-sm"
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1 ml-2">Precio base</label>
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={nuevoProc.precio_base}
                  onChange={e => setNuevoProc({...nuevoProc, precio_base: e.target.value})}
                  className="w-full p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark"
                  placeholder="$ 0.00"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-surface">
              <button 
                onClick={guardarProcedimiento}
                className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-full font-bold transition-colors shadow-sm"
              >
                {procEditando ? "Guardar Cambios" : "Guardar procedimiento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}