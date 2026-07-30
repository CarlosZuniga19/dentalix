import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function Calendario() {
  const navigate = useNavigate();
  
  const [modoBloqueo, setModoBloqueo] = useState(false);
  const [diasBloqueados, setDiasBloqueados] = useState([]); 
  const [citasReales, setCitasReales] = useState([]);
  const [guardando, setGuardando] = useState(false);
  
  // Estado para navegar entre meses
  const [fechaBase, setFechaBase] = useState(new Date());

  // Observador para detectar modo oscuro en tiempo real y cambiar fondos
  const [esOscuro, setEsOscuro] = useState(document.documentElement.classList.contains('dark'));

  const API_URL = 'https://dentalix.lat/api.php';

  // Efecto para escuchar los cambios de tema (Claro/Oscuro)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setEsOscuro(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch(`${API_URL}?accion=calendario_datos`)
      .then(res => res.json())
      .then(data => {
        setDiasBloqueados(data.dias_bloqueados || []);
        setCitasReales(data.citas || []);
      })
      .catch(err => console.error("Error al cargar calendario:", err));
  }, []);

  // Funciones para cambiar de mes
  const mesAnterior = () => {
    setFechaBase(new Date(fechaBase.getFullYear(), fechaBase.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setFechaBase(new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 1));
  };

  const generarMes = () => {
    const year = fechaBase.getFullYear();
    const month = fechaBase.getMonth(); 
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

  // NUEVA LÓGICA: Si no está en modo bloqueo, manda a crear una cita con la fecha.
  const handleDiaClick = (fechaStr, e) => {
    if (!fechaStr) return;
    
    // Si el usuario hizo clic directamente en una cita (botón), no queremos que se ejecute el clic del fondo de la celda
    if (e && e.target.closest('button')) return;

    if (modoBloqueo) {
      if (diasBloqueados.includes(fechaStr)) {
        setDiasBloqueados(diasBloqueados.filter(d => d !== fechaStr));
      } else {
        setDiasBloqueados([...diasBloqueados, fechaStr]);
      }
    } else {
      // Si no es modo bloqueo y el día NO está bloqueado, navegar a Citas.
      if (!diasBloqueados.includes(fechaStr)) {
        navigate('/citas', { state: { fechaPreseleccionada: fechaStr } });
      }
    }
  };

  const toggleModoBloqueo = () => {
    if (modoBloqueo) {
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
      setModoBloqueo(true);
    }
  };

  const handleCitaClick = (e, citaId) => {
    e.stopPropagation(); 
    navigate('/citas', { state: { citaIdParaEditar: Number(citaId) } }); 
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      
      {/* CABECERA REORGANIZADA PARA VERSIÓN MÓVIL Y ESCRITORIO */}
      <div className="relative mb-6 flex flex-col items-center">
        
        {/* Botón de bloqueo alineado a la derecha como en la imagen */}
        <div className="w-full flex justify-end mb-2 sm:mb-0 sm:absolute sm:top-0 sm:right-0 z-10">
          <button 
            onClick={toggleModoBloqueo}
            disabled={guardando}
            className={`p-2.5 sm:px-5 sm:py-2.5 rounded-full flex items-center justify-center gap-2 transition-all font-bold shadow-sm border disabled:opacity-50 ${
              modoBloqueo 
                ? 'bg-danger text-white border-danger animate-pulse' 
                : (esOscuro ? 'bg-background text-dark border-gray-800 hover:bg-gray-800' : 'bg-white text-dark hover:bg-gray-50 border-gray-200')
            }`}
          >
            {modoBloqueo ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            <span className="hidden sm:inline text-sm">
              {guardando ? 'Guardando...' : (modoBloqueo ? 'Guardar Cambios' : 'Bloquear Días')}
            </span>
          </button>
        </div>

        {/* Controles de navegación de mes tipo "Píldora" (Aplica bg-background en dark mode) */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className={`flex items-center gap-2 rounded-full border p-1 shadow-sm w-max transition-colors ${esOscuro ? 'bg-background border-gray-800' : 'bg-white border-gray-200'}`}>
            <button onClick={mesAnterior} className={`p-1 sm:p-1.5 rounded-full transition-colors ${esOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
              <ChevronLeft size={18} className="text-dark" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-dark capitalize min-w-[120px] text-center">
              {fechaBase.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
            </h1>
            <button onClick={mesSiguiente} className={`p-1 sm:p-1.5 rounded-full transition-colors ${esOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
              <ChevronRight size={18} className="text-dark" />
            </button>
          </div>
          <p className="text-muted text-xs sm:text-sm px-2 text-center mb-1">Desliza lateralmente en celular para ver la semana.</p>
        </div>
        
      </div>

      {modoBloqueo ? (
        <div className="bg-danger/10 text-danger p-3 rounded-xl mb-6 font-medium text-center text-sm border border-danger/20">
          Modo Edición: Toca cualquier día para marcarlo como No Disponible.
        </div>
      ) : (
        <div className="bg-primary/10 text-primary p-3 rounded-xl mb-6 font-medium text-center text-sm border border-primary/20 flex items-center justify-center gap-2">
          <Plus size={16} /> Toca cualquier día vacío para agendar una cita nueva.
        </div>
      )}

      {/* Contenedor principal con scroll horizontal único que mueve todo el mes */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        
        {/* El min-w obliga a que en celulares mantenga su forma y se active el scroll del contenedor padre */}
        <div className="min-w-[700px] md:min-w-0 flex flex-col gap-2 sm:gap-4">
          
          {semanas.map((semana, semanaIndex) => (
            <div key={semanaIndex} className="grid grid-cols-6 gap-2 sm:gap-4">
              
              {semana.map((dia, diaIndex) => {
                const isBlocked = dia ? diasBloqueados.includes(dia.fechaStr) : false;
                const citasDelDia = dia ? citasReales.filter(c => c.fecha === dia.fechaStr) : [];
                
                return (
                  <div 
                    key={diaIndex} 
                    onClick={(e) => dia && handleDiaClick(dia.fechaStr, e)}
                    className={`bg-surface rounded-2xl border-2 transition-all min-h-[120px] md:min-h-[140px] flex flex-col relative overflow-hidden ${
                      !dia ? 'opacity-0 pointer-events-none' : ''
                    } ${dia ? 'cursor-pointer hover:border-primary/50' : ''} ${
                      isBlocked ? 'border-danger bg-danger/5 hover:border-danger/50' : 'border-transparent'
                    }`}
                  >
                    {dia && (
                      <>
                        {/* Encabezado del día (Aplica bg-background en dark mode) */}
                        <div className={`p-2 md:p-3 pb-1 border-b flex justify-between items-center transition-colors ${esOscuro ? 'bg-background border-gray-800' : 'bg-white/50 border-gray-100'}`}>
                          <span className="text-xs font-bold text-muted uppercase">{diasSemana[diaIndex]}</span>
                          <span className={`text-lg font-black ${isBlocked ? 'text-danger' : 'text-dark'}`}>{dia.numero}</span>
                        </div>
                        
                        <div className="p-1 md:p-2 flex-1 flex flex-col gap-1 overflow-y-auto relative">
                          {isBlocked ? (
                            <div className="absolute inset-0 flex items-center justify-center p-2">
                              <span className="text-danger font-black uppercase text-[10px] md:text-xs text-center border-2 border-danger rounded px-1 rotate-[-12deg] bg-white dark:bg-background">
                                No Disponible
                              </span>
                            </div>
                          ) : (
                            citasDelDia.map((cita, i) => (
                              <button
                                key={i}
                                onClick={(e) => handleCitaClick(e, cita.id)}
                                className="w-full bg-primary/10 hover:bg-primary hover:text-white text-primary text-left text-[10px] md:text-xs font-bold px-2 py-1.5 rounded-lg transition-colors truncate shadow-sm flex flex-col relative z-10"
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
          ))}
        </div>
      </div>
    </div>
  );
}