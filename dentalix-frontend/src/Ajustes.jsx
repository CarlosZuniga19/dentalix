import { useState, useEffect } from 'react';
import { Save, LogOut, KeyRound, Moon, Sun, Upload, Image as ImageIcon, Stethoscope, PenTool } from 'lucide-react';

export default function Ajustes({ onLogout, onUpdateName, onUpdateLogo }) {
  const [nombreApp, setNombreApp] = useState('Dentalix');
  const [colorPrimary, setColorPrimary] = useState('#8B5CF6');
  const [logoBase64, setLogoBase64] = useState('');
  
  // --- NUEVOS ESTADOS LEGALES ---
  const [cedula, setCedula] = useState('');
  const [universidad, setUniversidad] = useState('');
  const [firmaDoctor, setFirmaDoctor] = useState('');

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
        if(data.logo) setLogoBase64(data.logo);
        if(data.colores_tema) {
          const colores = JSON.parse(data.colores_tema);
          setColorPrimary(colores.primary);
        }
        // Cargar datos legales
        if(data.cedula) setCedula(data.cedula);
        if(data.universidad) setUniversidad(data.universidad);
        if(data.firma_doctor) setFirmaDoctor(data.firma_doctor);
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

  const procesarImagenBase64 = (file, setter, maxWidth = 400, maxHeight = 400) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setter(canvas.toDataURL('image/png'));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => procesarImagenBase64(e.target.files[0], setLogoBase64);
  const handleFirmaUpload = (e) => procesarImagenBase64(e.target.files[0], setFirmaDoctor);

  const guardarAjustesGenerales = () => {
    fetch(`${API_URL}?accion=guardar_ajustes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nombre_app: nombreApp, 
        color_primary: colorPrimary, 
        logo: logoBase64,
        cedula: cedula,
        universidad: universidad,
        firma_doctor: firmaDoctor
      })
    })
    .then(res => res.json())
    .then(data => {
      document.documentElement.style.setProperty('--color-primary', colorPrimary);
      document.documentElement.style.setProperty('--color-primary-hover', oscurecerColor(colorPrimary));
      
      localStorage.setItem('dentalix_color_primario', colorPrimary);
      localStorage.setItem('dentalix_nombre_app', nombreApp);
      if (logoBase64) localStorage.setItem('dentalix_logo', logoBase64);
      
      // Guardar en caché para acceso rápido desde el módulo de Recetas
      localStorage.setItem('dentalix_cedula', cedula);
      localStorage.setItem('dentalix_universidad', universidad);
      if (firmaDoctor) localStorage.setItem('dentalix_firma_doctor', firmaDoctor);
      
      if(onUpdateName) onUpdateName(nombreApp);
      if(onUpdateLogo) onUpdateLogo(logoBase64);

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

      {/* --- SECCIÓN 1: APARIENCIA --- */}
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

          <div className="bg-surface border border-gray-200 p-4 rounded-2xl">
            <label className="block text-sm font-medium text-dark mb-2">Logo de la Clínica (Aparecerá en el menú y los PDF)</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {logoBase64 ? (
                  <img src={logoBase64} alt="Logo Previsto" className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon size={32} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 w-full">
                <label className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors w-full">
                  <Upload className="text-muted mb-1" size={20} />
                  <span className="text-xs font-bold text-muted text-center">Subir Nuevo Logo (PNG o JPG)</span>
                  <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleLogoUpload} className="hidden" />
                </label>
                {logoBase64 && (
                  <button onClick={() => setLogoBase64('')} className="text-xs text-danger hover:underline mt-2 font-bold w-full text-center sm:text-left">
                    Eliminar logo actual
                  </button>
                )}
              </div>
            </div>
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
      </div>

      {/* --- SECCIÓN 2: DATOS MÉDICOS --- */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="text-primary" size={22} />
          <h2 className="text-lg font-bold text-dark">Datos Médicos y Legales (Para Recetas)</h2>
        </div>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1 ml-2">Cédula Profesional</label>
              <input
                type="text"
                placeholder="Ej. 12345678"
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                className="w-full p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1 ml-2">Universidad de Egreso</label>
              <input
                type="text"
                placeholder="Ej. UNAM"
                value={universidad}
                onChange={e => setUniversidad(e.target.value)}
                className="w-full p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark"
              />
            </div>
          </div>

          <div className="bg-surface border border-gray-200 p-4 rounded-2xl mt-2">
            <label className="block text-sm font-medium text-dark mb-2">Firma Digital del Titular</label>
            <p className="text-xs text-muted mb-3">Se inyectará automáticamente en las recetas generadas en PDF. Sube una foto clara (preferiblemente sin fondo o en papel blanco).</p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-32 h-20 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm px-2">
                {firmaDoctor ? (
                  <img src={firmaDoctor} alt="Firma Doctor" className="max-w-full max-h-full object-contain" />
                ) : (
                  <PenTool size={28} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 w-full">
                <label className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors w-full">
                  <Upload className="text-muted mb-1" size={20} />
                  <span className="text-xs font-bold text-muted text-center">Subir Archivo de Firma</span>
                  <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFirmaUpload} className="hidden" />
                </label>
                {firmaDoctor && (
                  <button onClick={() => setFirmaDoctor('')} className="text-xs text-danger hover:underline mt-2 font-bold w-full text-center sm:text-left">
                    Eliminar firma actual
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={guardarAjustesGenerales}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-colors font-bold w-full md:w-auto shadow-sm"
        >
          <Save size={20} /> Guardar Ajustes
        </button>
      </div>

      {/* --- SECCIÓN 3: SEGURIDAD --- */}
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