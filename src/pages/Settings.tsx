import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Save, Smartphone, Key, Server, Calculator, MessageSquare, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
    const {
        evolutionApiUrl, evolutionInstanceName, evolutionApiKey, setEvolutionApiConfig,
        billingSettings, updateBillingSettings, billingTemplates, updateBillingTemplate
    } = useStore();

    const [activeTab, setActiveTab] = useState<'whatsapp' | 'billing' | 'templates'>('whatsapp');
    const [savedMessage, setSavedMessage] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
    };

    const tabs = [
        { id: 'whatsapp', label: 'WhatsApp / Evolution API', icon: Smartphone, color: '#10b981', bg: '#ecfdf5' },
        { id: 'billing', label: 'Regras de Cobrança', icon: Calculator, color: '#3b82f6', bg: '#eff6ff' },
        { id: 'templates', label: 'Templates de Mensagem', icon: MessageSquare, color: '#8b5cf6', bg: '#f5f3ff' },
    ] as const;

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <div>
                <h1 className="text-h1">Configurações</h1>
                <p className="text-subtitle">Personalize o comportamento do seu sistema e integrações</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 flex flex-col gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 p-4 rounded-xl transition-all border ${
                                activeTab === tab.id 
                                ? 'bg-white border-primary shadow-sm text-primary' 
                                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            <div 
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: activeTab === tab.id ? tab.bg : '#f1f5f9', color: activeTab === tab.id ? tab.color : '#64748b' }}
                            >
                                <tab.icon size={20} />
                            </div>
                            <span className="font-bold text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    {activeTab === 'whatsapp' && (
                        <div className="card animate-fade-in">
                            <div className="card-header flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                    <Smartphone size={22} />
                                </div>
                                <div>
                                    <h2 className="text-h3">Integração WhatsApp</h2>
                                    <p className="text-xs text-slate-500">Conecte sua instância do Evolution API</p>
                                </div>
                            </div>
                            <div className="card-body py-8">
                                <form onSubmit={handleSave} className="max-w-2xl space-y-6">
                                    <div className="input-group">
                                        <label className="input-label flex items-center gap-2">
                                            <Server size={14} className="text-slate-400" /> URL da API
                                        </label>
                                        <input
                                            type="url"
                                            className="input-field py-3"
                                            placeholder="https://api.seudominio.com"
                                            value={evolutionApiUrl}
                                            onChange={e => setEvolutionApiConfig(e.target.value, evolutionInstanceName, evolutionApiKey)}
                                        />
                                        <p className="text-[10px] text-slate-400">Endpoint base onde sua API está hospedada.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="input-group">
                                            <label className="input-label flex items-center gap-2">
                                                <Smartphone size={14} className="text-slate-400" /> Nome da Instância
                                            </label>
                                            <input
                                                type="text"
                                                className="input-field py-3"
                                                placeholder="Ex: AxialControl"
                                                value={evolutionInstanceName}
                                                onChange={e => setEvolutionApiConfig(evolutionApiUrl, e.target.value, evolutionApiKey)}
                                            />
                                        </div>

                                        <div className="input-group">
                                            <label className="input-label flex items-center gap-2">
                                                <Key size={14} className="text-slate-400" /> API Key
                                            </label>
                                            <input
                                                type="password"
                                                className="input-field py-3"
                                                placeholder="••••••••••••••••"
                                                value={evolutionApiKey}
                                                onChange={e => setEvolutionApiConfig(evolutionApiUrl, evolutionInstanceName, e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t flex items-center gap-4">
                                        <button type="submit" className="btn btn-primary px-8 py-3 rounded-xl shadow-lg shadow-blue-500/20">
                                            <Save size={18} /> Salvar Configurações
                                        </button>
                                        {savedMessage && (
                                            <span className="text-sm font-bold text-emerald-600 animate-fade-in py-2 px-4 bg-emerald-50 rounded-lg">
                                                ✓ Tudo certo! Dados salvos.
                                            </span>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="card animate-fade-in">
                            <div className="card-header flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                    <Calculator size={22} />
                                </div>
                                <div>
                                    <h2 className="text-h3">Regras de Cobrança</h2>
                                    <p className="text-xs text-slate-500">Multas e taxas para aparelhos parados no pátio</p>
                                </div>
                            </div>
                            <div className="card-body py-8">
                                <div className="max-w-2xl space-y-8">
                                    <div 
                                        onClick={() => updateBillingSettings({ ...billingSettings, isActive: !billingSettings.isActive })}
                                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                                            billingSettings.isActive 
                                            ? 'border-blue-100 bg-blue-50/30' 
                                            : 'border-slate-100 bg-slate-50/50 grayscale'
                                        }`}
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className={`w-12 h-6 rounded-full relative transition-colors ${billingSettings.isActive ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${billingSettings.isActive ? 'left-7' : 'left-1'}`} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">Ativar sistema de cobrança automática</p>
                                                <p className="text-xs text-slate-500 mt-1">Habilita o cálculo de taxas de permanência após o prazo de carência.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity ${!billingSettings.isActive ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Prazo de Resgate</h4>
                                            <div className="flex items-end gap-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="input-field text-3xl font-black w-24 text-center border-none focus:ring-0 p-0"
                                                    value={billingSettings.gracePeriodDays}
                                                    onChange={e => updateBillingSettings({ ...billingSettings, gracePeriodDays: parseInt(e.target.value) || 0 })}
                                                />
                                                <span className="text-slate-500 font-bold pb-1">Dias</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">Tempo que o cliente tem para retirar o aparelho sem pagar taxa após concluído.</p>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Valor da Taxa Diária</h4>
                                            <div className="flex items-end gap-2">
                                                <span className="text-slate-400 font-black text-xl pb-1">R$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="input-field text-3xl font-black w-32 border-none focus:ring-0 p-0"
                                                    value={billingSettings.dailyFee}
                                                    onChange={e => updateBillingSettings({ ...billingSettings, dailyFee: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">Valor acumulado por dia excedente ao prazo de carência configurado ao lado.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="card animate-fade-in">
                            <div className="card-header flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                                        <MessageSquare size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-h3">Templates de Mensagens</h2>
                                        <p className="text-xs text-slate-500">Padronização de avisos automáticos</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 mb-8">
                                    <div className="flex gap-4">
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-500 shrink-0 h-fit">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                Estas mensagens são disparadas via WhatsApp logo após a OS ser marcada como **"Pronto"** ou nos intervalos de lembrete configurados abaixo.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {['{nome_cliente}', '{numero_os}', '{valor_servico}', '{link_rastreio}'].map(tag => (
                                                    <code key={tag} className="text-[10px] font-bold px-2 py-1 bg-white border rounded-md text-slate-500 shadow-sm cursor-help hover:border-blue-400 transition-colors">
                                                        {tag}
                                                    </code>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {billingTemplates.map((template) => (
                                        <div 
                                            key={template.id} 
                                            className={`group relative border rounded-2xl p-6 transition-all ${
                                                !template.isActive 
                                                ? 'bg-slate-50 border-slate-100 opacity-60' 
                                                : 'bg-white border-slate-200 shadow-sm hover:border-violet-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div 
                                                        onClick={() => updateBillingTemplate({ ...template, isActive: !template.isActive })}
                                                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${template.isActive ? 'bg-violet-600' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${template.isActive ? 'left-6' : 'left-1'}`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-900">{template.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[11px] text-slate-400 font-bold uppercase">Disparo em:</span>
                                                            <input 
                                                                type="number" 
                                                                min="0" 
                                                                className="w-12 bg-transparent border-b border-slate-200 text-xs font-black text-violet-600 text-center focus:border-violet-600 focus:ring-0" 
                                                                value={template.triggerDays} 
                                                                onChange={(e) => updateBillingTemplate({ ...template, triggerDays: parseInt(e.target.value) || 0 })} 
                                                            />
                                                            <span className="text-[11px] text-slate-400 font-bold uppercase">dias após "Pronto"</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <textarea
                                                className={`w-full bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-sm leading-relaxed min-h-[120px] focus:bg-white focus:border-violet-400 transition-all focus:ring-0 ${!template.isActive ? 'pointer-events-none' : ''}`}
                                                value={template.content}
                                                onChange={(e) => updateBillingTemplate({ ...template, content: e.target.value })}
                                                placeholder="Sua mensagem aqui..."
                                            />
                                            {template.isActive && (
                                                <div className="absolute top-6 right-6 flex items-center gap-1 text-[10px] items-center text-emerald-600 font-black tracking-widest uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Ativo
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
