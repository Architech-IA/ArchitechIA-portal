'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
  replies: Comment[];
}

export default function CommentsSection({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchComments = () => {
    fetch(`/api/comments?entityType=${entityType}&entityId=${entityId}`)
      .then(r => r.json()).then(setComments).finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(); }, [entityType, entityId]);

  const addComment = async (parentId: string | null = null) => {
    const body = parentId ? replyText : text;
    if (!body.trim()) return;
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) return;

    await fetch('/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body, entityType, entityId, parentId, userId }),
    });
    setText('');
    setReplyText('');
    setReplyingTo(null);
    fetchComments();
  };

  const initials = (name: string) => name.split(' ').filter(w => w).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');

  return (
    <div className="space-y-4">
      {/* Nueva conversación */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 text-black text-xs font-bold">
          {session?.user?.name ? initials(session.user.name) : '?'}
        </div>
        <div className="flex-1 flex gap-2">
          <input type="text" value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addComment()}
            placeholder="Escribe un comentario..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500" />
          <button onClick={() => addComment()} disabled={!text.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
            Enviar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" /></div>
      ) : comments.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-4">Sin comentarios aún. Sé el primero en comentar.</p>
      ) : (
        comments.map(c => (
          <div key={c.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 text-black text-xs font-bold">
                {initials(c.user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{c.user.name}</span>
                  <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-gray-300">{c.text}</p>
                <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                  className="text-xs text-gray-500 hover:text-orange-400 mt-2 transition-colors">
                  {replyingTo === c.id ? 'Cancelar' : 'Responder'}
                </button>

                {/* Respuestas */}
                {c.replies.length > 0 && (
                  <div className="mt-3 ml-2 pl-3 border-l-2 border-gray-700 space-y-3">
                    {c.replies.map(r => (
                      <div key={r.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-500/30 flex items-center justify-center flex-shrink-0 text-orange-400 text-[10px] font-bold">
                          {initials(r.user.name)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{r.user.name}</span>
                            <span className="text-[10px] text-gray-500">{new Date(r.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input de respuesta */}
                {replyingTo === c.id && (
                  <div className="mt-2 flex gap-2">
                    <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addComment(c.id)}
                      placeholder="Escribe una respuesta..."
                      className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-orange-500" />
                    <button onClick={() => addComment(c.id)} disabled={!replyText.trim()}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs hover:bg-orange-700 disabled:opacity-50">Enviar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
