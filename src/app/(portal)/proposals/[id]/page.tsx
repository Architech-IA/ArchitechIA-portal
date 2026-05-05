'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Proposal {
  id: string; title: string; description: string; status: string;
  amount: number; sentDate: string | null; acceptedDate: string | null; createdAt: string;
  lead: { id: string; companyName: string; contactName: string; email: string; status: string } | null;
  user: { id: string; name: string; email: string };
  activities: Activity[];
  tasks: Task[];
  documents: Doc[];
}

interface Activity {
  id: string; type: string; description: string; entityType: string;
  createdAt: string; user: { name: string }; notes?: string;
}

interface Task {
  id: string; title: string; completed: boolean; createdAt: string;
}

interface Doc {
  id: string; name: string; url: string; type: string; createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador', cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  { value: 'SENT', label: 'Enviado', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'UNDER_REVIEW', label: 'En Revisión', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'ACCEPTED', label: 'Aceptado', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'REJECTED', label: 'Rechazado', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

function translateStatus(s: string) {
  const t: Record<string, string> = { DRAFT: 'Borrador', SENT: 'Enviado', UNDER_REVIEW: 'En Revisión', ACCEPTED: 'Aceptado', REJECTED: 'Rechazado' };
  return t[s] || s;
}

function translateActivityType(t: string) {
  const m: Record<string, string> = { CREATED: 'Creó', UPDATED: 'Actualizó', STATUS_CHANGED: 'Cambió estado', NOTE_ADDED: 'Agregó nota', PROPOSAL_SENT: 'Envió', MILESTONE_COMPLETED: 'Completó' };
  return m[t] || t;
}

const STATUS_FLOW: Record<string, string[]> = {
  DRAFT: ['DRAFT', 'SENT'],
  SENT: ['SENT', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'],
  UNDER_REVIEW: ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED'],
  ACCEPTED: ['ACCEPTED'],
  REJECTED: ['REJECTED', 'DRAFT'],
};

const LEAD_STAGES = [
  { key: 'NEW',             label: 'Nuevo' },
  { key: 'CONTACTED',       label: 'Contactado' },
  { key: 'DIAGNOSIS',       label: 'Diagnóstico' },
  { key: 'QUALIFIED',       label: 'Calificado' },
  { key: 'DEMO_VALIDATION', label: 'Demo' },
  { key: 'PROPOSAL_SENT',   label: 'Propuesta' },
  { key: 'NEGOTIATION',     label: 'Negociación' },
  { key: 'WON',             label: 'Ganado' },
  { key: 'LOST',            label: 'Perdido' },
];

function getLeadStageIndex(status: string) {
  return LEAD_STAGES.findIndex(s => s.key === status);
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'timeline' | 'tareas' | 'documentos'>('timeline');
  const [newTask, setNewTask] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [addingDoc, setAddingDoc] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const fetchProposal = useCallback(async () => {
    const res = await fetch(`/api/proposals?id=${id}`);
    const data = await res.json();
    const [tasksRes, docsRes] = await Promise.all([
      fetch(`/api/proposals/${id}/tasks`),
      fetch(`/api/proposals/${id}/documents`),
    ]);
    data.tasks = await tasksRes.json();
    data.documents = await docsRes.json();
    setProposal(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProposal(); }, [fetchProposal]);

  const handleStatusChange = async (newStatus: string) => {
    if (!proposal) return;
    setChangingStatus(true);
    await fetch(`/api/proposals/${proposal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...proposal, status: newStatus, userId: proposal.user.id, amount: String(proposal.amount) }),
    });
    setChangingStatus(false);
    fetchProposal();
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || !proposal) return;
    setAddingTask(true);
    await fetch(`/api/proposals/${proposal.id}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask }),
    });
    setNewTask('');
    setAddingTask(false);
    fetchProposal();
  };

  const handleToggleTask = async (task: Task) => {
    await fetch(`/api/proposals/${proposal?.id}/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    fetchProposal();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/proposals/${proposal?.id}/tasks/${taskId}`, { method: 'DELETE' });
    fetchProposal();
  };

