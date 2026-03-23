import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, AlertCircle, Loader2, UserCheck } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
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
                    options: {
                        data: { full_name: name }
                    }
                });
                if (signUpError) throw signUpError;
                setSuccess('Conta criada! Verifique seu email para confirmar.');
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
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-4 font-sans line-height-normal">
            <div className="max-w-[1000px] w-full bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in border border-white">
                
                {/* Lado Azul (Inspirado no estilo enviado) */}
                <div className={`w-full md:w-[40%] bg-blue-600 text-white p-12 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out ${isRegistering ? 'md:order-last' : 'md:order-first'}`}>
                    <div className="mb-8">
                        <Lock size={48} className="text-blue-200" />
                    </div>
                    <h2 className="text-3xl font-extrabold mb-4 leading-tight">
                        {isRegistering ? 'Bem-Vindo de volta' : 'Olá, Amigo!'}
                    </h2>
                    <p className="text-blue-100 mb-10 text-lg opacity-90">
                        {isRegistering 
                            ? 'Acesse sua conta agora mesmo para gerenciar suas ordens.' 
                            : 'Crie sua conta agora mesmo e comece a organizar sua assistência técnica.'
                        }
                    </p>
                    <button 
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError(null);
                            setSuccess(null);
                        }}
                        className="px-12 py-3 border-2 border-white rounded-full font-bold text-lg hover:bg-white hover:text-blue-600 transition-all active:scale-95 tracking-wide uppercase"
                    >
                        {isRegistering ? 'Entrar' : 'Cadastrar'}
                    </button>
                    
                    <div className="mt-12 flex items-center gap-2 opacity-50">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">Manutek Pro</span>
                    </div>
                </div>

                {/* Lado Branco (Formulário) */}
                <div className="w-full md:w-[60%] p-10 md:p-16 flex flex-col justify-center">
                    <div className="max-w-[400px] mx-auto w-full">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                                {isRegistering ? 'Crie sua conta' : 'Acesse o Painel'}
                            </h1>
                            <p className="text-slate-400 font-medium">
                                {isRegistering ? 'Cadastre seus dados abaixo' : 'Entre com suas credenciais'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-shake">
                                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                                <p className="text-sm font-semibold">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-600">
                                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                                <p className="text-sm font-semibold">{success}</p>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">
                            {isRegistering && (
                                <div className="space-y-1">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <UserCheck size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            required={isRegistering}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all placeholder:text-slate-500 font-bold text-slate-700 uppercase tracking-wider text-sm"
                                            placeholder="NOME"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all placeholder:text-slate-500 font-bold text-slate-700 uppercase tracking-wider text-sm"
                                        placeholder="EMAIL"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all placeholder:text-slate-500 font-bold text-slate-700 uppercase tracking-wider text-sm"
                                        placeholder="SENHA"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {!isRegistering && (
                                <div className="text-right">
                                    <button type="button" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                                        Esqueceu a senha?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-black hover:bg-slate-900 text-white rounded-full font-black text-sm tracking-widest uppercase shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>AGUARDE...</span>
                                    </>
                                ) : (
                                    <span>{isRegistering ? 'CADASTRAR' : 'ENTRAR'}</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
