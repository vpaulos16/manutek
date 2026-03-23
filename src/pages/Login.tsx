import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmar o cadastro (se habilitado).');
        setIsRegistering(false);
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 mb-6 transition-transform hover:scale-105">
            <Lock size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Manutek Pro</h1>
          <p className="text-slate-500 mt-2 font-medium">Sistema de Gestão de Assistência Técnica</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">
            {isRegistering ? 'Criar Nova Conta' : 'Acessar Painel'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 animate-shake">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 text-green-600">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{isRegistering ? 'Criando...' : 'Autenticando...'}</span>
                </>
              ) : (
                <span>{isRegistering ? 'Cadastrar Agora' : 'Entrar no Sistema'}</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
            >
              {isRegistering ? 'Já possui uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Manutek Cloud Solution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
