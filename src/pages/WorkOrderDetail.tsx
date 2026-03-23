import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { 
    ChevronLeft, MessageSquare, Edit, Printer, 
    X, Clock, Package, Info, Calculator, History, Wrench
} from 'lucide-react';
import type { OSStatus } from '../types';

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const parseMoneyInput = (val: string | number | undefined): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    if (val.trim() === '') return 0;
    // Remove all dots (thousands separator), then change comma to dot
    const cleanStr = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
};

const statusMap: Record<OSStatus, { label: string, color: string, bg: string }> = {
    received: { label: 'Recebido', color: '#64748b', bg: '#f1f5f9' },
    analyzing: { label: 'Em Diagnóstico', color: '#3b82f6', bg: '#eff6ff' },
    awaiting_approval: { label: 'Aguardando Aprovação', color: '#eab308', bg: '#fef9c3' },
    approved: { label: 'Aprovado', color: '#059669', bg: '#ecfdf5' },
    rejected: { label: 'Recusado', color: '#dc2626', bg: '#fef2f2' },
    in_maintenance: { label: 'Em Reparo', color: '#8b5cf6', bg: '#f5f3ff' },
    completed: { label: 'Reparo Concluído', color: '#8b5cf6', bg: '#f5f3ff' },
    ready: { label: 'Pronto para Retirada', color: '#10b981', bg: '#ecfdf5' },
    delivered: { label: 'Entregue', color: '#94a3b8', bg: '#f8fafc' },
};

const nextStatusLabel: Record<OSStatus, string> = {
    received: 'Iniciar Diagnóstico',
    analyzing: 'Enviar Orçamento',
    awaiting_approval: 'Aprovação Recebida',
    approved: 'Iniciar Reparo',
    in_maintenance: 'Finalizar Reparo',
    completed: 'Marcar como Pronto',
    ready: 'Marcar como Entregue',
    delivered: 'Entregue',
    rejected: 'Recusado'
};

const WorkOrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { 
        workOrders, customers, products, 
        updateWorkOrderStatus, logCommunication, billingSettings, updateWorkOrder,
        updateCustomer, updateProduct
    } = useStore();

    const wo = workOrders.find(o => o.id === id || o.number.toString() === id);
    const customer = customers.find(c => c.id === wo?.customerId);
    const product = products.find(p => p.id === wo?.productId);
    const allCommunications = useStore(state => state.communications);
    const communications = useMemo(() => 
        allCommunications.filter(log => log.workOrderId === wo?.id),
    [allCommunications, wo?.id]);

    const [newPart, setNewPart] = useState({ name: '', quantity: 1, priceInput: '' });
    const [localDiagnosis, setLocalDiagnosis] = useState(wo?.technicalDiagnostic || '');
    const [laborInput, setLaborInput] = useState(wo?.laborCost?.toString() || '');
    
    // Sincroniza o input local com o valor da OS se ele mudar externamente
    React.useEffect(() => {
        if (wo?.laborCost !== undefined) {
            setLaborInput(wo.laborCost.toString());
        }
    }, [wo?.laborCost]);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({
        customerName: '',
        customerPhone: '',
        customerWhatsapp: '',
        customerDocument: '',
        productBrand: '',
        productModel: '',
        reportedDefect: ''
    });

    const openEditModal = () => {
        setEditData({
            customerName: customer?.name || '',
            customerPhone: customer?.phone || '',
            customerWhatsapp: customer?.whatsapp || '',
            customerDocument: customer?.document || '',
            productBrand: product?.brand || '',
            productModel: product?.model || '',
            reportedDefect: wo?.reportedDefect || ''
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => setIsEditModalOpen(false);

    const saveEditModal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (customer) {
            await updateCustomer(customer.id, {
                name: editData.customerName,
                phone: editData.customerPhone,
                whatsapp: editData.customerWhatsapp,
                document: editData.customerDocument
            });
        }
        if (product) {
            await updateProduct(product.id, {
                brand: editData.productBrand,
                model: editData.productModel
            });
        }
        if (wo) {
            await updateWorkOrder(wo.id, { reportedDefect: editData.reportedDefect });
        }
        setIsEditModalOpen(false);
    };

    if (!wo) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <h2 className="text-h2">Ordem de Serviço não encontrada</h2>
                <button className="btn btn-secondary mt-4" onClick={() => navigate('/os')}>Voltar para Lista</button>
            </div>
        );
    }

    const advanceStatus = () => {
        const flow: OSStatus[] = ['received', 'analyzing', 'awaiting_approval', 'approved', 'in_maintenance', 'completed', 'ready', 'delivered'];
        const currentIndex = flow.indexOf(wo.status);
        if (currentIndex < flow.length - 1) {
            const nextStatus = flow[currentIndex + 1];
            updateWorkOrderStatus(wo.id, nextStatus);
            
            if (nextStatus === 'awaiting_approval') {
                sendBudgetNotification();
            } else if (nextStatus === 'ready') {
                sendManualBilling();
            }
        }
    };

    const sendBudgetNotification = () => {
        if (!customer || !wo) return;
        
        const safeItems = wo.items || [];
        const itemsList = safeItems.length > 0 
            ? `\n📋 *Detalhamento:*\n${safeItems.map(item => `- ${item.name}: ${formatCurrency(item.price * item.quantity)}`).join('\n')}\n`
            : '';

        const diagnosis = wo.technicalDiagnostic 
            ? `\n🔍 *Diagnóstico Técnico:*\n${wo.technicalDiagnostic}\n`
            : '';

        const message = `Olá *${customer.name.split(' ')[0]}*! 📝
O orçamento para o seu aparelho (*${product?.brand} ${product?.model}*) na OS *#${wo.number}* está pronto.
${diagnosis}${itemsList}
💰 *Valor Total:* ${formatCurrency(wo.totalCost)}

Você pode revisar os detalhes e *APROVAR* ou *RECUSAR* o serviço clicando no link oficial abaixo:
🔗 ${window.location.origin}/rastreio/${wo.number}

Estamos aguardando seu retorno para iniciar o reparo!`;

        logCommunication({
            id: crypto.randomUUID(),
            workOrderId: wo.id,
            customerPhone: customer.whatsapp,
            message,
            status: 'sent',
            direction: 'outbound',
            timestamp: new Date().toISOString(),
            type: 'awaiting_approval'
        });
    };

    const sendManualBilling = () => {
        if (!customer) return;
        const message = `Olá ${customer.name}, seu aparelho da OS #${wo.number} está pronto para retirada.

Valor do serviço: ${formatCurrency(wo.totalCost)}${(wo.totalStorageFee || 0) > 0 ? `\n\nTaxa de armazenamento: ${formatCurrency(wo.totalStorageFee || 0)}` : ''}

Após ${billingSettings.gracePeriodDays} dias será aplicada taxa de armazenamento de ${formatCurrency(billingSettings.dailyFee)} por dia.`;

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
    };

    const addPart = () => {
        const parsedPrice = parseMoneyInput(newPart.priceInput);
        if (!newPart.name || newPart.quantity <= 0) return;
        const updatedItems = [...(wo.items || []), { 
            partId: crypto.randomUUID(), 
            name: newPart.name, 
            quantity: newPart.quantity, 
            price: parsedPrice 
        }];
        const totalParts = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const totalCost = totalParts + (wo.laborCost || 0);
        updateWorkOrder(wo.id, { items: updatedItems, totalCost });
        setNewPart({ name: '', quantity: 1, priceInput: '' });
    };

    const removePart = (partId: string) => {
        const updatedItems = (wo.items || []).filter(i => i.partId !== partId);
        const totalParts = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const totalCost = totalParts + (wo.laborCost || 0);
        updateWorkOrder(wo.id, { items: updatedItems, totalCost });
    };

    return (
        <div className="animate-fade-in scroll-area" style={{ backgroundColor: '#f8fafc', paddingBottom: '3rem' }}>
            {/* Modal de Edição */}
            {isEditModalOpen && (
                <div className="modal-overlay" style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '40px 16px', zIndex: 1000 }}>
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '600px', width: '100%', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div style={{ padding: '24px 32px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="text-h2" style={{ fontSize: '1.25rem', margin: 0 }}>Editar Ordem de Serviço</h2>
                            <button className="btn-icon" onClick={closeEditModal} type="button">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={saveEditModal}>
                            <div className="p-6 flex flex-col gap-4">
                                <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider mb-2">Dados do Cliente</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="input-group col-span-2">
                                        <label className="input-label">Nome Completo</label>
                                        <input className="input-field" required value={editData.customerName} onChange={e => setEditData({...editData, customerName: e.target.value})} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Telefone</label>
                                        <input className="input-field" required value={editData.customerPhone} onChange={e => setEditData({...editData, customerPhone: e.target.value})} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">WhatsApp</label>
                                        <input className="input-field" required value={editData.customerWhatsapp} onChange={e => setEditData({...editData, customerWhatsapp: e.target.value})} />
                                    </div>
                                    <div className="input-group col-span-2">
                                        <label className="input-label">CPF/CNPJ</label>
                                        <input className="input-field" placeholder="000.000.000-00" value={editData.customerDocument} onChange={e => setEditData({...editData, customerDocument: e.target.value})} />
                                    </div>
                                </div>

                                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '8px 0' }} />
                                <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider mb-2">Equipamento</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">Marca</label>
                                        <input className="input-field" required value={editData.productBrand} onChange={e => setEditData({...editData, productBrand: e.target.value})} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Modelo</label>
                                        <input className="input-field" value={editData.productModel} onChange={e => setEditData({...editData, productModel: e.target.value})} />
                                    </div>
                                    <div className="input-group col-span-2">
                                        <label className="input-label">Defeito Relatado</label>
                                        <textarea className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} required value={editData.reportedDefect} onChange={e => setEditData({...editData, reportedDefect: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                                <button type="button" className="btn btn-secondary px-6" onClick={closeEditModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary px-8">
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TOP ACTIONS & HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-6" style={{ alignItems: 'center', marginBottom: '2.5rem' }}>
                <div className="flex items-center gap-4">
                    <button 
                        className="btn-icon card" 
                        style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => navigate('/os')}
                        title="Voltar"
                    >
                        <ChevronLeft size={22} style={{ color: '#475569' }} />
                    </button>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-h1" style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#0f172a' }}>OS #{wo.number}</h1>
                                <span 
                                    className="badge" 
                                    style={{ 
                                        backgroundColor: statusMap[wo.status]?.bg || '#f1f5f9', 
                                        color: statusMap[wo.status]?.color || '#64748b', 
                                        padding: '0.35rem 1rem',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {statusMap[wo.status]?.label || wo.status}
                                </span>
                        </div>
                        <p className="text-small flex items-center gap-2" style={{ color: '#64748b', fontSize: '0.85rem' }}>
                            <span>{customer?.name}</span>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#cbd5e1' }}></span>
                            <span>{product?.brand} {product?.model}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="card flex items-center gap-1" style={{ padding: '0.35rem', borderRadius: '1rem' }}>
                        <button 
                            className="btn" 
                            style={{ height: '2.5rem', color: '#475569', fontSize: '0.8rem', fontWeight: 700, backgroundColor: 'transparent' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={sendManualBilling}
                            title="Enviar Cobrança WhatsApp"
                        >
                            <MessageSquare size={16} />
                            <span>Cobrança</span>
                        </button>
                        <button 
                            className="btn" 
                            style={{ height: '2.5rem', color: '#475569', fontSize: '0.8rem', fontWeight: 700, backgroundColor: 'transparent' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={openEditModal}
                        >
                            <Edit size={16} />
                            <span>Editar</span>
                        </button>
                        <button 
                            className="btn-icon"
                            style={{ width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                            title="Imprimir OS"
                        >
                            <Printer size={16} /> 
                        </button>
                    </div>
                    <button 
                        className="btn btn-primary"
                        style={{ height: '3rem', padding: '0 2rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)', fontSize: '0.85rem' }}
                        onClick={advanceStatus}
                        disabled={['delivered', 'rejected'].includes(wo.status)}
                    >
                        {nextStatusLabel[wo.status]}
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* COLUNA ESQUERDA - 2/3 */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* CLIENTE & EQUIPAMENTO */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="card flex flex-col h-full">
                            <h3 className="card-header text-h3 flex items-center gap-2" style={{ fontSize: '1rem', paddingBottom: '1rem' }}>
                                <Info size={18} style={{ color: '#64748b' }} /> Dados do Cliente
                            </h3>
                            <div className="card-body flex-1 flex flex-col gap-4">
                                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                    <p className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Nome Completo</p>
                                    <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{customer?.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                        <p className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Telefone</p>
                                        <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{customer?.phone}</p>
                                    </div>
                                    <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '0.75rem', border: '1px solid #d1fae5' }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>WhatsApp</p>
                                        <p style={{ fontWeight: 600, color: '#047857', fontSize: '0.85rem' }}>{customer?.whatsapp}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                    <p className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>CPF / CNPJ</p>
                                    <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{customer?.document || 'Não informado'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card flex flex-col h-full">
                            <h3 className="card-header text-h3 flex items-center gap-2" style={{ fontSize: '1rem', paddingBottom: '1rem' }}>
                                <Package size={18} style={{ color: '#64748b' }} /> Equipamento
                            </h3>
                            <div className="card-body flex-1 flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                        <p className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Marca / Modelo</p>
                                        <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{product?.brand} {product?.model}</p>
                                    </div>
                                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                        <p className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Garantia</p>
                                        <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{wo.isUnderWarranty ? 'Sim' : 'Não'}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '0.75rem', border: '1px solid #fef3c7' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Obs. de Entrada</p>
                                    <p style={{ fontSize: '0.8rem', color: '#92400e', fontStyle: 'italic', fontWeight: 500 }}>"{wo.productCondition?.visualObservations || 'Nenhuma observação visual registrada'}"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DEFEITO & DIAGNOSTICO */}
                    <div className="card">
                        <div className="card-body grid md:grid-cols-2 gap-6" style={{ padding: '1.5rem' }}>
                            <div>
                                <h3 className="text-h3" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Defeito Relatado</h3>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#e2e8f0', borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}></div>
                                    <div style={{ padding: '1.25rem', paddingLeft: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', minHeight: '140px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, border: '1px solid #f1f5f9' }}>
                                        {wo.reportedDefect}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-h3" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Diagnóstico Técnico</h3>
                                <textarea 
                                    className="input-field"
                                    style={{ width: '100%', height: '140px', resize: 'none', marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', fontSize: '0.9rem' }}
                                    placeholder="Registre aqui o diagnóstico técnico detalhado..."
                                    value={localDiagnosis}
                                    onChange={e => setLocalDiagnosis(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <button 
                                        className="btn btn-primary"
                                        style={{ height: '2.5rem', padding: '0 1.5rem', borderRadius: '0.75rem' }}
                                        onClick={() => updateWorkOrder(wo.id, { technicalDiagnostic: localDiagnosis })}
                                        disabled={localDiagnosis === wo.technicalDiagnostic}
                                    >
                                        Salvar Diagnóstico
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PEÇAS & FINANCEIRO */}
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div className="card-header flex justify-between items-center" style={{ padding: '1.25rem 1.5rem' }}>
                            <h3 className="text-h3 flex items-center gap-2" style={{ fontSize: '1rem', margin: 0 }}>
                                <Calculator size={18} style={{ color: '#64748b' }} /> Peças e Financeiro
                            </h3>
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 700 }}>Gestão de Custos</p>
                        </div>
                        <div className="card-body flex flex-col gap-6" style={{ padding: '1.5rem' }}>
                            <div className="flex flex-col gap-4">
                                {/* Linha de Adição de Peça - Layout de Grid Fixo para evitar sobreposição */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 items-end">
                                    <div className="md:col-span-5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1 truncate">Peça / Componente / Serviço</p>
                                        <input 
                                            className="input-field w-full shadow-sm"
                                            style={{ height: '2.5rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
                                            placeholder="Descreva o item para adicionar..." 
                                            value={newPart.name}
                                            onChange={e => setNewPart({...newPart, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-1" style={{ maxWidth: '70px' }}>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1 truncate">Qtde</p>
                                        <input 
                                            type="number" 
                                            className="input-field w-full shadow-sm"
                                            style={{ height: '2.5rem', backgroundColor: '#ffffff', textAlign: 'center', border: '1px solid #cbd5e1', padding: '0' }}
                                            value={newPart.quantity}
                                            onChange={e => setNewPart({...newPart, quantity: parseInt(e.target.value) || 1})}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1 truncate">V. Unitário</p>
                                        <input 
                                            type="text" 
                                            className="input-field w-full shadow-sm"
                                            style={{ height: '2.5rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
                                            placeholder="R$ 0,00"
                                            value={newPart.priceInput}
                                            onChange={e => setNewPart({...newPart, priceInput: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <button className="btn btn-primary w-full shadow-md" style={{ height: '2.5rem', fontWeight: 600 }} onClick={addPart}>Adicionar à Lista</button>
                                    </div>
                                </div>

                                {/* Linha de Mão de Obra Integrada */}
                                <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Wrench size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Valor da Mão de Obra</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-small font-bold text-slate-400">R$</span>
                                        <input 
                                            type="text" 
                                            className="input-field"
                                            style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', backgroundColor: '#f8fafc', textAlign: 'right', width: '140px', padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0' }}
                                            placeholder="0,00"
                                            value={laborInput}
                                            onChange={e => setLaborInput(e.target.value)}
                                        />
                                        <button 
                                            className="btn btn-primary"
                                            style={{ height: '2.5rem', padding: '0 1rem', fontSize: '0.75rem', fontWeight: 700 }}
                                            onClick={() => {
                                                const labor = parseMoneyInput(laborInput);
                                                const partsTotal = wo.items?.reduce((acc, i) => acc + (i.price * i.quantity), 0) || 0;
                                                updateWorkOrder(wo.id, { laborCost: labor, totalCost: partsTotal + labor });
                                            }}
                                        >
                                            SALVAR
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="table-container" style={{ borderRadius: '0.75rem', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                                <table className="table">
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                            <th style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Peça / Componente</th>
                                            <th style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Quantidade</th>
                                            <th style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Valor Unitário</th>
                                            <th style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Subtotal</th>
                                            <th style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>#</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wo.items?.map(item => (
                                            <tr key={item.partId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{item.name}</td>
                                                <td style={{ color: '#475569', fontSize: '0.85rem' }}>{item.quantity}</td>
                                                <td style={{ color: '#475569', fontSize: '0.85rem' }}>{formatCurrency(item.price)}</td>
                                                <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{formatCurrency(item.price * item.quantity)}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn-icon" style={{ padding: '0.4rem', color: '#ef4444', backgroundColor: '#fef2f2' }} onClick={() => removePart(item.partId)}>
                                                        <X size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!wo.items || wo.items.length === 0) && (
                                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Nenhuma peça adicionada a este reparo.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end gap-6 pt-6 mt-2 border-t" style={{ borderColor: '#f1f5f9' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Geral</p>
                                    <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{formatCurrency(wo.totalCost)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA - 1/3 */}
                <div className="flex flex-col gap-6">
                    {/* STATUS CARD */}
                    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: 0, top: 0, width: '100px', height: '100px', backgroundColor: '#eff6ff', borderBottomLeftRadius: '100%', marginRight: '-2rem', marginTop: '-2rem' }}></div>
                        <div className="card-body">
                            <h3 className="text-h3 flex items-center gap-2" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
                                <Clock size={18} style={{ color: '#64748b' }} /> Status da Ordem
                            </h3>
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <p className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progresso Atual</p>
                                    <div className="flex items-center gap-4" style={{ padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${statusMap[wo.status]?.color || '#cbd5e1'}30`, backgroundColor: '#f8fafc' }}>
                                        <div 
                                            style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: statusMap[wo.status]?.color || '#cbd5e1', color: 'white', flexShrink: 0 }}
                                        >
                                            <History size={24} />
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <p style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2, marginBottom: '0.2rem', color: statusMap[wo.status]?.color || '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{statusMap[wo.status]?.label || wo.status}</p>
                                            <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Desde {new Date(wo.statusEntryDate || wo.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    className="btn btn-primary"
                                    style={{ width: '100%', height: '3rem', borderRadius: '0.75rem' }}
                                    onClick={advanceStatus}
                                    disabled={['delivered', 'rejected'].includes(wo.status)}
                                >
                                    {nextStatusLabel[wo.status]}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RETIRADA CARD */}
                    {wo.status === 'ready' && (
                        <div className="card" style={{ border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)' }}>
                            <div className="card-body">
                                <h3 className="text-h3 flex items-center gap-2" style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#047857' }}>
                                    <Package size={18} style={{ color: '#059669' }} /> Pronta p/ Retirada
                                </h3>
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #d1fae5', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Entrada em</p>
                                            <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{wo.readyForPickupDate ? new Date(wo.readyForPickupDate).toLocaleDateString('pt-BR') : '-'}</p>
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #d1fae5', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Tempo</p>
                                            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{wo.daysPending || 0}d</p>
                                            {(wo.daysPending || 0) > billingSettings.gracePeriodDays && (
                                                <div style={{ position: 'absolute', right: 0, top: 0, width: '4px', height: '100%', backgroundColor: '#ef4444' }}></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center" style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fecaca' }}>
                                        <div className="flex flex-col">
                                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#dc2626', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Taxa Acumulada</p>
                                            {(wo.daysPending || 0) > billingSettings.gracePeriodDays ? (
                                                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Atraso Crítico</p>
                                            ) : (
                                              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#059669', opacity: 0.7, textTransform: 'uppercase' }}>Período de Graça</p>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>{formatCurrency(wo.totalStorageFee || 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COBRANÇA CARD */}
                    <div className="card">
                        <div className="card-body">
                            <h3 className="text-h3 flex items-center gap-2" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
                                <MessageSquare size={18} style={{ color: '#64748b' }} /> Registro de Cobrança
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="custom-scrollbar flex flex-col gap-3" style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                    {communications.map(log => (
                                        <div key={log.id} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8fafc'}>
                                            <div className="flex justify-between items-center">
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                                    {log.type === 'ready' ? 'Cobrança de Retirada' : 'Comunicado'}
                                                </span>
                                                <span style={{ padding: '0.15rem 0.6rem', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '0.65rem', fontWeight: 700, borderRadius: '9999px', textTransform: 'uppercase' }}>Enviado</span>
                                            </div>
                                            <p style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                                                {new Date(log.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    ))}
                                    {communications.length === 0 && (
                                        <div style={{ padding: '2rem 1rem', textAlign: 'center', borderRadius: '0.75rem', border: '1px dashed #e2e8f0', backgroundColor: '#f8fafc' }}>
                                            <MessageSquare size={24} style={{ color: '#cbd5e1', margin: '0 auto 0.5rem' }} />
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Nenhuma cobrança enviada</p>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    className="btn" 
                                    style={{ width: '100%', height: '2.5rem', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700, borderRadius: '0.75rem' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d1fae5'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                                    onClick={sendManualBilling}
                                >
                                    <MessageSquare size={16} />
                                    Enviar Nova Cobrança
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* HISTORICO CARD */}
                    <div className="card">
                        <div className="card-body">
                            <h3 className="text-h3 flex items-center gap-2" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
                                <History size={18} style={{ color: '#64748b' }} /> Linha do Tempo
                            </h3>
                            <div style={{ position: 'relative', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ position: 'absolute', left: '0.65rem', top: '0.5rem', bottom: '0.5rem', width: '2px', backgroundColor: '#f1f5f9' }}></div>
                                {[...(wo.history || [])].reverse().slice(0, 5).map(event => (
                                    <div key={event.id} style={{ position: 'relative' }}>
                                        <div style={{ 
                                            position: 'absolute', left: '-1.85rem', top: '0.15rem', width: '0.75rem', height: '0.75rem', borderRadius: '50%', 
                                            border: '2px solid white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', zIndex: 10,
                                            backgroundColor: event.type === 'status' ? '#2563eb' : event.type === 'communication' ? '#10b981' : '#f59e0b'
                                        }} />
                                        <div className="flex flex-col gap-1">
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>
                                                {event.type === 'status' ? `Alterado para ${statusMap[event.status]?.label}` : 
                                                 event.type === 'communication' ? 'Cobrança Enviada' : 
                                                 `Editado: ${event.fieldName || 'Dados da OS'}`}
                                            </p>
                                            <div className="flex items-center gap-1" style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                                                <Clock size={10} />
                                                <span>{new Date(event.timestamp).toLocaleDateString('pt-BR')} às {new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {wo.history.length === 0 && (
                                    <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Nenhum evento registrado</p>
                                    </div>
                                )}
                            </div>
                            <button style={{ width: '100%', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', backgroundColor: 'transparent', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#1d4ed8'} onMouseLeave={e => e.currentTarget.style.color = '#2563eb'}>
                                Ver Histórico Completo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderDetail;
