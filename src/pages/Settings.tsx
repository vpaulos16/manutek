import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Save, Smartphone, Calculator, MessageSquare, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { checkWhatsAppStatus, type WhatsAppStatus } from '../lib/whatsapp';

const Settings: React.FC = () => {
    const {
        whatsappBotUrl, setWhatsappBotConfig,
        billingSettings, updateBillingSettings, billingTemplates, updateBillingTemplate
    } = useStore();

    const [savedMessage, setSavedMessage] = useState(false);
    const [wsStatus, setWsStatus] = useState<WhatsAppStatus | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchStatus = async () => {
        setIsRefreshing(true);
        const status = await checkWhatsAppStatus();
        setWsStatus(status);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchStatus();
        // Polling if not connected
        const interval = setInterval(() => {
            if (!wsStatus?.connected) {
                fetchStatus();
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [wsStatus?.connected]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-h1">Configurações</h1>
                    <p className="text-subtitle">Gerenciamento de integrações e regras do sistema</p>
                </div>
                {savedMessage && (
                    <div className="flex items-center gap-2 text-success font-semibold animate-fade-in">
                        <CheckCircle2 size={18} />
                        <span>Configurações salvas!</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* 1. WhatsApp Integration Card */}
                <div className="card">
                    <div className="card-header border-b">
                        <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                                <Smartphone size={20} className="text-primary" />
                                <h2 className="font-semibold text-lg">Integração WhatsApp Bot</h2>
                            </div>
                            <button 
                                onClick={fetchStatus} 
                                disabled={isRefreshing}
                                className={`p-2 rounded-full hover:bg-slate-100 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                            >
                                <RefreshCw size={16} className="text-slate-400" />
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        {/* Status Connection */}
                        <div className="mb-6">
                            {wsStatus?.connected ? (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-green-800">WhatsApp Conectado!</p>
                                        <p className="text-xs text-green-600">O sistema está pronto para enviar mensagens.</p>
                                    </div>
                                </div>
                            ) : wsStatus?.qr ? (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex flex-col items-center">
                                        <p className="text-sm font-bold text-blue-800 mb-4 text-center">Escaneie o QR Code abaixo para conectar</p>
                                        <div className="bg-white p-3 rounded-xl shadow-inner border mb-4">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wsStatus.qr)}`} 
                                                alt="WhatsApp QR Code"
                                                className="w-48 h-48"
                                            />
                                        </div>
                                        <p className="text-[10px] text-blue-600 font-medium text-center max-w-[200px]">
                                            Abra o WhatsApp {'>'} Aparelhos Conectados {'>'} Conectar um Aparelho.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-amber-800">Bot Desconectado</p>
                                        <p className="text-xs text-amber-600">Inicie o servidor `whatsapp-bot` para obter o QR Code.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="input-group">
                                <label className="input-label">URL do Bot Nest.js</label>
                                <input
                                    type="url"
                                    className="input-field"
                                    placeholder="http://localhost:3000"
                                    value={whatsappBotUrl}
                                    onChange={e => setWhatsappBotConfig(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Padrão: http://localhost:3000
                                </p>
                            </div>
                            
                            <div className="mt-6">
                                <button type="submit" className="btn btn-primary w-full">
                                    <Save size={18} /> Salvar Configuração
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* 2. Billing Rules Card */}
                <div className="card">
                    <div className="card-header border-b">
                        <div className="flex items-center gap-2">
                            <Calculator size={20} className="text-primary" />
                            <h2 className="font-semibold text-lg">Regras de Cobrança</h2>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <input 
                                type="checkbox" 
                                id="billing-active" 
                                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                checked={billingSettings.isActive} 
                                onChange={e => updateBillingSettings({ ...billingSettings, isActive: e.target.checked })} 
                            />
                            <label htmlFor="billing-active" className="text-sm font-medium text-slate-700 cursor-pointer">
                                Ativar sistema de cobrança automática
                            </label>
                        </div>

                        <div className={`space-y-4 ${!billingSettings.isActive ? 'opacity-40 pointer-events-none' : ''}`}>
                            <div className="input-group">
                                <label className="input-label">Prazo de Resgate (Dias de Carência)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ width: '100px' }}
                                        value={billingSettings.gracePeriodDays}
                                        onChange={e => updateBillingSettings({ ...billingSettings, gracePeriodDays: parseInt(e.target.value) || 0 })}
                                    />
                                    <span className="text-sm text-muted">Dias após conclusão da OS</span>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Valor da Taxa Diária (R$)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input-field"
                                        style={{ width: '120px' }}
                                        value={billingSettings.dailyFee}
                                        onChange={e => updateBillingSettings({ ...billingSettings, dailyFee: parseFloat(e.target.value) || 0 })}
                                    />
                                    <span className="text-sm text-muted">Por dia excedente</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Message Templates Card */}
                <div className="card md:col-span-2">
                    <div className="card-header border-b">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={20} className="text-primary" />
                            <h2 className="font-semibold text-lg">Templates de Mensagem</h2>
                        </div>
                    </div>
                    <div className="card-body">
                        <p className="text-subtitle mb-6">Personalize os avisos automáticos enviados via WhatsApp.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {billingTemplates.map((template) => (
                                <div key={template.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold text-slate-900">{template.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id={`template-${template.id}`} 
                                                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                checked={template.isActive} 
                                                onChange={e => updateBillingTemplate({ ...template, isActive: e.target.checked })} 
                                            />
                                            <label htmlFor={`template-${template.id}`} className="text-xs font-medium text-slate-500">Ativo</label>
                                        </div>
                                    </div>
                                    
                                    <div className="input-group mb-4">
                                        <label className="input-label text-xs">Gatilho (Dias após "Pronto")</label>
                                        <input 
                                            type="number" 
                                            className="input-field"
                                            style={{ width: '80px' }} 
                                            value={template.triggerDays} 
                                            onChange={(e) => updateBillingTemplate({ ...template, triggerDays: parseInt(e.target.value) || 0 })} 
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label text-xs">Conteúdo da Mensagem</label>
                                        <textarea
                                            className="input-field h-24 resize-none"
                                            value={template.content}
                                            onChange={(e) => updateBillingTemplate({ ...template, content: e.target.value })}
                                        />
                                    </div>
                                    
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {['{cliente}', '{aparelho}', '{valor}'].map(tag => (
                                            <span key={tag} className="badge badge-neutral">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
