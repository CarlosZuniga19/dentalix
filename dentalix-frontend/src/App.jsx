import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Calendar, Clock, ClipboardList, Users, Stethoscope, Bell, Settings, Menu, X } from 'lucide-react';

import Procedimientos from './Procedimientos';
import Login from './Login';
import Ajustes from './Ajustes';
import Calendario from './Calendario';
import Agenda from './Agenda';
import Citas from './Citas';
import Pacientes from './Pacientes';
import Recordatorios from './Recordatorios'; 

function Layout({ children, nombreClinica }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface overflow-hidden transition-colors duration-300">
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-background border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <span className="text-primary font-bold text-xl">{nombreClinica}</span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-primary p-2 focus:outline-none">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-dark/20 z-20 md:hidden transition-opacity" onClick={() => setIsMenuOpen(false)} />
      )}

      <nav className={`fixed md:static top-0 left-0 h-full w-64 bg-background border-r border-gray-200 p-4 z-30 transition-transform duration-300 ease-in-out flex flex-col pt-20 md:pt-4 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="hidden md:block text-primary font-bold text-2xl mb-8 text-center mt-4">
          {nombreClinica}
        </div>
        
        <NavItem to="/" icon={<Calendar />} label="Calendario" onClick={() => setIsMenuOpen(false)} />
        <NavItem to="/agenda" icon={<Clock />} label="Agenda" onClick={() => setIsMenuOpen(false)} />
        <NavItem to="/citas" icon={<ClipboardList />} label="Citas" onClick={() => setIsMenuOpen(false)} />
        <NavItem to="/pacientes" icon={<Users />} label="Pacientes" onClick={() => setIsMenuOpen(false)} />
        <NavItem to="/procedimientos" icon={<Stethoscope />} label="Procedimientos" onClick={() => setIsMenuOpen(false)} />
        <NavItem to="/recordatorios" icon={<Bell />} label="Recordatorios" onClick={() => setIsMenuOpen(false)} />
        <NavItem to="/ajustes" icon={<Settings />} label="Ajustes" onClick={() => setIsMenuOpen(false)} />
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-16 md:mt-0 bg-surface">
        {children}
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex items-center p-3 mb-2 rounded-full transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface hover:text-primary'}`}>
      <div className="w-6 h-6 mr-3">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
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
    if (localStorage.getItem('dentalix_auth') === 'true') setIsAuthenticated(true);
    if (localStorage.getItem('dentalix_dark') === 'true') document.documentElement.classList.add('dark');

    // Carga de color ULTRA-RÁPIDA desde Caché (Elimina el destello)
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

  const handleLogin = () => {
    localStorage.setItem('dentalix_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('dentalix_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <Router>
      <Layout nombreClinica={nombreClinica}>
        <Routes>
          <Route path="/" element={<Calendario />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/procedimientos" element={<Procedimientos />} />
          <Route path="/recordatorios" element={<Recordatorios />} />
          <Route path="/ajustes" element={<Ajustes onLogout={handleLogout} onUpdateName={setNombreClinica} />} />
        </Routes>
      </Layout>
    </Router>
  );
}