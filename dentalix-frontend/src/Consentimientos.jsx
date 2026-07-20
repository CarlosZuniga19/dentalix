import { useState } from 'react';
import { 
  Search, FileText, ExternalLink, ShieldAlert, 
  Baby, Wrench, Scissors, Activity, AlertTriangle, 
  Zap, Camera, Layers, Droplet, Smile, Sparkles, 
  User, Syringe, Pill, HeartPulse, Stethoscope 
} from 'lucide-react';

const LISTA_CONSENTIMIENTOS = [
  { nombre: "Gestantes", icono: Baby, color: "text-pink-500", bg: "bg-pink-100", border: "hover:border-pink-300" },
  { nombre: "Operatoria Dental", icono: Wrench, color: "text-blue-500", bg: "bg-blue-100", border: "hover:border-blue-300" },
  { nombre: "Exodoncia Simple", icono: Scissors, color: "text-red-500", bg: "bg-red-100", border: "hover:border-red-300" },
  { nombre: "Endodoncia", icono: Activity, color: "text-purple-500", bg: "bg-purple-100", border: "hover:border-purple-300" },
  { nombre: "Exodoncia Terceros Molares", icono: AlertTriangle, color: "text-red-600", bg: "bg-red-100", border: "hover:border-red-400" },
  { nombre: "Pulpectomía", icono: Zap, color: "text-orange-500", bg: "bg-orange-100", border: "hover:border-orange-300" },
  { nombre: "Pulpotomía", icono: Zap, color: "text-orange-400", bg: "bg-orange-100", border: "hover:border-orange-300" },
  { nombre: "Toma de Registros Clínicos y Radiográficos", icono: Camera, color: "text-slate-500", bg: "bg-slate-100", border: "hover:border-slate-300" },
  { nombre: "Prótesis Total Removible", icono: Layers, color: "text-teal-500", bg: "bg-teal-100", border: "hover:border-teal-300" },
  { nombre: "Gingivectomía", icono: Droplet, color: "text-rose-500", bg: "bg-rose-100", border: "hover:border-rose-300" },
  { nombre: "Tallado de Dientes Pilares y Rehabilitación con Coronas y Prótesis Fija", icono: Wrench, color: "text-amber-500", bg: "bg-amber-100", border: "hover:border-amber-300" },
  { nombre: "Ortodoncia", icono: Smile, color: "text-indigo-500", bg: "bg-indigo-100", border: "hover:border-indigo-300" },
  { nombre: "Valoración Profilaxis y Detartraje", icono: Sparkles, color: "text-cyan-500", bg: "bg-cyan-100", border: "hover:border-cyan-300" },
  { nombre: "Pediatría", icono: Baby, color: "text-yellow-500", bg: "bg-yellow-100", border: "hover:border-yellow-300" },
  { nombre: "Aclaramiento Dental", icono: Sparkles, color: "text-yellow-400", bg: "bg-yellow-100", border: "hover:border-yellow-300" },
  { nombre: "Armonización Orofacial", icono: User, color: "text-fuchsia-500", bg: "bg-fuchsia-100", border: "hover:border-fuchsia-300" },
  { nombre: "Anestesia en Odontología", icono: Syringe, color: "text-blue-400", bg: "bg-blue-100", border: "hover:border-blue-300" },
  { nombre: "Carillas", icono: Smile, color: "text-cyan-400", bg: "bg-cyan-100", border: "hover:border-cyan-300" },
  { nombre: "Prótesis Parcial Removible", icono: Layers, color: "text-teal-400", bg: "bg-teal-100", border: "hover:border-teal-300" },
  { nombre: "Implantes Dentales", icono: Pill, color: "text-zinc-500", bg: "bg-zinc-100", border: "hover:border-zinc-300" },
  { nombre: "Pacientes Comprometidos Sistémicamente", icono: Stethoscope, color: "text-red-500", bg: "bg-red-100", border: "hover:border-red-300" }
];

export default function Consentimientos() {
  const [busqueda, setBusqueda] = useState('');
  
  // Verificación estricta: Solo el usuario administrador (ID 1) puede ver esto
  const currentUserId = localStorage.getItem('dentalix_usuario_id');

  if (currentUserId !== '1') {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center pt-24 pb-12 text-center px-4">
        <ShieldAlert size={80} className="text-danger mb-6 animate-pulse" />
        <h1 className="text-3xl font-black text-dark mb-4">Acceso Restringido</h1>
        <p className="text-muted text-lg">
          No tienes los permisos necesarios para visualizar o descargar los consentimientos informados de la clínica.
        </p>
      </div>
    );
  }

  // Filtrado de documentos según el buscador
  const filtrados = LISTA_CONSENTIMIENTOS.filter(doc => 
    doc.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirDocumento = (nombreDocumento) => {
    // Forzamos la ruta absoluta y agregamos ?nocache= para evitar la pantalla blanca
    const url = `${window.location.origin}/consentimientos/${encodeURIComponent(nombreDocumento)}.pdf?nocache=${new Date().getTime()}`;
    
    // Creamos un enlace nativo invisible
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-dark mb-2">Consentimientos Informados</h1>
        <p className="text-muted text-sm sm:text-base">
          Catálogo digital de documentos legales. Selecciona uno para visualizarlo, compartirlo o imprimirlo.
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar documento por nombre (ej. Ortodoncia, Endodoncia)..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 sm:py-4 bg-surface border border-gray-200 rounded-2xl focus:outline-none focus:border-primary text-dark text-sm sm:text-base font-medium transition-colors shadow-inner" 
          />
          <Search className="absolute left-4 top-3.5 sm:top-4 text-muted" size={24} />
        </div>
      </div>

      {/* Cuadrícula de Documentos Compacta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtrados.length > 0 ? (
          filtrados.map((doc, index) => {
            const Icono = doc.icono;
            return (
              <button
                key={index}
                onClick={() => abrirDocumento(doc.nombre)}
                className={`bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 ${doc.border} hover:shadow-md transition-all flex items-center gap-3 text-left group w-full`}
              >
                <div className={`${doc.bg} ${doc.color} p-2.5 rounded-xl shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icono size={22} />
                </div>
                
                <h3 className="font-bold text-dark text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-1">
                  {doc.nombre}
                </h3>

                <ExternalLink size={18} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
              </button>
            );
          })
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted border-2 border-dashed border-gray-200 rounded-3xl">
            <FileText size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">No se encontró ningún documento con ese nombre.</p>
          </div>
        )}
      </div>
    </div>
  );
}