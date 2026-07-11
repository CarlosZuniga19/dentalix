import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Upload, X, Check, FileDown, MessageCircle, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- ARREGLOS DE DATOS CLÍNICOS EXACTOS ---
const ANAMNESIS_ITEMS = [
  "Dolor en el pecho", "Enfermedades del corazón", "Algún problema respiratorio", "Asma o fiebre de heno", "Alergias", "Desmayos, convulsiones o epilepsia", "Diabetes", "Hepatitis o enfermedad del hígado", "Artritis - reumatismo", "Úlcera gástrica", "Dolor abdominal", "Dolor de cabeza", "Dolor muscular", "Fiebre frecuente", "Mareos vértigo", "Enfermedad del riñón", "Tuberculosis", "Problemas de presión arterial", "Anemia", "Hemofilia", "Tuvo hemorragias después de extracciones", "Enfermedad mental o problemas emocionales", "Radioterapia o tratamiento para el cáncer", "Enfermedades por transmisión sexual", "Problemas de tiroides", "Enfermedades de la piel", "Ha tenido un crecimiento anormal o tumoración", "Delirio o estado confusional", "Tabaquismo actual", "Alcoholismo actual", "Alcoholismo en el pasado", "¿Ha consumido drogas?", "¿Le han practicado exámenes para detectar SIDA?", "¿Está usted embarazada?", "¿Ya se presentó la menopausia?", "¿Su médico autoriza el tratamiento dental?", "¿Está usted amamantando?", "¿Utiliza algún método anticonceptivo?", "Varicela", "Sarampión", "Rubéola", "Paperas"
];

const CONDICIONES_DENTALES = [
  { nombre: 'Caries', color: '#EF4444' }, { nombre: 'Resina', color: '#3B82F6' },
  { nombre: 'Ausente', color: '#9CA3AF' }, { nombre: 'Tratamiento de conducto radicular', color: '#8B5CF6' },
  { nombre: 'Fractura de corona', color: '#F97316' }, { nombre: 'Sensibilidad', color: '#EAB308' },
  { nombre: 'Reconstrucción', color: '#14B8A6' }, { nombre: 'Corona', color: '#EAB308' },
  { nombre: 'Implante', color: '#06B6D4' }, { nombre: 'Puente', color: '#6366F1' },
  { nombre: 'Protesis Removible', color: '#EC4899' }, { nombre: 'Corona, poste y nucleo', color: '#A8A29E' },
  { nombre: 'Diente pilar', color: '#84CC16' }, { nombre: 'Resto radicular', color: '#1F2937' },
  { nombre: 'No vital', color: '#4B5563' }, { nombre: 'Movilidad 1', color: '#FCA5A5' },
  { nombre: 'Movilidad 2', color: '#F87171' }, { nombre: 'Movilidad 3', color: '#DC2626' },
  { nombre: 'Recesion gingival', color: '#FBCFE8' }, { nombre: 'Nota', color: '#FFFFFF', borde: '#CBD5E1' }
];

const DIENTES_ADULTOS = [
  18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28,
  48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38
];

