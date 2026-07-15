import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Upload, X, Check, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from './App';

// --- ARREGLOS DE DATOS CLÍNICOS EXACTOS ---
const ANAMNESIS_ITEMS = [
  "Dolor en el pecho", "Enfermedades del corazón", "Algún problema respiratorio", "Asma o fiebre de heno", "Alergias", "Desmayos, convulsiones o epilepsia", "Diabetes", "Hepatitis o enfermedad del hígado", "Artritis - reumatismo", "Úlcera gástrica", "Dolor abdominal", "Dolor de cabeza", "Dolor muscular", "Fiebre frecuente", "Mareos vértigo", "Enfermedad del riñón", "Tuberculosis", "Problemas de presión arterial", "Anemia", "Hemofilia", "Tuvo hemorragias después de extracciones", "Enfermedad mental o problemas emocionales", "Radioterapia o tratamiento para el cáncer", "Enfermedades por transmisión sexual", "Problemas de tiroides", "Enfermedades de la piel", "Ha tenido un crecimiento anormal o tumoración", "Delirio o estado confusional", "Tabaquismo actual", "Alcoholismo actual", "Alcoholismo en el pasado", "¿Ha consumido drogas?", "¿Le han practicado exámenes para detectar SIDA?", "¿Está usted embarazada?", "¿Ya se presentó la menopausia?", "¿Su médico autoriza el tratamiento dental?", "¿Está usted amamantando?", "¿Utiliza algún método anticonceptivo?", "Varicela", "Sarampión", "Rubéola", "Paperas"
];

