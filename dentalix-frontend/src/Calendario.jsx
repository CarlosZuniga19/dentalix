import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function Calendario() {
  const navigate = useNavigate();
  
  const [modoBloqueo, setModoBloqueo] = useState(false);
  const [diasBloqueados, setDiasBloqueados] = useState([]); 
  const [citasReales, setCitasReales] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const API_URL = 'https://dentalix.lat/api.php';

  // Cargar datos reales al abrir la pantalla
  useEffect(() => {
    fetch(`${API_URL}?accion=calendario_datos`)
      .then(res => res.json())
      .then(data => {
        setDiasBloqueados(data.dias_bloqueados || []);
        setCitasReales(data.citas || []);
      })
      .catch(err => console.error("Error al cargar calendario:", err));
  }, []);

  const generarMes = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let weeks = [];
    let currentWeek = Array(6).fill(null); 
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(year, month, i);
      const dayOfWeek = currentDay.getDay(); 
      if (dayOfWeek === 0) continue; 
      
      const index = dayOfWeek - 1; 
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      currentWeek[index] = { numero: i, fechaStr: dateString };
      
      if (dayOfWeek === 6 || i === daysInMonth) {
        weeks.push(currentWeek);
        currentWeek = Array(6).fill(null);
      }
    }
    return weeks;
  };

  const semanas = generarMes();
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const handleDiaClick = (fechaStr) => {
    if (!fechaStr || !modoBloqueo) return;
    
    if (diasBloqueados.includes(fechaStr)) {
      setDiasBloqueados(diasBloqueados.filter(d => d !== fechaStr));
    } else {
      setDiasBloqueados([...diasBloqueados, fechaStr]);
    }
  };

  const toggleModoBloqueo = () => {
    if (modoBloqueo) {
      // Si estaba editando, ahora mandamos a guardar a Hostinger
      setGuardando(true);
      fetch(`${API_URL}?accion=guardar_bloqueos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dias_bloqueados: diasBloqueados })
      })
      .then(res => res.json())
      .then(() => {
        setGuardando(false);
        setModoBloqueo(false);
      });
    } else {
      // Activar modo edición
      setModoBloqueo(true);
    }
  };

  // AQUÍ ESTÁ LA CORRECCIÓN QUIRÚRGICA
  const handleCitaClick = (e, citaId) => {
    e.stopPropagation(); 
    // Mandamos el ID dentro de la propiedad "state" para que Citas lo reciba y abra la edición
    navigate('/citas', { state: { citaIdParaEditar: Number(citaId) } }); 
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark capitalize">
            {new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
          </h1>
          <p className="text-muted text-sm mt-1">Desliza lateralmente en celular para ver la semana completa.</p>
        </div>
        
        <button 
          onClick={toggleModoBloqueo}
          disabled={guardando}
          className={`px-5 py-2.5 rounded-full flex items-center gap-2 transition-all font-bold shadow-sm border-2 disabled:opacity-50 ${
            modoBloqueo 
              ? 'bg-danger text-white border-danger animate-pulse' 
              : 'bg-white text-dark border-gray-200 hover:border-gray-300'
          }`}
        >
          {modoBloqueo ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          <span className="hidden sm:inline">
            {guardando ? 'Guardando...' : (modoBloqueo ? 'Guardar Cambios' : 'Bloquear Días')}
          </span>
        </button>
      </div>

      {modoBloqueo && (
        <div className="bg-danger/10 text-danger p-3 rounded-xl mb-6 font-medium text-center text-sm border border-danger/20">
          Modo Edición: Toca cualquier día para marcarlo como No Disponible.
        </div>
      )}

      <div className="flex flex-col gap-4 sm:gap-6">
        {semanas.map((semana, semanaIndex) => (
          <div key={semanaIndex} className="bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex md:grid md:grid-cols-6 gap-2 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:pb-0" style={{ scrollbarWidth: 'none' }}>
              
              {semana.map((dia, diaIndex) => {
                const isBlocked = dia ? diasBloqueados.includes(dia.fechaStr) : false;
                // Filtramos las citas reales de la base de datos para este día
                const citasDelDia = dia ? citasReales.filter(c => c.fecha === dia.fechaStr) : [];
                
                return (
                  <div 
                    key={diaIndex} 
                    onClick={() => dia && handleDiaClick(dia.fechaStr)}
                    className={`min-w-[calc(33.333%-0.5rem)] md:min-w-0 flex-shrink-0 snap-start bg-surface rounded-2xl border-2 transition-all min-h-[120px] md:min-h-[140px] flex flex-col relative overflow-hidden ${
                      !dia ? 'opacity-0 pointer-events-none' : ''
                    } ${modoBloqueo && dia ? 'cursor-pointer hover:border-danger/50' : ''} ${
                      isBlocked ? 'border-danger bg-danger/5' : 'border-transparent'
                    }`}
                  >
                    {dia && (
                      <>
                        <div className="p-2 md:p-3 pb-1 border-b border-gray-100 flex justify-between items-center bg-white/50">
                          <span className="text-xs font-bold text-muted uppercase">{diasSemana[diaIndex]}</span>
                          <span className={`text-lg font-black ${isBlocked ? 'text-danger' : 'text-dark'}`}>{dia.numero}</span>
                        </div>
                        
                        <div className="p-1 md:p-2 flex-1 flex flex-col gap-1 overflow-y-auto relative">
                          {isBlocked ? (
                            <div className="absolute inset-0 flex items-center justify-center p-2">
                              <span className="text-danger font-black uppercase text-[10px] md:text-xs text-center border-2 border-danger rounded px-1 rotate-[-12deg] bg-white">
                                No Disponible
                              </span>
                            </div>
                          ) : (
                            citasDelDia.map((cita, i) => (
                              <button
                                key={i}
                                onClick={(e) => handleCitaClick(e, cita.id)}
                                className="w-full bg-primary/10 hover:bg-primary hover:text-white text-primary text-left text-[10px] md:text-xs font-bold px-2 py-1.5 rounded-lg transition-colors truncate shadow-sm flex flex-col"
                              >
                                <span>{cita.hora.substring(0, 5)} hrs</span>
                                <span className="font-medium truncate opacity-90">{cita.paciente}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}