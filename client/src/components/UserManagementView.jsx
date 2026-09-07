import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserPlus, Shield, Wrench, HardHat, Eye, 
  CheckSquare, Square, Globe, CheckCircle, XCircle,
  Edit, Trash2, Key, AlertTriangle
} from 'lucide-react';

export const UserManagementView = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'operator',
    language_preference: 'en',
  });
  const [createError, setCreateError] = useState('');

  // Edit User Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editingUser, setEditingUser] = useState(false);
  const [editUserError, setEditUserError] = useState('');

  // Reset Password Modal
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');

  // Delete User Modal
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Operator Assignment Modal
  const [assigningUser, setAssigningUser] = useState(null);
  const [selectedEqIds, setSelectedEqIds] = useState([]);

  const handleOpenEditUser = (u) => {
    setEditUser({
      id: u.id,
      full_name: u.full_name || '',
      username: u.username || '',
      email: u.email || '',
      role: u.role || 'operator',
      language_preference: u.language_preference || 'en',
      is_active: u.is_active,
    });
    setEditUserError('');
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditUserError('');
    try {
      setEditingUser(true);
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editUser.full_name,
          username: editUser.username,
          email: editUser.email,
          role: editUser.role,
          language_preference: editUser.language_preference,
          is_active: editUser.is_active,
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      setShowEditModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setEditUserError(err.message);
    } finally {
      setEditingUser(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetPasswordError('');
    if (!newPassword || newPassword.length < 6) {
      setResetPasswordError('Password must be at least 6 characters');
      return;
    }
    try {
      setResettingPassword(true);
      const res = await fetch(`/api/users/${resetPasswordUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setResetPasswordUser(null);
      setNewPassword('');
      alert('Password updated successfully');
    } catch (err) {
      setResetPasswordError(err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      setDeletingUser(true);
      const res = await fetch(`/api/users/${deleteUserTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      setDeleteUserTarget(null);
      fetchUsers();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingUser(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await fetch('/api/equipment', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEquipmentList(data.equipment);
      }
    } catch (e) {
      console.error('Failed to fetch equipment list', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEquipment();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'operator',
        language_preference: 'en',
      });
      fetchUsers();
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const openAssignmentModal = (targetUser) => {
    setAssigningUser(targetUser);
    const existingIds = (targetUser.assigned_equipment || []).map((e) => e.id);
    setSelectedEqIds(existingIds);
  };

  const toggleEquipmentSelection = (id) => {
    if (selectedEqIds.includes(id)) {
      setSelectedEqIds(selectedEqIds.filter((eqId) => eqId !== id));
    } else {
      setSelectedEqIds([...selectedEqIds, id]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!assigningUser) return;
    try {
      const res = await fetch(`/api/users/${assigningUser.id}/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment_ids: selectedEqIds }),
        credentials: 'include',
      });
      if (res.ok) {
        setAssigningUser(null);
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to save assignments', e);
    }
  };

  const toggleUserActive = async (targetUser) => {
    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !targetUser.is_active }),
        credentials: 'include',
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to toggle active status', e);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800"><Shield size={12} /> {t('roles.admin')}</span>;
      case 'manager':
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800"><Shield size={12} /> {t('roles.manager')}</span>;
      case 'technician':
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800"><Wrench size={12} /> {t('roles.technician')}</span>;
      case 'operator':
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-700/50"><HardHat size={12} /> {t('roles.operator')}</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"><Eye size={12} /> {t('roles.viewer')}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users size={24} className="text-cyan-400" />
            {t('users.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t('users.subtitle')}
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md shadow-cyan-900/30 transition"
          >
            <UserPlus size={16} />
            {t('users.create_user')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">{t('common.loading')}</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Language</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Operator Scoped Machinery</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">@{u.username} • {u.email}</div>
                    </td>
                    <td className="px-4 py-3.5">{getRoleBadge(u.role)}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        <Globe size={11} className="text-cyan-400" />
                        {u.language_preference}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                          <CheckCircle size={12} /> {t('users.active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-medium">
                          <XCircle size={12} /> {t('users.inactive')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {u.role === 'operator' ? (
                        <div className="space-y-1">
                          {u.assigned_equipment && u.assigned_equipment.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.assigned_equipment.map((eq) => (
                                <span
                                  key={eq.id}
                                  className="font-mono text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded"
                                >
                                  {eq.asset_id}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">{t('users.no_assignments')}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">N/A (Plant-wide access)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {u.role === 'operator' && (
                          <button
                            onClick={() => openAssignmentModal(u)}
                            className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/80 rounded text-[11px] font-medium transition"
                          >
                            {t('users.assign_machines')}
                          </button>
                        )}
                        {currentUser?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              title={t('users.edit_user')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => {
                                setResetPasswordUser(u);
                                setNewPassword('');
                                setResetPasswordError('');
                              }}
                              title={t('users.reset_password')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
                            >
                              <Key size={13} />
                            </button>
                            {currentUser.id !== u.id && (
                              <>
                                <button
                                  onClick={() => toggleUserActive(u)}
                                  className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                                    u.is_active
                                      ? 'bg-amber-950/40 hover:bg-amber-950 text-amber-300 border-amber-800'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  {u.is_active ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  onClick={() => setDeleteUserTarget(u)}
                                  title={t('users.delete_user')}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 transition"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Operator Machine Assignment Modal */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardHat size={18} className="text-cyan-400" />
                Assign Machines to {assigningUser.full_name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Operators can only view and request parts for selected machinery (PRD 2.1).
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-950">
              {equipmentList.map((eq) => {
                const isSelected = selectedEqIds.includes(eq.id);
                return (
                  <div
                    key={eq.id}
                    onClick={() => toggleEquipmentSelection(eq.id)}
                    className="p-3 flex items-center justify-between hover:bg-slate-900/60 cursor-pointer transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                          {eq.asset_id}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{eq.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {eq.category} • {eq.area || 'Plant Main'}
                      </div>
                    </div>

                    <div className="text-cyan-400">
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-600" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setAssigningUser(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveAssignments}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow-md shadow-cyan-900/30"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal (Admin Only) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-cyan-400" />
                {t('users.create_user')}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {createError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">{t('users.name')} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Gonzalez"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('users.username')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="mgonzalez"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">{t('users.email')} *</label>
                <input
                  type="email"
                  required
                  placeholder="mgonzalez@cgi.internal"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('users.role')}</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="operator">{t('roles.operator')}</option>
                    <option value="technician">{t('roles.technician')}</option>
                    <option value="manager">{t('roles.manager')}</option>
                    <option value="admin">{t('roles.admin')}</option>
                    <option value="viewer">{t('roles.viewer')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('users.language')}</label>
                  <select
                    value={newUser.language_preference}
                    onChange={(e) => setNewUser({ ...newUser, language_preference: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium shadow-md shadow-cyan-900/30"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal (Admin Only) */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit size={18} className="text-cyan-400" />
                {t('users.edit_modal_title')} (@{editUser.username})
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {editUserError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-300">
                {editUserError}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">{t('users.name')} *</label>
                <input
                  type="text"
                  required
                  value={editUser.full_name}
                  onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('users.username')} *</label>
                  <input
                    type="text"
                    required
                    value={editUser.username}
                    onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('users.role')} *</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="operator">{t('roles.operator')}</option>
                    <option value="technician">{t('roles.technician')}</option>
                    <option value="manager">{t('roles.manager')}</option>
                    <option value="admin">{t('roles.admin')}</option>
                    <option value="viewer">{t('roles.viewer')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">{t('users.email')} *</label>
                <input
                  type="email"
                  required
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('users.language')}</label>
                  <select
                    value={editUser.language_preference}
                    onChange={(e) => setEditUser({ ...editUser, language_preference: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('users.status')}</label>
                  <select
                    value={editUser.is_active ? 'true' : 'false'}
                    onChange={(e) => setEditUser({ ...editUser, is_active: e.target.value === 'true' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="true">{t('users.active')}</option>
                    <option value="false">{t('users.inactive')}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={editingUser}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium shadow-md shadow-cyan-900/30"
                >
                  {editingUser ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal (Admin) */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key size={18} className="text-amber-400" />
                {t('users.reset_password')}
              </h3>
              <button onClick={() => setResetPasswordUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Set a new password for <strong className="text-cyan-400">@{resetPasswordUser.username}</strong> ({resetPasswordUser.full_name}).
            </p>

            {resetPasswordError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-300">
                {resetPasswordError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder={t('users.new_password_placeholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium shadow-md shadow-amber-900/30"
                >
                  {resettingPassword ? t('common.loading') : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal (Admin) */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-900/50 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-950/80 rounded-full border border-red-800">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t('users.delete_user')}</h3>
                <p className="text-xs text-slate-400 font-mono">@{deleteUserTarget.username} - {deleteUserTarget.full_name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              {t('users.delete_user_confirm', { username: deleteUserTarget.username })}
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                disabled={deletingUser}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingUser}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shadow-md shadow-red-950/40"
              >
                {deletingUser ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
