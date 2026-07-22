import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Printer, MessageCircle, User, X, Pill, Stethoscope, AlertCircle, Calendar, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAppContext } from './App';

export default function Recetas() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setBackAction } = useAppContext();

  // Estados de Vistas y Datos
  const [vista, setVista] = useState('lista'); // 'lista' o 'nueva'
  const [vinoDeAfuera, setVinoDeAfuera] = useState(false);
  
  const [historialRecetas, setHistorialRecetas] = useState([]);
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  
  const [listaPacientes, setListaPacientes] = useState([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  // Estados del Formulario
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [signosVitales, setSignosVitales] = useState({ peso: '', presion: '', temperatura: '', alergias: '' });
  const [medicamentos, setMedicamentos] = useState([{ id: Date.now(), nombre: '', indicaciones: '' }]);

  const API_URL = 'https://dentalix.lat/api.php';

  const cargarHistorial = () => {
    fetch(`${API_URL}?accion=recetas_lista`)
      .then(res => res.json())
      .then(data => setHistorialRecetas(data || []));
  };

  useEffect(() => {
    cargarHistorial();
    fetch(`${API_URL}?accion=pacientes`)
      .then(res => res.json())
      .then(data => setListaPacientes(data || []));
  }, []);

  // Efecto para atrapar al paciente que viene de Citas o Pacientes
  useEffect(() => {
    if (location.state?.pacientePreseleccionado) {
      setPacienteSeleccionado(location.state.pacientePreseleccionado);
      setVista('nueva');
      setVinoDeAfuera(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Efecto del Botón Atrás Global
  useEffect(() => {
    if (vista === 'nueva') {
      setBackAction(() => () => {
        if (vinoDeAfuera) {
          navigate(-1);
        } else {
          setVista('lista');
          resetFormulario();
        }
      });
    } else {
      setBackAction(null);
    }
    return () => setBackAction(null);
  }, [vista, vinoDeAfuera, setBackAction, navigate]);

  // --- FUNCIONES UNIVERSALES (Sirven para recetas nuevas o del historial) ---
  const generarPDFNativo = (datosPaciente, fechaReceta, signosObj, medsArray) => {
    const doc = new jsPDF('p', 'mm', 'a5'); 
    
    const logo = localStorage.getItem('dentalix_logo');
    const clinica = localStorage.getItem('dentalix_nombre_app') || 'Clínica Dental';
    const cedula = localStorage.getItem('dentalix_cedula') || 'Pendiente';
    const universidad = localStorage.getItem('dentalix_universidad') || 'Pendiente';
    const firma = localStorage.getItem('dentalix_firma_doctor');
    
    const currentUserId = localStorage.getItem('dentalix_usuario_id') || '1';
    let doctor = 'Dra. Hasdra Guerrero';
    if (currentUserId === '2') doctor = 'Dra. Valeria Ramírez';
    else if (currentUserId !== '1') doctor = localStorage.getItem('dentalix_user_name') || 'Médico Titular';

    doc.setTextColor(0, 0, 0);

    if (logo) doc.addImage(logo, 'PNG', 12, 10, 25, 25, undefined, 'FAST');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(doctor, 136, 15, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(clinica, 136, 20, { align: "right" });
    doc.text(`Universidad: ${universidad}`, 136, 25, { align: "right" });
    doc.text(`Cédula Prof: ${cedula}`, 136, 30, { align: "right" });

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(12, 38, 136, 38);

    let yPos = 45;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Paciente:", 12, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(datosPaciente.nombre || datosPaciente.paciente, 28, yPos);
    
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 100, yPos);
    doc.setFont("helvetica", "normal");
    
    const fechaObj = new Date(fechaReceta + 'T00:00:00');
    doc.text(fechaObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }), 112, yPos);

    yPos += 7;
    doc.setFontSize(8);
    doc.text(`Edad/Nac: ${datosPaciente.fecha_nacimiento || 'N/A'}`, 12, yPos);
    doc.text(`Peso: ${signosObj.peso || '___'} kg`, 50, yPos);
    doc.text(`Temp: ${signosObj.temperatura || '___'} °C`, 80, yPos);
    doc.text(`TA: ${signosObj.presion || '___'}`, 110, yPos);
    
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Alergias reportadas: `, 12, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(signosObj.alergias || 'Negadas', 42, yPos);

    yPos += 4;
    doc.setLineWidth(0.2);
    doc.line(12, yPos, 136, yPos);

    yPos += 12;
    doc.setFont("times", "italic");
    doc.setFontSize(22);
    doc.setTextColor(150, 150, 150);
    doc.text("Rx", 12, yPos);
    
    yPos += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    medsArray.forEach((m, idx) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. ${m.nombre}`, 12, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lineasInd = doc.splitTextToSize(`${m.indicaciones}`, 120);
      doc.text(lineasInd, 16, yPos);
      yPos += (lineasInd.length * 4) + 4;

      if (yPos > 170) {
        doc.addPage();
        yPos = 20;
      }
    });

    const firmY = 185; 
    if (firma) doc.addImage(firma, 'PNG', 44, firmY - 22, 60, 25, undefined, 'FAST');
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(44, firmY, 104, firmY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(doctor, 74, firmY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Firma del Médico", 74, firmY + 9, { align: "center" });

    const nombreArchivo = datosPaciente.nombre || datosPaciente.paciente;
    doc.save(`Receta_${nombreArchivo.replace(/\s+/g, '_')}.pdf`);
  };

  const enviarWANativo = (datosPaciente, medsArray) => {
    if (!datosPaciente.telefono) {
      alert("Este paciente no tiene teléfono registrado.");
      return;
    }
    let num = datosPaciente.telefono.replace(/\D/g, ''); 
    if (num.length === 10) num = '52' + num;

    const nombre = datosPaciente.nombre || datosPaciente.paciente;
    let textoWa = `Hola ${nombre}, te comparto las indicaciones de tu receta médica:\n\n`;
    
    medsArray.forEach((m, idx) => {
      textoWa += `*${idx + 1}. ${m.nombre}*\n📝 Indicaciones: ${m.indicaciones}\n\n`;
    });
    
    textoWa += `Recuerda seguir las indicaciones al pie de la letra. ¡Pronta recuperación!`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(textoWa)}`, '_blank');
  };

  // --- LÓGICA DE GUARDADO EN BASE DE DATOS ---
  const guardarYProcesar = async (accion) => {
    if (!pacienteSeleccionado) { alert("Selecciona un paciente."); return; }
    
    const medValidos = medicamentos.filter(m => m.nombre.trim() !== '');
    if (medValidos.length === 0) { alert("Agrega al menos un medicamento."); return; }

    const payload = {
      id_paciente: pacienteSeleccionado.id,
      fecha: fecha,
      signos_vitales: signosVitales,
      medicamentos: medValidos
    };

    try {
      const res = await fetch(`${API_URL}?accion=guardar_receta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        if (accion === 'pdf') generarPDFNativo(pacienteSeleccionado, fecha, signosVitales, medValidos);
        if (accion === 'wa') enviarWANativo(pacienteSeleccionado, medValidos);
        
        cargarHistorial(); // Refrescamos la lista
        setVista('lista');
        resetFormulario();
      } else {
        alert("Error al guardar la receta en el historial.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    }
  };

  // Acciones Rápidas del Historial
  const reImprimirHistorial = (receta) => {
    const signos = JSON.parse(receta.signos_vitales || '{}');
    const meds = JSON.parse(receta.medicamentos || '[]');
    generarPDFNativo(receta, receta.fecha, signos, meds);
  };

  const reEnviarWAHistorial = (receta) => {
    const meds = JSON.parse(receta.medicamentos || '[]');
    enviarWANativo(receta, meds);
  };

  // Helpers Formulario
  const resetFormulario = () => {
    setPacienteSeleccionado(null);
    setMedicamentos([{ id: Date.now(), nombre: '', indicaciones: '' }]);
    setSignosVitales({ peso: '', presion: '', temperatura: '', alergias: '' });
    setFecha(new Date().toISOString().split('T')[0]);
    setVinoDeAfuera(false);
  };

  const agregarMedicamento = () => setMedicamentos([...medicamentos, { id: Date.now(), nombre: '', indicaciones: '' }]);
  const eliminarMedicamento = (id) => { if (medicamentos.length > 1) setMedicamentos(medicamentos.filter(m => m.id !== id)); };
  const actualizarMedicamento = (id, campo, valor) => setMedicamentos(medicamentos.map(m => m.id === id ? { ...m, [campo]: valor } : m));

  const pacientesFiltrados = listaPacientes.filter(p => p.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase())).slice(0, 8);
  const historialFiltrado = historialRecetas.filter(r => r.paciente.toLowerCase().includes(busquedaHistorial.toLowerCase()));

  // =========================================================
  // VISTA 1: HISTORIAL DE RECETAS (LISTA)
  // =========================================================
  if (vista === 'lista') {
    return (
      <div className="max-w-4xl mx-auto pb-24 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark mb-1">Historial de Recetas</h1>
            <p className="text-muted text-sm">Registro de todas las prescripciones expedidas en la clínica.</p>
          </div>
          <button onClick={() => setVista('nueva')} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-sm shrink-0 w-full sm:w-auto justify-center">
            <Plus size={18} /> Nueva Receta
          </button>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar recetas por nombre del paciente..." 
            value={busquedaHistorial} 
            onChange={(e) => setBusquedaHistorial(e.target.value)} 
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-surface border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:border-primary text-dark text-sm font-medium" 
          />
          <Search className="absolute left-4 top-4 text-muted" size={20} />
        </div>

        <div className="grid gap-3">
          {historialFiltrado.length > 0 ? (
            historialFiltrado.map(receta => {
              const meds = JSON.parse(receta.medicamentos || '[]');
              return (
                <div key={receta.id} className="bg-white dark:bg-surface p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 p-3 rounded-xl shrink-0">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark text-base">{receta.paciente}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted font-medium mt-1">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {receta.fecha}</span>
                        <span className="flex items-center gap-1"><Pill size={12}/> {meds.length} medicamento(s)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 sm:shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    <button onClick={() => reImprimirHistorial(receta)} className="flex-1 sm:flex-none bg-surface hover:bg-gray-100 dark:bg-background dark:hover:bg-gray-800 text-dark p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-gray-200 shadow-sm">
                      <Printer size={16}/> Imprimir
                    </button>
                    <button onClick={() => reEnviarWAHistorial(receta)} className="flex-1 sm:flex-none bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#20bd5a] p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#25D366]/30 shadow-sm">
                      <MessageCircle size={16}/> Enviar
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-12 bg-white dark:bg-surface rounded-3xl border-2 border-dashed border-gray-200 text-muted">
              <Pill size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No se encontraron recetas en el historial.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // VISTA 2: FORMULARIO DE NUEVA RECETA
  // =========================================================
  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col mb-2">
        <h1 className="text-2xl sm:text-3xl font-black text-dark mb-2 flex items-center gap-2">
          <Pill className="text-primary"/> Expedir Nueva Receta
        </h1>
        <p className="text-muted text-sm sm:text-base">
          Genera prescripciones formales. Una vez expedida, se guardará en el historial del paciente.
        </p>
      </div>

      {/* BUSCADOR DE PACIENTE */}
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
                <button key={p.id} onClick={() => { setPacienteSeleccionado(p); setBusquedaPaciente(''); }} className="w-full p-3 text-left hover:bg-primary/5 text-dark font-bold text-sm flex justify-between">
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
              <p className="text-lg font-black text-dark">{pacienteSeleccionado.nombre || pacienteSeleccionado.paciente}</p>
            </div>
          </div>
          <button onClick={resetFormulario} className="text-danger hover:bg-danger/10 p-2 rounded-full transition-colors" title="Cambiar paciente">
            <X size={20} />
          </button>
        </div>
      )}

      {/* FORMULARIO */}
      {pacienteSeleccionado && (
        <div className="bg-white dark:bg-surface rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
          
          <section>
            <h2 className="text-sm font-black text-muted uppercase mb-4 flex items-center gap-2">
              <Stethoscope size={16}/> Signos Vitales y Alergias (Opcional)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted ml-1 mb-1">Peso (kg)</label>
                <input type="text" value={signosVitales.peso} onChange={e=>setSignosVitales({...signosVitales, peso: e.target.value})} className="w-full p-2.5 bg-surface dark:bg-background border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted ml-1 mb-1">Presión (TA)</label>
                <input type="text" value={signosVitales.presion} onChange={e=>setSignosVitales({...signosVitales, presion: e.target.value})} className="w-full p-2.5 bg-surface dark:bg-background border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted ml-1 mb-1">Temp. (°C)</label>
                <input type="text" value={signosVitales.temperatura} onChange={e=>setSignosVitales({...signosVitales, temperatura: e.target.value})} className="w-full p-2.5 bg-surface dark:bg-background border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted ml-1 mb-1">Alergias</label>
                <input type="text" value={signosVitales.alergias} onChange={e=>setSignosVitales({...signosVitales, alergias: e.target.value})} className="w-full p-2.5 bg-danger/5 border border-danger/20 rounded-xl text-sm text-danger font-medium" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-black text-muted uppercase mb-4 flex items-center gap-2 border-b pb-2">
              <Pill size={16}/> Prescripción Médica (Rx)
            </h2>
            <div className="space-y-4">
              {medicamentos.map((med, index) => (
                <div key={med.id} className="flex flex-col md:flex-row gap-3 bg-gray-50 dark:bg-background/50 p-3 rounded-2xl border border-gray-200 relative group">
                  <div className="md:w-1/3">
                    <label className="block text-xs font-bold text-dark mb-1">Medicamento / Presentación</label>
                    <input type="text" placeholder="Ej. Ketorolaco 10mg" value={med.nombre} onChange={(e) => actualizarMedicamento(med.id, 'nombre', e.target.value)} className="w-full p-2.5 bg-white dark:bg-surface border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-dark mb-1">Indicaciones</label>
                    <input type="text" placeholder="Ej. Tomar 1 cada 8 hrs por 3 días." value={med.indicaciones} onChange={(e) => actualizarMedicamento(med.id, 'indicaciones', e.target.value)} className="w-full p-2.5 bg-white dark:bg-surface border border-gray-200 rounded-xl text-sm outline-none focus:border-primary" />
                  </div>
                  {medicamentos.length > 1 && (
                    <button onClick={() => eliminarMedicamento(med.id)} className="md:mt-6 bg-white border border-gray-200 text-gray-400 hover:text-danger p-2.5 rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-sm"><Trash2 size={18} /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={agregarMedicamento} className="mt-4 bg-surface text-primary border border-primary/20 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 w-full transition-colors shadow-sm">
              <Plus size={16} /> Agregar otro medicamento
            </button>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <button onClick={() => guardarYProcesar('pdf')} className="bg-dark hover:bg-black text-white p-4 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2">
              <Printer size={20} /> Guardar e Imprimir PDF
            </button>
            <button onClick={() => guardarYProcesar('wa')} className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2">
              <MessageCircle size={20} /> Guardar y Enviar WhatsApp
            </button>
          </section>

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 p-4 rounded-2xl flex gap-3 text-sm text-blue-800 dark:text-blue-300">
            <AlertCircle className="shrink-0 mt-0.5" size={18}/>
            <p>Al hacer clic en generar, esta receta quedará almacenada en la base de datos de la clínica para consultas futuras.</p>
          </div>
        </div>
      )}
    </div>
  );
}