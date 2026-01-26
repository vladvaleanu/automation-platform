/**
 * Settings Users Page - User management (admin only)
 */

import { useState, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, UserListItem, Role, CreateUserData, UpdateUserData } from '../api/users';
import { showError, showSuccess } from '../utils/toast.utils';
import { getErrorMessage } from '../utils/error.utils';
import { Button, Card, PageHeader, Badge, Modal, ModalFooter, Input, Select, FormField, EmptyState, LoadingState } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ConfirmModal';

interface UserRowProps {
  user: UserListItem;
  onEdit: (user: UserListItem) => void;
  onChangeRole: (user: UserListItem) => void;
  onResetPassword: (user: UserListItem) => void;
  onToggleStatus: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
}

const UserRow = memo(({ user, onEdit, onChangeRole, onResetPassword, onToggleStatus, onDelete }: UserRowProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <tr>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {user.firstName?.[0] || user.username[0].toUpperCase()}
              {user.lastName?.[0] || ''}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{user.username}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {user.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="info" size="sm">
          {user.roles[0]?.name || 'No role'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge
          variant={user.isActive ? 'success' : 'error'}
          size="sm"
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatDate(user.lastLogin)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <Button variant="link" size="sm" onClick={() => onEdit(user)}>
          Edit
        </Button>
        <Button variant="link" size="sm" onClick={() => onChangeRole(user)}>
          Role
        </Button>
        <Button variant="link" size="sm" onClick={() => onResetPassword(user)} className="text-yellow-600 dark:text-yellow-400">
          Reset
        </Button>
        <Button variant="link" size="sm" onClick={() => onToggleStatus(user)} className="text-orange-600 dark:text-orange-400">
          {user.isActive ? 'Disable' : 'Enable'}
        </Button>
        <Button variant="link" size="sm" onClick={() => onDelete(user)} className="text-red-600 dark:text-red-400">
          Delete
        </Button>
      </td>
    </tr>
  );
});

UserRow.displayName = 'UserRow';

export default function SettingsUsersPage() {
  const queryClient = useQueryClient();
  const { confirm, confirmState, handleConfirm, handleClose } = useConfirm();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  // Form state
  const [createForm, setCreateForm] = useState<CreateUserData>({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
  });
  const [editForm, setEditForm] = useState<UpdateUserData>({});
  const [newPassword, setNewPassword] = useState('');

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', searchQuery, roleFilter, statusFilter, page],
    queryFn: async () => {
      const response = await usersApi.listUsers({
        search: searchQuery || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter || undefined,
        page,
        limit: 10,
      });
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to load users');
      }
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch roles
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await usersApi.getRoles();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to load roles');
      }
      return response.data;
    },
  });

  const roles = rolesData || [];

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await usersApi.createUser(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create user');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      setCreateForm({ email: '', username: '', password: '', firstName: '', lastName: '', roleId: '' });
      showSuccess('User created successfully');
    },
    onError: (error: Error) => {
      showError(getErrorMessage(error));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await usersApi.updateUser(id, data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update user');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowEditModal(false);
      setSelectedUser(null);
      showSuccess('User updated successfully');
    },
    onError: (error: Error) => {
      showError(getErrorMessage(error));
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const response = await usersApi.assignRole(userId, roleId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to assign role');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowRoleModal(false);
      setSelectedUser(null);
      showSuccess('Role assigned successfully');
    },
    onError: (error: Error) => {
      showError(getErrorMessage(error));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const response = await usersApi.resetPassword(userId, password);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reset password');
      }
      return response.data;
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      showSuccess('Password reset successfully');
    },
    onError: (error: Error) => {
      showError(getErrorMessage(error));
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await usersApi.deleteUser(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete user');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('User deleted successfully');
    },
    onError: (error: Error) => {
      showError(getErrorMessage(error));
    },
  });

  // Handlers
  const handleEdit = useCallback((user: UserListItem) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    });
    setShowEditModal(true);
  }, []);

  const handleChangeRole = useCallback((user: UserListItem) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  }, []);

  const handleResetPassword = useCallback((user: UserListItem) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  }, []);

  const handleToggleStatus = useCallback((user: UserListItem) => {
    confirm(
      async () => { await updateUserMutation.mutateAsync({ id: user.id, data: { isActive: !user.isActive } }); },
      {
        title: user.isActive ? 'Disable User' : 'Enable User',
        message: `Are you sure you want to ${user.isActive ? 'disable' : 'enable'} ${user.username}?`,
        confirmText: user.isActive ? 'Disable' : 'Enable',
        variant: 'warning',
      }
    );
  }, [confirm, updateUserMutation]);

  const handleDelete = useCallback((user: UserListItem) => {
    confirm(
      async () => { await deleteUserMutation.mutateAsync(user.id); },
      {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger',
      }
    );
  }, [confirm, deleteUserMutation]);

  const users = usersData?.data || [];
  const meta = usersData?.meta;

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load users: {(error as Error).message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="User Management"
          description="Manage users, roles, and permissions"
          actions={
            <Button onClick={() => setShowCreateModal(true)}>
              Add User
            </Button>
          }
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Roles</option>
                {roles.map((role: Role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </div>
            <div className="flex items-center justify-end text-sm text-gray-500 dark:text-gray-400">
              {meta && `${meta.total} user${meta.total !== 1 ? 's' : ''} found`}
            </div>
          </div>
        </Card>

        {/* Users Table */}
        {isLoading ? (
          <Card className="p-6">
            <LoadingState variant="skeleton" lines={8} />
          </Card>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Adjust your search or filters to see results"
            action={{
              label: 'Add User',
              onClick: () => setShowCreateModal(true),
            }}
          />
        ) : (
          <Card noPadding className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={handleEdit}
                    onChangeRole={handleChangeRole}
                    onResetPassword={handleResetPassword}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                  disabled={page === meta.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        <form
          id="create-user-form"
          onSubmit={(e) => {
            e.preventDefault();
            createUserMutation.mutate(createForm);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name">
              <Input
                type="text"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
              />
            </FormField>
            <FormField label="Last Name">
              <Input
                type="text"
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Email" required>
            <Input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </FormField>
          <FormField label="Username" required>
            <Input
              type="text"
              required
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            />
          </FormField>
          <FormField label="Password" required>
            <Input
              type="password"
              required
              minLength={8}
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
          </FormField>
          <FormField label="Role">
            <Select
              value={createForm.roleId}
              onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
            >
              <option value="">Default (Viewer)</option>
              {roles.map((role: Role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </FormField>
        </form>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            isLoading={createUserMutation.isPending}
          >
            Create User
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal && !!selectedUser}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        <form
          id="edit-user-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedUser) {
              updateUserMutation.mutate({ id: selectedUser.id, data: editForm });
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name">
              <Input
                type="text"
                value={editForm.firstName || ''}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              />
            </FormField>
            <FormField label="Last Name">
              <Input
                type="text"
                value={editForm.lastName || ''}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Email">
            <Input
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </FormField>
          <FormField label="Username">
            <Input
              type="text"
              value={editForm.username || ''}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            />
          </FormField>
        </form>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-user-form"
            isLoading={updateUserMutation.isPending}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={showRoleModal && !!selectedUser}
        onClose={() => setShowRoleModal(false)}
        title="Change User Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a new role for <span className="font-medium text-gray-900 dark:text-white">{selectedUser?.username}</span>
          </p>
          <div className="space-y-2">
            {roles.map((role: Role) => (
              <button
                key={role.id}
                onClick={() => {
                  if (selectedUser) {
                    assignRoleMutation.mutate({
                      userId: selectedUser.id,
                      roleId: role.id
                    });
                  }
                }}
                disabled={assignRoleMutation.isPending}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${selectedUser?.roles[0]?.id === role.id
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${selectedUser?.roles[0]?.id === role.id
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                    }`}>
                    {role.name}
                  </span>
                  {selectedUser?.roles[0]?.id === role.id && (
                    <span className="text-blue-600 dark:text-blue-400">
                      ✓
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${selectedUser?.roles[0]?.id === role.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
                  }`}>
                  {role.description}
                </p>
              </button>
            ))}
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showPasswordModal && !!selectedUser}
        onClose={() => setShowPasswordModal(false)}
        title="Reset Password"
        size="sm"
      >
        <form
          id="reset-password-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedUser) {
              resetPasswordMutation.mutate({
                userId: selectedUser.id,
                password: newPassword
              });
            }
          }}
          className="space-y-4"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter a new password for <span className="font-medium text-gray-900 dark:text-white">{selectedUser?.username}</span>
          </p>
          <FormField label="New Password">
            <Input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
          </FormField>
        </form>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="reset-password-form"
            isLoading={resetPasswordMutation.isPending}
            variant="primary"
          >
            Reset Password
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />
    </div>
  );
}
