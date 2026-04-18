'use client';

import { useEffect, useState } from 'react';

interface CalEvent {
  id:    string;
  title: string;
  date:  string;
  type:  'project' | 'proposal';
  meta:  string;
  extra: string;
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function CalendarPage() {
  const today    = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ date: string; events: CalEvent[] } | null>(null);

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(d => { setEvents(d); setLoading(false); });
  }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth  = getDaysInMonth(year, month);
  const firstDayIdx  = getFirstDayOfMonth(year, month);
  const totalCells   = Math.ceil((firstDayIdx + daysInMonth) / 7) * 7;

  const eventsForDate = (dateStr: string) => events.filter(e => e.date === dateStr);

  const formatDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Calendario</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />Proyecto deadline</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Propuesta enviada</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Header mes */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white">{MONTH_NAMES[month]} {year}</h2>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-gray-800">
          {DAY_NAMES.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }, (_, i) => {
            const dayNum  = i - firstDayIdx + 1;
            const isValid = dayNum >= 1 && dayNum <= daysInMonth;
            const dateStr = isValid ? formatDate(dayNum) : '';
            const dayEvts = isValid ? eventsForDate(dateStr) : [];
            const isToday = dateStr === today.toISOString().split('T')[0];

            return (
              <div
                key={i}
                onClick={() => isValid && dayEvts.length > 0 && setSelected({ date: dateStr, events: dayEvts })}
                className={`min-h-24 p-2 border-b border-r border-gray-800 transition-colors ${isValid && dayEvts.length > 0 ? 'cursor-pointer hover:bg-gray-800/50' : ''} ${!isValid ? 'bg-gray-900/30' : ''}`}
              >
                {isValid && (
                  <>
                    <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${isToday ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>
                      {dayNum}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvts.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${ev.type === 'project' ? 'bg-orange-900/40 text-orange-300' : 'bg-blue-900/40 text-blue-300'}`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvts.length > 3 && (
                        <p className="text-xs text-gray-500 pl-1">+{dayEvts.length - 3} más</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Próximos eventos */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">Próximos Eventos</h3>
        {events
          .filter(e => e.date >= today.toISOString().split('T')[0])
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 8)
          .map(e => (
            <div key={e.id} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${e.type === 'project' ? 'bg-orange-500' : 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{e.title}</p>
                <p className="text-xs text-gray-500">{e.type === 'project' ? 'Deadline proyecto' : 'Propuesta enviada'} · {e.meta}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {new Date(e.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          ))}
        {events.filter(e => e.date >= today.toISOString().split('T')[0]).length === 0 && (
          <p className="text-gray-500 text-sm">No hay eventos próximos.</p>
        )}
      </div>

      {/* Modal día */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">
                {new Date(selected.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {selected.events.map(e => (
                <div key={e.id} className={`p-3 rounded-lg border ${e.type === 'project' ? 'bg-orange-900/20 border-orange-800/50' : 'bg-blue-900/20 border-blue-800/50'}`}>
                  <p className={`text-sm font-medium ${e.type === 'project' ? 'text-orange-300' : 'text-blue-300'}`}>{e.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {e.type === 'project' ? `Deadline · ${e.meta}` : `Propuesta enviada · $${parseInt(e.extra).toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
