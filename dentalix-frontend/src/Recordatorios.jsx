import { useState, useEffect } from 'react';
import { Bell, Save, Check, Clock, User, AlertCircle, MessageCircle, Sparkles, Stethoscope, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Recordatorios() {
  const [citasHoy, setCitasHoy] = useState([]);
  const [recalls, setRecalls] = useState([]); // Estado para las notificaciones de limpieza/revisión
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [editandoNotas, setEditandoNotas] = useState({}); 

  const navigate = useNavigate();
  const API_URL = 'https://dentalix.lat/api.php';

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
    
    // 1. Cargar las citas de la agenda de hoy
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

    // 2. Cargar TODAS las citas para calcular el Recall (Limpiezas y Revisiones)
    fetch(`${API_URL}?accion=citas_lista`)
      .then(res => res.json())
      .then(data => {
        const citas = data || [];
        const now = new Date(hoy + 'T00:00:00');
        const pacientesMap = {};

        // Agrupar y detectar la última cita de cada paciente
        citas.forEach(c => {
          if (!pacientesMap[c.id_paciente]) {
            pacientesMap[c.id_paciente] = {
              id_paciente: c.id_paciente,
              nombre: c.paciente,
              telefono: c.telefono,
              ultimaCita: null,
              tieneCitaFutura: false
            };
          }
          const p = pacientesMap[c.id_paciente];
          const fechaCita = new Date(c.fecha + 'T00:00:00');

          // Si el paciente tiene una cita hoy o en el futuro (y no está cancelada), no lo molestamos
          if (fechaCita >= now && (!c.estado || !c.estado.includes('cancelado'))) {
            p.tieneCitaFutura = true;
          }

          // Registrar la cita pasada más reciente
          if (fechaCita < now && (!c.estado || !c.estado.includes('cancelado'))) {
            if (!p.ultimaCita || fechaCita > p.ultimaCita) {
              p.ultimaCita = fechaCita;
            }
          }
        });

        const recallList = [];
        Object.values(pacientesMap).forEach(p => {
          if (p.tieneCitaFutura || !p.ultimaCita) return; // Si ya tiene cita programada, ignorar

          const diffTime = now - p.ultimaCita;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffMonths = diffDays / 30.44; // Promedio de días en un mes

          if (diffMonths >= 12) {
            recallList.push({ ...p, tipo: 'revisión', meses: Math.floor(diffMonths) });
          } else if (diffMonths >= 6) {
            recallList.push({ ...p, tipo: 'limpieza', meses: Math.floor(diffMonths) });
          }
        });

        // Ordenar para mostrar primero los que llevan más tiempo sin venir
        recallList.sort((a, b) => b.meses - a.meses);
        setRecalls(recallList);
      })
      .catch(err => console.error("Error calculando notificaciones:", err));
  }, []);

  const handleCambioTexto = (id_cita, texto) => {
    setCitasHoy(citasHoy.map(cita => 
      cita.id_cita === id_cita ? { ...cita, recordatorio: texto } : cita
    ));
  };

  const toggleEdicionNota = (id_cita) => {
    setEditandoNotas(prev => ({ ...prev, [id_cita]: !prev[id_cita] }));
  };

  const getWaLink = (telefono) => {
    if (!telefono) return '#';
    let num = telefono.replace(/\D/g, ''); 
    if (num.length === 10) num = '52' + num;
    return `https://wa.me/${num}`;
  };

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
        setEditandoNotas(prev => ({ ...prev, [id_cita]: false }));
        setTimeout(() => setMensajeExito(null), 3000); 
      }
    })
    .catch(() => {
      alert("Error de conexión al guardar el recordatorio.");
      setGuardandoId(null);
    });
  };

  // Función para navegar al expediente desde la notificación
  const irAPaciente = (pacienteRecall) => {
    // Mandamos la instrucción al enrutador de que preseleccione a este paciente
    navigate('/pacientes', { state: { pacientePreseleccionadoParaAbrir: pacienteRecall } });
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">

      {/* ================= CARRUSEL DE NOTIFICACIONES (RECALL) ================= */}
      {recalls.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-black text-primary uppercase mb-3 flex items-center gap-2">
            <Sparkles size={16} /> Notificaciones Inteligentes
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
            {recalls.map((recall, i) => (
              <div 
                key={i} 
                onClick={() => irAPaciente(recall)}
                className="bg-white dark:bg-surface min-w-[260px] max-w-[280px] p-4 rounded-3xl border-2 border-primary/10 dark:border-primary/20 shadow-sm hover:border-primary/40 dark:hover:border-primary/50 cursor-pointer flex-shrink-0 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${recall.tipo === 'limpieza' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                    {recall.tipo === 'limpieza' ? <Sparkles size={20}/> : <Stethoscope size={20}/>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-dark font-medium leading-tight mb-2">
                      El paciente <strong className="font-black">{recall.nombre}</strong> ya necesita una <strong className={recall.tipo === 'limpieza' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}>{recall.tipo}</strong>.
                    </p>
                    <span className="text-[10px] text-muted uppercase font-bold flex items-center gap-1 group-hover:text-primary transition-colors">
                      Abrir expediente <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ================= AGENDA DEL DÍA == =============== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Bell className="text-primary" size={28} /> Agenda del Día
          </h1>
          <p className="text-muted text-sm capitalize mt-1">{fechaHoyFormateada}</p>
        </div>
        <div className="bg-white dark:bg-surface px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm text-sm font-bold text-dark flex items-center gap-2">
          Citas programadas hoy: <span className="bg-primary text-white px-2 py-0.5 rounded-full">{citasHoy.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {cargando ? (
          <div className="bg-white dark:bg-surface p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-center font-medium text-muted">
            Buscando citas de hoy...
          </div>
        ) : citasHoy.length > 0 ? (
          citasHoy.map((cita) => (
            <div 
              key={cita.id_cita} 
              onClick={() => navigate('/citas', { state: { citaIdParaEditar: cita.id_cita } })}
              className="bg-white dark:bg-surface rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-primary/30 dark:hover:border-primary/50 cursor-pointer"
            >
              
              <div className="p-4 md:p-5 flex justify-between items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-primary font-black text-xl mb-2">
                    <Clock size={20} />
                    {cita.hora.substring(0, 5)} hrs
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-surface dark:bg-background p-2.5 rounded-full mt-0.5 text-muted">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark text-lg leading-tight">{cita.paciente}</h3>
                      {cita.telefono ? (
                        <a 
                          href={getWaLink(cita.telefono)} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
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

                <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                  <span className="bg-surface dark:bg-background border border-gray-200 dark:border-gray-800 text-xs font-bold px-4 py-2 rounded-full uppercase text-muted shadow-sm text-center w-full min-w-[120px]">
                    {cita.estado}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleEdicionNota(cita.id_cita); }}
                    className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-xs font-bold px-4 py-2 rounded-full shadow-sm transition-colors flex items-center justify-center gap-1.5 w-full min-w-[120px]"
                  >
                    <Bell size={14} />
                    {cita.recordatorio ? 'Editar nota' : 'Agregar nota'}
                  </button>
                </div>
              </div>

              {cita.recordatorio && !editandoNotas[cita.id_cita] && (
                <div className="bg-[#FFF8F3] dark:bg-orange-900/10 border-t border-orange-100 dark:border-orange-900/30 p-4 md:px-5 flex items-start gap-3">
                  <Bell size={20} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-orange-800 dark:text-orange-400 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                    {cita.recordatorio}
                  </p>
                </div>
              )}

              {editandoNotas[cita.id_cita] && (
                <div 
                  className="p-4 md:p-5 bg-surface/50 dark:bg-background/50 border-t border-gray-100 dark:border-gray-800 flex flex-col cursor-default"
                  onClick={(e) => e.stopPropagation()} 
                >
                  <label className="text-sm font-bold text-dark mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-muted" /> Escribe la nota o recordatorio:
                  </label>
                  <textarea 
                    value={cita.recordatorio || ''} 
                    onChange={(e) => handleCambioTexto(cita.id_cita, e.target.value)}
                    placeholder="Ej: Paciente debe $200 de la cita anterior, recordar firmar responsiva..."
                    className="w-full flex-1 min-h-[80px] p-4 bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 text-dark resize-none transition-colors"
                  ></textarea>
                  
                  <div className="mt-3 flex justify-end gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleEdicionNota(cita.id_cita); }}
                      className="px-5 py-2 rounded-full font-bold text-muted hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); guardarRecordatorio(cita.id_cita, cita.recordatorio); }}
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

              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-background/50 flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); abrirWhatsAppRecordatorio(cita); }}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-1.5 px-5 rounded-full flex items-center justify-center gap-1.5 shadow-sm transition-colors text-xs"
                >
                  <MessageCircle size={14} />
                  Enviar Recordatorio
                </button>
              </div>

            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-surface p-12 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface dark:bg-background rounded-full flex items-center justify-center mb-4">
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