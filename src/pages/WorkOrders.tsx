import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { FilePlus, Search, MessageSquare, X, Check, Clock, Wrench, CheckCircle2, Package } from 'lucide-react';
import type { WorkOrder, OSStatus } from '../types';

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const statusMap: Record<OSStatus, { label: string, color: string, bg: string, icon: React.ReactNode }> = {
    received: { label: 'Recebido', color: '#3b82f6', bg: '#eff6ff', icon: <Package size={18} /> },
    analyzing: { label: 'Em Análise', color: '#d97706', bg: '#fffbeb', icon: <Search size={18} /> },
    awaiting_approval: { label: 'Aguardando Aprovação', color: '#ea580c', bg: '#fff7ed', icon: <Clock size={18} /> },
    approved: { label: 'Aprovado', color: '#059669', bg: '#ecfdf5', icon: <CheckCircle2 size={18} /> },
    rejected: { label: 'Recusado', color: '#dc2626', bg: '#fef2f2', icon: <X size={18} /> },
    in_maintenance: { label: 'Em Manutenção', color: '#6366f1', bg: '#eef2ff', icon: <Wrench size={18} /> },
    completed: { label: 'Concluído', color: '#8b5cf6', bg: '#f5f3ff', icon: <Check size={18} /> },
    ready: { label: 'Pronto para Retirada', color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle2 size={18} /> },
    delivered: { label: 'Entregue', color: '#64748b', bg: '#f1f5f9', icon: <Package size={18} /> },
};

