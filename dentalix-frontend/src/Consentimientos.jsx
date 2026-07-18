import { useState } from 'react';
import { Search, FileText, ExternalLink, ShieldAlert } from 'lucide-react';

const LISTA_CONSENTIMIENTOS = [
  "Gestantes",
  "Operatoria Dental",
  "Exodoncia Simple",
  "Endodoncia",
  "Exodoncia Terceros Molares",
  "Pulpectomía",
  "Pulpotomía",
  "Toma de Registros Clínicos y Radiográficos",
  "Prótesis Total Removible",
  "Gingivectomía",
  "Tallado de Dientes Pilares y Rehabilitación con Coronas y Prótesis Fija",
  "Ortodoncia",
  "Valoración Profilaxis y Detartraje",
  "Pediatría",
  "Aclaramiento Dental",
  "Armonización Orofacial",
  "Anestesia en Odontología",
  "Carillas",
  "Prótesis Parcial Removible",
  "Implantes Dentales",
  "Pacientes Comprometidos Sistémicamente"
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
    doc.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirDocumento = (nombreDocumento) => {
    // Apunta directamente a la carpeta public/consentimientos/
    const url = `/consentimientos/${nombreDocumento}.pdf`;
    window.open(url, '_blank');
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
            className="w-full pl-12 pr-4 py-4 bg-surface border border-gray-200 rounded-2xl focus:outline-none focus:border-primary text-dark text-sm sm:text-base font-medium transition-colors shadow-inner" 
          />
          <Search className="absolute left-4 top-4 text-muted" size={24} />
        </div>
      </div>

      {/* Cuadrícula de Documentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtrados.length > 0 ? (
          filtrados.map((doc, index) => (
            <button
              key={index}
              onClick={() => abrirDocumento(doc)}
              className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between items-start text-left group min-h-[140px]"
            >
              <div className="w-full flex justify-between items-start gap-3 mb-4">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                  <FileText size={28} />
                </div>
                <ExternalLink size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
              
              <h3 className="font-bold text-dark text-sm sm:text-base line-clamp-3 group-hover:text-primary transition-colors">
                {doc}
              </h3>
            </button>
          ))
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