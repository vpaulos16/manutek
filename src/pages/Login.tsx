import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import './Login.css';

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
                setSuccess('Conta criada com sucesso! Verifique seu email.');
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
        <div className="login-container">
            <div className="login-card">
                
                {/* Lado Azul (Bem-vindo) */}
                <div className="login-sidebar" style={{ order: isRegistering ? 2 : 1 }}>
                    <div className="login-sidebar-logo">
                        <Lock size={48} />
                    </div>
                    <h2>
                        {isRegistering ? 'Bem-Vindo de volta' : 'Olá, Amigo!'}
                    </h2>
                    <p>
                        {isRegistering 
                            ? 'Acesse sua conta agora mesmo para gerenciar suas ordens.' 
                            : 'Crie sua conta agora mesmo e comece a organizar sua assistência técnica.'
                        }
                    </p>
                    <button 
                        type="button"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError(null);
                            setSuccess(null);
                        }}
                        className="btn-toggle"
                    >
                        {isRegistering ? 'Entrar' : 'Cadastrar'}
                    </button>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }}></div>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>Manutek Pro</span>
                    </div>
                </div>

                {/* Lado Branco (Formulário) */}
                <div className="login-form-side" style={{ order: isRegistering ? 1 : 2 }}>
                    <div className="login-form-container">
                        <div className="login-header">
                            <h1>
                                {isRegistering ? 'Crie sua conta' : 'Acesse o Painel'}
                            </h1>
                            <p>
                                {isRegistering ? 'Cadastre seus dados abaixo' : 'Entre com suas credenciais'}
                            </p>
                        </div>

                        {error && (
                            <div className="error-msg">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="success-msg">
                                <AlertCircle size={20} />
                                <span>{success}</span>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">
                            {isRegistering && (
                                <div className="form-group">
                                    <div className="input-wrapper">
                                        <UserCheck size={20} className="input-icon" />
                                        <input
                                            type="text"
                                            required={isRegistering}
                                            className="login-input"
                                            placeholder="NOME"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <div className="input-wrapper">
                                    <Mail size={20} className="input-icon" />
                                    <input
                                        type="email"
                                        required
                                        className="login-input"
                                        placeholder="EMAIL"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="input-wrapper">
                                    <Lock size={20} className="input-icon" />
                                    <input
                                        type="password"
                                        required
                                        className="login-input"
                                        placeholder="SENHA"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {!isRegistering && (
                                <span className="forgot-password">
                                    Esqueceu a senha?
                                </span>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-submit"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
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