// Diccionario Anatómico Orgánico (Trazos amorfos, asimétricos e inclinados idénticos a la imagen)
const getToothData = (diente) => {
  const type = diente % 10;
  const isUpper = diente >= 11 && diente <= 28;
  
  let paths = { d: "", c: "" };
  
  if (isUpper) {
    if (type === 1) paths = { d: "M30,85 C28,110 33,140 45,145 C55,148 65,135 68,85 C75,40 65,15 55,5 C48,-5 42,10 43,35 C44,55 35,70 30,85 Z", c: "M29,85 C45,75 55,75 69,85" };
    else if (type === 2) paths = { d: "M33,83 C30,105 38,135 48,138 C55,140 62,130 65,83 C72,40 68,15 58,8 C52,0 45,15 47,40 C48,60 38,70 33,83 Z", c: "M32,83 C45,74 55,74 66,83" };
    else if (type === 3) paths = { d: "M32,85 C32,100 42,145 50,148 C58,145 68,100 66,85 C78,40 70,10 58,5 C50,-2 45,15 46,40 C47,60 35,75 32,85 Z", c: "M31,85 C45,75 55,75 67,85" };
    else if (type === 4) paths = { d: "M28,82 C25,110 35,135 45,138 C50,135 60,138 68,82 C78,40 78,15 65,5 C60,2 55,20 52,35 C50,35 45,15 40,10 C32,5 25,30 28,82 Z", c: "M27,82 C45,72 55,72 69,82" };
    else if (type === 5) paths = { d: "M30,82 C28,110 38,135 48,138 C52,135 62,138 68,82 C78,40 70,15 58,8 C50,2 45,15 46,40 C47,60 35,70 30,82 Z", c: "M29,82 C45,72 55,72 69,82" };
    else if (type === 6) paths = { d: "M18,80 C18,115 25,135 38,140 C45,135 50,135 50,135 C50,135 55,135 62,140 C75,135 80,115 80,80 C95,40 85,10 75,5 C70,2 65,25 60,35 C55,20 52,10 45,15 C40,20 35,30 30,35 C25,20 20,5 15,10 C5,15 8,40 18,80 Z", c: "M16,80 C40,65 60,65 82,80" };
    else if (type === 7) paths = { d: "M20,80 C20,110 28,130 40,135 C45,130 50,130 50,130 C50,130 55,130 60,135 C72,130 78,110 78,80 C92,45 80,15 70,10 C65,8 60,25 55,35 C50,20 48,12 42,18 C38,22 32,32 28,35 C22,25 18,10 12,15 C5,20 10,45 20,80 Z", c: "M18,80 C40,68 60,68 80,80" };
    else if (type === 8) paths = { d: "M25,80 C25,105 32,125 42,130 C48,125 52,125 52,125 C52,125 55,125 60,130 C70,125 75,105 75,80 C88,50 75,20 65,15 C60,12 55,28 52,38 C50,25 48,18 42,22 C38,25 35,35 30,38 C25,28 20,15 15,20 C8,25 15,50 25,80 Z", c: "M23,80 C40,70 60,70 77,80" };
  } else {
    if (type === 1) paths = { d: "M35,65 C40,20 42,5 48,2 C52,2 60,20 65,65 C72,110 62,140 55,145 C50,148 45,145 42,140 C35,110 30,80 35,65 Z", c: "M34,65 C45,75 55,75 66,65" };
    else if (type === 2) paths = { d: "M34,65 C38,20 40,5 48,2 C54,2 62,20 66,65 C74,110 64,142 58,146 C52,148 48,145 44,140 C36,110 30,80 34,65 Z", c: "M33,65 C45,74 55,74 67,65" };
    else if (type === 3) paths = { d: "M32,65 C35,20 45,5 50,2 C55,5 65,20 68,65 C78,110 68,145 58,148 C50,150 45,145 40,140 C30,110 25,80 32,65 Z", c: "M31,65 C45,76 55,76 69,65" };
    else if (type === 4) paths = { d: "M30,65 C32,25 42,8 50,5 C58,8 68,25 70,65 C80,115 72,145 60,148 C52,150 45,145 40,140 C28,115 22,80 30,65 Z", c: "M28,65 C45,78 55,78 72,65" };
    else if (type === 5) paths = { d: "M32,65 C35,28 45,10 50,8 C55,10 65,28 68,65 C80,115 70,145 62,148 C52,150 48,145 42,140 C30,115 25,80 32,65 Z", c: "M30,65 C45,78 55,78 70,65" };
    else if (type === 6) paths = { d: "M18,70 C20,25 25,10 35,5 C45,5 48,20 50,30 C52,20 55,5 65,5 C75,10 80,25 82,70 C95,115 88,145 78,148 C68,148 60,130 55,120 C50,130 45,148 35,148 C22,148 10,115 18,70 Z", c: "M16,70 C40,88 60,88 84,70" };
    else if (type === 7) paths = { d: "M20,70 C22,30 28,15 38,10 C45,10 48,25 50,35 C52,25 55,10 62,10 C72,15 78,30 80,70 C92,110 85,140 75,145 C68,145 60,125 55,115 C50,125 45,145 35,145 C25,140 12,110 20,70 Z", c: "M18,70 C40,85 60,85 82,70" };
    else if (type === 8) paths = { d: "M25,70 C28,35 35,20 42,15 C48,15 50,30 52,40 C54,30 56,15 62,15 C70,20 75,35 78,70 C88,105 80,135 72,140 C65,140 60,125 55,115 C50,125 45,140 38,140 C30,135 20,105 25,70 Z", c: "M23,70 C40,85 60,85 80,70" };
  }
  return paths;
};

