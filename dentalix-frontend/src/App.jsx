import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, ClipboardList, Users, Stethoscope, Bell, Settings, ArrowLeft, BarChart3, FileText, Pill, RefreshCw, Download, Share, Plus, Smartphone, Monitor, MonitorDown, Star } from 'lucide-react';

import Procedimientos from './Procedimientos';
import Login from './Login';
import Ajustes from './Ajustes';
import Calendario from './Calendario';
import Agenda from './Agenda';
import Citas from './Citas';
import Pacientes from './Pacientes';
import Recordatorios from './Recordatorios'; 
import Reportes from './Reportes';
import Consentimientos from './Consentimientos';
import Recetas from './Recetas'; 

export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.includes('api.php')) {
    const userId = localStorage.getItem('dentalix_usuario_id') || '1';
    
    if (!config) { config = { method: 'GET' }; }

    if (!config.method || config.method.toUpperCase() === 'GET') {
      const separador = resource.includes('?') ? '&' : '?';
      resource += `${separador}usuario_id=${userId}`;
    } else if (config.method.toUpperCase() === 'POST') {
      if (config.body && typeof config.body === 'string') {
        try {
          let bodyObj = JSON.parse(config.body);
          bodyObj.usuario_id = userId;
          config.body = JSON.stringify(bodyObj);
        } catch(e) { }
      } else if (config.body instanceof FormData) {
        config.body.append('usuario_id', userId);
      }
    }
  }
  return originalFetch.apply(this, [resource, config]);
};

function UpdatePrompt() {
  const { backAction } = useAppContext(); 
  const [workerEsperando, setWorkerEsperando] = useState(null);
  const [autoActualizando, setAutoActualizando] = useState(false); 
  const location = useLocation(); 

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let recargando = false;
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!recargando) {
        recargando = true;
        window.location.reload(); 
      }
    });

    const revisarActualizaciones = async () => {
      const registro = await navigator.serviceWorker.ready;

      if (registro.waiting) {
        setWorkerEsperando(registro.waiting);
      }

      registro.addEventListener('updatefound', () => {
        const nuevoWorker = registro.installing;
        if (nuevoWorker) {
          nuevoWorker.addEventListener('statechange', () => {
            if (nuevoWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWorkerEsperando(nuevoWorker);
            }
          });
        }
      });
    };

    revisarActualizaciones();

    const intervalo = setInterval(() => {
      navigator.serviceWorker.ready.then(reg => reg.update());
    }, 3 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && !workerEsperando) {
      navigator.serviceWorker.ready.then(reg => {
        reg.update().catch(() => {});
      });
    }
  }, [location.pathname, workerEsperando]);

  useEffect(() => {
    if (workerEsperando && !backAction) {
      setAutoActualizando(true);
      setTimeout(() => {
        workerEsperando.postMessage({ type: 'SKIP_WAITING' });
      }, 1500); 
    }
  }, [workerEsperando, backAction]);

  if (autoActualizando) {
    return (
      <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-surface p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center gap-4 border border-primary/20 text-center animate-in zoom-in-95 duration-300">
          <RefreshCw className="text-primary animate-spin" size={40} />
          <div>
            <h3 className="text-dark font-black text-lg mb-1">Instalando mejora...</h3>
            <p className="text-muted text-sm font-medium">Actualizando el sistema dental</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workerEsperando) return null;

  return (
    <div className="fixed top-6 left-0 w-full flex justify-center z-[9999]">
      <button 
        onClick={() => {
          setAutoActualizando(true);
          setTimeout(() => workerEsperando.postMessage({ type: 'SKIP_WAITING' }), 800);
        }}
        className="bg-red-600 text-white px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(220,38,38,0.6)] font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform animate-bounce border-2 border-white"
      >
        <RefreshCw className="animate-spin-slow" size={20} />
        Actualización lista (Guarda y presiona aquí)
      </button>
    </div>
  );
}

function RouteChangeListener({ setBackAction }) {
  const location = useLocation();
  useEffect(() => {
    setBackAction(null);
  }, [location.pathname, setBackAction]);
  return null;
}

