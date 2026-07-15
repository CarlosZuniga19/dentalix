import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import { Calendar, Clock, ClipboardList, Users, Stethoscope, Bell, Settings } from 'lucide-react';

import Procedimientos from './Procedimientos';
import Login from './Login';
import Ajustes from './Ajustes';
import Calendario from './Calendario';
import Agenda from './Agenda';
import Citas from './Citas';
import Pacientes from './Pacientes';
import Recordatorios from './Recordatorios'; 

// =========================================================================
// INTERCEPTOR GLOBAL MULTIUSUARIO
// Agrega el usuario_id automáticamente a todas las llamadas hacia api.php
// =========================================================================
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
        } catch(e) { /* Ignorar si no es JSON */ }
      } else if (config.body instanceof FormData) {
        config.body.append('usuario_id', userId);
      }
    }
  }
  return originalFetch.apply(this, [resource, config]);
};
// =========================================================================


function Layout({ children, nombreClinica }) {
  return (
    <div className="flex h-screen bg-surface overflow-hidden transition-colors duration-300">
      
      {/* CABECERA MÓVIL (Solo Logo Clickeable, sin hamburguesa) */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-background border-b border-gray-200 flex items-center justify-center z-40">
        <Link to="/" className="text-primary font-bold text-xl hover:opacity-80 transition-opacity">
          {nombreClinica}
        </Link>
      </div>

      {/* MENÚ LATERAL ESCRITORIO (Oculto en móvil) */}
      <nav className="hidden md:flex fixed md:static top-0 left-0 h-full w-64 bg-background border-r border-gray-200 p-4 z-30 flex-col transition-transform duration-300 ease-in-out">
        <Link to="/" className="text-primary font-bold text-2xl mb-8 text-center mt-4 block hover:opacity-80 transition-opacity">
          {nombreClinica}
        </Link>
        
        {/* REORDENADO: "Hoy" es el primero y es la ruta raíz */}
        <NavItem to="/" icon={<Bell />} label="Hoy" />
        <NavItem to="/calendario" icon={<Calendar />} label="Calendario" />
        <NavItem to="/agenda" icon={<Clock />} label="Agenda" />
        <NavItem to="/citas" icon={<ClipboardList />} label="Citas" />
        <NavItem to="/pacientes" icon={<Users />} label="Pacientes" />
        <NavItem to="/procedimientos" icon={<Stethoscope />} label="Procedimientos" />
        <NavItem to="/ajustes" icon={<Settings />} label="Ajustes" />
      </nav>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-16 md:mt-0 mb-28 md:mb-0 bg-surface relative">
        {children}
      </main>

      {/* BARRA INFERIOR FLOTANTE TIPO CÁPSULA (Estilo iOS) */}
      <div className="md:hidden fixed bottom-6 left-0 w-full px-4 z-50 flex justify-center pointer-events-none">
        <nav 
          className="bg-background/95 backdrop-blur-md border border-gray-200 rounded-full flex overflow-x-auto shadow-[0_8px_30px_rgba(0,0,0,0.12)] pointer-events-auto max-w-full"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex min-w-max px-2 py-1">
            {/* REORDENADO: "Hoy" es el primero y es la ruta raíz */}
            <MobileNavItem to="/" icon={<Bell size={22} />} label="Hoy" />
            <MobileNavItem to="/calendario" icon={<Calendar size={22} />} label="Calendario" />
            <MobileNavItem to="/agenda" icon={<Clock size={22} />} label="Agenda" />
            <MobileNavItem to="/citas" icon={<ClipboardList size={22} />} label="Citas" />
            <MobileNavItem to="/pacientes" icon={<Users size={22} />} label="Pacientes" />
            <MobileNavItem to="/procedimientos" icon={<Stethoscope size={22} />} label="Procedimientos" />
            <MobileNavItem to="/ajustes" icon={<Settings size={22} />} label="Ajustes" />
          </div>
        </nav>
      </div>
    </div>
  );
}

/* COMPONENTE PARA BOTONES DEL MENÚ ESCRITORIO */
function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `flex items-center p-3 mb-2 rounded-full transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface hover:text-primary'}`}>
      <div className="w-6 h-6 mr-3">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

/* COMPONENTE PARA BOTONES DE LA BARRA INFERIOR MÓVIL */
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
    // BLOQUEO DE ZOOM EN MÓVILES (Inyecta la etiqueta meta dinámicamente)
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';

    if (localStorage.getItem('dentalix_auth') === 'true') setIsAuthenticated(true);
    if (localStorage.getItem('dentalix_dark') === 'true') document.documentElement.classList.add('dark');

    // Carga de color ULTRA-RÁPIDA desde Caché
    const colorCache = localStorage.getItem('dentalix_color_primario');
    const nombreCache = localStorage.getItem('dentalix_nombre_app');
    
    if (colorCache) {
      document.documentElement.style.setProperty('--color-primary', colorCache);
      document.documentElement.style.setProperty('--color-primary-hover', oscurecerColor(colorCache));
    }
    if (nombreCache) setNombreClinica(nombreCache);

    // Carga silenciosa desde Base de Datos
    fetch('https://dentalix.lat/api.php?accion=ajustes')
      .then(res => res.json())
      .then(data => {
        if (data.nombre_app) {
          setNombreClinica(data.nombre_app);
          localStorage.setItem('dentalix_nombre_app', data.nombre_app);
        }
        if (data.colores_tema) {
          const colores = JSON.parse(data.colores_tema);
          document.documentElement.style.setProperty('--color-primary', colores.primary);
          document.documentElement.style.setProperty('--color-primary-hover', oscurecerColor(colores.primary));
          localStorage.setItem('dentalix_color_primario', colores.primary);
        }
      })
      .catch(err => console.error("Error al cargar ajustes globales:", err));
  }, []);

  const handleLogin = (usuarioId) => {
    localStorage.setItem('dentalix_auth', 'true');
    // Guardamos el ID del usuario. Si no se pasa, usamos 1 como seguridad para que no colapse el sistema
    localStorage.setItem('dentalix_usuario_id', usuarioId || '1');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('dentalix_auth');
    localStorage.removeItem('dentalix_usuario_id');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <Router>
      <Layout nombreClinica={nombreClinica}>
        <Routes>
          <Route path="/" element={<Recordatorios />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/procedimientos" element={<Procedimientos />} />
          <Route path="/ajustes" element={<Ajustes onLogout={handleLogout} onUpdateName={setNombreClinica} />} />
        </Routes>
      </Layout>
    </Router>
  );
}