export default function Pacientes() {
  const navigate = useNavigate();
  const location = useLocation();
  const mostrarEstadoCita = location.state?.mostrarEstadoCita || false;

  const [vista, setVista] = useState(mostrarEstadoCita ? 'nuevo' : 'lista');
  const [catalogoProcedimientos, setCatalogoProcedimientos] = useState([]);
  const API_URL = 'https://dentalix.lat/api.php';

  const [listaPacientes, setListaPacientes] = useState([]);
  const [busquedaP, setBusquedaP] = useState('');
  const [todasLasCitas, setTodasLasCitas] = useState([]);
  
  // ================= ESTADOS DEL FORMULARIO =================
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [profesional, setProfesional] = useState('');
  const [estadoCita, setEstadoCita] = useState(['programado']);
  
  const [datosPaciente, setDatosPaciente] = useState({
    nombre: '', telefono: '', notas: '', fechaNacimiento: '', direccion: '', ocupacion: '', motivo: ''
  });

  const [procedimientosSeleccionados, setProcedimientosSeleccionados] = useState([]);
  
  const [montoAbono, setMontoAbono] = useState('');
  const [destinoAbono, setDestinoAbono] = useState('total');
  const [pagosAgregados, setPagosAgregados] = useState([]);
  
  const [tratamientosGuardados, setTratamientosGuardados] = useState([]);
  const [modalTratamiento, setModalTratamiento] = useState(false);
  const [tratamientoTemp, setTratamientoTemp] = useState({ fecha: '', hora: '', procedimientos: [], dientes: [] });

  const [historialOdontograma, setHistorialOdontograma] = useState({});
  const [dienteActivoHistorial, setDienteActivoHistorial] = useState(null);
  
  const [imagenes, setImagenes] = useState([]);
  const [imagenEnGrande, setImagenEnGrande] = useState(null);

  const [anamnesis, setAnamnesis] = useState(
    ANAMNESIS_ITEMS.reduce((acc, _, idx) => ({ ...acc, [idx]: { estado: '?', detalle: '' } }), {})
  );

  // ================= CARGA PRINCIPAL DE DATOS =================
  useEffect(() => {
    fetch(`${API_URL}?accion=procedimientos`).then(res => res.json()).then(data => setCatalogoProcedimientos(data || []));
    fetch(`${API_URL}?accion=pacientes`).then(res => res.json()).then(data => setListaPacientes(data || []));
    fetch(`${API_URL}?accion=citas_lista`).then(res => res.json()).then(data => setTodasLasCitas(data || []));
  }, [vista]);

  // Cálculos dinámicos
  const totalProcedimientos = procedimientosSeleccionados.reduce((sum, proc) => sum + parseFloat(proc.precio_base || 0), 0);
  const totalAbonado = pagosAgregados.reduce((sum, pago) => sum + pago.monto, 0);
  const totalAPagar = totalProcedimientos - totalAbonado;

  const cargarImagenes = (idPaciente) => {
    fetch(`${API_URL}?accion=imagenes&id_paciente=${idPaciente}`).then(res => res.json()).then(data => setImagenes(data || []));
  };

  const handleNuevoPaciente = () => {
    setDatosPaciente({ nombre: '', telefono: '', notas: '', fechaNacimiento: '', direccion: '', ocupacion: '', motivo: '' });
    setFecha(''); setHora(''); setEstadoCita(['programado']);
    setProcedimientosSeleccionados([]); 
    setPagosAgregados([]); setMontoAbono(''); setDestinoAbono('total');
    setImagenes([]); 
    
    setHistorialOdontograma({});
    setTratamientosGuardados([]);
    setAnamnesis(ANAMNESIS_ITEMS.reduce((acc, _, idx) => ({ ...acc, [idx]: { estado: '?', detalle: '' } }), {}));

    setVista('nuevo');
  };

  const abrirEdicionPaciente = (p) => {
    setDatosPaciente({
      id: p.id, nombre: p.nombre || '', telefono: p.telefono || '', notas: p.notas || '',
      fechaNacimiento: p.fecha_nacimiento || '', direccion: p.direccion || '', ocupacion: p.ocupacion || '', motivo: p.motivo_consulta || ''
    });
    setFecha(''); setHora(''); setEstadoCita(['programado']);
    
    fetch(`${API_URL}?accion=procedimientos_paciente&id_paciente=${p.id}`)
      .then(res => res.json())
      .then(data => setProcedimientosSeleccionados(data || []));

    fetch(`${API_URL}?accion=pagos_paciente&id_paciente=${p.id}`)
      .then(res => res.json())
      .then(data => setPagosAgregados(data || []));

    fetch(`${API_URL}?accion=expediente_clinico&id_paciente=${p.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.tratamientos) setTratamientosGuardados(data.tratamientos);
        if (data.odontograma) {
          const odontoObj = {};
          data.odontograma.forEach(item => { odontoObj[item.numero_diente] = { nombre: item.nombre, color: item.color }; });
          setHistorialOdontograma(odontoObj);
        } else {
          setHistorialOdontograma({});
        }
        if (data.anamnesis) {
          const anamnesisObj = ANAMNESIS_ITEMS.reduce((acc, _, idx) => ({ ...acc, [idx]: { estado: '?', detalle: '' } }), {});
          data.anamnesis.forEach(item => {
            anamnesisObj[item.pregunta_id] = { estado: item.respuesta, detalle: item.detalle || '' };
          });
          setAnamnesis(anamnesisObj);
        }
      });

    cargarImagenes(p.id); 
    setVista('editar');
  };

  const toggleProcedimientoPrincipal = (proc) => {
    if (procedimientosSeleccionados.find(p => p.id === proc.id)) {
      setProcedimientosSeleccionados(procedimientosSeleccionados.filter(p => p.id !== proc.id));
      setPagosAgregados(pagosAgregados.filter(pago => pago.id_destino != proc.id));
    } else {
      setProcedimientosSeleccionados([...procedimientosSeleccionados, { ...proc, fecha_procedimiento: '', hora_procedimiento: '' }]);
    }
  };

  const agregarAbono = () => {
    if (!montoAbono || parseFloat(montoAbono) <= 0) return;
    const destinoNombre = destinoAbono === 'total' ? 'Abono al Total' : procedimientosSeleccionados.find(p => p.id == destinoAbono)?.nombre;
    setPagosAgregados([...pagosAgregados, { 
      id: Date.now(), 
      monto: parseFloat(montoAbono), 
      id_destino: destinoAbono === 'total' ? null : destinoAbono, 
      destinoNombre 
    }]);
    setMontoAbono('');
  };

  const handleAnamnesisClick = (idx) => {
    const actual = anamnesis[idx].estado;
    let nuevo = '?';
    if (actual === '?') nuevo = 'No'; else if (actual === 'No') nuevo = 'Si';
    setAnamnesis({ ...anamnesis, [idx]: { ...anamnesis[idx], estado: nuevo } });
  };

  const handleImagenUpload = async (e) => {
    if (!datosPaciente.id) {
      alert("Por favor, dale a 'Guardar Expediente' primero para registrar al paciente. Después podrás subirle las imágenes.");
      return;
    }
    const files = Array.from(e.target.files);
    for (const file of files) {
      const formData = new FormData();
      formData.append('imagen', file);
      formData.append('id_paciente', datosPaciente.id);
      try {
        const res = await fetch(`${API_URL}?accion=subir_imagen`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) cargarImagenes(datosPaciente.id);
      } catch (err) { console.error(err); }
    }
  };

  const aplicarCondicionDental = (condicion) => {
    if (!dienteActivoHistorial) return;
    setHistorialOdontograma({ ...historialOdontograma, [dienteActivoHistorial]: condicion });
    setDienteActivoHistorial(null);
  };

  const guardarTratamiento = () => {
    setTratamientosGuardados([...tratamientosGuardados, tratamientoTemp]);
    setModalTratamiento(false);
    setTratamientoTemp({ fecha: '', hora: '', procedimientos: [], dientes: [] });
  };

  const guardarCitaYRegresar = () => {
    if (!datosPaciente.nombre) { alert("El nombre del paciente es obligatorio."); return; }
    if ((fecha && !hora) || (!fecha && hora)) { alert("Si vas a programar una cita, debes ingresar la fecha y la hora completas."); return; }

    const payload = {
      paciente: datosPaciente,
      cita: { fecha, hora, estado: estadoCita },
      procedimientos: procedimientosSeleccionados,
      pagos: pagosAgregados,
      anamnesis: anamnesis,
      historialOdontograma: historialOdontograma,
      tratamientosGuardados: tratamientosGuardados
    };

    fetch(`${API_URL}?accion=guardar_paciente_cita`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) setVista('lista'); else alert("Error al guardar: " + data.mensaje);
    })
    .catch(() => alert("Error de conexión al servidor."));
  };

  // ================= GENERACIÓN DE PRESUPUESTO (PDF) =================
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
      p.fecha_procedimiento ? `${p.fecha_procedimiento.split('-').reverse().join('/')} ${p.hora_procedimiento ? p.hora_procedimiento : ''}` : 'Por definir',
      `$${parseFloat(p.precio_base).toFixed(2)}`,
      `$${parseFloat(p.precio_base).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['No.', 'Descripción del Servicio', 'Cita Prog.', 'Costo', 'Total']],
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

    doc.setTextColor(220, 38, 38); 
    doc.text(`Abonos:`, 125, finalY + 6);
    doc.text(`-$${totalAbonado.toFixed(2)}`, 165, finalY + 6);
    
    doc.setFillColor(...primaryColor);
    doc.rect(120, finalY + 10, 75, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`SALDO RESTANTE:`, 125, finalY + 16.5);
    doc.text(`$${totalAPagar > 0 ? totalAPagar.toFixed(2) : '0.00'}`, 165, finalY + 16.5);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text("Gracias por elegir nuestra clínica.", 14, finalY + 10);
    
    doc.line(130, finalY + 45, 185, finalY + 45);
    doc.text("Firma del Paciente", 143, finalY + 50);

    doc.save(`Presupuesto_${datosPaciente.nombre || 'Paciente'}.pdf`);
  };

  // ================= VISTA: LISTA DE PACIENTES =================
  if (vista === 'lista') {
    const filtrados = listaPacientes.filter(p => p.nombre.toLowerCase().includes(busquedaP.toLowerCase()));
    return (
      <div className="max-w-6xl mx-auto pb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div><h1 className="text-2xl font-bold text-dark">Pacientes Registrados</h1><p className="text-muted text-sm">Total: {filtrados.length} pacientes</p></div>
          <button onClick={handleNuevoPaciente} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-medium shadow-sm shrink-0"><Plus size={20} /> Agregar paciente nuevo</button>
        </div>
        <div className="relative mb-4"><input type="text" placeholder="Buscar paciente por nombre..." value={busquedaP} onChange={(e) => setBusquedaP(e.target.value)} className="w-full pl-6 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:outline-none focus:border-primary shadow-sm text-dark" /></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filtrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-surface border-b border-gray-100 text-muted font-bold text-xs uppercase"><th className="p-4">Nombre</th><th className="p-4">Teléfono</th><th className="p-4">Ocupación</th><th className="p-4">Motivo</th><th className="p-4 text-center">Cita Pendiente</th></tr></thead>
                <tbody className="divide-y divide-gray-50 text-sm text-dark font-medium">
                  {filtrados.map(p => {
                    const tieneCita = todasLasCitas.some(c => c.id_paciente === p.id && c.estado && c.estado.includes('programado'));
                    return (
                      <tr key={p.id} onClick={() => abrirEdicionPaciente(p)} className="hover:bg-surface/60 transition-colors cursor-pointer group">
                        <td className="p-4 font-bold text-primary group-hover:underline">{p.nombre}</td><td className="p-4 text-muted">{p.telefono || '—'}</td><td className="p-4">{p.ocupacion || '—'}</td><td className="p-4 truncate max-w-[200px]">{p.motivo_consulta || '—'}</td><td className="p-4 text-center font-black">{tieneCita ? <span className="text-primary bg-primary/10 px-3 py-1 rounded-full">Sí</span> : <span className="text-muted">No</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : <div className="p-8 text-center text-muted">No hay pacientes registrados aún.</div>}
        </div>
      </div>
    );
  }

  // ================= VISTA: EXPEDIENTE GIGANTE =================
  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      
      <button onClick={() => setVista('lista')} className="text-muted hover:text-dark font-medium flex items-center gap-2">
        <X size={18} /> Cancelar y regresar a la lista
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-10">
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-muted mb-1 ml-2">Fecha de Cita</label><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full p-3 bg-surface border border-gray-200 rounded-full text-dark" /></div>
          <div><label className="block text-sm font-medium text-muted mb-1 ml-2">Hora</label><input type="time" value={hora} onChange={e => setHora(e.target.value)} className="w-full p-3 bg-surface border border-gray-200 rounded-full text-dark" /></div>
          <div><label className="block text-sm font-medium text-muted mb-1 ml-2">Profesional</label><input type="text" list="profesionales" value={profesional} onChange={e => setProfesional(e.target.value)} placeholder="Dra. Hasdra..." className="w-full p-3 bg-surface border border-gray-200 rounded-full text-dark" /><datalist id="profesionales"><option value="Dra. Hasdra Guerrero" /><option value="Dr. Invitado" /></datalist></div>
        </section>

        <section className="p-4 bg-surface rounded-2xl border border-primary/20">
          <label className="block text-sm font-bold text-primary mb-2">Estado de la Cita (Multiselect)</label>
          <select multiple value={estadoCita} onChange={e => setEstadoCita(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-dark" size="5">
            <option value="programado">Programado</option><option value="solicitado">Solicitado</option><option value="llegó">El paciente llegó</option><option value="no_presento">No se presentó</option><option value="cancelado">Cancelado</option>
          </select>
        </section>

        <section>
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2">{datosPaciente.id ? "Editando Datos del Paciente" : "Paciente Nuevo"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nombre completo" value={datosPaciente.nombre} onChange={e=>setDatosPaciente({...datosPaciente, nombre: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl font-bold" />
            <input type="tel" placeholder="Teléfono" value={datosPaciente.telefono} onChange={e=>setDatosPaciente({...datosPaciente, telefono: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl" />
            <input type="date" placeholder="Fecha de Nacimiento" value={datosPaciente.fechaNacimiento} onChange={e=>setDatosPaciente({...datosPaciente, fechaNacimiento: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl" title="Fecha de Nacimiento" />
            <input type="text" placeholder="Ocupación" value={datosPaciente.ocupacion} onChange={e=>setDatosPaciente({...datosPaciente, ocupacion: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl" />
            <input type="text" placeholder="Dirección" value={datosPaciente.direccion} onChange={e=>setDatosPaciente({...datosPaciente, direccion: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl md:col-span-2" />
            <textarea placeholder="Motivo de consulta" value={datosPaciente.motivo} onChange={e=>setDatosPaciente({...datosPaciente, motivo: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl md:col-span-2" rows="2"></textarea>
            <textarea placeholder="Notas generales" value={datosPaciente.notas} onChange={e=>setDatosPaciente({...datosPaciente, notas: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl md:col-span-2" rows="2"></textarea>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2">Asignar Procedimientos al Paciente</h2>
          <div className="bg-surface p-4 rounded-xl border border-gray-200 max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
            {catalogoProcedimientos.map(proc => (
              <label key={proc.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                <input type="checkbox" checked={!!procedimientosSeleccionados.find(p => p.id === proc.id)} onChange={() => toggleProcedimientoPrincipal(proc)} className="w-5 h-5 accent-primary" />
                <span className="flex-1 font-medium">{proc.nombre}</span>
                <span className="text-muted font-bold">${parseFloat(proc.precio_base).toFixed(2)}</span>
              </label>
            ))}
          </div>
          
          {procedimientosSeleccionados.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-bold text-dark mb-3">Programa y agenda los procedimientos:</h3>
              <p className="text-xs text-muted mb-3 italic">Si ingresas fecha y hora, se creará una Cita automáticamente en la agenda al guardar.</p>
              {procedimientosSeleccionados.map(p => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between text-sm mb-3 bg-white p-3 rounded-lg border shadow-sm gap-3">
                  <span className="font-bold text-dark flex-1">{p.nombre}</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted font-bold">Fecha:</label>
                      <input 
                        type="date" 
                        value={p.fecha_procedimiento || ''} 
                        onChange={e => setProcedimientosSeleccionados(procedimientosSeleccionados.map(proc => proc.id === p.id ? {...proc, fecha_procedimiento: e.target.value} : proc))} 
                        className="p-1.5 bg-surface border border-gray-200 rounded text-xs text-dark outline-none focus:border-primary" 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted font-bold">Hora:</label>
                      <input 
                        type="time" 
                        value={p.hora_procedimiento || ''} 
                        onChange={e => setProcedimientosSeleccionados(procedimientosSeleccionados.map(proc => proc.id === p.id ? {...proc, hora_procedimiento: e.target.value} : proc))} 
                        className="p-1.5 bg-surface border border-gray-200 rounded text-xs text-dark outline-none focus:border-primary" 
                      />
                    </div>
                  </div>
                  <span className="font-black text-primary md:w-20 md:text-right">${parseFloat(p.precio_base).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-black text-primary mt-4 pt-3 border-t">
                <span>Costo Total de Procedimientos:</span><span>${totalProcedimientos.toFixed(2)}</span>
              </div>
            </div>
          )}
        </section>

        <section className="p-6 bg-surface border border-gray-200 rounded-2xl">
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2">Sistema de Pagos y Abonos</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-muted mb-1 ml-2">Monto del Abono</label>
              <input type="number" inputMode="decimal" value={montoAbono} onChange={e => setMontoAbono(e.target.value)} placeholder="$ 0.00" className="w-full p-3.5 bg-white border border-gray-200 rounded-full font-bold text-lg text-dark" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-muted mb-1 ml-2">Aplicar abono a:</label>
              <select value={destinoAbono} onChange={e => setDestinoAbono(e.target.value)} className="w-full p-3.5 bg-white border border-gray-200 rounded-full font-bold text-dark focus:outline-none focus:border-primary">
                <option value="total">Abono al Saldo Total</option>
                {procedimientosSeleccionados.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <button onClick={agregarAbono} className="bg-dark hover:bg-black text-white px-6 py-3.5 rounded-full font-bold shadow-sm w-full sm:w-auto shrink-0 transition-transform hover:scale-105">
              Agregar Abono
            </button>
          </div>

          {pagosAgregados.length > 0 && (
            <div className="mt-4 grid gap-2">
              {pagosAgregados.map(pago => (
                <div key={pago.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-sm">
                  <div>
                    <span className="font-bold text-dark">${pago.monto.toFixed(2)}</span>
                    <span className="text-muted ml-2">→ {pago.destinoNombre}</span>
                  </div>
                  <button onClick={() => setPagosAgregados(pagosAgregados.filter(p => p.id !== pago.id))} className="text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-base font-bold text-muted">Abonado: <span className="text-green-600">${totalAbonado.toFixed(2)}</span></span>
            <span className="text-2xl font-black text-danger mt-2 sm:mt-0">Saldo Restante: ${totalAPagar > 0 ? totalAPagar.toFixed(2) : '0.00'}</span>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-[#E8F8F5] border border-[#A2D9CE] rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[#117A65] mb-2 flex items-center gap-2"><MessageCircle size={20} /> Recordatorio WhatsApp</h3>
              <p className="text-sm text-[#148F77] mb-3 italic">"Para confirmar su cita del día: {fecha || '[Sin fecha]'} a las {hora || '[Sin hora]'}..."</p>
            </div>
            <button className="bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-colors mt-2"><MessageCircle size={18} /> Enviar Confirmación WA</button>
          </div>
          <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col justify-center items-center text-center">
            <h3 className="font-bold text-blue-800 mb-2">Enviar Presupuesto PDF</h3>
            <button onClick={generarPresupuestoPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold shadow-sm w-full justify-center"><FileDown size={18} /> Generar PDF con desglose y abonos</button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2 flex justify-between items-center">
            Tratamientos Realizados
            <button onClick={() => setModalTratamiento(true)} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-1"><Plus size={16}/> Agregar</button>
          </h2>
          <div className="flex flex-wrap gap-2">
            {tratamientosGuardados.length === 0 && <span className="text-sm text-muted">Sin tratamientos guardados en esta sesión.</span>}
            {tratamientosGuardados.map((trat, i) => (
              <div key={i} className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-full flex flex-col shadow-sm"><span>{trat.fecha} {trat.hora}</span><span className="opacity-90">{trat.procedimientos.length} proc. / {trat.dientes.length} dientes</span></div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2">Historial Dental (Odontograma)</h2>
          <div className="bg-surface p-2 sm:p-4 rounded-2xl border border-gray-200 overflow-hidden w-full">
            <p className="text-xs text-muted text-center mb-6">Toca un diente para asignarle un padecimiento.</p>
            
            <div className="w-full flex flex-col gap-6 items-center px-1">
              
              {/* FILA SUPERIOR (Maxilar) */}
              <div className="flex justify-between w-full gap-[2px] sm:gap-2">
                {DIENTES_ADULTOS.slice(0, 16).map(diente => {
                  const condicion = historialOdontograma[diente];
                  const fillColor = condicion?.color && condicion.color !== '#FFFFFF' ? condicion.color : 'transparent';
                  const textColor = condicion?.color && condicion.color !== '#FFFFFF' ? condicion.color : '#374151'; 
                  const { d, c } = getToothData(diente);
                  const isMirrored = [21,22,23,24,25,26,27,28].includes(diente);
                  
                  return (
                    <button key={diente} onClick={() => setDienteActivoHistorial(diente)} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 group outline-none min-w-[16px]">
                      <span className="text-[9px] sm:text-xs font-bold transition-colors" style={{ color: textColor }}>{diente}</span>
                      <div className="w-full flex justify-center">
                        <svg viewBox="0 0 100 150" className={`w-full h-auto drop-shadow-sm group-hover:scale-110 transition-transform origin-center ${isMirrored ? '-scale-x-100' : ''}`}>
                          <path d={d} fill={fillColor} stroke="#4B5563" strokeWidth="3" strokeLinejoin="round" />
                          <path d={c} fill="none" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* FILA INFERIOR (Mandíbula) */}
              <div className="flex justify-between w-full gap-[2px] sm:gap-2">
                {DIENTES_ADULTOS.slice(16, 32).map(diente => {
                  const condicion = historialOdontograma[diente];
                  const fillColor = condicion?.color && condicion.color !== '#FFFFFF' ? condicion.color : 'transparent';
                  const textColor = condicion?.color && condicion.color !== '#FFFFFF' ? condicion.color : '#374151';
                  const { d, c } = getToothData(diente);
                  const isMirrored = [31,32,33,34,35,36,37,38].includes(diente);
                  
                  return (
                    <button key={diente} onClick={() => setDienteActivoHistorial(diente)} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 group outline-none min-w-[16px]">
                      <div className="w-full flex justify-center">
                        <svg viewBox="0 0 100 150" className={`w-full h-auto drop-shadow-sm group-hover:scale-110 transition-transform origin-center ${isMirrored ? '-scale-x-100' : ''}`}>
                          <path d={d} fill={fillColor} stroke="#4B5563" strokeWidth="3" strokeLinejoin="round" />
                          <path d={c} fill="none" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="text-[9px] sm:text-xs font-bold transition-colors" style={{ color: textColor }}>{diente}</span>
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
          </div>
          
          <div className="mt-4">
            <label className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="text-muted mb-2" size={28} />
              <span className="text-sm font-bold text-muted">Subir Imágenes del Paciente</span>
              <input type="file" multiple accept="image/*" onChange={handleImagenUpload} className="hidden" />
            </label>
            {imagenes.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {imagenes.map((img, i) => (
                  <img key={i} src={`https://dentalix.lat/${img.ruta_imagen}`} alt="Archivo Clínico" onClick={() => setImagenEnGrande(`https://dentalix.lat/${img.ruta_imagen}`)} className="w-20 h-20 object-cover rounded-xl cursor-pointer border-2 border-gray-200 hover:border-primary shadow-sm" />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2">Anamnesis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {ANAMNESIS_ITEMS.map((item, idx) => {
              const state = anamnesis[idx].estado;
              const bgClass = state === '?' ? 'bg-gray-100 text-gray-500' : state === 'No' ? 'bg-green-100 text-green-700' : 'bg-danger/10 text-danger';
              return (
                <div key={idx} className="flex flex-col bg-white border border-gray-100 p-2 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center gap-2"><span className="text-sm font-medium leading-tight text-dark flex-1">{item}</span><button onClick={() => handleAnamnesisClick(idx)} className={`w-10 h-8 rounded-lg font-black text-sm flex items-center justify-center shrink-0 transition-colors ${bgClass}`}>{state}</button></div>
                  {state === 'Si' && <input type="text" placeholder="Especifique..." value={anamnesis[idx].detalle} onChange={(e) => setAnamnesis({...anamnesis, [idx]: {...anamnesis[idx], detalle: e.target.value}})} className="mt-2 w-full p-2 bg-surface border border-gray-200 rounded text-xs" />}
                </div>
              )
            })}
          </div>
        </section>

      </div>

      <button onClick={guardarCitaYRegresar} className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-full font-black text-lg shadow-lg flex justify-center items-center gap-2 transition-transform hover:scale-[1.01]">
        <Check size={24} /> Guardar Expediente de Paciente
      </button>

      {/* Modal Visor Imagen */}
      {imagenEnGrande && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setImagenEnGrande(null)}>
          <img src={imagenEnGrande} className="max-w-full max-h-full rounded-lg object-contain" />
          <button className="absolute top-4 right-4 text-white hover:text-danger"><X size={32}/></button>
        </div>
      )}

      {/* Modal Tratamiento */}
      {modalTratamiento && (
        <div className="fixed inset-0 bg-dark/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl mt-20 sm:mt-0">
            <h3 className="text-xl font-bold mb-4">Agregar Tratamiento Realizado</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="block text-xs font-bold text-muted">Fecha</label><input type="date" value={tratamientoTemp.fecha} onChange={e=>setTratamientoTemp({...tratamientoTemp, fecha: e.target.value})} className="w-full p-2 bg-surface rounded" /></div>
              <div><label className="block text-xs font-bold text-muted">Hora</label><input type="time" value={tratamientoTemp.hora} onChange={e=>setTratamientoTemp({...tratamientoTemp, hora: e.target.value})} className="w-full p-2 bg-surface rounded" /></div>
            </div>
            <label className="block text-xs font-bold text-muted mb-2">Procedimientos realizados (Selección múltiple)</label>
            <select multiple value={tratamientoTemp.procedimientos} onChange={e=>setTratamientoTemp({...tratamientoTemp, procedimientos: Array.from(e.target.selectedOptions, o=>o.value)})} className="w-full p-2 bg-surface rounded border mb-4 h-24 text-sm" size="3">
              {catalogoProcedimientos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
            <label className="block text-xs font-bold text-muted mb-2">Dientes aplicados (Múltiple)</label>
            <select multiple value={tratamientoTemp.dientes} onChange={e=>setTratamientoTemp({...tratamientoTemp, dientes: Array.from(e.target.selectedOptions, o=>o.value)})} className="w-full p-2 bg-surface rounded border mb-6 h-24 text-sm font-mono" size="3">
              {DIENTES_ADULTOS.map(d => <option key={d} value={d}>Diente {d}</option>)}
            </select>
            <div className="flex gap-4">
              <button onClick={() => setModalTratamiento(false)} className="flex-1 py-3 font-bold text-muted bg-surface rounded-full">Cancelar</button>
              <button onClick={guardarTratamiento} className="flex-1 py-3 font-bold text-white bg-primary rounded-full">Agregar Tratamiento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}