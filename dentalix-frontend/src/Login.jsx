import { useState } from 'react';
import { Stethoscope } from 'lucide-react';

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    // Conectar a la API con la acción de login
    fetch('https://dentalix.lat/api.php?accion=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    })
    .then(res => res.json())
    .then(data => {
      setCargando(false);
      if (data.success) {
        // MODIFICADO: Pasamos el usuario_id devuelto por la API a App.jsx para fijar la sesión
        onLogin(data.usuario_id); 
      } else {
        setError(data.mensaje);
      }
    })
    .catch(() => {
      setCargando(false);
      setError('Error de conexión con el servidor.');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-sm border border-gray-100">
        
        {/* Logo y Título */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-3xl font-bold text-dark">Dentalix</h1>
          <p className="text-muted text-sm mt-1">Gestión Clínica</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-sm text-center p-3 rounded-xl mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1 ml-2">Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark"
              placeholder="Ingresa tu usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1 ml-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-full font-bold transition-colors shadow-sm mt-4 disabled:opacity-70"
          >
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}