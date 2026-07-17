import { useState, useEffect } from 'react';
import { Bell, Save, Check, Clock, User, AlertCircle, MessageCircle } from 'lucide-react';

export default function Recordatorios() {
  const [citasHoy, setCitasHoy] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [editandoNotas, setEditandoNotas] = useState({}); // Controla qué cajas de texto están abiertas

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

  const handleCambioTexto = (id_cita, texto) => {
    setCitasHoy(citasHoy.map(cita => 
      cita.id_cita === id_cita ? { ...cita, recordatorio: texto } : cita
    ));
  };

  const toggleEdicionNota = (id_cita) => {
    setEditandoNotas(prev => ({ ...prev, [id_cita]: !prev[id_cita] }));
  };

  // Formateador simple para el enlace del teléfono en la cabecera
  const getWaLink = (telefono) => {
    if (!telefono) return '#';
    let num = telefono.replace(/\D/g, ''); // Limpia guiones y espacios
    if (num.length === 10) num = '52' + num;
    return `https://wa.me/${num}`;
  };

  // Lógica inteligente para el botón de Enviar Recordatorio
  const abrirWhatsAppRecordatorio = (cita) => {
    if (!cita.telefono) {
      alert("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    
    let num = cita.telefono.replace(/\D/g, ''); 
    if (num.length === 10) num = '52' + num;

    const hoyStr = getFechaHoyLocal();
    const hoyObj = new Date(hoyStr + 'T00:00:00');
    const citaObj = new Date(cita.fecha + 'T00:00:00');
    const diffDays = Math.ceil((citaObj - hoyObj) / (1000 * 60 * 60 * 24));

    let textoWa = `Hola ${cita.paciente}, para recordarte tu cita `;
    
    if (diffDays <= 0) {
      textoWa += `el día de hoy a las ${cita.hora.substring(0,5)} hrs.`;
    } else if (diffDays === 1) {
      textoWa += `el día de mañana a las ${cita.hora.substring(0,5)} hrs.`;
    } else {
      const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
      const fechaFormateada = citaObj.toLocaleDateString('es-MX', opcionesFecha);
      textoWa += `el ${fechaFormateada} a las ${cita.hora.substring(0,5)} hrs.`;
    }
    
    textoWa += ` ¡Te esperamos!`;
    
    const url = `https://wa.me/${num}?text=${encodeURIComponent(textoWa)}`;
    window.open(url, '_blank');
  };

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
        // Cerramos la caja de edición automáticamente al guardar exitosamente
        setEditandoNotas(prev => ({ ...prev, [id_cita]: false }));
        setTimeout(() => setMensajeExito(null), 3000); 
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
            <Bell className="text-primary" size={28} /> Agenda del Día
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
            <div key={cita.id_cita} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-md">
              
              {/* Información principal de la cita (ligeramente más compacta) */}
              <div className="p-4 md:p-5 flex justify-between items-center gap-4">
                
                {/* Lado izquierdo: Hora y Paciente */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-primary font-black text-xl mb-2">
                    <Clock size={20} />
                    {cita.hora.substring(0, 5)} hrs
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-surface p-2.5 rounded-full mt-0.5 text-muted">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark text-lg leading-tight">{cita.paciente}</h3>
                      {cita.telefono ? (
                        <a 
                          href={getWaLink(cita.telefono)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-sm text-[#25D366] font-bold hover:underline mt-1 inline-flex items-center gap-1.5"
                        >
                          <MessageCircle size={15} /> {cita.telefono}
                        </a>
                      ) : (
                        <p className="text-sm text-muted mt-1">Sin teléfono registrado</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado derecho: Cápsulas de Estado y Nota en Columna */}
                <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                  <span className="bg-surface border border-gray-200 text-xs font-bold px-4 py-2 rounded-full uppercase text-muted shadow-sm text-center w-full min-w-[120px]">
                    {cita.estado}
                  </span>
                  <button 
                    onClick={() => toggleEdicionNota(cita.id_cita)}
                    className="bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-600 text-xs font-bold px-4 py-2 rounded-full shadow-sm transition-colors flex items-center justify-center gap-1.5 w-full min-w-[120px]"
                  >
                    <Bell size={14} />
                    {cita.recordatorio ? 'Editar nota' : 'Agregar nota'}
                  </button>
                </div>
              </div>

              {/* Área de Nota Guardada (Modo Lectura) - Diseño naranja */}
              {cita.recordatorio && !editandoNotas[cita.id_cita] && (
                <div className="bg-[#FFF8F3] border-t border-orange-100 p-4 md:px-5 flex items-start gap-3">
                  <Bell size={20} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-orange-800 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                    {cita.recordatorio}
                  </p>
                </div>
              )}

              {/* Área de Edición de Nota (Caja de Texto) */}
              {editandoNotas[cita.id_cita] && (
                <div className="p-4 md:p-5 bg-surface/50 border-t border-gray-100 flex flex-col">
                  <label className="text-sm font-bold text-dark mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-muted" /> Escribe la nota o recordatorio:
                  </label>
                  <textarea 
                    value={cita.recordatorio || ''} 
                    onChange={(e) => handleCambioTexto(cita.id_cita, e.target.value)}
                    placeholder="Ej: Paciente debe $200 de la cita anterior, recordar firmar responsiva..."
                    className="w-full flex-1 min-h-[80px] p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 text-dark resize-none transition-colors"
                  ></textarea>
                  
                  <div className="mt-3 flex justify-end gap-2">
                    <button 
                      onClick={() => toggleEdicionNota(cita.id_cita)}
                      className="px-5 py-2 rounded-full font-bold text-muted hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => guardarRecordatorio(cita.id_cita, cita.recordatorio)}
                      disabled={guardandoId === cita.id_cita}
                      className={`px-5 py-2 rounded-full font-bold shadow-sm flex items-center gap-2 transition-all text-sm ${
                        mensajeExito === cita.id_cita 
                          ? 'bg-green-500 text-white' 
                          : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50'
                      }`}
                    >
                      {guardandoId === cita.id_cita ? (
                        'Guardando...'
                      ) : mensajeExito === cita.id_cita ? (
                        <><Check size={16} /> ¡Guardado!</>
                      ) : (
                        <><Save size={16} /> Guardar Nota</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Botón Inferior: Enviar Recordatorio WhatsApp (Reducido y alineado a la derecha) */}
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                <button
                  onClick={() => abrirWhatsAppRecordatorio(cita)}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-1.5 px-5 rounded-full flex items-center justify-center gap-1.5 shadow-sm transition-colors text-xs"
                >
                  <MessageCircle size={14} />
                  Enviar Recordatorio
                </button>
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