  const handleAddDocument = async () => {
    if (!newDocName.trim() || !newDocUrl.trim() || !proposal) return;
    setAddingDoc(true);
    await fetch(`/api/proposals/${proposal.id}/documents`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDocName, url: newDocUrl, type: newDocUrl.startsWith('http') ? 'link' : 'file' }),
    });
    setNewDocName('');
    setNewDocUrl('');
    setAddingDoc(false);
    fetchProposal();
  };

  const handleDeleteDocument = async (docId: string) => {
    await fetch(`/api/proposals/${proposal?.id}/documents`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId }),
    });
    fetchProposal();
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !proposal) return;
    setAddingNote(true);
    const userId = (session?.user as { id?: string })?.id || '';
    await fetch('/api/activities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'NOTE_ADDED', description: noteText, entityType: 'proposal',
        entityId: proposal.id, userId, proposalId: proposal.id,
      }),
    });
    setNoteText('');
    setAddingNote(false);
    fetchProposal();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  if (!proposal) return (
    <div className="p-8 text-center text-gray-500">Propuesta no encontrada.</div>
  );

  const taskProgress = proposal.tasks.length > 0
    ? Math.round((proposal.tasks.filter(t => t.completed).length / proposal.tasks.length) * 100) : 0;

  return (
    <div className="p-8">
      {/* Header + back */}
      <button onClick={() => router.push('/proposals')} className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Volver a Propuestas
      </button>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{proposal.title}</h1>
            <p className="text-gray-400 mt-2">{proposal.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-400 flex-wrap">
              <span>💰 ${proposal.amount.toLocaleString()}</span>
              {proposal.lead && <span>🏢 {proposal.lead.companyName} — {proposal.lead.contactName}</span>}
              <span>👤 {proposal.user.name}</span>
              {proposal.sentDate && <span>📅 Enviado: {new Date(proposal.sentDate).toLocaleDateString('es-ES')}</span>}
              {proposal.acceptedDate && <span className="text-green-400">✅ Aceptado: {new Date(proposal.acceptedDate).toLocaleDateString('es-ES')}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 text-sm font-semibold rounded-full border ${STATUS_OPTIONS.find(o => o.value === proposal.status)?.cls}`}>
              {translateStatus(proposal.status)}
            </span>
            {STATUS_FLOW[proposal.status]?.filter(s => s !== proposal.status).map(s => (
              <button key={s} onClick={() => handleStatusChange(s)} disabled={changingStatus}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  s === 'ACCEPTED' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  s === 'REJECTED' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  s === 'SENT' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                  'bg-gray-700 hover:bg-gray-600 text-white'
                } disabled:opacity-50`}>
                {s === 'DRAFT' ? '↩ Borrador' : s === 'SENT' ? '📤 Enviar' : s === 'UNDER_REVIEW' ? '🔍 Revisar' : s === 'ACCEPTED' ? '✅ Aceptar' : '❌ Rechazar'}
              </button>
            ))}
          </div>
        </div>

        {/* Task progress */}
        {proposal.tasks.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">Progreso de tareas</span>
              <span className="font-semibold text-white">{proposal.tasks.filter(t => t.completed).length}/{proposal.tasks.length} · {taskProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full transition-all" style={{ width: `${taskProgress}%` }} />
            </div>
          </div>
        )}
        {/* Lead Pipeline Timeline */}
        {proposal.lead && (() => {
          const lead = proposal.lead;
          const currentIdx = getLeadStageIndex(lead.status);
          return (
        <div className="mt-5 pt-4 border-t border-gray-800">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pipeline del Lead — {lead.companyName}</p>
          <div className="flex items-center overflow-x-auto pb-2">
            {LEAD_STAGES.filter(s => s.key !== 'LOST' || lead.status === 'LOST').map((stage, i, arr) => {
              const isCompleted = currentIdx >= 0 && i <= currentIdx && lead.status !== 'LOST';
              const isCurrent = i === currentIdx;
              const isLost = lead.status === 'LOST' && stage.key === 'LOST';
              const isPastLost = lead.status === 'LOST' && i < arr.length - 1;
              return (
                <div key={stage.key} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isLost ? 'bg-red-600 text-white' :
                      isCompleted ? 'bg-green-600 text-white' :
                      isCurrent ? 'bg-orange-500 text-white ring-2 ring-orange-500/30' :
                      'bg-gray-700 text-gray-500'
                    }`}>
                      {isCompleted && !isCurrent ? '✓' : isLost ? '✗' : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 text-center leading-tight ${
                      isLost ? 'text-red-400' :
                      isCompleted ? 'text-green-400' :
                      isCurrent ? 'text-orange-400 font-semibold' :
                      'text-gray-600'
                    }`}>{stage.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-0.5 ${
                      isPastLost ? 'bg-red-600/40' :
                      i < currentIdx ? 'bg-green-600' :
                      'bg-gray-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        );})()}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1 w-fit">
        {[
          { key: 'timeline' as const, label: 'Timeline' },
          { key: 'tareas' as const, label: `Tareas (${proposal.tasks.filter(t => !t.completed).length} pend.)` },
          { key: 'documentos' as const, label: `Documentos (${proposal.documents.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="space-y-4">
          {/* Add note */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3">
            <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              placeholder="Escribe una nota o actualización..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500" />
            <button onClick={handleAddNote} disabled={addingNote || !noteText.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
              {addingNote ? '...' : 'Agregar'}
            </button>
          </div>

          {proposal.activities && proposal.activities.length > 0 ? (
            proposal.activities.map((a, i) => (
              <div key={a.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                  {i < proposal.activities.length - 1 && <div className="w-0.5 flex-1 bg-gray-800 mt-1" />}
                </div>
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-orange-400">{translateActivityType(a.type)}</span>
                    <span className="text-xs text-gray-500">· {new Date(a.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-white">{a.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{a.user.name}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-1">Sin actividad aún</p>
              <p className="text-sm">Agrega una nota para empezar el historial.</p>
            </div>
          )}
        </div>
      )}

      {/* Tareas */}
      {tab === 'tareas' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3">
            <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              placeholder="Nueva tarea..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500" />
            <button onClick={handleAddTask} disabled={addingTask || !newTask.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
              {addingTask ? '...' : 'Agregar'}
            </button>
          </div>

          {proposal.tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-1">Sin tareas</p>
              <p className="text-sm">Agrega tareas para hacer seguimiento del avance.</p>
            </div>
          ) : (
            proposal.tasks.map(task => (
              <div key={task.id} className={`bg-gray-900 border rounded-xl p-4 flex items-center gap-3 ${task.completed ? 'border-green-800/50 opacity-60' : 'border-gray-800'}`}>
                <button onClick={() => handleToggleTask(task)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    task.completed ? 'bg-green-600 border-green-600' : 'border-gray-600 hover:border-orange-500'
                  }`}>
                  {task.completed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>
                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</span>
                <button onClick={() => handleDeleteTask(task.id)} className="text-gray-600 hover:text-red-400 transition-colors text-xs">×</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Documentos */}
      {tab === 'documentos' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3 flex-wrap">
            <input type="text" value={newDocName} onChange={e => setNewDocName(e.target.value)}
              placeholder="Nombre del documento"
              className="flex-1 min-w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500" />
            <input type="url" value={newDocUrl} onChange={e => setNewDocUrl(e.target.value)}
              placeholder="URL o enlace"
              className="flex-[2] min-w-48 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500" />
            <button onClick={handleAddDocument} disabled={addingDoc || !newDocName.trim() || !newDocUrl.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
              {addingDoc ? '...' : 'Agregar'}
            </button>
          </div>

          {proposal.documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-1">Sin documentos</p>
              <p className="text-sm">Agrega enlaces a documentos relacionados: propuestas PDF, contratos, specs técnicas, etc.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {proposal.documents.map(doc => (
                <div key={doc.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-8 h-8 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500 truncate">{doc.url}</p>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors">
                    Abrir
                  </a>
                  <button onClick={() => handleDeleteDocument(doc.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors text-xs px-2">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
