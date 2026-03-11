import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Users, Settings, ArrowLeft, Trash2, Plus, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { UserForm } from '@/components/admin/UserForm';
import { ProductForm } from '@/components/admin/ProductForm';
import { SupplierForm } from '@/components/admin/SupplierForm';
import { CouponForm } from '@/components/admin/CouponForm';
import { CategoryForm } from '@/components/admin/CategoryForm';
import type { User } from '@/hooks/useAuth';
import type { Product } from '@/types';

type SupplierItem = { id: number; name: string; email?: string };
type CategoryItem = { id: number; name: string };
type CouponItem = { id: number; code: string; discount: number };

export default function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'products' | 'users' | 'operations'>('dashboard');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);

  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);

  const isUserAdmin = isAdmin || Boolean(user?.isAdmin);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setIsReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const fetchUsers = async () => {
    setLoadingData(true);
    try {
      const data = await apiRequest('/users');
      let list: User[] = [];
      if (Array.isArray(data)) list = data;
      else if (data) list = data.data || data.rows || data.users || [];
      setUsersList(list);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingData(true);
    try {
      const data = await apiRequest('/products');
      let list: Product[] = [];
      if (Array.isArray(data)) list = data;
      else if (data) list = data.data || data.rows || data.products || [];
      setProductsList(list);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleCreateButton = () => {
    setEditingProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleProductDialogChange = (open: boolean) => {
    setIsProductDialogOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  const handleCloseProductDialog = () => {
    setEditingProduct(null);
    setIsProductDialogOpen(false);
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await apiRequest(`/users/${id}`, { method: 'DELETE' });
      toast.success('Usuário removido com sucesso');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao remover usuário');
    }
  };

  const handleEditUser = (selectedUser: User) => {
    setEditingUser(selectedUser);
    setIsUserFormOpen(true);
  };

  const handleUserFormChange = (open: boolean) => {
    setIsUserFormOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  };

  const handleCloseUserForm = () => {
    setEditingUser(null);
    setIsUserFormOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' });
      toast.success('Produto removido com sucesso');
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao remover produto');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiRequest('/suppliers');
      setSuppliers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Erro carregando fornecedores');
    }
  };
  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/categories');
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Erro carregando categorias');
    }
  };
  const fetchCoupons = async () => {
    try {
      const data = await apiRequest('/coupons');
      setCoupons(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Erro carregando cupons');
    }
  };

  const openSupplierDialog = (item: SupplierItem | null = null) => {
    setEditingSupplier(item);
    setIsSupplierDialogOpen(true);
  };
  const closeSupplierDialog = () => {
    setEditingSupplier(null);
    setIsSupplierDialogOpen(false);
  };
  const openCategoryDialog = (item: CategoryItem | null = null) => {
    setEditingCategory(item);
    setIsCategoryDialogOpen(true);
  };
  const closeCategoryDialog = () => {
    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };
  const openCouponDialog = (item: CouponItem | null = null) => {
    setEditingCoupon(item);
    setIsCouponDialogOpen(true);
  };
  const closeCouponDialog = () => {
    setEditingCoupon(null);
    setIsCouponDialogOpen(false);
  };

  useEffect(() => {
    if (currentView === 'users') {
      fetchUsers();
    }
    if (currentView === 'products') {
      fetchProducts();
    }
    if (currentView === 'operations') {
      fetchSuppliers();
      fetchCategories();
      fetchCoupons();
    }
  }, [currentView]);

  if (isLoading || !isReady) {
    return <div className="flex justify-center items-center h-screen">Carregando Painel...</div>;
  }

  if (!isUserAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">Sua conta não possui permissões de administrador.</p>
        <div className="p-4 bg-muted rounded text-xs font-mono">
           Debug: User={user?.nome || 'N/A'} | Admin={String(isUserAdmin)}
        </div>
        <Button onClick={() => navigate('/')}>Voltar para o Início</Button>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card 
        className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 group"
        onClick={() => setCurrentView('products')}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold font-display group-hover:text-primary transition-colors">Produtos</CardTitle>
          <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">Gerenciar</div>
          <p className="text-sm text-muted-foreground">Adicionar, editar ou remover livros e produtos.</p>
          <Button className="w-full mt-4" variant="secondary">Acessar</Button>
        </CardContent>
      </Card>

      <Card 
        className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 group"
        onClick={() => setCurrentView('users')}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold font-display group-hover:text-primary transition-colors">Usuários</CardTitle>
          <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">Clientes</div>
          <p className="text-sm text-muted-foreground">Visualizar e gerenciar lista de usuários.</p>
          <Button className="w-full mt-4" variant="secondary">Acessar</Button>
        </CardContent>
      </Card>

      <Card 
        className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 group"
        onClick={() => setCurrentView('operations')}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold font-display group-hover:text-primary transition-colors">Operações</CardTitle>
          <Settings className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">Livraria</div>
          <p className="text-sm text-muted-foreground">Fornecedores, categorias e cupons da loja.</p>
          <Button className="w-full mt-4" variant="secondary">Acessar</Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gerenciar Usuários</CardTitle>
          <Button size="sm" onClick={fetchUsers} variant="outline">Atualizar Lista</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingData ? (
          <div className="text-center py-8">Carregando usuários...</div>
        ) : usersList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</div>
        ) : (
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nome</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">CPF</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Admin</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {usersList.map((u) => (
                  <tr key={u.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{u.nome}</td>
                    <td className="p-4 align-middle">{u.email}</td>
                    <td className="p-4 align-middle">{u.cpf || '-'}</td>
                    <td className="p-4 align-middle">{u.isAdmin ? 'Sim' : 'Não'}</td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditUser(u)}
                          disabled={user?.id !== u.id}
                          title={user?.id !== u.id ? 'Somente o próprio usuário pode ser editado' : 'Editar usuário'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderProducts = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gerenciar Produtos</CardTitle>
          <Dialog open={isProductDialogOpen} onOpenChange={handleProductDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleCreateButton}>
                <Plus className="w-4 h-4 mr-2" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
              </DialogHeader>
              { (isProductDialogOpen) && (
                <ProductForm
                  product={editingProduct}
                  onSuccess={() => { fetchProducts(); handleCloseProductDialog(); }}
                />
              ) }
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loadingData ? (
          <div className="text-center py-8">Carregando produtos...</div>
        ) : productsList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece adicionando seu primeiro livro.</p>
          </div>
        ) : (
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Imagem</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nome</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Formato</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Categoria Livro</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Preço</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {productsList.map((p) => (
                  <tr key={p.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-middle font-medium">{p.name}</td>
                    <td className="p-4 align-middle capitalize">{p.category}</td>
                    <td className="p-4 align-middle">{p.book_category || '-'}</td>
                    <td className="p-4 align-middle">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditProduct(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderOperations = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operações da Livraria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gerencie parceiros editoriais, organização do catálogo e campanhas promocionais da loja.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button asChild variant="outline" size="sm"><Link to="/admin/operations/suppliers">Abrir Fornecedores (rotas)</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/admin/operations/categories">Abrir Categorias (rotas)</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/admin/operations/coupons">Abrir Cupons (rotas)</Link></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Fornecedores</CardTitle>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => openSupplierDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b hover:bg-muted/50">
                  <th className="h-12 px-4">Nome</th>
                  <th className="h-12 px-4">Email</th>
                  <th className="h-12 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {suppliers.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 align-middle">{item.name}</td>
                    <td className="p-4 align-middle">{item.email || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openSupplierDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={async () => {
                            if (!confirm('Excluir?')) return;
                            try {
                              await apiRequest(`/suppliers/${item.id}`, { method: 'DELETE' });
                              toast.success('Removido');
                              fetchSuppliers();
                            } catch (err) {
                              toast.error('Erro ao excluir');
                            }
                          }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Categorias de Livros</CardTitle>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => openCategoryDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b hover:bg-muted/50">
                  <th className="h-12 px-4">Nome</th>
                  <th className="h-12 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {categories.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 align-middle">{item.name}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openCategoryDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={async () => {
                            if (!confirm('Excluir?')) return;
                            try {
                              await apiRequest(`/categories/${item.id}`, { method: 'DELETE' });
                              toast.success('Removido');
                              fetchCategories();
                            } catch (err) {
                              toast.error('Erro ao excluir');
                            }
                          }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Cupons</CardTitle>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => openCouponDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b hover:bg-muted/50">
                  <th className="h-12 px-4">Código</th>
                  <th className="h-12 px-4">Desconto</th>
                  <th className="h-12 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {coupons.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 align-middle">{item.code}</td>
                    <td className="p-4 align-middle">{item.discount}%</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openCouponDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={async () => {
                            if (!confirm('Excluir?')) return;
                            try {
                              await apiRequest(`/coupons/${item.id}`, { method: 'DELETE' });
                              toast.success('Removido');
                              fetchCoupons();
                            } catch (err) {
                              toast.error('Erro ao excluir');
                            }
                          }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isSupplierDialogOpen} onOpenChange={(o) => !o && closeSupplierDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Editar' : 'Adicionar'} Fornecedor</DialogTitle>
          </DialogHeader>
          <SupplierForm item={editingSupplier} onSuccess={() => { fetchSuppliers(); closeSupplierDialog(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={(o) => !o && closeCategoryDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar' : 'Adicionar'} Categoria</DialogTitle>
          </DialogHeader>
          <CategoryForm item={editingCategory} onSuccess={() => { fetchCategories(); closeCategoryDialog(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={isCouponDialogOpen} onOpenChange={(o) => !o && closeCouponDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Editar' : 'Adicionar'} Cupom</DialogTitle>
          </DialogHeader>
          <CouponForm item={editingCoupon} onSuccess={() => { fetchCoupons(); closeCouponDialog(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Painel Administrativo</h1>
          <p className="text-muted-foreground">Bem-vindo, {user?.nome}!</p>
        </div>
        <div className="flex gap-2">
          {currentView !== 'dashboard' && (
            <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Painel
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/')}>
            Ir para Loja
          </Button>
        </div>
      </div>

      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'users' && renderUsers()}
      {currentView === 'products' && renderProducts()}
      {currentView === 'operations' && renderOperations()}

      <Dialog open={isUserFormOpen} onOpenChange={handleUserFormChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserForm user={editingUser} onSuccess={() => { fetchUsers(); handleCloseUserForm(); }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}