function InstallBlocker() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null); 
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 shadow-lg border border-primary/20">
        <Download className="text-primary w-12 h-12" />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-black text-dark mb-4">
        Instala Dentalix para continuar
      </h1>
      
      <p className="text-muted text-lg max-w-md mb-10">
        Por seguridad y rendimiento, Dentalix solo funciona como una aplicación nativa. Instálala en tu dispositivo para acceder.
      </p>

      {deferredPrompt ? (
        <button 
          onClick={handleInstallClick}
          className="bg-primary text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_10px_30px_rgba(var(--color-primary-rgb),0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          {deviceType === 'desktop' ? <Monitor size={24} /> : <Smartphone size={24} />}
          Instalar Aplicación Ahora
        </button>
      ) : deviceType === 'ios' ? (
        <div className="bg-surface p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-sm w-full">
          <h3 className="text-dark font-bold mb-4 flex items-center justify-center gap-2">
            <Smartphone className="text-primary" /> Instrucciones para iOS
          </h3>
          <ol className="text-left text-muted space-y-4">
            <li className="flex items-start gap-3">
              <div className="bg-background p-2 rounded-lg shrink-0">
                <Share size={20} className="text-blue-500" />
              </div>
              <p><strong>Paso 1:</strong> Toca el botón de <strong>Compartir</strong> en la barra inferior de Safari.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-background p-2 rounded-lg shrink-0">
                <Plus size={20} className="text-gray-500 dark:text-gray-400" />
              </div>
              <p><strong>Paso 2:</strong> Desliza hacia abajo y selecciona <strong>Agregar a inicio</strong>.</p>
            </li>
          </ol>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-primary font-medium animate-pulse">
              Abre la app desde tu pantalla de inicio una vez agregada.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full">
          <h3 className="text-dark font-bold mb-5 flex items-center justify-center gap-2">
            <Monitor className="text-primary" /> Instalación en Computadora
          </h3>
          
          <div className="space-y-5 text-left">
            <div className="bg-background p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-dark mb-2 text-sm">🌐 En Chrome o Edge (Mac y PC):</h4>
              <p className="text-muted text-xs mb-4">
                Busca este ícono en tu barra de direcciones (arriba a la derecha) y haz clic para instalar:
              </p>
              
              <div className="flex items-center justify-end bg-surface border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 w-full max-w-[300px] ml-auto shadow-inner pointer-events-none">
                 <span className="text-xs text-muted truncate mr-auto pl-2 font-mono">dentalix.lat</span>
                 <div className="flex items-center gap-3 pr-1">
                   <div className="relative flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-bounce shadow-sm border border-gray-300 dark:border-gray-500">
                     <MonitorDown size={16} className="text-dark" />
                   </div>
                   <Star size={16} className="text-gray-400 dark:text-gray-500" />
                 </div>
              </div>
            </div>

            <div className="bg-background p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-dark mb-2 text-sm">🍎 En Safari (Mac):</h4>
              <p className="text-muted text-xs">
                Safari no tiene botón rápido. Ve a la barra de menú superior, haz clic en <strong>Archivo</strong> y selecciona <strong>Agregar al Dock...</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Layout({ children, nombreClinica, logoClinica, backAction }) {
  const [esOscuro, setEsOscuro] = useState(document.documentElement.classList.contains('dark'));
  const currentUserId = localStorage.getItem('dentalix_usuario_id'); 

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setEsOscuro(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-screen bg-surface overflow-hidden transition-colors duration-300 relative">
      
      <style>{`
        /* ESTILOS GLOBALES MEJORADOS PARA MODO OSCURO */
        html.dark {
          color-scheme: dark;
        }
        html.dark body, html.dark .bg-background {
          background-color: #0f172a !important; 
        }
        html.dark .bg-surface {
          background-color: #1e293b !important; 
        }
        html.dark .border-gray-100, 
        html.dark .border-gray-200 {
          border-color: #334155 !important; 
        }
        html.dark .text-dark {
          color: #f8fafc !important; 
        }
        html.dark .text-muted {
          color: #94a3b8 !important; 
        }
        html.dark input, html.dark textarea, html.dark select {
          background-color: #0f172a !important; 
          border-color: #334155 !important;
          color: #f8fafc !important;
        }
        html.dark .shadow-sm, html.dark .shadow-md, html.dark .shadow-xl {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5) !important;
        }

        /* ======================================================= */
        /* BYPASS MAESTRO PARA EL CACHÉ DE SAFARI (TARJETAS)       */
        /* ======================================================= */
        .tarjeta-footer {
          background-color: #f8fafc !important; /* bg-slate-50 seguro para modo claro */
        }
        html.dark .tarjeta-footer {
          background-color: transparent !important; /* Hereda el bg-surface en modo oscuro */
          border-color: #334155 !important; 
        }
      `}</style>

      <UpdatePrompt />

      <nav className="hidden md:flex fixed md:static top-0 left-0 h-full w-64 bg-background border-r border-gray-200 p-4 z-30 flex-col transition-transform duration-300 ease-in-out">
        <Link to="/" className="text-primary font-bold text-2xl mb-8 text-center mt-4 block hover:opacity-80 transition-opacity flex justify-center items-center h-16">
          {logoClinica ? (
            <img src={logoClinica} alt={nombreClinica} className="max-h-full max-w-full object-contain" />
          ) : (
            nombreClinica
          )}
        </Link>
        
        <NavItem to="/" icon={<Bell />} label="Hoy" />
        <NavItem to="/calendario" icon={<Calendar />} label="Calendario" />
        <NavItem to="/agenda" icon={<Clock />} label="Agenda" />
        <NavItem to="/citas" icon={<ClipboardList />} label="Citas" />
        <NavItem to="/pacientes" icon={<Users />} label="Pacientes" />
        
        <NavItem to="/recetas" icon={<Pill />} label="Recetas" />
        
        <NavItem to="/procedimientos" icon={<Stethoscope />} label="Procedimientos" />
        <NavItem to="/reportes" icon={<BarChart3 />} label="Reportes" />
        
        {currentUserId === '1' && (
          <NavItem to="/consentimientos" icon={<FileText />} label="Consentimientos" />
        )}

        <NavItem to="/ajustes" icon={<Settings />} label="Ajustes" />
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-28 md:mb-0 bg-surface relative">
        {children}
      </main>

      {backAction && (
        <button 
          onClick={backAction}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-dark text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center z-[60] hover:scale-105 active:scale-95 transition-all"
          title="Volver sin guardar"
        >
          <ArrowLeft size={28} />
        </button>
      )}

      <div className="md:hidden fixed bottom-6 left-0 w-full px-4 z-50 flex justify-center pointer-events-none">
        <nav 
          className={
            esOscuro
              ? "bg-background border border-gray-200 dark:border-gray-800 rounded-full flex overflow-x-auto shadow-[0_8px_30px_rgba(0,0,0,0.12)] pointer-events-auto max-w-full transition-colors"
              : "bg-white/95 backdrop-blur-md border border-gray-200 rounded-full flex overflow-x-auto shadow-[0_8px_30px_rgba(0,0,0,0.12)] pointer-events-auto max-w-full transition-colors"
          }
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex min-w-max px-2 py-1">
            <MobileNavItem to="/" icon={<Bell size={22} />} label="Hoy" />
            <MobileNavItem to="/calendario" icon={<Calendar size={22} />} label="Calendario" />
            <MobileNavItem to="/agenda" icon={<Clock size={22} />} label="Agenda" />
            <MobileNavItem to="/citas" icon={<ClipboardList size={22} />} label="Citas" />
            <MobileNavItem to="/pacientes" icon={<Users size={22} />} label="Pacientes" />
            
            <MobileNavItem to="/recetas" icon={<Pill size={22} />} label="Recetas" />
            
            <MobileNavItem to="/procedimientos" icon={<Stethoscope size={22} />} label="Procedimientos" />
            <MobileNavItem to="/reportes" icon={<BarChart3 size={22} />} label="Reportes" />
            
            {currentUserId === '1' && (
              <MobileNavItem to="/consentimientos" icon={<FileText size={22} />} label="Consentimientos" />
            )}

            <MobileNavItem to="/ajustes" icon={<Settings size={22} />} label="Ajustes" />
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `flex items-center p-3 mb-2 rounded-full transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface hover:text-primary'}`}>
      <div className="w-6 h-6 mr-3">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

function MobileNavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `flex flex-col items-center justify-center w-[72px] h-14 transition-colors shrink-0 ${isActive ? 'text-primary' : 'text-muted hover:text-primary'}`}>
      <div className="mb-1">{icon}</div>
      <span className="text-[10px] font-bold max-w-full truncate px-1">{label}</span>
    </NavLink>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nombreClinica, setNombreClinica] = useState('Dentalix');
  const [logoClinica, setLogoClinica] = useState(null);
  
  const [isStandalone, setIsStandalone] = useState(
    window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true ||
    window.location.hostname === 'localhost' 
  );
  
  const [backAction, setBackAction] = useState(null);

  const oscurecerColor = (hex, factor = 0.15) => {
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    let rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i*2,2), 16);
      c = Math.round(Math.min(Math.max(0, c - (c * factor)), 255)).toString(16);
      rgb += ("00"+c).substr(c.length);
    }
    return rgb;
  };

  useEffect(() => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';

    const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const aplicarTema = () => {
      const userPref = localStorage.getItem('dentalix_dark');
      if (userPref === 'true' || (userPref === null && systemDarkQuery.matches)) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    };

    aplicarTema();

    const listenerModoOscuro = () => {
      if (localStorage.getItem('dentalix_dark') === null) {
        aplicarTema();
      }
    };
    systemDarkQuery.addEventListener('change', listenerModoOscuro);

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleStandaloneChange = (e) => {
      setIsStandalone(e.matches || window.navigator.standalone === true);
    };
    standaloneQuery.addEventListener('change', handleStandaloneChange);

    if (localStorage.getItem('dentalix_auth') === 'true') setIsAuthenticated(true);

    const colorCache = localStorage.getItem('dentalix_color_primario');
    const nombreCache = localStorage.getItem('dentalix_nombre_app');
    const logoCache = localStorage.getItem('dentalix_logo');
    
    if (colorCache) {
      document.documentElement.style.setProperty('--color-primary', colorCache);
      document.documentElement.style.setProperty('--color-primary-hover', oscurecerColor(colorCache));
    }
    if (nombreCache) setNombreClinica(nombreCache);
    if (logoCache) setLogoClinica(logoCache);

    fetch('https://dentalix.lat/api.php?accion=ajustes')
      .then(res => res.json())
      .then(data => {
        if (data.nombre_app) {
          setNombreClinica(data.nombre_app);
          localStorage.setItem('dentalix_nombre_app', data.nombre_app);
        }
        if (data.logo) {
          setLogoClinica(data.logo);
          localStorage.setItem('dentalix_logo', data.logo);
        }
        if (data.colores_tema) {
          const colores = JSON.parse(data.colores_tema);
          document.documentElement.style.setProperty('--color-primary', colores.primary);
          document.documentElement.style.setProperty('--color-primary-hover', oscurecerColor(colores.primary));
          localStorage.setItem('dentalix_color_primario', colores.primary);
        }
        if(data.cedula) localStorage.setItem('dentalix_cedula', data.cedula);
        if(data.universidad) localStorage.setItem('dentalix_universidad', data.universidad);
        if(data.firma_doctor) localStorage.setItem('dentalix_firma_doctor', data.firma_doctor);
      })
      .catch(err => console.error("Error al cargar ajustes globales:", err));

    return () => {
      systemDarkQuery.removeEventListener('change', listenerModoOscuro);
      standaloneQuery.removeEventListener('change', handleStandaloneChange);
    };
  }, []);

  const handleLogin = (usuarioId) => {
    localStorage.setItem('dentalix_auth', 'true');
    localStorage.setItem('dentalix_usuario_id', usuarioId || '1');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('dentalix_auth');
    localStorage.removeItem('dentalix_usuario_id');
    setIsAuthenticated(false);
  };

  if (!isStandalone) return <InstallBlocker />;

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <AppContext.Provider value={{ setBackAction, backAction }}>
      <Router>
        <RouteChangeListener setBackAction={setBackAction} />
        <Layout nombreClinica={nombreClinica} logoClinica={logoClinica} backAction={backAction}>
          <Routes>
            <Route path="/" element={<Recordatorios />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/citas" element={<Citas />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/recetas" element={<Recetas />} />  
            <Route path="/procedimientos" element={<Procedimientos />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/consentimientos" element={<Consentimientos />} />
            <Route path="/ajustes" element={<Ajustes onLogout={handleLogout} onUpdateName={setNombreClinica} onUpdateLogo={setLogoClinica} />} />
          </Routes>
        </Layout>
      </Router>
    </AppContext.Provider>
  );
}