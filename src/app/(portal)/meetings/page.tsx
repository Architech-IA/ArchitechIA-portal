'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  endDate: string | null;
  location: string | null;
  link: string | null;
  attendees: string | null;
  status: string;
  notes: string | null;
  userId: string;
  user: { id: string; name: string; email: string };
  createdAt: string;
}

const EMPTY_FORM = {
  title: '', description: '', type: 'INTERNAL',
  date: '', endDate: '', location: '', link: '',
  attendees: '', status: 'SCHEDULED', notes: '', userId: '',
};

const TYPE_COLORS: Record<string, string> = {
  INTERNAL:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CLIENT:      'bg-orange-500/20 text-orange-400 border-orange-500/30',
  APPOINTMENT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  OTHER:       'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const TYPE_LABELS: Record<string, string> = {
  INTERNAL: 'Reunión Interna', CLIENT: 'Cliente', APPOINTMENT: 'Cita', OTHER: 'Otro',
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/20 text-blue-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

function translateStatus(s: string) {
  return ({ SCHEDULED: 'Programada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' } as Record<string, string>)[s] || s;
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export default function MeetingsPage() {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'calendario' | 'lista'>('calendario');
  const [showModal, setShowModal] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [confirmDel, setConfirmDel] = useState<Meeting | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/meetings').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([m, u]) => { setMeetings(m); setUsers(u); setLoading(false); });
  }, []);

  const openNew = () => {
    setEditMeeting(null);
    setFormError('');
    setForm({ ...EMPTY_FORM, userId: (session?.user as { id?: string })?.id || users[0]?.id || '' });
    setShowModal(true);
  };

  const openEdit = (m: Meeting) => {
    setEditMeeting(m);
    setFormError('');
    setForm({
      title: m.title, description: m.description || '', type: m.type,
      date: new Date(m.date).toISOString().slice(0, 16),
      endDate: m.endDate ? new Date(m.endDate).toISOString().slice(0, 16) : '',
      location: m.location || '', link: m.link || '', attendees: m.attendees || '',
      status: m.status, notes: m.notes || '',
      userId: m.userId,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const url = editMeeting ? `/api/meetings/${editMeeting.id}` : '/api/meetings';
      const method = editMeeting ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) {
        const saved = await res.json();
        setMeetings(prev => editMeeting ? prev.map(m => m.id === saved.id ? saved : m) : [saved, ...prev]);
        setShowModal(false);
      } else {
        const d = await res.json();
        setFormError(d.error || `Error ${res.status}`);
      }
    } catch {
      setFormError('Error de conexión.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await fetch(`/api/meetings/${confirmDel.id}`, { method: 'DELETE' });
      setMeetings(prev => prev.filter(m => m.id !== confirmDel.id));
      setConfirmDel(null);
    } catch { /* ignore */ }
    setDeleting(false);
  };

  const handleStatusToggle = async (meeting: Meeting) => {
    const newStatus = meeting.status === 'COMPLETED' ? 'SCHEDULED' : 'COMPLETED';
    const res = await fetch(`/api/meetings/${meeting.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
    }
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const today = new Date().toISOString().slice(0, 10);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayMeetings = meetings.filter(m => m.date.slice(0, 10) === dateStr);
      days.push({ day: d, date: dateStr, meetings: dayMeetings, isToday: dateStr === today });
    }
    return days;
  }, [viewMonth, viewYear, meetings]);

  const filtered = useMemo(() => {
    return meetings.filter(m => {
      if (filterType && m.type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!m.title.toLowerCase().includes(q) && !(m.attendees || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [meetings, filterType, search]);

  const dayMeetings = selectedDay ? meetings.filter(m => m.date.slice(0, 10) === selectedDay) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Meetings</h1>
          <p className="text-gray-400 mt-1">Calendario de reuniones, citas y actas</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
          + Nueva Reunión
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('calendario')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'calendario' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>Calendario</button>
        <button onClick={() => setTab('lista')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'lista' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>Lista</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total reuniones', value: meetings.length, color: 'text-white' },
          { label: 'Programadas', value: meetings.filter(m => m.status === 'SCHEDULED').length, color: 'text-blue-400' },
          { label: 'Completadas', value: meetings.filter(m => m.status === 'COMPLETED').length, color: 'text-green-400' },
          { label: 'Esta semana', value: meetings.filter(m => {
            const d = new Date(m.date);
            const now = new Date();
            const start = new Date(now); start.setDate(now.getDate() - now.getDay());
            const end = new Date(start); end.setDate(start.getDate() + 7);
            return d >= start && d < end;
          }).length, color: 'text-orange-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {tab === 'calendario' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }}
                className="p-1 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-lg font-semibold text-white">{MONTHS[viewMonth]} {viewYear}</h2>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }}
                className="p-1 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 text-center border-b border-gray-800">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-xs font-medium text-gray-500">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((d, i) => (
                <div
                  key={i}
                  onClick={() => d && setSelectedDay(d.date)}
                  className={`min-h-[80px] p-1.5 border-b border-r border-gray-800/50 cursor-pointer hover:bg-gray-800/30 transition-colors ${
                    d && d.date === selectedDay ? 'bg-orange-600/10 ring-1 ring-inset ring-orange-500/30' : ''
                  } ${d?.isToday ? 'bg-blue-600/5' : ''}`}
                >
                  {d && (
                    <>
                      <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        d.isToday ? 'bg-orange-600 text-white' : 'text-gray-300'
                      }`}>{d.day}</span>
                      <div className="mt-1 space-y-0.5">
                        {d.meetings.slice(0, 3).map(m => (
                          <div key={m.id} className={`text-xs truncate px-1 py-0.5 rounded border ${TYPE_COLORS[m.type] || TYPE_COLORS.OTHER}`}>
                            {m.title}
                          </div>
                        ))}
                        {d.meetings.length > 3 && (
                          <span className="text-xs text-gray-600">+{d.meetings.length - 3} más</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Panel del día seleccionado */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {selectedDay
                ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Selecciona un día'}
            </h3>
            {selectedDay && dayMeetings.length === 0 && (
              <p className="text-gray-500 text-sm">Sin reuniones este día.</p>
            )}
            <div className="space-y-3">
              {dayMeetings.map(m => (
                <div key={m.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[m.status]}`}>
                      {translateStatus(m.status)}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-400">
                    <p>{new Date(m.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      {m.endDate ? ` — ${new Date(m.endDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </p>
                    {m.location && <p>📍 {m.location}</p>}
                    {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 block">🔗 Enlace</a>}
                    {m.attendees && <p>👥 {m.attendees}</p>}
                    {m.notes && <p className="text-gray-500 mt-1 italic border-t border-gray-700 pt-1">📝 {m.notes.slice(0, 150)}{m.notes.length > 150 ? '...' : ''}</p>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openEdit(m)} className="text-xs text-gray-400 hover:text-white">Editar</button>
                    <button onClick={() => handleStatusToggle(m)} className={`text-xs ${m.status === 'COMPLETED' ? 'text-blue-400 hover:text-blue-300' : 'text-green-400 hover:text-green-300'}`}>
                      {m.status === 'COMPLETED' ? 'Reabrir' : 'Completar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filtros lista */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6 flex gap-3 flex-wrap items-center">
            <input type="text" placeholder="Buscar por título o asistentes..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500" />
            {['', 'INTERNAL', 'CLIENT', 'APPOINTMENT', 'OTHER'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filterType === t ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {t === '' ? 'Todas' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="space-y-3">
            {filtered.map(m => (
              <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${m.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' : m.status === 'CANCELLED' ? 'bg-red-900/30 text-red-400' : 'bg-orange-900/30 text-orange-400'}`}>
                      {new Date(m.date).getDate()}
                    </div>
                    <div>
                      <h3 className={`font-semibold text-white ${m.status === 'CANCELLED' ? 'line-through opacity-50' : ''}`}>{m.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${TYPE_COLORS[m.type] || TYPE_COLORS.OTHER}`}>{TYPE_LABELS[m.type] || m.type}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[m.status]}`}>{translateStatus(m.status)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(m)} className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg">Editar</button>
                    <button onClick={() => handleStatusToggle(m)} className={`px-3 py-1 text-xs rounded-lg ${m.status === 'COMPLETED' ? 'bg-blue-900/30 hover:bg-blue-800/50 text-blue-400' : 'bg-green-900/30 hover:bg-green-800/50 text-green-400'}`}>
                      {m.status === 'COMPLETED' ? 'Reabrir' : '✓'}
                    </button>
                    <button onClick={() => setConfirmDel(m)} className="px-3 py-1 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg">×</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-400">
                  <p>📅 {new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date(m.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                  {m.location && <p>📍 {m.location}</p>}
                  {m.attendees && <p>👥 {m.attendees}</p>}
                  <p>👤 {m.user.name}</p>
                </div>
                {m.notes && (
                  <p className="text-sm text-gray-500 mt-3 border-t border-gray-800 pt-3 italic">📝 {m.notes.slice(0, 200)}{m.notes.length > 200 ? '...' : ''}</p>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg mb-2">No hay reuniones</p>
                <p className="text-sm">Crea tu primera reunión con el botón "Nueva Reunión".</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editMeeting ? 'Editar Reunión' : 'Nueva Reunión'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Título</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm">
                    <option value="INTERNAL">Reunión Interna</option>
                    <option value="CLIENT">Cliente</option>
                    <option value="APPOINTMENT">Cita</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha y hora</label>
                  <input type="datetime-local" required value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fin (opcional)</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm [color-scheme:dark]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ubicación</label>
                  <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                    placeholder="Oficina, Virtual, Cliente..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Enlace (Meet/Zoom)</label>
                  <input type="url" value={form.link} onChange={e => setForm({...form, link: e.target.value})}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Asistentes</label>
                <input type="text" value={form.attendees} onChange={e => setForm({...form, attendees: e.target.value})}
                  placeholder="Nombres separados por coma..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Acta / Notas de reunión</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={4}
                  placeholder="Puntos tratados, acuerdos, tareas pendientes..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Estado</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm">
                  <option value="SCHEDULED">Programada</option>
                  <option value="COMPLETED">Completada</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </div>
              {formError && (
                <div className="px-3 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">{formError}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60 text-sm font-medium flex items-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editMeeting ? 'Guardar Cambios' : 'Crear Reunión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Eliminar reunión</h3>
                <p className="text-gray-400 text-sm">¿Eliminar <span className="text-white font-medium">{confirmDel.title}</span>?</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-2">
                {deleting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