const WorkOrders: React.FC = () => {
    const { workOrders, customers, products, technicians, setOSModalOpen, updateWorkOrderStatus, logCommunication } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [selectedWOForBudget, setSelectedWOForBudget] = useState<WorkOrder | null>(null);
    const [budgetValue, setBudgetValue] = useState('');
    const [selectedTechnicianId, setSelectedTechnicianId] = useState('');


    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedWOForDetails, setSelectedWOForDetails] = useState<WorkOrder | null>(null);

    const handleGenerateBudget = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWOForBudget || !budgetValue) return;

        const customer = customers.find(c => c.id === selectedWOForBudget.customerId);
        const cost = parseFloat(budgetValue.replace('.', '').replace(',', '.'));

        if (isNaN(cost)) return;

        useStore.getState().updateWorkOrder(selectedWOForBudget.id, { 
            totalCost: cost, 
            laborCost: cost, // Por padrão, tudo como MO se for entrada manual rápida
            technicianId: selectedTechnicianId 
        });
        updateWorkOrderStatus(selectedWOForBudget.id, 'awaiting_approval');

        if (customer) {
            const baseUrl = window.location.origin;
            const trackingUrl = `${baseUrl}/rastreio/${selectedWOForBudget.number}`;

            logCommunication({
                id: crypto.randomUUID(),
                workOrderId: selectedWOForBudget.id,
                customerPhone: customer.whatsapp,
                message: `Olá ${customer.name.split(' ')[0]}! O diagnóstico do seu aparelho (OS: #${selectedWOForBudget.number}) foi finalizado e o orçamento já está disponível.\n\nAcesse o link para aprovar ou recusar o serviço: ${trackingUrl}`,
                status: 'delivered',
                direction: 'outbound',
                timestamp: new Date().toISOString(),
                type: 'awaiting_approval'
            });
        }

        setBudgetModalOpen(false);
        setSelectedWOForBudget(null);
        setBudgetValue('');
        setSelectedTechnicianId('');
    };

    const filteredOrders = workOrders.filter(wo => {
        const customer = customers.find(c => c.id === wo.customerId);
        return wo.number.toString().includes(searchTerm) ||
            customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.statusEntryDate || b.createdAt).getTime() - new Date(a.statusEntryDate || a.createdAt).getTime());

    const advanceStatus = (wo: WorkOrder) => {
        const flow: OSStatus[] = ['received', 'analyzing', 'awaiting_approval', 'approved', 'in_maintenance', 'completed', 'ready', 'delivered'];
        const currentIndex = flow.indexOf(wo.status);
        if (currentIndex < flow.length - 1) {
            const nextStatus = flow[currentIndex + 1];
            updateWorkOrderStatus(wo.id, nextStatus);

            // Envio automático de cobrança ao ficar Pronto
            if (nextStatus === 'ready') {
                sendManualBilling(wo);
            }
        }
    };

    const sendManualBilling = (wo: WorkOrder) => {
        const customer = customers.find(c => c.id === wo.customerId);
        const product = products.find(p => p.id === wo.productId);
        if (customer && product) {
            const message = `Olá, seu equipamento já está pronto para retirada.

OS: #${wo.number}
Equipamento: ${product.brand} ${product.model}

Valor do serviço: ${formatCurrency(wo.totalCost)}

Por favor compareça à assistência para retirada.`;

            logCommunication({
                id: crypto.randomUUID(),
                workOrderId: wo.id,
                customerPhone: customer.whatsapp,
                message,
                status: 'sent',
                direction: 'outbound',
                timestamp: new Date().toISOString(),
                type: 'ready'
            });
        }
    };

    const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'technical' | 'history'>('info');

    // Funções para manipulação de peças no Reparo
    const [newPart, setNewPart] = useState({ name: '', quantity: 1, price: 0 });
    const addPartToOS = (wo: WorkOrder) => {
        if (!newPart.name || newPart.quantity <= 0) return;
        const updatedItems = [...(wo.items || []), { 
            partId: crypto.randomUUID(), 
            name: newPart.name, 
            quantity: newPart.quantity, 
            price: newPart.price 
        }];
        const totalParts = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const totalCost = totalParts + (wo.laborCost || 0);
        
        useStore.getState().updateWorkOrder(wo.id, { items: updatedItems, totalCost });
        setNewPart({ name: '', quantity: 1, price: 0 });
    };

    const removePartFromOS = (wo: WorkOrder, partId: string) => {
        const updatedItems = wo.items.filter(i => i.partId !== partId);
        const totalParts = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const totalCost = totalParts + (wo.laborCost || 0);
        useStore.getState().updateWorkOrder(wo.id, { items: updatedItems, totalCost });
    };

    const updateLabor = (wo: WorkOrder, laborCost: number) => {
        const totalParts = (wo.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const totalCost = totalParts + laborCost;
        useStore.getState().updateWorkOrder(wo.id, { laborCost, totalCost });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-h1">Ordens de Serviço</h1>
                    <p className="text-subtitle">Gestão de manutenção e diagnósticos</p>
                </div>
                <button className="btn btn-primary" onClick={() => setOSModalOpen(true)}>
                    <FilePlus size={18} /> Nova OS
                </button>
            </div>

            <div className="card shadow-sm">
                <div className="card-header flex justify-between items-center">
                    <div className="search-bar" style={{ width: '400px' }}>
                        <Search size={18} color="var(--color-text-muted)" />
                        <input
                            type="text"
                            placeholder="Buscar por número da OS ou Nome Cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                <th>OS</th>
                                <th>Cliente</th>
                                <th>Equipamento</th>
                                <th>Status</th>
                                <th>Técnico</th>
                                <th>Valor Total</th>
                                <th>Última Alteração</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map(wo => {
                                    const customer = customers.find(c => c.id === wo.customerId);
                                    const product = products.find(p => p.id === wo.productId);
                                    const tech = technicians.find(t => t.id === wo.technicianId);

                                    return (
                                        <tr key={wo.id}>
                                            <td className="font-extrabold text-primary">#{wo.number}</td>
                                            <td className="font-semibold">{customer?.name}</td>
                                            <td className="text-xs">{product?.brand} {product?.model}</td>
                                            <td>
                                                <span style={{
                                                    backgroundColor: `${statusMap[wo.status].color}12`,
                                                    color: statusMap[wo.status].color,
                                                    padding: '0.3rem 0.7rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.03em'
                                                }}>
                                                    {statusMap[wo.status].label}
                                                </span>
                                            </td>
                                            <td className="text-sm">{tech ? tech.name.split(' ')[0] : '-'}</td>
                                            <td className="font-bold">{formatCurrency(wo.totalCost)}</td>
                                            <td className="text-xs text-gray-400">
                                                {new Date(wo.statusEntryDate || wo.createdAt).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        className="btn btn-secondary btn-icon"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                                        onClick={() => {
                                                            setSelectedWOForDetails(wo);
                                                            setDetailsModalOpen(true);
                                                        }}
                                                    >
                                                        Gerenciar
                                                    </button>
                                                    <button
                                                        className="btn btn-primary btn-icon"
                                                        style={{ padding: '0.4rem' }}
                                                        onClick={() => advanceStatus(wo)}
                                                        disabled={['delivered', 'rejected'].includes(wo.status)}
                                                        title="Avançar Status"
                                                    >
                                                        <Wrench size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center p-12 text-gray-400">Nenhuma Ordem de Serviço encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Orçamento (Mantido simplificado) */}
            {budgetModalOpen && selectedWOForBudget && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content" style={{ maxWidth: '450px', width: '90%' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Gerar Orçamento</h2>
                            <button className="btn-icon" onClick={() => setBudgetModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleGenerateBudget}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Técnico Responsável</label>
                                    <select className="input-field" value={selectedTechnicianId} onChange={(e) => setSelectedTechnicianId(e.target.value)} required>
                                        <option value="">Selecione...</option>
                                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Valor Total (R$)</label>
                                    <input type="text" required className="input-field text-xl font-bold" value={budgetValue} onChange={(e) => setBudgetValue(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setBudgetModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar e Notificar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* NOVO MODAL DE DETALHES COMPLETO */}
            {detailsModalOpen && selectedWOForDetails && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '95%', height: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                    <Wrench size={24} />
                                </div>
                                <div>
                                    <h2 className="modal-title">Gerenciamento da OS #{selectedWOForDetails.number}</h2>
                                    <p className="text-xs text-gray-500">{customers.find(c => c.id === selectedWOForDetails.customerId)?.name} · {statusMap[selectedWOForDetails.status].label}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    className="btn btn-secondary flex items-center gap-2"
                                    onClick={() => sendManualBilling(selectedWOForDetails)}
                                    title="Enviar lembrete de cobrança via WhatsApp"
                                >
                                    <MessageSquare size={16} className="text-green-600" /> Cobrança Manual
                                </button>
                                <button className="btn-icon" onClick={() => setDetailsModalOpen(false)}><X size={20} /></button>
                            </div>
                        </div>

                        {/* Abas do Modal */}
                        <div className="flex border-b bg-white">
                            <button 
                                onClick={() => setActiveDetailTab('info')}
                                className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeDetailTab === 'info' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400'}`}
                            >
                                Dados Gerais
                            </button>
                            <button 
                                onClick={() => setActiveDetailTab('technical')}
                                className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeDetailTab === 'technical' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400'}`}
                            >
                                Reparo Técnico
                            </button>
                            <button 
                                onClick={() => setActiveDetailTab('history')}
                                className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeDetailTab === 'history' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400'}`}
                            >
                                Histórico
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                            {/* ABA: DADOS GERAIS */}
                            {activeDetailTab === 'info' && (
                                <div className="flex flex-col gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Defeito Relatado</p>
                                            <p className="text-sm text-gray-700">{selectedWOForDetails.reportedDefect}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Diagnóstico Técnico</p>
                                            <textarea 
                                                className="w-full text-sm border-none focus:ring-0 p-0" 
                                                rows={3} 
                                                placeholder="Adicione um diagnóstico..."
                                                defaultValue={selectedWOForDetails.technicalDiagnostic}
                                                onBlur={(e) => useStore.getState().updateWorkOrder(selectedWOForDetails.id, { technicalDiagnostic: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                            <Package size={16} className="text-primary" /> Detalhes do Equipamento
                                        </h3>
                                        <div className="grid grid-cols-3 gap-6">
                                            {[
                                                { label: 'Condição', val: selectedWOForDetails.productCondition?.visualObservations || 'Nenhuma obs.' },
                                                { label: 'Garantia', val: selectedWOForDetails.isUnderWarranty ? 'SIM' : 'NÃO' },
                                                { label: 'Prioridade', val: selectedWOForDetails.priority?.toUpperCase() || 'NORMAL' }
                                            ].map((it, i) => (
                                                <div key={i}>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">{it.label}</p>
                                                    <p className="text-xs font-semibold mt-1">{it.val}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {selectedWOForDetails.entryImages && selectedWOForDetails.entryImages.length > 0 && (
                                            <div className="mt-6 pt-6 border-t">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-3">Fotos da Entrada</p>
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {selectedWOForDetails.entryImages.map((img, i) => (
                                                        <img 
                                                            key={i} 
                                                            src={img} 
                                                            className="w-24 h-24 object-cover rounded-lg border shadow-sm cursor-pointer hover:opacity-80" 
                                                            onClick={() => window.open(img, '_blank')}
                                                            alt={`Foto ${i + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA: REPARO TÉCNICO */}
                            {activeDetailTab === 'technical' && (
                                <div className="flex flex-col gap-6">
                                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-indigo-600">
                                            <Wrench size={16} /> Detalhes da Execução
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="input-group">
                                                <label className="input-label">Descrição do Reparo Realizado</label>
                                                <textarea 
                                                    className="input-field" 
                                                    rows={3} 
                                                    placeholder="O que foi feito no aparelho?"
                                                    defaultValue={selectedWOForDetails.repairDescription}
                                                    onBlur={(e) => useStore.getState().updateWorkOrder(selectedWOForDetails.id, { repairDescription: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div className="input-group">
                                                    <label className="input-label">Valor Mão de Obra (R$)</label>
                                                    <input 
                                                        type="number" 
                                                        className="input-field font-bold text-primary" 
                                                        defaultValue={selectedWOForDetails.laborCost}
                                                        onBlur={(e) => updateLabor(selectedWOForDetails, parseFloat(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Tempo de Serviço (Ex: 2h)</label>
                                                    <input 
                                                        type="text" 
                                                        className="input-field" 
                                                        defaultValue={selectedWOForDetails.serviceTime}
                                                        onBlur={(e) => useStore.getState().updateWorkOrder(selectedWOForDetails.id, { serviceTime: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
                                            <Package size={16} /> Peças Utilizadas
                                        </h3>
                                        
                                        {/* Adicionar Peça */}
                                        <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-dashed">
                                            <input 
                                                className="input-field flex-1 text-xs" 
                                                placeholder="Nome da peça" 
                                                value={newPart.name}
                                                onChange={(e) => setNewPart({...newPart, name: e.target.value})}
                                            />
                                            <input 
                                                type="number" 
                                                className="input-field w-20 text-xs" 
                                                placeholder="Qtde" 
                                                value={newPart.quantity}
                                                onChange={(e) => setNewPart({...newPart, quantity: parseInt(e.target.value)})}
                                            />
                                            <input 
                                                type="number" 
                                                className="input-field w-28 text-xs" 
                                                placeholder="Preço Un." 
                                                value={newPart.price}
                                                onChange={(e) => setNewPart({...newPart, price: parseFloat(e.target.value)})}
                                            />
                                            <button className="btn btn-primary btn-icon" onClick={() => addPartToOS(selectedWOForDetails)}><FilePlus size={16} /></button>
                                        </div>

                                        <div className="table-container">
                                            <table className="table">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="text-[9px]">Peça</th>
                                                        <th className="text-[9px]">Qtde</th>
                                                        <th className="text-[9px]">Unitário</th>
                                                        <th className="text-[9px]">Subtotal</th>
                                                        <th className="text-[9px]">#</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedWOForDetails.items.length > 0 ? selectedWOForDetails.items.map(item => (
                                                        <tr key={item.partId}>
                                                            <td className="text-sm font-semibold">{item.name}</td>
                                                            <td className="text-sm">{item.quantity}</td>
                                                            <td className="text-sm">{formatCurrency(item.price)}</td>
                                                            <td className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</td>
                                                            <td>
                                                                <button className="text-red-500 hover:bg-red-50 p-1 rounded" onClick={() => removePartFromOS(selectedWOForDetails, item.partId)}>
                                                                    <X size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )) : <tr><td colSpan={5} className="text-center py-4 text-xs text-gray-400">Nenhuma peça adicionada.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Footer do Reparo com Totais */}
                                    <div className="bg-indigo-600 p-6 rounded-xl shadow-lg text-white flex justify-between items-center">
                                        <div className="flex gap-8">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase opacity-70">Total Peças</p>
                                                <p className="text-xl font-bold">{formatCurrency(selectedWOForDetails.items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</p>
                                            </div>
                                            <div className="border-l border-white/20 pl-8">
                                                <p className="text-[9px] font-bold uppercase opacity-70">Mão de Obra</p>
                                                <p className="text-xl font-bold">{formatCurrency(selectedWOForDetails.laborCost)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Geral da Ordem</p>
                                            <p className="text-4xl font-black">{formatCurrency(selectedWOForDetails.totalCost)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ABA: HISTÓRICO - Timeline Estilo João */}
                            {activeDetailTab === 'history' && (
                                <div className="p-4 bg-white rounded-xl border shadow-sm">
                                    <div className="relative pl-8 flex flex-col gap-6">
                                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100" />
                                        {[...selectedWOForDetails.history].reverse().map((event: any) => (
                                            <div key={event.id} className="relative">
                                                <div className={`absolute -left-[24px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${event.type === 'status' ? 'bg-primary' : 'bg-amber-400'}`} />
                                                <div className="flex flex-col bg-gray-50/50 p-3 rounded-lg border">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-[10px] font-bold uppercase text-gray-400">
                                                            {event.type === 'status' ? 'Troca de Status' : 'Edição de Campo'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {new Date(event.timestamp).toLocaleString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-700">
                                                        {event.type === 'status' 
                                                            ? `Status alterado para: ${statusMap[event.status as OSStatus]?.label || event.status}` 
                                                            : `Alteração no campo: ${event.fieldName}`}
                                                    </p>
                                                    {event.type === 'edit' && (
                                                        <div className="mt-2 text-[11px] bg-white p-2 rounded border border-dashed flex flex-col gap-1">
                                                            <p><span className="text-red-500 font-bold">DE (Antigo):</span> {JSON.stringify(event.oldValue)}</p>
                                                            <p><span className="text-green-600 font-bold">PARA (Novo):</span> {JSON.stringify(event.newValue)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrders;