const CONDICIONES_DENTALES = [
  { nombre: 'Caries', color: '#EF4444' }, { nombre: 'Resina', color: '#3B82F6' },
  { nombre: 'Ausente', color: '#9CA3AF' }, { nombre: 'Tratamiento de conducto radicular', color: '#8B5CF6' },
  { nombre: 'Fractura de corona', color: '#F97316' }, { nombre: 'Sensibilidad', color: '#EAB308' },
  { nombre: 'Reconstrucción', color: '#14B8A6' }, { nombre: 'Corona', color: '#EAB308' },
  { nombre: 'Implante', color: '#06B6D4' }, { fontColor: '#FFFFFF', nombre: 'Puente', color: '#6366F1' },
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

export default function Pacientes() {
  const navigate = useNavigate();
  const location = useLocation();
  const mostrarEstadoCita = location.state?.mostrarEstadoCita || false;

  const [vista, setVista] = useState(mostrarEstadoCita ? 'nuevo' : 'lista');
  const [catalogoProcedimientos, setCatalogoProcedimientos] = useState([]);
  const API_URL = 'https://dentalix.lat/api.php';
  const { setBackAction } = useAppContext();

  const [listaPacientes, setListaPacientes] = useState([]);
  const [busquedaP, setBusquedaP] = useState('');
  const [todasLasCitas, setTodasLasCitas] = useState([]);
  
  const [datosPaciente, setDatosPaciente] = useState({
    nombre: '', telefono: '', notas: '', fechaNacimiento: '1998-01-01', direccion: '', ocupacion: '', motivo: ''
  });

  const [tratamientosGuardados, setTratamientosGuardados] = useState([]);
  const [modalTratamiento, setModalTratamiento] = useState(false);
  const [tratamientoTemp, setTratamientoTemp] = useState({ fecha: '', hora: '', procedimientos: [], dientes: [] });

  const [historialOdontograma, setHistorialOdontograma] = useState({});
  const [dienteActivoHistorial, setDienteActivoHistorial] = useState(null);
  
  const [imagenes, setImagenes] = useState([]);
  const [archivosLocales, setArchivosLocales] = useState([]);
  const [imagenEnGrande, setImagenEnGrande] = useState(null);

  const [anamnesis, setAnamnesis] = useState(
    ANAMNESIS_ITEMS.reduce((acc, _, idx) => ({ ...acc, [idx]: { estado: '?', detalle: '' } }), {})
  );

  // CONTROL DEL BOTÓN ATRÁS GLOBAL
  useEffect(() => {
    if (vista !== 'lista') {
      setBackAction(() => () => setVista('lista'));
    } else {
      setBackAction(null);
    }
    return () => setBackAction(null);
  }, [vista, setBackAction]);

  // ================= CARGA PRINCIPAL DE DATOS =================
  useEffect(() => {
    fetch(`${API_URL}?accion=procedimientos`).then(res => res.json()).then(data => setCatalogoProcedimientos(data || []));
    fetch(`${API_URL}?accion=pacientes`).then(res => res.json()).then(data => setListaPacientes(data || []));
    fetch(`${API_URL}?accion=citas_lista`).then(res => res.json()).then(data => setTodasLasCitas(data || []));
  }, [vista]);

  const cargarImagenes = (idPaciente) => {
    fetch(`${API_URL}?accion=imagenes&id_paciente=${idPaciente}`).then(res => res.json()).then(data => setImagenes(data || []));
  };

  const handleNuevoPaciente = () => {
    setDatosPaciente({ nombre: '', telefono: '', notas: '', fechaNacimiento: '1998-01-01', direccion: '', ocupacion: '', motivo: '' });
    setImagenes([]); 
    setArchivosLocales([]);
    setHistorialOdontograma({});
    setTratamientosGuardados([]);
    setAnamnesis(ANAMNESIS_ITEMS.reduce((acc, _, idx) => ({ ...acc, [idx]: { estado: '?', detalle: '' } }), {}));
    setVista('nuevo');
  };

  const abrirEdicionPaciente = (p) => {
    setDatosPaciente({
      id: p.id, nombre: p.nombre || '', telefono: p.telefono || '', notas: p.notas || '',
      fechaNacimiento: p.fecha_nacimiento || '1998-01-01', direccion: p.direccion || '', ocupacion: p.ocupacion || '', motivo: p.motivo_consulta || ''
    });
    setArchivosLocales([]);

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

  const handleAnamnesisClick = (idx) => {
    const actual = anamnesis[idx].estado;
    let nuevo = '?';
    if (actual === '?') nuevo = 'No'; else if (actual === 'No') nuevo = 'Si';
    setAnamnesis({ ...anamnesis, [idx]: { ...anamnesis[idx], estado: nuevo } });
  };

  const handleImagenUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    // Si el paciente NO existe aún, guardamos las fotos localmente en previsualización
    if (!datosPaciente.id) {
      setArchivosLocales(prev => [...prev, ...files]);
      const previews = files.map(file => ({ ruta_imagen: URL.createObjectURL(file), es_local: true }));
      setImagenes(prev => [...prev, ...previews]);
      return;
    }

    // Si el paciente YA existe, lógica original de subida directa
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
    if (!tratamientoTemp.fecha) { alert("Selecciona una fecha."); return; }
    if (tratamientoTemp.procedimientos.length === 0 || !tratamientoTemp.procedimientos[0]) { alert("Selecciona un procedimiento."); return; }

    setTratamientosGuardados([...tratamientosGuardados, tratamientoTemp]);
    setModalTratamiento(false);
    setTratamientoTemp({ fecha: '', hora: '', procedimientos: [], dientes: [] });
  };

  const guardarExpedienteYRegresar = async () => {
    if (!datosPaciente.nombre) { alert("El nombre del paciente es obligatorio."); return; }

    const payload = {
      paciente: datosPaciente,
      cita: { fecha: '', hora: '', estado: ['programado'] }, 
      procedimientos: [], 
      pagos: [], 
      anamnesis: anamnesis,
      historialOdontograma: historialOdontograma,
      tratamientosGuardados: tratamientosGuardados
    };

    try {
      const res = await fetch(`${API_URL}?accion=guardar_paciente_cita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const textData = await res.text();
      let data;
      
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.error("Crash del servidor PHP detectado:", textData);
        alert("Ocurrió un error interno en el servidor PHP. Revisa la consola.");
        return;
      }

      if (data.success) {
        const idPacienteReal = datosPaciente.id || data.id_paciente || data.id;

        // Subimos las imágenes que estaban en cola esperando el ID del paciente nuevo
        if (archivosLocales.length > 0 && idPacienteReal) {
          for (const file of archivosLocales) {
            const formData = new FormData();
            formData.append('imagen', file);
            formData.append('id_paciente', idPacienteReal);
            await fetch(`${API_URL}?accion=subir_imagen`, { method: 'POST', body: formData });
          }
        }
        
        setVista('lista');
      } else {
        alert("Error al guardar: " + (data.error || data.mensaje || "Error desconocido devuelto por la base de datos."));
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("Error de conexión al servidor.");
    }
  };

  const irACrearCita = () => {
    navigate('/citas', { state: { pacientePreseleccionado: datosPaciente } });
  };

  // --- Lógica Auxiliar para WhatsApp ---
  const getWaLink = (telefono) => {
    if (!telefono) return '#';
    let num = telefono.replace(/\D/g, ''); 
    if (num.length === 10) num = '52' + num;
    return `https://wa.me/${num}`;
  };

  // --- Lógica Auxiliar para Dropdowns de Fecha de Nacimiento ---
  const getFnParts = (fecha) => {
    if (!fecha) return ['1998', '01', '01'];
    const parts = fecha.split('-');
    if (parts.length === 3) return parts;
    return ['1998', '01', '01'];
  };

  const handleFechaNacimiento = (type, value) => {
    const current = getFnParts(datosPaciente.fechaNacimiento);
    let y = current[0], m = current[1], d = current[2];
    if (type === 'year') y = value;
    if (type === 'month') m = value;
    if (type === 'day') d = value;
    setDatosPaciente({ ...datosPaciente, fechaNacimiento: `${y}-${m}-${d}` });
  };

  const [fnYear, fnMonth, fnDay] = getFnParts(datosPaciente.fechaNacimiento);

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
                <thead>
                  <tr className="bg-surface border-b border-gray-100 text-muted font-bold text-xs uppercase">
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Teléfono</th>
                    <th className="p-4 hidden md:table-cell">Ocupación</th>
                    <th className="p-4 hidden md:table-cell">Motivo</th>
                    <th className="p-4 text-center">Cita Pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-dark font-medium">
                  {filtrados.map(p => {
                    const tieneCita = todasLasCitas.some(c => c.id_paciente === p.id && c.estado && c.estado.includes('programado'));
                    return (
                      <tr key={p.id} onClick={() => abrirEdicionPaciente(p)} className="hover:bg-surface/60 transition-colors cursor-pointer group">
                        <td className="p-4 font-bold text-primary group-hover:underline">{p.nombre}</td>
                        <td className="p-4 text-muted">
                          {p.telefono ? (
                            <a 
                              href={getWaLink(p.telefono)} 
                              target="_blank" 
                              rel="noreferrer" 
                              onClick={(e) => e.stopPropagation()} 
                              className="text-[#25D366] hover:underline flex items-center gap-1.5 font-bold"
                            >
                              <MessageCircle size={15} /> {p.telefono}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="p-4 hidden md:table-cell">{p.ocupacion || '—'}</td>
                        <td className="p-4 truncate max-w-[200px] hidden md:table-cell">{p.motivo_consulta || '—'}</td>
                        <td className="p-4 text-center font-black">{tieneCita ? <span className="text-primary bg-primary/10 px-3 py-1 rounded-full">Sí</span> : <span className="text-muted">No</span>}</td>
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

      {/* --- BOTÓN DE CREAR CITA (SOLO VISIBLE SI EL PACIENTE EXISTE) --- */}
      {datosPaciente.id && (
        <div className="bg-[#E8F8F5] border border-[#A2D9CE] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-bold text-[#117A65] text-lg">¿El paciente necesita agendar?</h3>
            <p className="text-sm text-[#148F77]">Ir al módulo de agenda para presupuestar procedimientos o asignar pagos a este paciente.</p>
          </div>
          <button onClick={irACrearCita} className="bg-[#117A65] hover:bg-[#0E6251] text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 font-bold shadow-sm transition-colors w-full sm:w-auto shrink-0">
            <CalendarIcon size={20} /> Asignarle una Cita a {datosPaciente.nombre.split(' ')[0]}
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-10">

        <section>
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2">{datosPaciente.id ? "Expediente Clínico" : "Creando Expediente de Paciente Nuevo"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nombre completo" value={datosPaciente.nombre} onChange={e=>setDatosPaciente({...datosPaciente, nombre: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl font-bold" />
            <input type="tel" placeholder="Teléfono" value={datosPaciente.telefono} onChange={e=>setDatosPaciente({...datosPaciente, telefono: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl" />
            
            {/* TRES DROPDOWNS PARA FECHA DE NACIMIENTO */}
            <div className="flex gap-2 w-full" title="Fecha de Nacimiento">
              <select value={fnYear} onChange={e => handleFechaNacimiento('year', e.target.value)} className="w-1/3 p-3 bg-surface border border-gray-200 rounded-xl text-dark font-medium outline-none focus:border-primary">
                <option value="" disabled>Año</option>
                {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={fnMonth} onChange={e => handleFechaNacimiento('month', e.target.value)} className="w-1/3 p-3 bg-surface border border-gray-200 rounded-xl text-dark font-medium outline-none focus:border-primary">
                <option value="" disabled>Mes</option>
                {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => {
                   const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                   return <option key={m} value={m}>{nombresMeses[i]}</option>
                })}
              </select>
              <select value={fnDay} onChange={e => handleFechaNacimiento('day', e.target.value)} className="w-1/3 p-3 bg-surface border border-gray-200 rounded-xl text-dark font-medium outline-none focus:border-primary">
                <option value="" disabled>Día</option>
                {Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <input type="text" placeholder="Ocupación" value={datosPaciente.ocupacion} onChange={e=>setDatosPaciente({...datosPaciente, ocupacion: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl" />
            <input type="text" placeholder="Dirección" value={datosPaciente.direccion} onChange={e=>setDatosPaciente({...datosPaciente, direccion: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl md:col-span-2" />
            <textarea placeholder="Motivo de consulta" value={datosPaciente.motivo} onChange={e=>setDatosPaciente({...datosPaciente, motivo: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl md:col-span-2" rows="2"></textarea>
            <textarea placeholder="Notas generales" value={datosPaciente.notas} onChange={e=>setDatosPaciente({...datosPaciente, notas: e.target.value})} className="w-full p-3 bg-surface border border-gray-200 rounded-xl md:col-span-2" rows="2"></textarea>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-dark mb-4 border-b pb-2 flex justify-between items-center">
            Tratamientos Realizados en Clínica
            <button onClick={() => setModalTratamiento(true)} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-1"><Plus size={16}/> Agregar</button>
          </h2>
          <div className="flex flex-wrap gap-2">
            {tratamientosGuardados.length === 0 && <span className="text-sm text-muted">Sin tratamientos guardados en este expediente.</span>}
            {tratamientosGuardados.map((trat, i) => (
              <div key={i} className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-full flex flex-col shadow-sm">
                <span>{trat.fecha}</span>
                <span className="opacity-90">{trat.procedimientos.length} proc. / {trat.dientes.length} dientes</span>
              </div>
            ))}
          </div>
        </section>

      {/* AQUI CERRAMOS LA CAJA BLANCA PRINCIPAL PARA DEJAR LIBRE AL ODONTOGRAMA */}
      </div>

      {/* ================= SECCIÓN ODONTOGRAMA ================= */}
      <section className="w-full py-6">
        <div className="px-2 sm:px-8 mb-8">
          <h2 className="text-xl font-bold text-dark mb-2 border-b border-gray-200 pb-2">Historial Dental (Odontograma)</h2>
          <p className="text-xs text-muted">Toca un diente para asignarle un padecimiento.</p>
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
      
      {/* AQUI ABRIMOS LA CAJA BLANCA DE NUEVO PARA LO RESTANTE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-10">

        <section>
          <label className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload className="text-muted mb-2" size={28} />
            <span className="text-sm font-bold text-muted">Subir Imágenes del Paciente</span>
            <input type="file" multiple accept="image/*" onChange={handleImagenUpload} className="hidden" />
          </label>
          {imagenes.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {imagenes.map((img, i) => {
                // Validación para renderizar rutas locales vs del servidor
                const imageSrc = img.es_local ? img.ruta_imagen : `https://dentalix.lat/${img.ruta_imagen}`;
                return (
                  <img key={i} src={imageSrc} alt="Archivo Clínico" onClick={() => setImagenEnGrande(imageSrc)} className="w-20 h-20 object-cover rounded-xl cursor-pointer border-2 border-gray-200 hover:border-primary shadow-sm shrink-0" />
                );
              })}
            </div>
          )}
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

      <button onClick={guardarExpedienteYRegresar} className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-full font-black text-lg shadow-lg flex justify-center items-center gap-2 transition-transform hover:scale-[1.01]">
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
            <div className="mb-4">
              <label className="block text-xs font-bold text-muted mb-1">Fecha del procedimiento</label>
              <input type="date" value={tratamientoTemp.fecha} onChange={e=>setTratamientoTemp({...tratamientoTemp, fecha: e.target.value})} className="w-full p-2 bg-surface rounded border border-gray-200 outline-none focus:border-primary" />
            </div>
            
            <label className="block text-xs font-bold text-muted mb-2">Procedimiento realizado (Selecciona uno solo)</label>
            <select 
              value={tratamientoTemp.procedimientos[0] || ''} 
              onChange={e=>setTratamientoTemp({...tratamientoTemp, procedimientos: [e.target.value]})} 
              className="w-full p-2 bg-surface rounded border border-gray-200 mb-4 h-32 text-sm outline-none focus:border-primary" 
              size="5"
            >
              {catalogoProcedimientos.map(p => <option key={p.id} value={p.nombre} className="p-1">{p.nombre}</option>)}
            </select>
            
            <label className="block text-xs font-bold text-muted mb-2">Dientes aplicados (Múltiple)</label>
            <select multiple value={tratamientoTemp.dientes} onChange={e=>setTratamientoTemp({...tratamientoTemp, dientes: Array.from(e.target.selectedOptions, o=>o.value)})} className="w-full p-2 bg-surface rounded border border-gray-200 mb-6 h-32 text-sm font-mono outline-none focus:border-primary" size="5">
              {DIENTES_ADULTOS.map(d => <option key={d} value={d} className="p-1">Diente {d}</option>)}
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