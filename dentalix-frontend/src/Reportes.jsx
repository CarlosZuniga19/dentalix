import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Calendar as CalendarIcon, 
  UserX, 
  BellRing, 
  ChevronRight,
  X,
  ChevronLeft,
  ChevronRight as ArrowRight
} from 'lucide-react';
import { useAppContext } from './App';

export default function Reportes() {
  const [vista, setVista] = useState('menu'); // 'menu', 'ingresos', 'facturas', 'citas', 'cancelaciones', 'recordar'
  const { setBackAction } = useAppContext();

  // Control del botón flotante global Atrás
  useEffect(() => {
    if (vista !== 'menu') {
      setBackAction(() => () => setVista('menu'));
    } else {
      setBackAction(null);
    }
    return () => setBackAction(null);
  }, [vista, setBackAction]);

  // ================= COMPONENTES REUTILIZABLES PARA LA UI =================

  // Tarjeta del menú principal
  const MenuCard = ({ icon: Icon, title, description, colorClass, bgClass, onClick }) => (
    <button 
      onClick={onClick}
      className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-primary/30 hover:shadow-md transition-all flex items-center justify-between group text-left w-full"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass} transition-transform group-hover:scale-105`}>
          <Icon size={28} />
        </div>
        <div>
          <h3 className="font-bold text-dark text-lg mb-0.5">{title}</h3>
          <p className="text-xs text-muted leading-tight">{description}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted group-hover:bg-primary group-hover:text-white transition-colors shrink-0 ml-2">
        <ChevronRight size={18} />
      </div>
    </button>
  );

  // Tarjeta de Métrica (KPI)
  const KPICard = ({ title, value, subtitle, fullWidth = false }) => (
    <div className={`bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
      <span className="text-sm font-bold text-muted mb-2">{title}</span>
      <span className="text-3xl font-black text-dark mb-1">{value}</span>
      {subtitle && <span className="text-xs font-medium text-muted">{subtitle}</span>}
    </div>
  );

  // Selector de Filtro (Cápsula)
  const FilterSelect = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-muted ml-3 mb-1 uppercase tracking-wider">{label}</span>
      <select className="bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm font-bold text-dark outline-none focus:border-primary shadow-sm appearance-none min-w-[140px] text-center">
        <option>{value}</option>
        <option>Mes</option>
        <option>Año</option>
      </select>
    </div>
  );

  // Selector de Fecha (Cápsula)
  const DateSelector = ({ dateRange }) => (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-muted ml-3 mb-1 uppercase tracking-wider text-center">Cuando</span>
      <div className="bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm font-bold text-dark shadow-sm flex items-center justify-between min-w-[200px]">
        <button className="text-muted hover:text-primary"><ChevronLeft size={16} /></button>
        <span>{dateRange}</span>
        <button className="text-muted hover:text-primary"><ArrowRight size={16} /></button>
      </div>
    </div>
  );

  // Contenedor Placeholder para Gráficas
  const ChartPlaceholder = ({ title, yLabel, yMax, xLabels }) => (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mt-4">
      <h3 className="font-bold text-dark text-lg mb-6">{title}</h3>
      <div className="relative h-64 w-full flex">
        {/* Eje Y */}
        <div className="flex flex-col justify-between items-end pr-3 text-xs text-muted font-medium pb-6">
          <span>{yMax}</span>
          <span>$0</span>
        </div>
        {/* Área de gráfica */}
        <div className="flex-1 border-l border-b border-gray-200 relative">
          {/* Línea horizontal central para diseño */}
          <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-200"></div>
          {/* Aquí iría la librería de gráficas real (Recharts, Chart.js, etc.) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-300">Área del gráfico</span>
          </div>
        </div>
      </div>
      {/* Eje X */}
      <div className="flex justify-between items-center ml-8 mt-3 text-xs text-muted font-medium">
        {xLabels.map((lbl, idx) => (
          <span key={idx}>{lbl}</span>
        ))}
      </div>
    </div>
  );

  // ================= VISTAS DE REPORTES =================

  if (vista === 'menu') {
    return (
      <div className="max-w-4xl mx-auto pb-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Reportes y Estadísticas</h1>
          <p className="text-muted text-sm mt-1">Selecciona una categoría para ver los detalles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MenuCard 
            icon={TrendingUp} 
            title="Ingresos" 
            description="Producción y pagos recaudados." 
            bgClass="bg-green-100" 
            colorClass="text-green-600"
            onClick={() => setVista('ingresos')}
          />
          <MenuCard 
            icon={FileText} 
            title="Facturas pendientes" 
            description="Saldos pendientes por cobrar." 
            bgClass="bg-orange-100" 
            colorClass="text-orange-600"
            onClick={() => setVista('facturas')}
          />
          <MenuCard 
            icon={CalendarIcon} 
            title="Citas" 
            description="Volumen y estado en el tiempo." 
            bgClass="bg-blue-100" 
            colorClass="text-blue-600"
            onClick={() => setVista('citas')}
          />
          <MenuCard 
            icon={UserX} 
            title="Cancelaciones" 
            description="Citas perdidas e ingresos perdidos." 
            bgClass="bg-red-100" 
            colorClass="text-red-600"
            onClick={() => setVista('cancelaciones')}
          />
          <MenuCard 
            icon={BellRing} 
            title="Recordar" 
            description="Pacientes vencidos para revisión." 
            bgClass="bg-purple-100" 
            colorClass="text-purple-600"
            onClick={() => setVista('recordar')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      <button onClick={() => setVista('menu')} className="text-muted hover:text-dark font-medium flex items-center gap-2 mb-2">
        <X size={18} /> Cancelar y regresar a reportes
      </button>

      {/* VISTA 1: INGRESOS */}
      {vista === 'ingresos' && (
        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-dark mb-1">Ingresos</h2>
            <p className="text-sm text-muted">Producción es el valor de las citas completadas;<br/>Recaudado es lo que los pacientes pagaron realmente.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <FilterSelect label="Granularidad" value="Semana" />
            <DateSelector dateRange="Apr 19 - Jul 17" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard title="Cobrado" value="$0" />
            <KPICard title="Producción" value="$0" />
            <KPICard title="Tasa de cobro" value="—" subtitle="Recaudado / Producción" fullWidth />
          </div>

          <ChartPlaceholder 
            title="Producción vs Cobrado" 
            yMax="$1" 
            xLabels={['13 Apr 26', '4 May 26', '25 May 26', '15 Jun 26', '6 Jul 26']}
          />
          
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-600 rounded"></div><span className="text-sm font-bold text-muted">Producción</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#14B8A6] rounded"></div><span className="text-sm font-bold text-muted">Cobrado</span></div>
          </div>
        </div>
      )}

      {/* VISTA 2: FACTURAS PENDIENTES */}
      {vista === 'facturas' && (
        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-dark mb-1">Facturas Pendientes</h2>
            <p className="text-sm text-muted">Saldos abiertos de facturas emitidas en el período seleccionado, categorizados por antigüedad para saber a quién gestionar primero.</p>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <DateSelector dateRange="Apr 19 - Jul 17" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard title="Total pendiente" value="$0" />
            <KPICard title="Vencido" value="$0" subtitle="0 facturas" />
            <KPICard title="Facturas pendientes" value="0" fullWidth />
          </div>

          <ChartPlaceholder 
            title="Pendiente por antigüedad (días)" 
            yMax="90+" 
            xLabels={['$0']}
          />
        </div>
      )}

      {/* VISTA 3: CITAS */}
      {vista === 'citas' && (
        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-dark mb-1">Citas</h2>
            <p className="text-sm text-muted">Qué tan ocupada está la clínica y cómo terminan las citas.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <FilterSelect label="Estado" value="Todo" />
            <FilterSelect label="Granularidad" value="Semana" />
            <DateSelector dateRange="Apr 19 - Jul 17" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard title="Citas" value="0" />
            <KPICard title="Completado" value="0" />
            <KPICard title="Próximos" value="0" fullWidth />
          </div>

          <ChartPlaceholder 
            title="Citas por estado" 
            yMax="1" 
            xLabels={['13 Apr 26', '4 May 26', '25 May 26', '15 Jun 26', '6 Jul 26']}
          />
        </div>
      )}

      {/* VISTA 4: CANCELACIONES */}
      {vista === 'cancelaciones' && (
        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-dark mb-1">No-shows</h2>
            <p className="text-sm text-muted">Costo de citas no presentadas y qué miembros del equipo tienen más pacientes que las pierden.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <FilterSelect label="Granularidad" value="Semana" />
            <DateSelector dateRange="Apr 19 - Jul 17" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard title="Tasa de inasistencia" value="0%" subtitle="de citas completadas + citas perdidas" />
            <KPICard title="No-shows" value="0" />
            <KPICard title="Ingresos perdidos" value="$0" fullWidth />
          </div>

          <ChartPlaceholder 
            title="Tasa de inasistencia" 
            yMax="1%" 
            xLabels={['13 Apr 26', '4 May 26', '25 May 26', '15 Jun 26', '6 Jul 26']}
          />
        </div>
      )}

      {/* VISTA 5: RECORDAR */}
      {vista === 'recordar' && (
        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-dark mb-1">Recordatorio</h2>
            <p className="text-sm text-muted">Pacientes cuya última cita fue hace más de 6 meses sin citas programadas — lista para contactar esta semana.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard title="Vencido para cita de control" value="0" subtitle="6-12 meses desde la última visita" />
            <KPICard title="Inactivos" value="0" subtitle="12+ meses desde la última visita" />
            <KPICard title="Reservado con anticipación" value="0" fullWidth />
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex items-center justify-center mt-6">
            <span className="text-lg font-bold text-muted text-center">¡Ningún paciente se atrasa en el control. ¡Excelente!</span>
          </div>
        </div>
      )}

    </div>
  );
}