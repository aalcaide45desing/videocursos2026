'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { MessageSquare, Send, RefreshCcw } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import Image from 'next/image';

interface CommentType {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export function LessonComments({ lessonId }: { lessonId: string }) {
  const { user } = useUser();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/comments?lessonId=${lessonId}`);
      if (res.ok) {
        setComments(await res.json());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, content: newComment.trim() }),
      });

      if (res.ok) {
        const addedComment = await res.json();
        setComments((prev) => [addedComment, ...prev]);
        setNewComment('');
      } else {
        alert('Error al publicar. Verifica que tienes acceso al curso.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-white">Foro de Dudas</h2>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 relative">
          <textarea
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 pr-16 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all"
            rows={3}
            placeholder="¿Tienes alguna duda sobre esta lección? Escríbela aquí..."
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
          Inicia sesión para dejar un comentario.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8 text-gray-500">
          <RefreshCcw className="w-6 h-6 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay comentarios aún. ¡Sé el primero!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <div className="flex-shrink-0">
                {comment.user.avatarUrl ? (
                  <Image
                    src={comment.user.avatarUrl}
                    alt={comment.user.firstName || 'Usuario'}
                    width={40}
                    height={40}
                    className="rounded-full bg-gray-800"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400">
                    {(comment.user.firstName?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 bg-gray-900/50 rounded-2xl rounded-tl-none p-4 border border-gray-800/50">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-semibold text-gray-200">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatRelativeDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
