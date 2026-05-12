import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { validarCPF } from '@/lib/validators';

const emailSchema = z.string().email('Formato de e-mail inválido');
const cpfSchema = z
  .string()
  .length(11, 'Formato de CPF inválido (11 números)')
  .refine((value) => validarCPF(value), 'CPF inválido');

const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[a-z]/, 'A senha deve conter ao menos uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter ao menos um número');

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isLoading: authLoading, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupCpf, setSignupCpf] = useState('');
  const [signupEmailError, setSignupEmailError] = useState('');
  const [signupCpfError, setSignupCpfError] = useState('');

  if (user && !authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Você já está conectado</h1>
          <p className="text-muted-foreground">
            Logado como <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/', { replace: true })}>
            Ir para a Loja
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => signOut ? signOut() : (localStorage.clear(), window.location.reload())}
          >
            Sair da Conta
          </Button>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    
    try {
      setIsLoading(true);
      const result = await signIn(loginEmail, loginPassword);
      
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao fazer login');
      }

      toast.success('Login realizado com sucesso! 🎉');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = signupCpf.replace(/\D/g, '');

    setSignupEmailError('');
    setSignupCpfError('');

    if (signupPassword !== signupConfirmPassword) {
      return toast.error('As senhas não coincidem!');
    }

    try {
      emailSchema.parse(signupEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const msg = err.errors[0].message;
        setSignupEmailError(msg);
        toast.error(msg);
        return;
      }
    }

    try {
      cpfSchema.parse(cleanCpf);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const msg = err.errors[0].message;
        setSignupCpfError(msg);
        toast.error(msg);
        return;
      }
    }

    try {
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const msg = err.errors[0].message;
        toast.error(msg);
        return;
      }
    }

    try {
      setIsLoading(true);
      const result = await signUp({
        email: signupEmail,
        senha: signupPassword,
        nome: signupName || 'Usuário',
        cpf: cleanCpf
      });

      if (result.error) {
        const errMsg = result.error instanceof Error ? result.error.message : String(result.error);
        throw new Error(errMsg || 'Erro ao criar conta.');
      }

      toast.success('Conta criada com sucesso! Faça login agora. 🎉');

      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupCpf('');
      
      setActiveTab('login');
      navigate('/auth', { replace: true });
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Button variant="ghost" className="absolute top-4 left-4" onClick={() => navigate('/')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-display text-primary mb-2">Bem-vindo à Loja</h1>
        <p className="text-muted-foreground">Entre ou crie a sua conta</p>
      </div>
      
      <Card className="w-full max-w-md shadow-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Entrar
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input id="signup-name" type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-cpf">CPF (Somente números)</Label>
                  <Input
                    id="signup-cpf"
                    type="text"
                    maxLength={11}
                    pattern="\d{11}"
                    value={signupCpf}
                    onChange={(e) => setSignupCpf(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  {signupCpfError && (
                    <p className="text-destructive text-sm mt-1">{signupCpfError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                  {signupEmailError && (
                    <p className="text-destructive text-sm mt-1">{signupEmailError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <Input id="signup-confirm-password" type="password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar Conta
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;