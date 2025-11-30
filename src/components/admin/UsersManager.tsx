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
  const { user, sessionToken, isAdminRoot } = useAdminAuth();

  // Debug logs
  console.log('UsersManager - User:', user);
  console.log('UsersManager - SessionToken:', sessionToken);
  console.log('UsersManager - isAdminRoot():', isAdminRoot());

  // Verificar se o usuário pode executar operações de gerenciamento
  const canManageUsers = user && (user.user_type === 'admin_root' || user.user_type === 'admin' || user.is_admin_root === true);
  const canDeleteUsers = user && (user.user_type === 'admin_root' || user.is_admin_root === true);

  console.log('Permissions - canManageUsers:', canManageUsers, 'canDeleteUsers:', canDeleteUsers);

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
      setLoading(true);
      setError('');
      
      console.log('Fetching users... User:', user?.email);
      
      if (!user?.email) {
        setError('Usuário não logado');
        return;
      }

      // Usar edge function para listar usuários (bypass RLS)
      const response = await supabase.functions.invoke('list-admin-users');
      
      console.log('Edge function response:', response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        setError('Erro ao carregar usuários: ' + (response.error.message || 'Erro desconhecido'));
        return;
      }

      // A resposta pode estar em response.data ou diretamente no objeto
      const usersData = response.data;
      
      if (usersData && Array.isArray(usersData)) {
        console.log('Users loaded:', usersData.length);
        setUsers(usersData);
      } else {
        console.warn('Unexpected response format:', usersData);
        setUsers([]);
      }
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao carregar usuários';
      console.error('Error in fetchUsers:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    console.log('UsersManager useEffect - User:', user?.email);
    
    if (user) {
      fetchUsers();
    }
  }, [user]);

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
      const { data, error } = await (supabase as any).rpc('create_admin_user_secure', {
        user_email: formData.email,
        user_password: formData.password,
        user_type: formData.user_type,
        admin_email: user?.email,
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
      // Atualizar tipo de usuário
      const { data: userTypeData, error: userTypeError } = await (supabase as any).rpc('update_admin_user_type_secure', {
        user_id: editingUser.user_id,
        new_user_type: editFormData.user_type,
        admin_email: user?.email,
        session_token: sessionToken
      });

      if (userTypeError) throw userTypeError;

      // Se uma nova senha foi fornecida, atualizar a senha
      if (editFormData.newPassword) {
        const { data: passwordData, error: passwordError } = await (supabase as any).rpc('update_admin_user_password_secure', {
          user_id: editingUser.user_id,
          new_password: editFormData.newPassword,
          admin_email: user?.email,
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
      const { data, error } = await (supabase as any).rpc('delete_admin_user_secure', {
        user_id: userId,
        admin_email: user?.email,
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
        <span className="ml-2">Carregando usuários...</span>
      </div>
    );
  }

  // Remover verificação restritiva aqui - deixar que os dados sejam carregados primeiro

  return (
    <div className="space-y-4 md:space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-civeni-blue">{t('admin.users.title')}</h2>
          <p className="text-xs md:text-sm lg:text-base text-gray-600">{t('admin.users.description')}</p>
        </div>
        
        {canManageUsers && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-civeni-blue hover:bg-blue-700 w-full sm:w-auto text-xs md:text-sm">
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

      {!canManageUsers ? (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado: você não tem permissão para gerenciar usuários.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-base sm:text-lg">
              <Users className="w-5 h-5" />
              Administração de Usuários ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('admin.users.noUsersFound')}
            </div>
          ) : (
            <>
              {/* Mobile: Card layout */}
              <div className="sm:hidden space-y-3">
                {users.map((adminUser) => (
                  <div key={adminUser.user_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-medium text-sm truncate">{adminUser.email}</span>
                        {adminUser.email === user?.email && (
                          <Badge variant="outline" className="text-xs shrink-0">Você</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getUserTypeColor(adminUser.user_type)}>
                        {getUserTypeLabel(adminUser.user_type)}
                        {adminUser.is_admin_root && <Shield className="w-3 h-3 ml-1" />}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(adminUser.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {adminUser.email !== 'cleyber.silva@live.com' && canManageUsers && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(adminUser)}
                            className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          {canDeleteUsers && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(adminUser.user_id, adminUser.email)}
                              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </>
                      )}
                      {adminUser.email === 'cleyber.silva@live.com' && (
                        <Badge variant="outline" className="text-xs">
                          Protegido
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Email</th>
                      <th className="text-left p-3 font-semibold">Tipo de Usuário</th>
                      <th className="text-left p-3 font-semibold">Criado em</th>
                      <th className="text-left p-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((adminUser) => (
                      <tr key={adminUser.user_id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{adminUser.email}</span>
                            {adminUser.email === user?.email && (
                              <Badge variant="outline" className="text-xs">Você</Badge>
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
                                Protegido
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
        </Card>
      )}

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
