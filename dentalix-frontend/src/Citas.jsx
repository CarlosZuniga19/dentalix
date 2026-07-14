import { useState, useEffect } from 'react';
import { Plus, X, Check, FileDown, MessageCircle, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';

const ANAMNESIS_ITEMS = [ "Dolor en el pecho", "Enfermedades del corazón", "Algún problema respiratorio", "Asma o fiebre de heno", "Alergias", "Desmayos, convulsiones o epilepsia", "Diabetes", "Hepatitis o enfermedad del hígado", "Artritis - reumatismo", "Úlcera gástrica", "Dolor abdominal", "Dolor de cabeza", "Dolor muscular", "Fiebre frecuente", "Mareos vértigo", "Enfermedad del riñón", "Tuberculosis", "Problemas de presión arterial", "Anemia", "Hemofilia", "Tuvo hemorragias después de extracciones", "Enfermedad mental o problemas emocionales", "Radioterapia o tratamiento para el cáncer", "Enfermedades por transmisión sexual", "Problemas de tiroides", "Enfermedades de la piel", "Ha tenido un crecimiento anormal o tumoración", "Delirio o estado confusional", "Tabaquismo actual", "Alcoholismo actual", "Alcoholismo en el pasado", "¿Ha consumido drogas?", "¿Le han practicado exámenes para detectar SIDA?", "¿Está usted embarazada?", "¿Ya se presentó la menopausia?", "¿Su médico autoriza el tratamiento dental?", "¿Está usted amamantando?", "¿Utiliza algún método anticonceptivo?", "Varicela", "Sarampión", "Rubéola", "Paperas" ];
const DIENTES_ADULTOS = [ 18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28, 48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38 ];

export default function Citas() {
  const [vista, setVista] = useState('lista'); 
  const [citas, setCitas] = useState([]);
  const [pacientesExistentes, setPacientesExistentes] = useState([]);
  const [catalogoProcedimientos, setCatalogoProcedimientos] = useState([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const API_URL = 'https://dentalix.lat/api.php';

  const [idCitaEditando, setIdCitaEditando] = useState(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [profesional, setProfesional] = useState('Dra. Hasdra Guerrero');
  const [estadoCita, setEstadoCita] = useState(['programado']);
  const [datosPaciente, setDatosPaciente] = useState({ nombre: '', telefono: '', notas: '', fechaNacimiento: '', direccion: '', ocupacion: '', motivo: '' });
  const [procedimientosSeleccionados, setProcedimientosSeleccionados] = useState([]);
  const [abono, setAbono] = useState('');
  const [anamnesis, setAnamnesis] = useState(ANAMNESIS_ITEMS.reduce((acc, _, idx) => ({ ...acc, [idx]: { estado: '?', detalle: '' } }), {}));

  // Función para recargar la lista de citas por debajo del agua
  const recargarCitas = () => {
    fetch(`${API_URL}?accion=citas_lista`)
      .then(res => res.json())
      .then(data => {
        const citasCargadas = data || [];
        const citasAgrupadas = citasCargadas.reduce((acc, cita) => {
          const claveUnica = `${cita.id_paciente}-${cita.fecha}`;
          if (!acc[claveUnica]) {
            acc[claveUnica] = { ...cita, esMultiple: false };
          } else {
            acc[claveUnica].esMultiple = true;
          }
          return acc;
        }, {});
        setCitas(Object.values(citasAgrupadas));
      });
  };

  // ================= 1. CARGA INICIAL =================
  useEffect(() => {
    recargarCitas();
    fetch(`${API_URL}?accion=pacientes`).then(res => res.json()).then(data => setPacientesExistentes(data || []));
    fetch(`${API_URL}?accion=procedimientos`).then(res => res.json()).then(data => setCatalogoProcedimientos(data || []));

    // LÓGICA DE NAVEGACIÓN Y LIMPIEZA DE ROUTER
    if (location.state?.citaIdParaEditar) {
      // Se resolvió en un useEffect separado o aquí al inicio, pero requerimos que el fetch termine primero
      fetch(`${API_URL}?accion=citas_lista`).then(res => res.json()).then(data => {
        const citaEncontrada = data.find(c => Number(c.id_cita) === Number(location.state.citaIdParaEditar));
        if (citaEncontrada) {
          abrirEdicionCita(citaEncontrada);
        }
        // Borramos el recuerdo para que el botón "Cancelar" sí funcione
        navigate(location.pathname, { replace: true, state: {} });
      });
    } else if (location.state?.pacientePreseleccionado) {
      const p = location.state.pacientePreseleccionado;
      setPacienteSeleccionado(p);
      setDatosPaciente({
        id: p.id, 
        nombre: p.nombre || '', 
        telefono: p.telefono || '', 
        notas: p.notas || '',
        fechaNacimiento: p.fechaNacimiento || p.fecha_nacimiento || '', 
        direccion: p.direccion || '',
        ocupacion: p.ocupacion || '', 
        motivo: p.motivo || p.motivo_consulta || ''
      });
      setVista('nueva_cita');
      // Borramos el recuerdo para que el botón "Cancelar" sí funcione
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [vista]);

  const pacientesFiltrados = pacientesExistentes.filter(p => p.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase())).slice(0, 10);

  const resetFormulario = () => {
    setPacienteSeleccionado(null);
    setIdCitaEditando(null);
    setDatosPaciente({ nombre: '', telefono: '', notas: '', fechaNacimiento: '', direccion: '', ocupacion: '', motivo: '' });
    setFecha(''); setHora(''); setEstadoCita(['programado']);
    setProcedimientosSeleccionados([]); setAbono('');
    setBusquedaPaciente('');
  };

  const seleccionarPacienteExistente = (p) => {
    setPacienteSeleccionado(p);
    setDatosPaciente({
      id: p.id, nombre: p.nombre, telefono: p.telefono, notas: p.notas || '',
      fechaNacimiento: p.fecha_nacimiento || '', direccion: p.direccion || '',
      ocupacion: p.ocupacion || '', motivo: p.motivo_consulta || ''
    });
    setBusquedaPaciente('');
  };

  // ================= 2. EXTRACCIÓN Y AGRUPACIÓN DE PROCEDIMIENTOS AL EDITAR =================
  const abrirEdicionCita = (c) => {
    resetFormulario();
    setIdCitaEditando(c.id_cita);
    setFecha(c.fecha);
    setHora(c.hora);
    setEstadoCita(c.estado ? c.estado.split(',') : ['programado']);
    
    const objPaciente = {
      id: c.id_paciente, nombre: c.paciente, telefono: c.telefono || '',
      fechaNacimiento: c.fecha_nacimiento || '', direccion: c.direccion || '',
      ocupacion: c.ocupacion || '', motivo: c.motivo_consulta || '', notas: c.notes || ''
    };
    
    setPacienteSeleccionado(objPaciente);
    setDatosPaciente(objPaciente);

    fetch(`${API_URL}?accion=procedimientos_paciente&id_paciente=${c.id_paciente}`)
      .then(res => res.json())
      .then(data => {
        const procsDeEstaCita = (data || []).filter(p => p.fecha_procedimiento === c.fecha);
        
        // Magia: Agrupamos las filas idénticas de la DB en cantidades para la interfaz visual
        const procsAgrupados = procsDeEstaCita.reduce((acc, proc) => {
          const existente = acc.find(p => p.id === proc.id);
          if (existente) {
            existente.cantidad += 1;
          } else {
            acc.push({ ...proc, cantidad: 1 });
          }
          return acc;
        }, []);

        setProcedimientosSeleccionados(procsAgrupados);
      });

    setVista('nueva_cita');
  };

  const guardarCitaCompleta = () => {
    if (!datosPaciente.nombre) { alert("Debes seleccionar o escribir un paciente."); return; }
    if (!fecha || !hora) { alert("Fecha y hora son obligatorios."); return; }

    // Magia: Desempaquetamos las cantidades antes de mandarlas a PHP
    // Si el usuario eligió "4", creamos 4 filas idénticas en el arreglo
    const procedimientosExpandidos = [];
    procedimientosSeleccionados.forEach(p => {
      for (let i = 0; i < (p.cantidad || 1); i++) {
        procedimientosExpandidos.push({
          id: p.id,
          precio_base: p.precio_base,
          // Ya no hay inputs individuales, se fuerza la fecha y hora general de la cita
          fecha_procedimiento: fecha,
          hora_procedimiento: hora 
        });
      }
    });

    const payload = {
      paciente: datosPaciente,
      cita: { id: idCitaEditando, fecha, hora, estado: estadoCita },
      procedimientos: procedimientosExpandidos 
    };

    fetch(`${API_URL}?accion=guardar_paciente_cita`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Cita y procedimientos guardados exitosamente.");
        resetFormulario();
        recargarCitas(); // Refresca en el fondo
        // NO cambiamos setVista('lista'), dejamos al usuario en 'nueva_cita' limpia
      } else { alert("Error: " + data.error); }
    });
  };

  const totalProcedimientos = procedimientosSeleccionados.reduce((sum, proc) => sum + (parseFloat(proc.precio_base || 0) * (proc.cantidad || 1)), 0);
  const totalAPagar = totalProcedimientos - (parseFloat(abono) || 0);

  // ================= 3. GENERADOR DE PDF =================
  const generarPresupuestoPDF = () => {
    const doc = new jsPDF();
    const primaryColor = [139, 92, 246]; 
    
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("PRESUPUESTO DENTAL", 14, 23);
    
    doc.setFontSize(10);
    doc.text("DENTALIX CLÍNICA", 155, 23);

    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.text("PACIENTE", 14, 48);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${datosPaciente.nombre || '_________________'}`, 14, 56);
    doc.text(`Dirección: ${datosPaciente.direccion || '_________________'}`, 14, 62);
    doc.text(`Teléfono: ${datosPaciente.telefono || '_________________'}`, 110, 56);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 110, 62);

    const tableData = procedimientosSeleccionados.map((p, idx) => [
      (idx + 1).toString().padStart(2, '0'),
      p.nombre,
      p.cantidad.toString(),
      `$${parseFloat(p.precio_base).toFixed(2)}`,
      `$${(parseFloat(p.precio_base) * (p.cantidad || 1)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['No.', 'Descripción del Servicio', 'Cant.', 'Costo Unit.', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 9 }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setFillColor(245, 245, 245); 
    doc.rect(120, finalY - 5, 75, 25, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 125, finalY);
    doc.text(`$${totalProcedimientos.toFixed(2)}`, 165, finalY);
    
    doc.setFillColor(...primaryColor);
    doc.rect(120, finalY + 5, 75, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL:`, 125, finalY + 11.5);
    doc.text(`$${totalProcedimientos.toFixed(2)}`, 165, finalY + 11.5);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text("Gracias por elegir nuestra clínica.", 14, finalY + 10);
    
    doc.line(130, finalY + 45, 185, finalY + 45);
    doc.text("Firma del Paciente", 143, finalY + 50);

    doc.save(`Presupuesto_${datosPaciente.nombre || 'Paciente'}.pdf`);
  };

  // ================= VISTAS =================
  if (vista === 'lista') {
    return (
      <div className="max-w-4xl mx-auto pb-6">
        <div className="flex justify-between items-center mb-6">
          <div><h1 className="text-2xl font-bold text-dark">Citas Pendientes</h1></div>
          <button onClick={() => { resetFormulario(); setVista('nueva_cita'); }} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-medium shadow-sm">
            <Plus size={20} /> Agregar Nueva Cita
          </button>
        </div>

        <div className="grid gap-3">
          {citas.length > 0 ? (
            citas.map(c => (
              <div 
                key={c.id_cita} 
                onClick={() => abrirEdicionCita(c)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:bg-surface/60 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
              >
                {c.esMultiple && <div className="absolute top-0 left-0 w-1 h-full bg-primary" title="Múltiples procedimientos en esta fecha"></div>}
                
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors p-3 rounded-xl font-bold text-center min-w-[70px] text-xs">
                    <div className="text-sm font-black">{c.hora.substring(0,5)}</div>
                    <div>{c.fecha}</div>
                  </div>
                  <div>
                    <h3 className="font-bold text-dark text-base flex items-center gap-2">
                      {c.paciente}
                      {c.esMultiple && <span className="bg-surface text-primary border border-primary/20 text-[10px] px-2 py-0.5 rounded-full">Cita Múltiple</span>}
                    </h3>
                    <p className="text-xs text-muted">{c.telefono || 'Sin teléfono'}</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-700 font-bold text-xs px-3 py-1.5 rounded-full uppercase">
                  {c.estado || 'Programada'}
                </span>
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-2xl border text-center text-muted">No hay citas programadas.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      <button onClick={() => { resetFormulario(); navigate('/citas', { replace: true, state: {} }); setVista('lista'); }} className="text-muted hover:text-dark font-medium flex items-center gap-2">
        <X size={18} /> Cancelar y regresar a la lista
      </button>

      {/* Buscador Superior */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-primary/20 relative">
        <h2 className="text-sm font-black text-primary uppercase mb-2">Buscador de Pacientes Registrados</h2>
        <div className="relative">
          <input type="text" placeholder="Escribe el nombre para buscar..." value={busquedaPaciente} onChange={(e) => setBusquedaPaciente(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 rounded-full focus:outline-none focus:border-primary text-dark text-sm font-medium" />
          <Search className="absolute left-3.5 top-3.5 text-muted" size={18} />
        </div>
        {busquedaPaciente && (
          <div className="absolute left-6 right-6 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-gray-50">
            {pacientesFiltrados.length > 0 ? pacientesFiltrados.map(p => (
              <button key={p.id} onClick={() => seleccionarPacienteExistente(p)} className="w-full p-3 text-left hover:bg-primary/5 text-dark font-bold text-sm flex justify-between">
                <span>{p.nombre}</span> <span className="text-xs text-muted font-normal">{p.telefono}</span>
              </button>
            )) : <div className="p-3 text-xs text-muted text-center">Ningún registro coincide.</div>}
          </div>
        )}
        {pacienteSeleccionado && (
          <div className="mt-3 bg-primary/10 p-3 rounded-xl flex justify-between items-center border border-primary/20">
            <span className="text-xs font-bold text-primary">Paciente enlazado: <strong className="text-sm">{pacienteSeleccionado.nombre}</strong></span>
            <button onClick={() => { setPacienteSeleccionado(null); setDatosPaciente({ nombre: '', telefono: '', notas: '', fechaNacimiento: '', direccion: '', ocupacion: '', motivo: '' }); }} className="text-danger hover:underline text-xs font-bold">Desenlazar</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-muted mb-1 ml-2">Fecha de Cita</label><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full p-3 bg-surface border border-gray-200 rounded-full text-dark" /></div>
          
          {/* AÑADIDO: step="900" obliga al selector nativo a mostrar intervalos de 15 minutos */}
          <div><label className="block text-sm font-medium text-muted mb-1 ml-2">Hora</label><input type="time" step="900" value={hora} onChange={e => setHora(e.target.value)} className="w-full p-3 bg-surface border border-gray-200 rounded-full text-dark" /></div>
          
          <div><label className="block text-sm font-medium text-muted mb-1 ml-2">Profesional</label><input type="text" value={profesional} onChange={e => setProfesional(e.target.value)} className="w-full p-3 bg-surface border border-gray-200 rounded-full text-dark" /></div>
        </section>

        <section className="p-4 bg-surface rounded-2xl border border-primary/20">
          <label className="block text-sm font-bold text-primary mb-2">Estado de la Cita</label>
          <select multiple value={estadoCita} onChange={e => setEstadoCita(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-dark" size="5">
            <option value="programado">Programado</option>
            <option value="solicitado">Solicitado</option>
            <option value="llegó">El paciente llegó</option>
            <option value="no_presento">No se presentó</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </section>

        <section>
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2">{idCitaEditando ? "Editando Datos del Paciente" : (pacienteSeleccionado ? "Datos del Paciente Seleccionado" : "Paciente Nuevo")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nombre completo" value={datosPaciente.nombre} onChange={e=>setDatosPaciente({...datosPaciente, nombre: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl font-bold" />
            <input type="tel" placeholder="Teléfono" value={datosPaciente.telefono} onChange={e=>setDatosPaciente({...datosPaciente, telefono: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl" />
            <input type="date" placeholder="Fecha Nacimiento" value={datosPaciente.fechaNacimiento} onChange={e=>setDatosPaciente({...datosPaciente, fechaNacimiento: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl" />
            <input type="text" placeholder="Ocupación" value={datosPaciente.ocupacion} onChange={e=>setDatosPaciente({...datosPaciente, ocupacion: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl" />
            <input type="text" placeholder="Dirección" value={datosPaciente.direccion} onChange={e=>setDatosPaciente({...datosPaciente, direccion: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl md:col-span-2" />
            <textarea placeholder="Motivo de consulta" value={datosPaciente.motivo} onChange={e=>setDatosPaciente({...datosPaciente, motivo: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl md:col-span-2" rows="2"></textarea>
          </div>
        </section>

        {/* --- PROCEDIMIENTOS ASIGNADOS CON SELECTOR DE CANTIDAD --- */}
        <section>
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2 flex justify-between items-center">
            Procedimientos Programados
            {procedimientosSeleccionados.length > 0 && <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-black">{procedimientosSeleccionados.length}</span>}
          </h2>
          
          <div className="bg-surface p-4 rounded-xl border border-gray-200 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {catalogoProcedimientos.map(proc => (
              <label key={proc.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                <input type="checkbox" checked={!!procedimientosSeleccionados.find(p => p.id === proc.id)} onChange={() => {
                  if (procedimientosSeleccionados.find(p => p.id === proc.id)) {
                    setProcedimientosSeleccionados(procedimientosSeleccionados.filter(p => p.id !== proc.id));
                  } else { 
                    setProcedimientosSeleccionados([...procedimientosSeleccionados, { ...proc, cantidad: 1 }]); 
                  }
                }} className="w-5 h-5 accent-primary" />
                <span className="flex-1 text-sm font-medium">{proc.nombre}</span>
                <span className="text-muted font-bold text-sm">${parseFloat(proc.precio_base).toFixed(2)}</span>
              </label>
            ))}
          </div>

          {procedimientosSeleccionados.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              {procedimientosSeleccionados.map(p => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between text-sm mb-3 bg-white p-3 rounded-lg border shadow-sm gap-3">
                  <span className="font-bold text-dark flex-1">{p.nombre}</span>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-muted">Cantidad:</label>
                    <select 
                      value={p.cantidad || 1} 
                      onChange={(e) => {
                        const nuevaCant = parseInt(e.target.value);
                        setProcedimientosSeleccionados(procedimientosSeleccionados.map(proc => proc.id === p.id ? { ...proc, cantidad: nuevaCant } : proc));
                      }} 
                      className="p-1.5 bg-surface border border-gray-200 rounded text-xs text-dark focus:border-primary outline-none"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  
                  <span className="font-black text-primary md:w-24 md:text-right">
                    ${(parseFloat(p.precio_base) * (p.cantidad || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-black text-primary mt-4 pt-3 border-t">
                <span>Costo Total:</span><span>${totalProcedimientos.toFixed(2)}</span>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#E8F8F5] border border-[#A2D9CE] rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-bold text-[#117A65] flex items-center gap-1"><MessageCircle size={16}/> CONFIRMACIÓN METABUSINESS</span>
            <p className="text-xs text-[#148F77] italic my-2">"Para confirmar su cita del día: {fecha || '___'} a las {hora || '___'}..."</p>
            <button className="bg-[#25D366] text-white p-2.5 rounded-full font-bold text-xs shadow-sm flex items-center justify-center gap-2">
              <MessageCircle size={16}/> Enviar Confirmación WA
            </button>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-bold text-blue-800">DOCUMENTO DE COTIZACIÓN</span>
            <p className="text-xs text-muted my-2">Desglose de costos calcado al diseño solicitado.</p>
            <button onClick={generarPresupuestoPDF} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors">
              <FileDown size={16}/> Generar Presupuesto PDF
            </button>
          </div>
        </section>

        {/* --- PAGOS (Simplificado para Citas) --- */}
        <section className="p-5 bg-surface border border-gray-200 rounded-2xl">
          <label className="block text-sm font-medium text-muted mb-1">Monto a Cobrar / Abonar en Caja</label>
          <input type="number" inputMode="decimal" value={abono} onChange={e => setAbono(e.target.value)} placeholder="$ 0.00" className="w-full p-3 bg-white border border-gray-200 rounded-full font-bold text-dark" />
          <div className="mt-4 flex justify-between text-sm bg-white p-3 rounded-xl border">
            <span className="font-bold text-muted">Total procedimientos: ${totalProcedimientos.toFixed(2)}</span>
            <span className="font-black text-danger">Por cobrar: ${totalAPagar > 0 ? totalAPagar.toFixed(2) : '0.00'}</span>
          </div>
        </section>
      </div>

      <button onClick={guardarCitaCompleta} className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-full font-black text-lg shadow-lg flex justify-center items-center gap-2">
        <Check size={24} /> {idCitaEditando ? "Actualizar Cita y Paciente" : "Guardar Registro y Cita"}
      </button>
    </div>
  );
}