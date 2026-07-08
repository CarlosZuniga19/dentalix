import { useState, useEffect } from 'react';
import { Save, LogOut, KeyRound, Moon, Sun } from 'lucide-react';

export default function Ajustes({ onLogout, onUpdateName }) {
  const [nombreApp, setNombreApp] = useState('Dentalix');
  const [colorPrimary, setColorPrimary] = useState('#8B5CF6');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const API_URL = 'https://dentalix.lat/api.php';

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
    fetch(`${API_URL}?accion=ajustes`)
      .then(res => res.json())
      .then(data => {
        if(data.nombre_app) setNombreApp(data.nombre_app);
        if(data.colores_tema) {
          const colores = JSON.parse(data.colores_tema);
          setColorPrimary(colores.primary);
        }
      });

    setIsDarkMode(
      document.documentElement.classList.contains('dark') || 
      localStorage.getItem('dentalix_dark') === 'true'
    );
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dentalix_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dentalix_dark', 'false');
    }
  };

  const guardarAjustesGenerales = () => {
    fetch(`${API_URL}?accion=guardar_ajustes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_app: nombreApp, color_primary: colorPrimary })
    })
    .then(res => res.json())
    .then(data => {
      document.documentElement.style.setProperty('--color-primary', colorPrimary);
      document.documentElement.style.setProperty('--color-primary-hover', oscurecerColor(colorPrimary));
      
      // Guardar en caché para evitar el destello morado al recargar
      localStorage.setItem('dentalix_color_primario', colorPrimary);
      localStorage.setItem('dentalix_nombre_app', nombreApp);
      
      if(onUpdateName) onUpdateName(nombreApp);

      setMensaje({ texto: 'Ajustes guardados correctamente', tipo: 'success' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    });
  };

  const cambiarPassword = () => {
    if(!nuevaPassword) return;
    fetch(`${API_URL}?accion=cambiar_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: nuevaPassword })
    })
    .then(res => res.json())
    .then(data => {
      setMensaje({ texto: 'Contraseña actualizada', tipo: 'success' });
      setNuevaPassword('');
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    });
  };

  return (
    <div className="max-w-2xl mx-auto pb-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Ajustes del Sistema</h1>

      {mensaje.texto && (
        <div className={`p-4 rounded-xl mb-6 font-medium text-center ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-danger/10 text-danger'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-dark mb-4">Apariencia y Personalización</h2>
        
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-gray-200">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon size={24} className="text-primary" /> : <Sun size={24} className="text-amber-500" />}
              <div>
                <p className="font-bold text-dark text-sm">Modo Oscuro</p>
                <p className="text-xs text-muted">Cambia la interfaz a colores oscuros</p>
              </div>
            </div>
            <button 
              onClick={toggleDarkMode}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1 ml-2">Nombre de la Clínica / App</label>
            <input
              type="text"
              value={nombreApp}
              onChange={e => setNombreApp(e.target.value)}
              className="w-full p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1 ml-2">Color Principal (Cápsulas)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorPrimary}
                onChange={e => setColorPrimary(e.target.value)}
                className="w-14 h-14 rounded-full cursor-pointer border-0 p-0 bg-transparent shrink-0"
              />
              <input
                type="text"
                value={colorPrimary}
                onChange={e => setColorPrimary(e.target.value)}
                className="flex-1 p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark uppercase font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <button
          onClick={guardarAjustesGenerales}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-colors font-bold w-full md:w-auto shadow-sm"
        >
          <Save size={20} /> Guardar Cambios
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-dark mb-4">Seguridad</h2>
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted mb-1 ml-2">Nueva Contraseña de Administrador</label>
          <input
            type="password"
            value={nuevaPassword}
            onChange={e => setNuevaPassword(e.target.value)}
            placeholder="Escribe la nueva contraseña"
            className="w-full p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark"
          />
        </div>

        <button
          onClick={cambiarPassword}
          className="bg-dark hover:bg-black text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-colors font-bold w-full md:w-auto shadow-sm"
        >
          <KeyRound size={20} /> Actualizar Contraseña
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-danger/20">
        <h2 className="text-lg font-bold text-danger mb-2">Cerrar Sesión</h2>
        <p className="text-muted text-sm mb-4">Saldrás del sistema y se te pedirá tu contraseña para volver a entrar.</p>
        <button
          onClick={onLogout}
          className="bg-danger hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-colors font-bold w-full md:w-auto shadow-sm"
        >
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </div>

    </div>
  );
}