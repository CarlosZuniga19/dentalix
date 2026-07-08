import { useState, useEffect } from 'react';
import { Bell, Save, Check, Clock, User, AlertCircle } from 'lucide-react';

export default function Recordatorios() {
  const [citasHoy, setCitasHoy] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const API_URL = 'https://dentalix.lat/api.php';

  // Función para obtener la fecha local exacta (Evita desfases de zona horaria)
  const getFechaHoyLocal = () => {
    const curr = new Date();
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fechaHoyFormateada = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  useEffect(() => {
    const hoy = getFechaHoyLocal();
    fetch(`${API_URL}?accion=recordatorios_hoy&fecha_hoy=${hoy}`)
      .then(res => res.json())
      .then(data => {
        setCitasHoy(data || []);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error cargando recordatorios:", err);
        setCargando(false);
      });
  }, []);

  // Actualizar el estado local mientras el usuario escribe
  const handleCambioTexto = (id_cita, texto) => {
    setCitasHoy(citasHoy.map(cita => 
      cita.id_cita === id_cita ? { ...cita, recordatorio: texto } : cita
    ));
  };

  // Enviar la nota a la base de datos
  const guardarRecordatorio = (id_cita, texto) => {
    setGuardandoId(id_cita);
    
    fetch(`${API_URL}?accion=guardar_recordatorio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_cita: id_cita, recordatorio: texto })
    })
    .then(res => res.json())
    .then(data => {
      setGuardandoId(null);
      if (data.success) {
        setMensajeExito(id_cita);
        setTimeout(() => setMensajeExito(null), 3000); // El check verde dura 3 segundos
      }
    })
    .catch(() => {
      alert("Error de conexión al guardar el recordatorio.");
      setGuardandoId(null);
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Bell className="text-primary" size={28} /> Recordatorios del Día
          </h1>
          <p className="text-muted text-sm capitalize mt-1">{fechaHoyFormateada}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm font-bold text-dark flex items-center gap-2">
          Citas programadas hoy: <span className="bg-primary text-white px-2 py-0.5 rounded-full">{citasHoy.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {cargando ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center font-medium text-muted">
            Buscando citas de hoy...
          </div>
        ) : citasHoy.length > 0 ? (
          citasHoy.map((cita) => (
            <div key={cita.id_cita} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
              
              {/* Información de la cita (Lado izquierdo) */}
              <div className="bg-surface/50 p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-primary font-black text-xl mb-3">
                  <Clock size={20} />
                  {cita.hora.substring(0, 5)} hrs
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <User size={18} className="text-muted shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-dark leading-tight">{cita.paciente}</h3>
                    <p className="text-xs text-muted mt-1">{cita.telefono || 'Sin teléfono registrado'}</p>
                  </div>
                </div>
                <div className="mt-3 inline-flex">
                  <span className="bg-white border border-gray-200 text-xs font-bold px-3 py-1 rounded-full uppercase text-muted shadow-sm">
                    {cita.estado}
                  </span>
                </div>
              </div>

              {/* Área del Recordatorio (Lado derecho) */}
              <div className="p-6 md:w-2/3 flex flex-col">
                <label className="text-sm font-bold text-dark mb-2 flex items-center gap-2">
                  <AlertCircle size={16} className="text-muted" /> Notas / Recordatorio para este paciente
                </label>
                <textarea 
                  value={cita.recordatorio || ''} 
                  onChange={(e) => handleCambioTexto(cita.id_cita, e.target.value)}
                  placeholder="Ej: Paciente debe $200 de la cita anterior, recordar firmar responsiva..."
                  className="w-full flex-1 min-h-[100px] p-4 bg-surface border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-dark resize-none transition-colors"
                ></textarea>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => guardarRecordatorio(cita.id_cita, cita.recordatorio)}
                    disabled={guardandoId === cita.id_cita}
                    className={`px-6 py-2.5 rounded-full font-bold shadow-sm flex items-center gap-2 transition-all ${
                      mensajeExito === cita.id_cita 
                        ? 'bg-green-500 text-white' 
                        : 'bg-primary hover:bg-primary-hover text-white disabled:opacity-50'
                    }`}
                  >
                    {guardandoId === cita.id_cita ? (
                      'Guardando...'
                    ) : mensajeExito === cita.id_cita ? (
                      <><Check size={18} /> ¡Guardado!</>
                    ) : (
                      <><Save size={18} /> Guardar Nota</>
                    )}
                  </button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-muted" />
            </div>
            <h2 className="text-xl font-bold text-dark mb-2">Día libre de citas</h2>
            <p className="text-muted max-w-md">No hay citas programadas para el día de hoy. Las notas y recordatorios aparecerán aquí cuando tengas pacientes en agenda.</p>
          </div>
        )}
      </div>

    </div>
  );
}