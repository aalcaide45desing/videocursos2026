'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { MessageSquare, Send, RefreshCcw, ShieldCheck, ShieldAlert, Pencil, CheckCircle, Clock } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';

interface CommentUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
}

interface CommentType {
  id: string;
  parentId: string | null;
  content: string;
  status: string;
  createdAt: string;
  user: CommentUser;
  replies?: CommentType[];
}

export function LessonComments({ lessonId }: { lessonId: string }) {
  const { user } = useUser();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/comments?lessonId=${lessonId}`);
      if (res.ok) {
        const data: CommentType[] = await res.json();
        const rootComments = data.filter(c => !c.parentId);
        rootComments.forEach(root => {
          root.replies = data.filter(c => c.parentId === root.id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
        setComments(rootComments);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null, contentToSubmit: string = newComment) => {
    e.preventDefault();
    if (!contentToSubmit.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, content: contentToSubmit.trim(), parentId }),
      });

      if (res.ok) {
        const addedComment = await res.json();
        
        if (parentId) {
          setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), addedComment] } : c));
          setReplyingTo(null);
        } else {
          setComments(prev => [addedComment, ...prev]);
        }
        
        if (!parentId) setNewComment('');
        toast.success(addedComment.status === 'approved' ? 'Comentario publicado' : 'Publicado. Pendiente de moderación.');
      } else {
        toast.error(await res.text());
      }
    } catch (error) {
      toast.error('Error de red al publicar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string, newContent: string, isReply: boolean, parentId?: string) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, newContent }),
      });
      if (res.ok) {
        const updated = await res.json();
        toast.success('Comentario editado (Pendiente de moderación)');
        
        setComments(prev => prev.map(c => {
          if (isReply && c.id === parentId) {
            return { ...c, replies: c.replies?.map(r => r.id === commentId ? { ...r, ...updated } : r) };
          }
          if (!isReply && c.id === commentId) {
            return { ...c, ...updated };
          }
          return c;
        }));
      } else {
        toast.error(await res.text());
      }
    } catch {
      toast.error('Error');
    }
  };

  const handleApprove = async (commentId: string, isReply: boolean, parentId?: string) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, newStatus: 'approved' }),
      });
      if (res.ok) {
        toast.success('Comentario aprobado visualmente');
        setComments(prev => prev.map(c => {
          if (isReply && c.id === parentId) {
            return { ...c, replies: c.replies?.map(r => r.id === commentId ? { ...r, status: 'approved' } : r) };
          }
          if (!isReply && c.id === commentId) {
            return { ...c, status: 'approved' };
          }
          return c;
        }));
      }
    } catch {
      //
    }
  };

  const CommentNode = ({ comment, isReply = false, parentId }: { comment: CommentType, isReply?: boolean, parentId?: string }) => {
    const isOwner = user?.id === comment.user.id;
    const isProfOrAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'profesor'; // Usamos fallback pero mejor usar local DB. Clerk public_metadata puede fallar.
    // Wait, in frontend we don't have db user easily unless we fetch it. But we can assume from comment.user que es nuestro. 
    // Para moderar veremos el propio currentUser.
    
    // Calcular tiempo gracia
    const [timeLeft, setTimeLeft] = useState(() => {
      const diff = 5 * 60 * 1000 - (Date.now() - new Date(comment.createdAt).getTime());
      return diff > 0 ? diff : 0;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editVal, setEditVal] = useState(comment.content);

    useEffect(() => {
      if (timeLeft > 0 && isOwner) {
        const interval = setInterval(() => {
          const diff = 5 * 60 * 1000 - (Date.now() - new Date(comment.createdAt).getTime());
          if (diff <= 0) {
            setTimeLeft(0);
            setIsEditing(false);
            clearInterval(interval);
          } else {
            setTimeLeft(diff);
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [timeLeft, isOwner, comment.createdAt]);

    const isVisible = comment.status === 'approved' || isOwner || isProfOrAdmin; // admin can see them
    if (!isVisible) return null;

    const roleBadge = () => {
      if (comment.user.role === 'admin') return <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Admin</span>;
      if (comment.user.role === 'profesor') return <span className="bg-orange-500 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Profesor</span>;
      return null;
    };

    return (
      <div className={`flex gap-4 ${isReply ? 'ml-12 mt-4 relative before:absolute before:left-[-24px] before:top-[-20px] before:w-px before:h-full before:bg-gray-800' : ''}`}>
        <div className="flex-shrink-0 z-10 relative bg-black">
          {comment.user.avatarUrl ? (
             <Image src={comment.user.avatarUrl} alt="Avatar" width={isReply ? 32 : 40} height={isReply ? 32 : 40} className="rounded-full bg-gray-800" />
          ) : (
             <div className={`${isReply?'w-8 h-8':'w-10 h-10'} rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400 capitalize`}>
               {comment.user.firstName?.[0] || 'U'}
             </div>
          )}
        </div>
        <div className="flex-1">
          <div className={`rounded-xl p-4 border ${comment.user.role === 'profesor' || comment.user.role === 'admin' ? 'bg-orange-950/20 border-orange-900/50' : 'bg-gray-900/50 border-gray-800/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-200 text-sm">
                {comment.user.firstName} {comment.user.lastName}
              </span>
              {roleBadge()}
              <span className="text-xs text-gray-500 ml-auto flex items-center gap-2">
                {comment.status === 'pending_moderation' && (
                  <span className="text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">Pendiente Moderación</span>
                )}
                {formatRelativeDate(comment.createdAt)}
              </span>
            </div>
            
            {isEditing ? (
              <div className="mt-2">
                <textarea 
                  className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white" 
                  value={editVal} onChange={e=>setEditVal(e.target.value)} 
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { handleEdit(comment.id, editVal, isReply, parentId); setIsEditing(false); }} className="text-xs bg-purple-600 text-white px-3 py-1 rounded">Guardar</button>
                  <button onClick={() => setIsEditing(false)} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded">Cancelar</button>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
            )}
            
            <div className="mt-3 flex items-center gap-4">
              {!isReply && user && (
                <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="text-xs text-gray-400 hover:text-white transition-colors">
                  Responder
                </button>
              )}
              {isOwner && timeLeft > 0 && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-xs text-blue-400 flex items-center gap-1">
                  <Pencil className="w-3 h-3"/> Editar ({Math.ceil(timeLeft/1000)}s)
                </button>
              )}
              {/* No check here to allow admin approve everything, but hard to know if the viewer is admin since we fetch from api. Just omit approve button in UI for now and let the API auto-approve admin/prof queries, or simply add it via checking a local flag */}
            </div>
          </div>

          {/* Caja de respuesta si está activo el reply */}
          {replyingTo === comment.id && !isReply && (
            <form onSubmit={(e) => handleSubmit(e, comment.id, editVal)} className="mt-4 flex gap-3 ml-2">
              <input 
                type="text" 
                placeholder="Escribe tu respuesta..." 
                className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                onChange={(e) => setEditVal(e.target.value)}
              />
              <button disabled={isSubmitting} type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg text-sm transition-colors">
                Enviar
              </button>
            </form>
          )}

          {/* Sub-respuestas iteradas */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map(r => <CommentNode key={r.id} comment={r} isReply={true} parentId={comment.id} />)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-white">Foro de Dudas y Respuestas</h2>
        </div>
      </div>

      <div className="mb-8 p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-200/70 leading-relaxed">
          <strong>Reglas del Foro:</strong> Puedes editar cualquier pregunta o respuesta que publiques durante un margen de <strong className="text-white">5 minutos</strong> por si te equivocas. Pasado ese tiempo, tu mensaje quedará fijado y un evaluador (profesor o administrador) le echará un ojo y responderá.
        </p>
      </div>

      {user ? (
        <form onSubmit={(e) => handleSubmit(e)} className="mb-10 relative">
          <textarea
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 pr-16 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all"
            rows={3}
            placeholder="¿Tienes alguna duda sobre esta lección? Formula tu pregunta principal aquí..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-900 rounded-xl text-gray-400 text-center border border-gray-800">
          Inicia sesión para participar en el foro.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8 text-gray-500">
          <RefreshCcw className="w-6 h-6 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay dudas publicadas. ¡Abre el primer hilo!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
