import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Users, Shield, Eye, EyeOff, UserPlus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useTranslation } from 'react-i18next';

interface AdminUser {
  user_id: string;
  email: string;
  user_type: string;
  is_admin_root: boolean;
  created_at: string;
}

const UsersManager = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const { user, isAdminRoot } = useAdminAuth();

  // Verificar se o usuário pode executar operações de gerenciamento
  const canManageUsers = isAdminRoot() || user?.user_type === 'admin';
  const canDeleteUsers = isAdminRoot(); // Apenas Admin Root pode deletar

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'viewer' as const
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    user_type: 'viewer' as const,
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('list_admin_users');
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      setError('Erro ao carregar usuários');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      // Get session data
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;
      
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Failed to read admin session from localStorage');
          setError('Sessão administrativa inválida. Faça login novamente.');
          return;
        }
      }

      if (!sessionEmail || !sessionToken) {
        setError('Sessão administrativa inválida. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.rpc('create_admin_user_secure', {
        user_email: formData.email,
        user_password: formData.password,
        user_type: formData.user_type,
        admin_email: sessionEmail,
        session_token: sessionToken
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        setSuccess(result.message);
        setFormData({ email: '', password: '', confirmPassword: '', user_type: 'viewer' });
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Erro ao criar usuário');
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = (adminUser: AdminUser) => {
    setEditingUser(adminUser);
    setEditFormData({
      user_type: adminUser.user_type as any,
      newPassword: '',
      confirmNewPassword: ''
    });
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingUser) return;

    // Validar senha se fornecida
    if (editFormData.newPassword) {
      if (editFormData.newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (editFormData.newPassword !== editFormData.confirmNewPassword) {
        setError('As senhas não coincidem');
        return;
      }
    }

    try {
      // Get session data
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;
      
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Failed to read admin session from localStorage');
          setError('Sessão administrativa inválida. Faça login novamente.');
          return;
        }
      }

      if (!sessionEmail || !sessionToken) {
        setError('Sessão administrativa inválida. Faça login novamente.');
        return;
      }

      // Atualizar tipo de usuário
      const { data: userTypeData, error: userTypeError } = await supabase.rpc('update_admin_user_type_secure', {
        user_id: editingUser.user_id,
        new_user_type: editFormData.user_type,
        admin_email: sessionEmail,
        session_token: sessionToken
      });

      if (userTypeError) throw userTypeError;

      // Se uma nova senha foi fornecida, atualizar a senha
      if (editFormData.newPassword) {
        const { data: passwordData, error: passwordError } = await supabase.rpc('update_admin_user_password_secure', {
          user_id: editingUser.user_id,
          new_password: editFormData.newPassword,
          admin_email: sessionEmail,
          session_token: sessionToken
        });

        if (passwordError) throw passwordError;
      }

      const result = userTypeData as any;
      if (result.success) {
        setSuccess(editFormData.newPassword ? 
          'Usuário e senha atualizados com sucesso' : 
          result.message
        );
        setIsEditDialogOpen(false);
        setEditingUser(null);
        setEditFormData({
          user_type: 'viewer' as const,
          newPassword: '',
          confirmNewPassword: ''
        });
        fetchUsers();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Erro ao atualizar usuário');
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === 'cleyber.silva@live.com') {
      setError('Não é possível deletar o admin root principal');
      return;
    }

    // Verificar se o usuário pode deletar (apenas Admin Root)
    if (!canDeleteUsers) {
      setError('Acesso negado: apenas Admin Root pode deletar usuários');
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar o usuário ${email}?`)) {
      return;
    }

    try {
      // Get session data
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;
      
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Failed to read admin session from localStorage');
          setError('Sessão administrativa inválida. Faça login novamente.');
          return;
        }
      }

      if (!sessionEmail || !sessionToken) {
        setError('Sessão administrativa inválida. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.rpc('delete_admin_user_secure', {
        user_id: userId,
        admin_email: sessionEmail,
        session_token: sessionToken
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        setSuccess(result.message);
        fetchUsers();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Erro ao deletar usuário');
      console.error('Error deleting user:', error);
    }
  };

  const getUserTypeLabel = (userType: string) => {
    const labels = {
      admin_root: 'Admin Root',
      admin: 'Administrador',
      design: 'Designer',
      editor: 'Editor',
      viewer: 'Visualizador'
    };
    return labels[userType as keyof typeof labels] || userType;
  };

  const getUserTypeColor = (userType: string) => {
    const colors = {
      admin_root: 'bg-red-100 text-red-800',
      admin: 'bg-blue-100 text-blue-800',
      design: 'bg-purple-100 text-purple-800',
      editor: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[userType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civeni-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-civeni-blue">{t('admin.users.title')}</h2>
          <p className="text-gray-600">{t('admin.users.description')}</p>
        </div>
        
        {canManageUsers && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-civeni-blue hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                {t('admin.users.newUser')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin.users.createNewUser')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('admin.users.email')}</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('admin.users.enterEmail')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('admin.users.password')}</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={t('admin.users.enterPassword')}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('admin.users.confirmPassword')}</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder={t('admin.users.confirmPasswordPlaceholder')}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('admin.users.userType')}</label>
                  <Select 
                    value={formData.user_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, user_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="design">Designer</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      {isAdminRoot() && (
                        <SelectItem value="admin_root">Admin Root</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('admin.users.cancel')}
                  </Button>
                  <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                    {t('admin.users.createUser')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Administração de Usuários ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">{t('admin.users.email')}</th>
                  <th className="text-left p-3 font-semibold">{t('admin.users.userType')}</th>
                  <th className="text-left p-3 font-semibold">{t('admin.users.created')}</th>
                  <th className="text-left p-3 font-semibold">{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((adminUser) => (
                  <tr key={adminUser.user_id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{adminUser.email}</span>
                        {adminUser.email === user?.email && (
                          <Badge variant="outline" className="text-xs">{t('admin.users.you')}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getUserTypeColor(adminUser.user_type)}>
                        {getUserTypeLabel(adminUser.user_type)}
                        {adminUser.is_admin_root && <Shield className="w-3 h-3 ml-1" />}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(adminUser.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {adminUser.email !== 'cleyber.silva@live.com' && canManageUsers && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(adminUser)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {canDeleteUsers && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(adminUser.user_id, adminUser.email)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {adminUser.email === 'cleyber.silva@live.com' && (
                          <Badge variant="outline" className="text-xs">
                            {t('admin.users.protected')}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('admin.users.noUsersFound')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {canManageUsers && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.users.editUser')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('admin.users.email')}</label>
                <Input
                  type="email"
                  value={editingUser?.email || ''}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('admin.users.userType')}</label>
                <Select 
                  value={editFormData.user_type}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, user_type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="design">Designer</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {isAdminRoot() && (
                      <SelectItem value="admin_root">Admin Root</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4 border-t pt-4">
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  💡 <strong>{t('admin.users.passwordChangeTitle')}</strong> {t('admin.users.passwordChangeInfo')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t('admin.users.newPassword')}</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={editFormData.newPassword}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder={t('admin.users.enterNewPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t('admin.users.confirmNewPassword')}</label>
                  <div className="relative">
                    <Input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={editFormData.confirmNewPassword}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                      placeholder={t('admin.users.confirmNewPasswordPlaceholder')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    >
                      {showConfirmNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  {t('admin.users.cancel')}
                </Button>
                <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                  {t('admin.users.updateUser')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UsersManager;
