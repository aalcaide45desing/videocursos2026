'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'profesor' | 'alumno' | 'registrado' | 'visitante';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, newRole }),
      });

      if (res.ok) {
        toast.success(`Rol actualizado a ${newRole}`);
        setUsers(users.map(u => u.id === targetUserId ? { ...u, role: newRole as any } : u));
      } else {
        toast.error(await res.text());
      }
    } catch {
      toast.error('Error de red');
    }
  };

  if (loading) return <div className="p-8 text-white">Cargando usuarios...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios y Roles</h1>
        <p className="text-gray-400">Asigna permisos y roles a los miembros de la plataforma.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950/50 text-gray-400 font-medium border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Rol Actual</th>
              <th className="px-6 py-4">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                  </div>
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                    user.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    user.role === 'profesor' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-gray-800 text-gray-300 border-gray-700'
                  }`}>
                    {user.role === 'admin' ? <ShieldAlert className="w-3.5 h-3.5" /> : 
                     user.role === 'profesor' ? <ShieldCheck className="w-3.5 h-3.5" /> : 
                     <Shield className="w-3.5 h-3.5" />}
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    className="bg-black border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="registrado">Registrado (Base)</option>
                    <option value="alumno">Alumno (Legado)</option>
                    <option value="profesor">Profesor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
