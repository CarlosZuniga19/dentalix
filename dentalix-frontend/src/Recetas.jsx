import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Printer, MessageCircle, User, X, Pill, Stethoscope, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom'; // <-- IMPORTACIONES AGREGADAS
import jsPDF from 'jspdf';
import { useAppContext } from './App'; // <-- PARA EL BOTON ATRÁS

export default function Recetas() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setBackAction } = useAppContext();

  const [listaPacientes, setListaPacientes] = useState([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [signosVitales, setSignosVitales] = useState({ peso: '', presion: '', temperatura: '', alergias: '' });
  
  // Lista dinámica de medicamentos
  const [medicamentos, setMedicamentos] = useState([
    { id: Date.now(), nombre: '', indicaciones: '' }
  ]);

  const API_URL = 'https://dentalix.lat/api.php';

  // NUEVO EFECTO: Atrapar el paciente si viene de otra pantalla
  useEffect(() => {
    if (location.state?.pacientePreseleccionado) {
      const p = location.state.pacientePreseleccionado;
      setPacienteSeleccionado(p);
      // Limpiamos el state para que no se quede pegado si el usuario recarga
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // NUEVO EFECTO: Botón de atrás (si viene de otra ruta y quiere volver)
  useEffect(() => {
    setBackAction(() => () => {
      navigate(-1); // Regresa a donde estaba (citas o pacientes)
    });
    return () => setBackAction(null);
  }, [setBackAction, navigate]);

  useEffect(() => {
    fetch(`${API_URL}?accion=pacientes`)
      .then(res => res.json())
      .then(data => setListaPacientes(data || []));
  }, []);
  
  const pacientesFiltrados = listaPacientes
    .filter(p => p.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase()))
    .slice(0, 8);

  const seleccionarPaciente = (p) => {
    setPacienteSeleccionado(p);
    setBusquedaPaciente('');
  };

  const agregarMedicamento = () => {
    setMedicamentos([...medicamentos, { id: Date.now(), nombre: '', indicaciones: '' }]);
  };

  const eliminarMedicamento = (id) => {
    if (medicamentos.length === 1) return; // Mínimo 1
    setMedicamentos(medicamentos.filter(m => m.id !== id));
  };

  const actualizarMedicamento = (id, campo, valor) => {
    setMedicamentos(medicamentos.map(m => m.id === id ? { ...m, [campo]: valor } : m));
  };

  const resetFormulario = () => {
    setPacienteSeleccionado(null);
    setMedicamentos([{ id: Date.now(), nombre: '', indicaciones: '' }]);
    setSignosVitales({ peso: '', presion: '', temperatura: '', alergias: '' });
    setFecha(new Date().toISOString().split('T')[0]);
  };

  // --- GENERACIÓN DEL PDF (DISEÑO MÉDICO FORMAL) ---
  const generarRecetaPDF = () => {
    if (!pacienteSeleccionado) {
      alert("Debes seleccionar un paciente primero.");
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a5'); // Formato A5 (Media carta) es el estándar para recetas
    
    // Extraer variables almacenadas
    const logo = localStorage.getItem('dentalix_logo');
    const clinica = localStorage.getItem('dentalix_nombre_app') || 'Clínica Dental';
    const cedula = localStorage.getItem('dentalix_cedula') || 'Pendiente';
    const universidad = localStorage.getItem('dentalix_universidad') || 'Pendiente';
    const firma = localStorage.getItem('dentalix_firma_doctor');
    
    // Obtener doctor por ID
    const currentUserId = localStorage.getItem('dentalix_usuario_id') || '1';
    let doctor = 'Dra. Hasdra Guerrero';
    if (currentUserId === '2') doctor = 'Dra. Valeria Ramírez';
    else if (currentUserId !== '1') doctor = localStorage.getItem('dentalix_user_name') || 'Médico Titular';

    // DISEÑO ESTRICTAMENTE BLANCO Y NEGRO/GRIS (Cero morado)
    doc.setTextColor(0, 0, 0);

    // 1. CABECERA
    if (logo) {
      doc.addImage(logo, 'PNG', 12, 10, 25, 25, undefined, 'FAST');
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(doctor, 136, 15, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(clinica, 136, 20, { align: "right" });
    doc.text(`Universidad: ${universidad}`, 136, 25, { align: "right" });
    doc.text(`Cédula Prof: ${cedula}`, 136, 30, { align: "right" });

    // Línea separadora superior gruesa
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(12, 38, 136, 38);

    // 2. DATOS DEL PACIENTE Y SIGNOS
    let yPos = 45;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Paciente:", 12, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(pacienteSeleccionado.nombre, 28, yPos);
    
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 100, yPos);
    doc.setFont("helvetica", "normal");
    
    // Formatear fecha
    const fechaObj = new Date(fecha + 'T00:00:00');
    const fechaStr = fechaObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(fechaStr, 112, yPos);

    yPos += 7;
    doc.setFontSize(8);
    doc.text(`Edad/Nac: ${pacienteSeleccionado.fecha_nacimiento || 'N/A'}`, 12, yPos);
    doc.text(`Peso: ${signosVitales.peso || '___'} kg`, 50, yPos);
    doc.text(`Temp: ${signosVitales.temperatura || '___'} °C`, 80, yPos);
    doc.text(`TA: ${signosVitales.presion || '___'}`, 110, yPos);
    
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Alergias reportadas: `, 12, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(signosVitales.alergias || 'Negadas', 42, yPos);

    // Línea separadora fina
    yPos += 4;
    doc.setLineWidth(0.2);
    doc.line(12, yPos, 136, yPos);

    // 3. SÍMBOLO Rx Y MEDICAMENTOS
    yPos += 12;
    doc.setFont("times", "italic");
    doc.setFontSize(22);
    doc.setTextColor(150, 150, 150); // Gris claro para el Rx
    doc.text("Rx", 12, yPos);
    
    yPos += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const medValidos = medicamentos.filter(m => m.nombre.trim() !== '');

    medValidos.forEach((m, idx) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. ${m.nombre}`, 12, yPos);
      yPos += 5;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lineasInd = doc.splitTextToSize(`${m.indicaciones}`, 120);
      doc.text(lineasInd, 16, yPos);
      
      yPos += (lineasInd.length * 4) + 4;

      // Salto de página si se llena (A5 es más corto)
      if (yPos > 170) {
        doc.addPage();
        yPos = 20;
      }
    });

    // 4. FIRMA Y PIE DE PÁGINA
    const firmY = 185; // Posición fija al fondo en formato A5
    
    if (firma) {
      doc.addImage(firma, 'PNG', 44, firmY - 22, 60, 25, undefined, 'FAST');
    }
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(44, firmY, 104, firmY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(doctor, 74, firmY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Firma del Médico", 74, firmY + 9, { align: "center" });

    // Guardar
    doc.save(`Receta_${pacienteSeleccionado.nombre.replace(/\s+/g, '_')}.pdf`);
  };

  const enviarPorWhatsApp = () => {
    if (!pacienteSeleccionado || !pacienteSeleccionado.telefono) {
      alert("Selecciona un paciente que tenga teléfono registrado.");
      return;
    }
    const medValidos = medicamentos.filter(m => m.nombre.trim() !== '');
    if (medValidos.length === 0) {
      alert("Agrega al menos un medicamento.");
      return;
    }

    let num = pacienteSeleccionado.telefono.replace(/\D/g, ''); 
    if (num.length === 10) num = '52' + num;

    let textoWa = `Hola ${pacienteSeleccionado.nombre}, te comparto las indicaciones de tu receta médica del día de hoy:\n\n`;
    
    medValidos.forEach((m, idx) => {
      textoWa += `*${idx + 1}. ${m.nombre}*\n📝 Indicaciones: ${m.indicaciones}\n\n`;
    });
    
    textoWa += `Recuerda seguir las indicaciones al pie de la letra. ¡Pronta recuperación!`;
    
    const url = `https://wa.me/${num}?text=${encodeURIComponent(textoWa)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      <div className="flex flex-col mb-2">
        <h1 className="text-2xl sm:text-3xl font-black text-dark mb-2">Recetas Médicas</h1>
        <p className="text-muted text-sm sm:text-base">
          Genera prescripciones formales, expide en PDF o envía indicaciones por WhatsApp.
        </p>
      </div>

      {/* --- BUSCADOR --- */}
      {!pacienteSeleccionado ? (
        <div className="bg-white dark:bg-surface p-6 rounded-3xl shadow-sm border-2 border-primary/20 relative">
          <h2 className="text-sm font-black text-primary uppercase mb-2">Buscar Paciente para Recetar</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Escribe el nombre del paciente..." 
              value={busquedaPaciente} 
              onChange={(e) => setBusquedaPaciente(e.target.value)} 
              className="w-full pl-10 pr-4 py-3 bg-surface dark:bg-background border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark text-sm font-medium" 
            />
            <Search className="absolute left-3.5 top-3.5 text-muted" size={18} />
          </div>
          {busquedaPaciente && (
            <div className="absolute left-6 right-6 mt-1 bg-white dark:bg-background border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-gray-50">
              {pacientesFiltrados.length > 0 ? pacientesFiltrados.map(p => (
                <button key={p.id} onClick={() => seleccionarPaciente(p)} className="w-full p-3 text-left hover:bg-primary/5 text-dark font-bold text-sm flex justify-between">
                  <span>{p.nombre}</span> <span className="text-xs text-muted font-normal">{p.telefono}</span>
                </button>
              )) : <div className="p-3 text-xs text-muted text-center">Ningún registro coincide.</div>}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-primary/10 p-4 rounded-2xl flex justify-between items-center border border-primary/20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full"><User size={20} className="text-primary"/></div>
            <div>
              <p className="text-xs font-bold text-primary uppercase">Paciente Seleccionado</p>
              <p className="text-lg font-black text-dark">{pacienteSeleccionado.nombre}</p>
            </div>
          </div>
          <button onClick={resetFormulario} className="text-danger hover:bg-danger/10 p-2 rounded-full transition-colors" title="Cambiar paciente">
            <X size={20} />
          </button>
        </div>
      )}

      {/* --- FORMULARIO DE RECETA --- */}
      {pacienteSeleccionado && (
        <div className="bg-white dark:bg-surface rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
          
          {/* SIGNOS VITALES */}
          <section>
            <h2 className="text-sm font-black text-muted uppercase mb-4 flex items-center gap-2">
              <Stethoscope size={16}/> Signos Vitales y Alergias (Opcional)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted ml-1 mb-1">Peso (kg)</label>
                <input type="text" placeholder="Ej. 75" value={signosVitales.peso} onChange={e=>setSignosVitales({...signosVitales, peso: e.target.value})} className="w-full p-2.5 bg-surface dark:bg-background border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted ml-1 mb-1">Presión (TA)</label>
                <input type="text" placeholder="Ej. 120/80" value={signosVitales.presion} onChange={e=>setSignosVitales({...signosVitales, presion: e.target.value})} className="w-full p-2.5 bg-surface dark:bg-background border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted ml-1 mb-1">Temp. (°C)</label>
                <input type="text" placeholder="Ej. 36.5" value={signosVitales.temperatura} onChange={e=>setSignosVitales({...signosVitales, temperatura: e.target.value})} className="w-full p-2.5 bg-surface dark:bg-background border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted ml-1 mb-1">Alergias</label>
                <input type="text" placeholder="Ej. Penicilina" value={signosVitales.alergias} onChange={e=>setSignosVitales({...signosVitales, alergias: e.target.value})} className="w-full p-2.5 bg-danger/5 border border-danger/20 rounded-xl text-sm text-danger font-medium placeholder:text-danger/40 focus:outline-none focus:border-danger" />
              </div>
            </div>
          </section>

          {/* MEDICAMENTOS */}
          <section>
            <h2 className="text-sm font-black text-muted uppercase mb-4 flex items-center gap-2 border-b pb-2">
              <Pill size={16}/> Prescripción Médica (Rx)
            </h2>
            
            <div className="space-y-4">
              {medicamentos.map((med, index) => (
                <div key={med.id} className="flex flex-col md:flex-row gap-3 bg-gray-50 dark:bg-background/50 p-3 rounded-2xl border border-gray-200 relative group">
                  <div className="md:w-1/3">
                    <label className="block text-xs font-bold text-dark mb-1">Medicamento / Presentación</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Ketorolaco 10mg" 
                      value={med.nombre}
                      onChange={(e) => actualizarMedicamento(med.id, 'nombre', e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-surface border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-dark mb-1">Indicaciones (Dosis, Frecuencia, Duración)</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Tomar 1 tableta cada 8 hrs por 3 días." 
                      value={med.indicaciones}
                      onChange={(e) => actualizarMedicamento(med.id, 'indicaciones', e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-surface border border-gray-200 rounded-xl text-sm outline-none focus:border-primary"
                    />
                  </div>
                  
                  {medicamentos.length > 1 && (
                    <button 
                      onClick={() => eliminarMedicamento(med.id)}
                      className="md:mt-6 bg-white dark:bg-surface border border-gray-200 hover:border-danger text-gray-400 hover:text-danger p-2.5 rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-sm"
                      title="Eliminar medicamento"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={agregarMedicamento}
              className="mt-4 bg-surface dark:bg-background hover:bg-gray-100 dark:hover:bg-gray-800 text-primary border border-primary/20 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 w-full transition-colors shadow-sm"
            >
              <Plus size={16} /> Agregar otro medicamento
            </button>
          </section>

          {/* ACCIONES FINALES */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <button 
              onClick={generarRecetaPDF}
              className="bg-dark hover:bg-black text-white p-4 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
            >
              <Printer size={20} /> Generar e Imprimir Receta PDF
            </button>
            <button 
              onClick={enviarPorWhatsApp}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
            >
              <MessageCircle size={20} /> Enviar Texto por WhatsApp
            </button>
          </section>

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 p-4 rounded-2xl flex gap-3 text-sm text-blue-800 dark:text-blue-300">
            <AlertCircle className="shrink-0 mt-0.5" size={18}/>
            <p>El PDF usará los datos de <b>Ajustes</b> (Cédula, Universidad, Firma). Asegúrate de tenerlos configurados para que la receta tenga validez legal.</p>
          </div>

        </div>
      )}
    </div>
  );
}