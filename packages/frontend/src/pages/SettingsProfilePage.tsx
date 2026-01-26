/**
 * Settings Profile Page - User profile management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, UserProfile, UpdateProfileData, ChangePasswordData, Session } from '../api/auth';
import { showError, showSuccess } from '../utils/toast.utils';
import { getErrorMessage } from '../utils/error.utils';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ConfirmModal';
import { tokenStorage } from '../utils/token-storage.utils';
import { Button, Card, PageHeader, Badge, FormField, Input, LoadingState } from '../components/ui';

export default function SettingsProfilePage() {
  const queryClient = useQueryClient();
  const { confirm, confirmState, handleConfirm, handleClose } = useConfirm();

  // Profile form state
  const [profileForm, setProfileForm] = useState<UpdateProfileData>({
    firstName: '',
    lastName: '',
    username: '',
  });
  const [isProfileFormDirty, setIsProfileFormDirty] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch profile
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authApi.getProfile();
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Initialize form when profile loads
  const profile = profileData as UserProfile | undefined;
  if (profile && !isProfileFormDirty) {
    if (profileForm.firstName !== (profile.firstName || '') ||
      profileForm.lastName !== (profile.lastName || '') ||
      profileForm.username !== profile.username) {
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        username: profile.username,
      });
    }
  }

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await authApi.updateProfile(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsProfileFormDirty(false);
      showSuccess('Profile updated successfully');
    },
    onError: (error: Error) => {
      showError(getErrorMessage(error));
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await authApi.changePassword(data);
      return response.data;
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
      showSuccess('Password changed successfully. Other sessions have been revoked.');
    },
    onError: (error: Error) => {
      showError(getErrorMessage(error));
    },
  });

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await authApi.revokeSession(sessionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showSuccess('Session revoked successfully');
    },
    onError: (error: Error) => {
      showError(getErrorMessage(error));
    },
  });

  // Revoke all other sessions mutation
  const revokeOtherSessionsMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await authApi.revokeOtherSessions(refreshToken);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showSuccess('All other sessions have been revoked');
    },
    onError: (error: Error) => {
      showError(getErrorMessage(error));
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleRevokeSession = (sessionId: string) => {
    confirm(
      async () => { await revokeSessionMutation.mutateAsync(sessionId); },
      {
        title: 'Revoke Session',
        message: 'Are you sure you want to revoke this session? The device will be logged out.',
        confirmText: 'Revoke',
        variant: 'warning',
      }
    );
  };

  const handleRevokeAllSessions = () => {
    confirm(
      async () => { await revokeOtherSessionsMutation.mutateAsync(); },
      {
        title: 'Revoke All Other Sessions',
        message: 'Are you sure you want to log out of all other devices? Only your current session will remain active.',
        confirmText: 'Revoke All',
        variant: 'danger',
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const parseUserAgent = (ua?: string): string => {
    if (!ua) return 'Unknown device';
    if (ua.includes('Chrome')) return 'Chrome Browser';
    if (ua.includes('Firefox')) return 'Firefox Browser';
    if (ua.includes('Safari')) return 'Safari Browser';
    if (ua.includes('Edge')) return 'Edge Browser';
    return 'Web Browser';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <LoadingState variant="skeleton" lines={10} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load profile: {(error as Error).message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <PageHeader
          title="Profile Settings"
          description="Manage your account information and security settings"
        />

        {/* Profile Information */}
        <Card noPadding>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Profile Information
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update your personal information
            </p>
          </div>
          <form onSubmit={handleProfileSubmit} className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="First Name">
                <Input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, firstName: e.target.value });
                    setIsProfileFormDirty(true);
                  }}
                  placeholder="Enter first name"
                />
              </FormField>
              <FormField label="Last Name">
                <Input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, lastName: e.target.value });
                    setIsProfileFormDirty(true);
                  }}
                  placeholder="Enter last name"
                />
              </FormField>
            </div>
            <FormField label="Username">
              <Input
                type="text"
                value={profileForm.username}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, username: e.target.value });
                  setIsProfileFormDirty(true);
                }}
                placeholder="Enter username"
              />
            </FormField>
            <FormField label="Email" helpText="Email cannot be changed">
              <Input
                type="email"
                value={profile?.email || ''}
                disabled
              />
            </FormField>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={updateProfileMutation.isPending || !isProfileFormDirty}
                isLoading={updateProfileMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Account Info */}
        <Card noPadding>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Account Information
            </h2>
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {profile?.roles?.join(', ') || 'No role assigned'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Account Created</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Last Login</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {profile?.lastLogin ? formatDate(profile.lastLogin) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
              <Badge variant={profile?.isActive ? 'success' : 'error'}>
                {profile?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card noPadding>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Change Password
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update your password to keep your account secure
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="px-6 py-4 space-y-4">
            <FormField label="Current Password">
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
                required
              />
            </FormField>
            <FormField label="New Password">
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password (min 8 characters)"
                required
                minLength={8}
              />
            </FormField>
            <FormField label="Confirm New Password">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </FormField>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={changePasswordMutation.isPending}
                isLoading={changePasswordMutation.isPending}
              >
                Change Password
              </Button>
            </div>
          </form>
        </Card>

        {/* Active Sessions */}
        <Card noPadding>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Active Sessions
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your active login sessions
              </p>
            </div>
            {profile?.sessions && profile.sessions.length > 1 && (
              <Button
                onClick={handleRevokeAllSessions}
                disabled={revokeOtherSessionsMutation.isPending}
                variant="danger"
                size="sm"
                isLoading={revokeOtherSessionsMutation.isPending}
              >
                Revoke All Others
              </Button>
            )}
          </div>
          <div className="px-6 py-4">
            {!profile?.sessions || profile.sessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No active sessions</p>
            ) : (
              <div className="space-y-3">
                {profile.sessions.map((session: Session, index: number) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {parseUserAgent(session.userAgent)}
                        </span>
                        {index === 0 && (
                          <Badge variant="success" size="sm">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>IP: {session.ipAddress || 'Unknown'}</span>
                        <span className="mx-2">•</span>
                        <span>Created: {formatDate(session.createdAt)}</span>
                      </div>
                    </div>
                    {index !== 0 && (
                      <Button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokeSessionMutation.isPending}
                        variant="danger"
                        size="xs"
                        isLoading={revokeSessionMutation.isPending}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        isLoading={confirmState.isLoading}
      />
    </div>
  );
}
