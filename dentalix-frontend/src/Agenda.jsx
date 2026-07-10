import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function Agenda() {
  const navigate = useNavigate();
  const [modoBloqueo, setModoBloqueo] = useState(false);
  const [horasBloqueadas, setHorasBloqueadas] = useState([]);
  const [citasReales, setCitasReales] = useState([]); 
  const [guardando, setGuardando] = useState(false);

  const API_URL = 'https://dentalix.lat/api.php';

  useEffect(() => {
    fetch(`${API_URL}?accion=calendario_datos`)
      .then(res => res.json())
      .then(dataCitas => {
        setCitasReales(dataCitas.citas || []);
        return fetch(`${API_URL}?accion=agenda_datos`);
      })
      .then(res => res.json())
      .then(dataHoras => setHorasBloqueadas(dataHoras.horas_bloqueadas || []))
      .catch(err => console.error(err));
  }, []);

  // Generador exacto de la semana (Previene bug de desfase de horario)
  const generarSemanaActual = () => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1; 
    let days = [];
    for (let i = 0; i < 6; i++) {
      let next = new Date(curr.getTime());
      next.setDate(first + i);
      
      const yyyy = next.getFullYear();
      const mm = String(next.getMonth() + 1).padStart(2, '0');
      const dd = String(next.getDate()).padStart(2, '0');
      
      days.push({
        nombre: ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][i],
        numero: next.getDate(),
        fechaStr: `${yyyy}-${mm}-${dd}`
      });
    }
    return days;
  };

  const generarHoras = () => {
    let horas = [];
    for (let h = 8; h <= 20; h++) {
      const horaStr = String(h).padStart(2, '0');
      horas.push(`${horaStr}:00:00`);
      if (h !== 20) horas.push(`${horaStr}:30:00`);
    }
    return horas;
  };

  const dias = generarSemanaActual();
  const horas = generarHoras();

  const handleCeldaClick = (fechaStr, horaStr) => {
    if (!modoBloqueo) return;
    const existe = horasBloqueadas.find(h => h.fecha === fechaStr && h.hora === horaStr);
    if (existe) {
      setHorasBloqueadas(horasBloqueadas.filter(h => !(h.fecha === fechaStr && h.hora === horaStr)));
    } else {
      setHorasBloqueadas([...horasBloqueadas, { fecha: fechaStr, hora: horaStr }]);
    }
  };

  const toggleModoBloqueo = () => {
    if (modoBloqueo) {
      setGuardando(true);
      fetch(`${API_URL}?accion=guardar_horas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horas_bloqueadas: horasBloqueadas })
      }).then(() => {
        setGuardando(false);
        setModoBloqueo(false);
      });
    } else {
      setModoBloqueo(true);
    }
  };

  return (
    // Estructura maestra flex para abarcar toda la altura sin doble scroll
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)] pb-4">
      
      <div className="flex justify-between items-center mb-4 shrink-0 px-2">
        <h1 className="text-2xl font-bold text-dark">Agenda Semanal</h1>
        <button 
          onClick={toggleModoBloqueo}
          disabled={guardando}
          className={`px-4 py-2.5 rounded-full flex items-center gap-2 transition-all font-bold shadow-sm border-2 text-sm disabled:opacity-50 ${
            modoBloqueo ? 'bg-danger text-white border-danger animate-pulse' : 'bg-white text-dark border-gray-200 hover:border-gray-300'
          }`}
        >
          {modoBloqueo ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          <span className="hidden sm:inline">{guardando ? 'Guardando...' : (modoBloqueo ? 'Guardar Cambios' : 'Bloquear Horas')}</span>
        </button>
      </div>

      {modoBloqueo && (
        <div className="bg-danger/10 text-danger p-2.5 rounded-lg mb-4 font-bold text-center text-sm border border-danger/20 shrink-0 mx-2">
          Modo Edición: Toca las celdas de abajo para marcarlas como "No Disponibles".
        </div>
      )}

      {/* Contenedor de la Cuadrícula: Se agregó 'z-0' para aislar el contexto de apilamiento y no superponer el menú lateral */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-auto relative z-0">
        <div className="flex min-w-max md:min-w-full">
          
          {/* COLUMNA DE HORAS FIJA (Sticky Left): z-index reducido a 10 */}
          <div className="w-16 md:w-20 shrink-0 sticky left-0 z-10 bg-white border-r border-gray-200 shadow-[2px_0_10px_rgba(0,0,0,0.03)] flex flex-col">
            {/* Esquina superior izquierda (Doble Sticky: Top y Left): z-index reducido a 20 */}
            <div className="h-12 md:h-14 sticky top-0 z-20 bg-surface border-b border-gray-200"></div>
            
            {horas.map((hora, idx) => (
              <div key={idx} className="h-20 border-b border-gray-100 flex items-start justify-center pt-2 bg-white">
                <span className="text-[10px] md:text-xs font-bold text-muted font-mono">{hora.substring(0, 5)}</span>
              </div>
            ))}
          </div>

          {/* COLUMNAS DE DÍAS */}
          {dias.map((dia, diaIdx) => (
            <div key={diaIdx} className="w-[130px] sm:w-[150px] md:w-auto md:flex-1 shrink-0 flex flex-col border-r border-gray-200 last:border-r-0">
              
              {/* Cabecera del Día (Sticky Top): z-index reducido a 10 */}
              <div className="h-12 md:h-14 sticky top-0 z-10 bg-surface border-b border-gray-200 flex items-center justify-center shadow-sm">
                <span className="text-[10px] md:text-xs font-black text-primary uppercase">{dia.nombre} {dia.numero}</span>
              </div>
              
              {/* Celdas de 30 minutos */}
              {horas.map((hora, horaIdx) => {
                const isBlocked = horasBloqueadas.some(h => h.fecha === dia.fechaStr && h.hora === hora);
                
                // MOTOR MATEMÁTICO: Atrapa TODAS las citas dentro de este bloque de 30 minutos
                const citasEnEstaCelda = citasReales.filter(c => {
                  if (c.fecha !== dia.fechaStr) return false;
                  const cMin = parseInt(c.hora.substring(0,2)) * 60 + parseInt(c.hora.substring(3,5));
                  const celdaMin = parseInt(hora.substring(0,2)) * 60 + parseInt(hora.substring(3,5));
                  return cMin >= celdaMin && cMin < celdaMin + 30;
                });

                return (
                  <div 
                    key={horaIdx}
                    onClick={() => handleCeldaClick(dia.fechaStr, hora)}
                    className={`min-h-[5rem] h-20 border-b border-gray-100 p-1 relative flex flex-col gap-1 transition-colors ${
                      modoBloqueo ? 'cursor-pointer hover:bg-gray-100 bg-white' : 'bg-white'
                    } ${isBlocked ? 'bg-danger/5' : ''}`}
                  >
                    {isBlocked && (
                      <div className="absolute inset-0 flex items-center justify-center p-1 z-0 pointer-events-none">
                        <span className="text-danger font-black text-[9px] uppercase border border-danger/40 px-2 py-1 bg-white/80 rounded shadow-sm">
                          No Disp.
                        </span>
                      </div>
                    )}
                    
                    {/* Renderizado de todas las cápsulas encontradas en este bloque de media hora */}
                    {!isBlocked && citasEnEstaCelda.map((cita, i) => (
                      <button
                        key={i}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate(`/citas`, { state: { citaIdParaEditar: Number(cita.id) } }); 
                        }}
                        className="w-full bg-primary/10 text-primary border-l-4 border-primary rounded-r-lg shadow-sm text-left p-1.5 flex flex-col overflow-hidden hover:bg-primary hover:text-white transition-all relative shrink-0"
                      >
                        <div className="font-black text-[10px] md:text-xs font-mono leading-none mb-0.5">{cita.hora.substring(0,5)}</div>
                        <div className="truncate text-[9px] md:text-[10px] font-bold tracking-tight uppercase leading-tight">{cita.paciente}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}