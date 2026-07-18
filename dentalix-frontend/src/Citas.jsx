import { useState, useEffect } from 'react';
import { Plus, X, Check, FileDown, MessageCircle, Search, Bell, Edit2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from './App';

const ANAMNESIS_ITEMS = [ "Dolor en el pecho", "Enfermedades del corazón", "Algún problema respiratorio", "Asma o fiebre de heno", "Alergias", "Desmayos, convulsiones o epilepsia", "Diabetes", "Hepatitis o enfermedad del hígado", "Artritis - reumatismo", "Úlcera gástrica", "Dolor abdominal", "Dolor de cabeza", "Dolor muscular", "Fiebre frecuente", "Mareos vértigo", "Enfermedad del riñón", "Tuberculosis", "Problemas de presión arterial", "Anemia", "Hemofilia", "Tuvo hemorragias después de extracciones", "Enfermedad mental o problemas emocionales", "Radioterapia o tratamiento para el cáncer", "Enfermedades por transmisión sexual", "Problemas de tiroides", "Enfermedades de la piel", "Ha tenido un crecimiento anormal o tumoración", "Delirio o estado confusional", "Tabaquismo actual", "Alcoholismo actual", "Alcoholismo en el pasado", "¿Ha consumido drogas?", "¿Le practicado exámenes para detectar SIDA?", "¿Está usted embarazada?", "¿Ya se presentó la menopausia?", "¿Su médico autoriza el tratamiento dental?", "¿Está usted amamantando?", "¿Utiliza algún método anticonceptivo?", "Varicela", "Sarampión", "Rubéola", "Paperas" ];
const DIENTES_ADULTOS = [ 18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28, 48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38 ];
const CONDICIONES_DENTALES = []; // Arreglo vacío necesario para evitar que el bloque del odontograma crashee

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
  const { setBackAction } = useAppContext();

  // ============================================================================
  // LÓGICA DE ASIGNACIÓN AUTOMÁTICA DE DOCTOR POR USUARIO
  // ============================================================================
  const currentUserId = localStorage.getItem('dentalix_usuario_id') || '1';
  let doctorPorDefecto = 'Dra. Hasdra Guerrero';
  
  if (currentUserId === '2') {
    doctorPorDefecto = 'Dra. Valeria Ramírez';
  } else if (currentUserId !== '1') {
    // Si es un nuevo usuario (> 2), intenta leer su nombre, sino usa un texto genérico
    doctorPorDefecto = localStorage.getItem('dentalix_user_name') || 'Doctor Titular';
  }
  // ============================================================================

  const [idCitaEditando, setIdCitaEditando] = useState(null);
  const [fecha, setFecha] = useState('');
  
  // NUEVOS ESTADOS PARA HORA
  const [horaCombo, setHoraCombo] = useState('08');
  const [minutoCombo, setMinutoCombo] = useState('00');
  
  const [profesional, setProfesional] = useState(doctorPorDefecto); // Inicializa con el doctor detectado
  const [estadoCita, setEstadoCita] = useState(['programado']);
  const [datosPaciente, setDatosPaciente] = useState({ nombre: '', telefono: '', notas: '', fechaNacimiento: '', direccion: '', ocupacion: '', motivo: '' });
  const [procedimientosSeleccionados, setProcedimientosSeleccionados] = useState([]);
  const [abono, setAbono] = useState('');
  const [anamnesis, setAnamnesis] = useState(ANAMNESIS_ITEMS.reduce((acc, _, idx) => ({ ...acc, [idx]: { estado: '?', detalle: '' } }), {}));

  // ================= ESTADOS DEL NUEVO POPUP DE PROCEDIMIENTOS (MULTIPLE) =================
  const [modalProcedimientos, setModalProcedimientos] = useState(false);
  const [procTemp, setProcTemp] = useState(null);
  const [dientesSeleccionados, setDientesSeleccionados] = useState([]); // Ahora es un arreglo
  const [editandoProcIndex, setEditandoProcIndex] = useState(null); // Rastrea qué índice de la tabla estamos editando

  // Construimos el historial para que el odontograma pinte TODOS los dientes seleccionados a la vez
  const historialOdontograma = {};
  if (procTemp && dientesSeleccionados.length > 0) {
    dientesSeleccionados.forEach(d => {
      historialOdontograma[d] = { nombre: procTemp.nombre, color: procTemp.color_hex || '#8B5CF6' };
    });
  }

  const setDienteActivoHistorial = (diente) => {
    // Agrega o quita el diente de la selección múltiple
    setDientesSeleccionados(prev => 
      prev.includes(diente) ? prev.filter(d => d !== diente) : [...prev, diente]
    );
  };

  const dienteActivoHistorial = null; // Fuerza a que el sub-modal interno del odontograma nunca se abra aquí
  const aplicarCondicionDental = () => {}; 
  // ============================================================================

  // --- LÓGICA INTELIGENTE DE WHATSAPP ---
  const getFechaHoyLocal = () => {
    const curr = new Date();
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const abrirWhatsAppRecordatorio = (e, telefono, paciente, fechaCita, horaCita) => {
    if (e) e.stopPropagation(); // Evita que se abra el modal de editar cita si hacemos clic en la tarjeta de la lista
    
    if (!telefono) {
      alert("El paciente no tiene un número de teléfono registrado.");
      return;
    }
    if (!fechaCita || !horaCita) {
      alert("Aún no has definido fecha y hora para la cita.");
      return;
    }

    let num = telefono.replace(/\D/g, ''); 
    if (num.length === 10) num = '52' + num;

    const hoyStr = getFechaHoyLocal();
    const hoyObj = new Date(hoyStr + 'T00:00:00');
    const citaObj = new Date(fechaCita + 'T00:00:00');
    const diffDays = Math.ceil((citaObj - hoyObj) / (1000 * 60 * 60 * 24));

    let textoWa = `Hola ${paciente}, para recordarte tu cita `;
    
    if (diffDays <= 0) {
      textoWa += `el día de hoy a las ${horaCita.substring(0,5)} hrs.`;
    } else if (diffDays === 1) {
      textoWa += `el día de mañana a las ${horaCita.substring(0,5)} hrs.`;
    } else {
      const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
      const fechaFormateada = citaObj.toLocaleDateString('es-MX', opcionesFecha);
      textoWa += `el ${fechaFormateada} a las ${horaCita.substring(0,5)} hrs.`;
    }
    
    textoWa += ` ¡Te esperamos!`;
    
    const url = `https://wa.me/${num}?text=${encodeURIComponent(textoWa)}`;
    window.open(url, '_blank');
  };
  // ----------------------------------------

  // ============================================================================
  // FUNCIONES DE CONTROL DE ESTADO
  // ============================================================================
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

  const resetFormulario = () => {
    setPacienteSeleccionado(null);
    setIdCitaEditando(null);
    setDatosPaciente({ nombre: '', telefono: '', notas: '', fechaNacimiento: '', direccion: '', ocupacion: '', motivo: '' });
    setFecha(''); 
    setHoraCombo('08'); // Reset combos hora
    setMinutoCombo('00');
    setEstadoCita(['programado']);
    setProfesional(doctorPorDefecto); 
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

  const abrirEdicionCita = (c) => {
    resetFormulario();
    setIdCitaEditando(c.id_cita);
    setFecha(c.fecha);
    
    // Parseamos la hora guardada (ej. "09:30:00") a los combos
    if (c.hora) {
      const partesHora = c.hora.split(':');
      if (partesHora.length >= 2) {
        setHoraCombo(partesHora[0]);
        setMinutoCombo(partesHora[1]);
      }
    }
    
    setEstadoCita(c.estado ? c.estado.split(',') : ['programado']);
    
    if (c.abono !== null && c.abono !== undefined) {
      setAbono(c.abono);
    }
    
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
        
        const procsAgrupados = procsDeEstaCita.reduce((acc, proc) => {
          const existente = acc.find(p => p.id === proc.id && p.diente === proc.diente);
          if (existente) {
            existente.cantidad += 1;
          } else {
            // Re-convertimos el string guardado a un arreglo (si venía como "14, 15")
            let arrDientes = [];
            if (proc.diente) {
              arrDientes = proc.diente.toString().split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
            }
            acc.push({ ...proc, cantidad: 1, dientes: arrDientes, diente: proc.diente || null });
          }
          return acc;
        }, []);

        setProcedimientosSeleccionados(procsAgrupados);
      });

    setVista('nueva_cita');
  };

  // ============================================================================
  // EFECTOS Y CONTROLADORES DE RUTA
  // ============================================================================
  
  // EFECTO 1: Control del botón Atrás Global
  useEffect(() => {
    if (vista !== 'lista') {
      setBackAction(() => () => {
        resetFormulario();
        navigate('/citas', { replace: true, state: {} });
        setVista('lista');
      });
    } else {
      setBackAction(null);
    }
    return () => setBackAction(null);
  }, [vista, navigate, setBackAction]);

  // EFECTO 2: Recarga de datos principales cuando el usuario vuelve a la vista 'lista'
  useEffect(() => {
    recargarCitas();
    fetch(`${API_URL}?accion=pacientes`).then(res => res.json()).then(data => setPacientesExistentes(data || []));
    fetch(`${API_URL}?accion=procedimientos`).then(res => res.json()).then(data => setCatalogoProcedimientos(data || []));
  }, [vista]);

  // EFECTO 3: Vigilante de enrutamiento (Atrapa cuando vienes del calendario o de pacientes)
  useEffect(() => {
    if (location.state?.citaIdParaEditar) {
      fetch(`${API_URL}?accion=citas_lista`).then(res => res.json()).then(data => {
        const citaEncontrada = data.find(c => Number(c.id_cita) === Number(location.state.citaIdParaEditar));
        if (citaEncontrada) {
          abrirEdicionCita(citaEncontrada);
        }
        navigate(location.pathname, { replace: true, state: {} });
      });
    } 
    else if (location.state?.pacientePreseleccionado) {
      const p = location.state.pacientePreseleccionado;
      seleccionarPacienteExistente(p);
      setVista('nueva_cita');
      navigate(location.pathname, { replace: true, state: {} });
    } 
    else if (location.state?.fechaPreseleccionada) {
      resetFormulario();
      setFecha(location.state.fechaPreseleccionada);
      setVista('nueva_cita');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // ============================================================================

  const pacientesFiltrados = pacientesExistentes.filter(p => p.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase())).slice(0, 10);

  const totalProcedimientos = procedimientosSeleccionados.reduce((sum, proc) => sum + (parseFloat(proc.precio_base || 0) * (proc.cantidad || 1)), 0);
  const totalAPagar = totalProcedimientos - (parseFloat(abono) || 0);

  const guardarCitaCompleta = () => {
    if (!datosPaciente.nombre) { alert("Debes seleccionar o escribir un paciente."); return; }
    if (!fecha || !horaCombo || !minutoCombo) { alert("Fecha y hora son obligatorios."); return; }

    const horaFinal = `${horaCombo}:${minutoCombo}`; // Concatenamos la hora final

    const procedimientosExpandidos = [];
    procedimientosSeleccionados.forEach(p => {
      for (let i = 0; i < (p.cantidad || 1); i++) {
        procedimientosExpandidos.push({
          id: p.id,
          precio_base: p.precio_base,
          fecha_procedimiento: fecha,
          hora_procedimiento: horaFinal,
          // Convertimos el arreglo de vuelta a un texto separado por comas para enviarlo al API
          diente: (p.dientes && p.dientes.length > 0) ? p.dientes.join(', ') : null 
        });
      }
    });

    const payload = {
      paciente: datosPaciente,
      cita: { 
        id: idCitaEditando, 
        fecha, 
        hora: horaFinal, 
        estado: estadoCita,
        abono: parseFloat(abono) || 0,
        total_pagar: totalProcedimientos,
        restante: totalAPagar
      },
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
        recargarCitas(); 
        setVista('lista'); 
      } else { alert("Error: " + data.error); }
    });
  };

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

    const tableData = procedimientosSeleccionados.map((p, idx) => {
      const strDientes = p.dientes?.length > 0 ? p.dientes.join(', ') : '';
      return [
        (idx + 1).toString().padStart(2, '0'),
        strDientes ? `${p.nombre} (Dientes: ${strDientes})` : p.nombre,
        p.cantidad.toString(),
        `$${parseFloat(p.precio_base).toFixed(2)}`,
        `$${(parseFloat(p.precio_base) * (p.cantidad || 1)).toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 75,
      head: [['No.', 'Descripción del Servicio / Padecimiento', 'Cant.', 'Costo Unit.', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 9 }
    });

    let yDientes = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("MAPEO DENTAL (ODONTOGRAMA)", 14, yDientes);
    
    doc.setTextColor(0,0,0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    yDientes += 7;
    
    const procsConDiente = procedimientosSeleccionados.filter(p => p.dientes && p.dientes.length > 0);
    if(procsConDiente.length > 0) {
        procsConDiente.forEach(p => {
            doc.text(`• Dientes ${p.dientes.join(', ')}: ${p.nombre}`, 14, yDientes);
            yDientes += 5;
        });
    } else {
        doc.text("Ningún diente específico asignado en esta cotización.", 14, yDientes);
        yDientes += 5;
    }

    const finalY = yDientes + 10;
    
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

  const abrirModalProcedimientos = () => {
    setProcTemp(null);
    setDientesSeleccionados([]);
    setEditandoProcIndex(null);
    setModalProcedimientos(true);
  };

  const editarProcedimiento = (idx) => {
    const procGuardado = procedimientosSeleccionados[idx];
    // Buscamos el original en el catálogo para tener todo su color y propiedades, o usamos el guardado
    const original = catalogoProcedimientos.find(p => p.id === procGuardado.id) || procGuardado;
    
    setProcTemp(original);
    setDientesSeleccionados(procGuardado.dientes || []);
    setEditandoProcIndex(idx);
    setModalProcedimientos(true);
  };

  const agregarFila = () => {
    if(!procTemp) {
      alert("Debes seleccionar un procedimiento de la lista.");
      return;
    }
    
    // Si estamos editando, mantenemos la cantidad que tenía, sino le ponemos 1
    const cantidadExistente = editandoProcIndex !== null ? procedimientosSeleccionados[editandoProcIndex].cantidad : 1;
    
    const nuevoProc = { ...procTemp, cantidad: cantidadExistente, dientes: dientesSeleccionados };
    
    if (editandoProcIndex !== null) {
      const copiaProcedimientos = [...procedimientosSeleccionados];
      copiaProcedimientos[editandoProcIndex] = nuevoProc;
      setProcedimientosSeleccionados(copiaProcedimientos);
    } else {
      setProcedimientosSeleccionados([...procedimientosSeleccionados, nuevoProc]);
    }
    
    setModalProcedimientos(false);
  };

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
                className="bg-white rounded-2xl border border-gray-100 shadow-sm transition-all group relative overflow-hidden flex flex-col hover:border-primary/30"
              >
                {c.esMultiple && <div className="absolute top-0 left-0 w-1 h-full bg-primary z-10" title="Múltiples procedimientos en esta fecha"></div>}
                
                {/* Cuerpo de la tarjeta clickeable para Editar Cita */}
                <div 
                  onClick={() => abrirEdicionCita(c)}
                  className="p-4 flex justify-between items-center hover:bg-surface/60 cursor-pointer"
                >
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
                
                {/* Botón Inferior: WhatsApp */}
                <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/50 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => abrirWhatsAppRecordatorio(e, c.telefono, c.paciente, c.fecha, c.hora)}
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-1.5 px-4 rounded-full flex items-center justify-center gap-1.5 shadow-sm transition-colors text-xs"
                  >
                    <MessageCircle size={14} />
                    Enviar Recordatorio WA
                  </button>
                </div>

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
          
          {/* NUEVOS DROPDOWNS PARA LA HORA (8 AM a 20 PM) */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1 ml-2">Hora</label>
            <div className="flex gap-2 w-full">
              <select 
                value={horaCombo} 
                onChange={e => setHoraCombo(e.target.value)} 
                className="w-1/2 p-3 bg-surface border border-gray-200 rounded-full text-dark font-bold outline-none focus:border-primary appearance-none text-center"
              >
                {Array.from({length: 13}, (_, i) => {
                  const h = (i + 8).toString().padStart(2, '0');
                  return <option key={h} value={h}>{h}</option>;
                })}
              </select>
              <span className="flex items-center text-dark font-bold">:</span>
              <select 
                value={minutoCombo} 
                onChange={e => setMinutoCombo(e.target.value)} 
                className="w-1/2 p-3 bg-surface border border-gray-200 rounded-full text-dark font-bold outline-none focus:border-primary appearance-none text-center"
              >
                <option value="00">00</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
              </select>
            </div>
          </div>
          
          {/* NUEVO DROPDOWN DE PROFESIONAL */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1 ml-2">Profesional</label>
            <select 
              value={profesional} 
              onChange={e => setProfesional(e.target.value)} 
              className="w-full p-3 bg-surface border border-gray-200 rounded-full text-dark font-medium outline-none focus:border-primary appearance-none"
            >
              <option value={doctorPorDefecto}>{doctorPorDefecto}</option>
              <option value="Doctor invitado">Doctor invitado</option>
            </select>
          </div>
          
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

        {/* --- PROCEDIMIENTOS ASIGNADOS CON POPUP --- */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-dark flex items-center gap-2">
              Procedimientos Programados
              {procedimientosSeleccionados.length > 0 && <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-black">{procedimientosSeleccionados.length}</span>}
            </h2>
            <button type="button" onClick={abrirModalProcedimientos} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
              <Plus size={16} /> Agregar Procedimiento
            </button>
          </div>

          {procedimientosSeleccionados.length > 0 ? (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              {procedimientosSeleccionados.map((p, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between text-sm mb-3 bg-white p-3 rounded-lg border shadow-sm gap-3">
                  <div className="font-bold text-dark flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span>{p.nombre}</span>
                    {p.dientes && p.dientes.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => editarProcedimiento(idx)}
                        className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 text-xs font-black px-3 py-1 rounded-full transition-colors flex items-center w-max gap-1 shadow-sm"
                        title="Haz clic para editar los dientes asignados"
                      >
                        <Edit2 size={12} /> Dientes: {p.dientes.join(', ')}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-muted">Cantidad:</label>
                    <select 
                      value={p.cantidad || 1} 
                      onChange={(e) => {
                        const nuevaCant = parseInt(e.target.value);
                        setProcedimientosSeleccionados(procedimientosSeleccionados.map((proc, i) => i === idx ? { ...proc, cantidad: nuevaCant } : proc));
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
          ) : (
             <div className="text-center p-6 bg-surface rounded-xl border border-dashed border-gray-300 text-muted text-sm">
                No hay procedimientos asignados a esta cita aún.
             </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#E8F8F5] border border-[#A2D9CE] rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-bold text-[#117A65] flex items-center gap-1"><MessageCircle size={16}/> CONFIRMACIÓN WHATSAPP</span>
            <p className="text-xs text-[#148F77] italic my-2">Enviaremos un mensaje inteligente calculando si la cita es hoy, mañana o después.</p>
            <button 
              type="button"
              onClick={(e) => abrirWhatsAppRecordatorio(e, datosPaciente.telefono, datosPaciente.nombre, fecha, `${horaCombo}:${minutoCombo}`)}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-2.5 rounded-full font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
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

        {/* --- PAGOS CON BOTÓN DE APLICAR ABONO --- */}
        <section className="p-5 bg-surface border border-gray-200 rounded-2xl">
          <label className="block text-sm font-medium text-muted mb-2">Monto a Cobrar / Abonar en Caja</label>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input type="number" inputMode="decimal" value={abono} onChange={e => setAbono(e.target.value)} placeholder="$ 0.00" className="w-full sm:flex-1 p-3 bg-white border border-gray-200 rounded-full font-bold text-dark outline-none focus:border-primary shadow-sm" />
            <button type="button" onClick={() => alert("¡Abono capturado! El cálculo se ha actualizado, recuerda presionar 'Guardar Registro y Cita' al final para grabarlo en la base de datos.")} className="w-full sm:w-auto bg-dark hover:bg-black text-white px-6 py-3 rounded-full font-bold text-sm shadow-sm flex items-center justify-center gap-2 shrink-0 transition-colors">
              <Check size={16} /> Aplicar
            </button>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between text-sm bg-white p-4 rounded-xl border gap-2 shadow-sm">
            <span className="font-bold text-muted">Total procedimientos: <span className="text-dark">${totalProcedimientos.toFixed(2)}</span></span>
            <span className="font-black text-danger">Por cobrar: ${totalAPagar > 0 ? totalAPagar.toFixed(2) : '0.00'}</span>
          </div>
        </section>
      </div>

      <button onClick={guardarCitaCompleta} className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-full font-black text-lg shadow-lg flex justify-center items-center gap-2">
        <Check size={24} /> {idCitaEditando ? "Actualizar Cita y Paciente" : "Guardar Registro y Cita"}
      </button>

      {/* ========================================================================= */}
      {/* POPUP DE PROCEDIMIENTO INDIVIDUAL + ODONTOGRAMA (Z-INDEX 60 PARA MÓVIL)    */}
      {/* ========================================================================= */}
      {modalProcedimientos && (
        <div className="fixed inset-0 bg-dark/60 z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 w-full max-w-5xl shadow-2xl flex flex-col mt-auto mb-auto max-h-[90vh]">
            
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-black text-xl text-dark">
                {editandoProcIndex !== null ? "Editar Procedimiento" : "Agregar Procedimiento"}
              </h3>
              <button onClick={() => setModalProcedimientos(false)} className="p-2 hover:bg-surface rounded-full text-muted hover:text-danger transition-colors"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-12">
              
              <div>
                <label className="block text-sm font-bold text-primary uppercase mb-2">1. Selecciona un procedimiento</label>
                <select
                  value={procTemp ? procTemp.id : ''}
                  onChange={(e) => {
                    const seleccionado = catalogoProcedimientos.find(p => p.id == e.target.value);
                    setProcTemp(seleccionado);
                  }}
                  className="w-full p-3 bg-surface border border-gray-200 rounded-xl text-dark font-medium outline-none focus:border-primary"
                >
                  <option value="" disabled>-- Elige un procedimiento --</option>
                  {catalogoProcedimientos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} - ${parseFloat(p.precio_base).toFixed(2)}</option>
                  ))}
                </select>
              </div>

              {procTemp && (
                <div className="border-t pt-4">
                  {/* === BLOQUE EXACTO DEL ODONTOGRAMA === */}
                  <section className="w-full py-6">
                    <div className="px-2 sm:px-8 mb-8">
                      <h2 className="text-xl font-bold text-dark mb-2 border-b border-gray-200 pb-2">Historial Dental (Odontograma)</h2>
                      <p className="text-xs text-muted">Toca uno o varios dientes para asignarles este padecimiento.</p>
                    </div>

                    {/* Contenedor Flex: Proporción anatómica natural, números desamontonados y dientes enormes */}
                    <div className="w-full flex flex-col gap-12 sm:gap-20 items-center overflow-x-hidden px-2">

                      {/* FILA SUPERIOR (Maxilar) - Alineación inferior (items-end) proporcional */}
                      <div className="flex justify-between items-end w-full gap-[1px] sm:gap-1 max-w-5xl mx-auto pt-6">
                        {DIENTES_ADULTOS.slice(0, 16).map(diente => {
                          const condicion = historialOdontograma[diente];
                          const fillColor = condicion?.color && condicion.color !== '#FFFFFF' ? condicion.color : 'transparent';
                          const textColor = condicion?.color && condicion.color !== '#FFFFFF' ? condicion.color : '#374151';

                          return (
                            <button key={diente} onClick={() => setDienteActivoHistorial(diente)} className="relative flex flex-col items-center justify-end shrink min-w-0 group outline-none p-0 bg-transparent border-none">
                              
                              {/* Número absoluto arriba: Flota para no romper el ancho ni amontonarse */}
                              <span className="absolute bottom-full mb-1 sm:mb-2 text-[10px] sm:text-xs md:text-sm font-bold transition-colors whitespace-nowrap left-1/2 -translate-x-1/2" style={{ color: textColor }}>{diente}</span>

                              <div className="w-full relative flex justify-center h-24 sm:h-32 md:h-40 lg:h-48">
                                {fillColor !== 'transparent' && (
                                  <div
                                    className="absolute inset-0 z-0 transition-colors"
                                    style={{
                                      backgroundColor: fillColor,
                                      WebkitMaskImage: `url("/odontograma/${diente}.svg")`,
                                      WebkitMaskSize: 'contain',
                                      WebkitMaskRepeat: 'no-repeat',
                                      WebkitMaskPosition: 'bottom center',
                                      maskImage: `url("/odontograma/${diente}.svg")`,
                                      maskSize: 'contain',
                                      maskRepeat: 'no-repeat',
                                      maskPosition: 'bottom center'
                                    }}
                                  />
                                )}
                                <img
                                  src={`/odontograma/${diente}.svg`}
                                  alt={`Diente ${diente}`}
                                  className="h-full w-auto max-w-full object-contain object-bottom relative z-10 transition-transform origin-bottom group-hover:scale-110"
                                  style={fillColor !== 'transparent' ? { mixBlendMode: 'multiply' } : {}}
                                />
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* FILA INFERIOR (Mandíbula) - Alineación superior (items-start) proporcional */}
                      <div className="flex justify-between items-start w-full gap-[1px] sm:gap-1 max-w-5xl mx-auto pb-6">
                        {DIENTES_ADULTOS.slice(16, 32).map(diente => {
                          const condicion = historialOdontograma[diente];
                          const fillColor = condicion?.color && condicion.color !== '#FFFFFF' ? condicion.color : 'transparent';
                          const textColor = condicion?.color && condicion.color !== '#FFFFFF' ? condicion.color : '#374151';
                          
                          // Separación quirúrgica solo para los dientes estrechos del centro abajo
                          const isMiddleBottom = [43, 42, 41, 31, 32, 33].includes(diente);

                          return (
                            <button key={diente} onClick={() => setDienteActivoHistorial(diente)} className={`relative flex flex-col items-center justify-start shrink min-w-0 group outline-none p-0 bg-transparent border-none ${isMiddleBottom ? 'px-[2px] sm:px-1' : ''}`}>
                              
                              <div className="w-full relative flex justify-center h-24 sm:h-32 md:h-40 lg:h-48">
                                {fillColor !== 'transparent' && (
                                  <div
                                    className="absolute inset-0 z-0 transition-colors"
                                    style={{
                                      backgroundColor: fillColor,
                                      WebkitMaskImage: `url("/odontograma/${diente}.svg")`,
                                      WebkitMaskSize: 'contain',
                                      WebkitMaskRepeat: 'no-repeat',
                                      WebkitMaskPosition: 'top center',
                                      maskImage: `url("/odontograma/${diente}.svg")`,
                                      maskSize: 'contain',
                                      maskRepeat: 'no-repeat',
                                      maskPosition: 'top center'
                                    }}
                                  />
                                )}
                                <img
                                  src={`/odontograma/${diente}.svg`}
                                  alt={`Diente ${diente}`}
                                  className="h-full w-auto max-w-full object-contain object-top relative z-10 transition-transform origin-top group-hover:scale-110"
                                  style={fillColor !== 'transparent' ? { mixBlendMode: 'multiply' } : {}}
                                />
                              </div>

                              {/* Número absoluto abajo: Flota para no romper el ancho ni amontonarse */}
                              <span className="absolute top-full mt-1 sm:mt-2 text-[10px] sm:text-xs md:text-sm font-bold transition-colors whitespace-nowrap left-1/2 -translate-x-1/2" style={{ color: textColor }}>{diente}</span>
                            
                            </button>
                          )
                        })}
                      </div>

                    </div>

                    {/* MODAL DE ODONTOGRAMA A PANTALLA COMPLETA */}
                    {dienteActivoHistorial && (
                      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                          <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <span className="font-black text-lg text-dark">Diente {dienteActivoHistorial}</span>
                            <button onClick={() => setDienteActivoHistorial(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-danger"/></button>
                          </div>
                          <div className="p-2 overflow-y-auto flex-1">
                            {CONDICIONES_DENTALES.map((cond, i) => (
                              <button 
                                key={i} 
                                onClick={() => aplicarCondicionDental(cond)} 
                                className="w-full flex items-center gap-3 p-3 hover:bg-surface rounded-xl text-left text-sm font-medium transition-colors"
                              >
                                <div className="w-5 h-5 rounded-full border-2 shadow-sm shrink-0" style={{ backgroundColor: cond.color, borderColor: cond.borde || cond.color }}></div>
                                <span className="text-dark">{cond.nombre}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                  {/* === FIN DEL BLOQUE EXACTO === */}
                </div>
              )}

            </div>

            <div className="pt-3 border-t flex justify-end shrink-0">
              <button 
                type="button" 
                onClick={agregarFila} 
                className="bg-primary hover:bg-primary-hover text-white font-black py-3 px-10 rounded-full shadow-md transition-transform"
              >
                {editandoProcIndex !== null ? "Guardar Cambios" : "Agregar a la Cita"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}