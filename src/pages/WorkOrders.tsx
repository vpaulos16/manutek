import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { 
    FilePlus, Search, MessageSquare, AlertTriangle, ArrowRight 
} from 'lucide-react';
import type { WorkOrder, OSStatus } from '../types';

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const statusMap: Record<OSStatus, { label: string, color: string, bg: string }> = {
    received: { label: 'Recebido', color: '#3b82f6', bg: '#eff6ff' },
    analyzing: { label: 'Em Análise', color: '#d97706', bg: '#fffbeb' },
    awaiting_approval: { label: 'Aguardando Aprovação', color: '#ea580c', bg: '#fff7ed' },
    approved: { label: 'Aprovado', color: '#059669', bg: '#ecfdf5' },
    rejected: { label: 'Recusado', color: '#dc2626', bg: '#fef2f2' },
    in_maintenance: { label: 'Em Manutenção', color: '#6366f1', bg: '#eef2ff' },
    completed: { label: 'Concluído', color: '#8b5cf6', bg: '#f5f3ff' },
    ready: { label: 'Pronto para Retirada', color: '#10b981', bg: '#ecfdf5' },
    delivered: { label: 'Entregue', color: '#64748b', bg: '#f1f5f9' },
};

const WorkOrders: React.FC = () => {
    const navigate = useNavigate();
    const { 
        workOrders, customers, products, setOSModalOpen, 
        logCommunication, billingSettings 
    } = useStore();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = workOrders.filter(wo => {
        const customer = customers.find(c => c.id === wo.customerId);
        const product = products.find(p => p.id === wo.productId);
        const search = searchTerm.toLowerCase();
        
        return wo.number.toString().includes(search) ||
            customer?.name.toLowerCase().includes(search) ||
            customer?.whatsapp.includes(search) ||
            customer?.phone?.includes(search) ||
            product?.brand.toLowerCase().includes(search) ||
            product?.model.toLowerCase().includes(search);
    }).sort((a, b) => new Date(b.statusEntryDate || b.createdAt).getTime() - new Date(a.statusEntryDate || a.createdAt).getTime());

    const sendManualBilling = (wo: WorkOrder) => {
        const customer = customers.find(c => c.id === wo.customerId);
        if (customer) {
            const message = `Olá ${customer.name}, seu aparelho da OS #${wo.number} está pronto para retirada.

Valor do serviço: ${formatCurrency(wo.totalCost)}

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
        }
    };

    return (
        <div className="animate-fade-in scroll-area" style={{ backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4" style={{ alignItems: 'center' }}>
                <div>
                    <h1 className="text-h1" style={{ letterSpacing: '-0.02em', fontSize: '1.75rem', fontWeight: 800 }}>Ordens de Serviço</h1>
                    <p className="text-subtitle" style={{ marginTop: '0.25rem' }}>Gestão de manutenção e diagnósticos</p>
                </div>
                <div className="flex gap-4">
                    <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="input-field"
                            style={{ width: '100%', paddingLeft: '2.5rem', height: '3rem', borderRadius: '1rem' }}
                            placeholder="Buscar OS, cliente ou aparelho..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        className="btn btn-primary" 
                        style={{ height: '3rem', padding: '0 1.5rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)' }}
                        onClick={() => setOSModalOpen(true)}
                    >
                        <FilePlus size={18} /> 
                        <span>Nova OS</span>
                    </button>
                </div>
            </div>

            {/* Content Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '1.5rem', backgroundColor: '#ffffff', borderRadius: '1.5rem' }}>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>OS</th>
                                <th style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cliente</th>
                                <th style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Equipamento</th>
                                <th style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                                <th style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Aguardando Retirada</th>
                                <th style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Valor Total</th>
                                <th style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map(wo => {
                                    const customer = customers.find(c => c.id === wo.customerId);
                                    const product = products.find(p => p.id === wo.productId);
                                    const isReady = wo.status === 'ready';
                                    const criticalWithdrawal = (wo.daysPending || 0) > billingSettings.gracePeriodDays;

                                    return (
                                        <tr 
                                            key={wo.id} 
                                            onClick={() => navigate(`/os/${wo.id}`)}
                                            style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                                        >
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <span style={{ fontWeight: 700, color: '#0f172a', backgroundColor: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                                                    #{wo.number}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{customer?.name}</span>
                                                    <span className="text-small" style={{ marginTop: '0.1rem' }}>{customer?.whatsapp || customer?.phone}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{product?.brand}</span>
                                                    <span className="text-small" style={{ marginTop: '0.1rem' }}>{product?.model}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <span 
                                                    className="badge" 
                                                    style={{ 
                                                        backgroundColor: statusMap[wo.status].bg, 
                                                        color: statusMap[wo.status].color,
                                                        padding: '0.35rem 0.8rem',
                                                        letterSpacing: '0.02em'
                                                    }}
                                                >
                                                    {statusMap[wo.status].label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                {isReady ? (
                                                    <div style={{ 
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                                                        padding: '0.35rem 0.75rem', borderRadius: '0.5rem', 
                                                        backgroundColor: criticalWithdrawal ? '#fef2f2' : '#f8fafc',
                                                        border: `1px solid ${criticalWithdrawal ? '#fecaca' : '#e2e8f0'}`,
                                                        color: criticalWithdrawal ? '#dc2626' : '#64748b'
                                                    }}>
                                                        {criticalWithdrawal ? <AlertTriangle size={14} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8' }} />}
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{wo.daysPending || 0} dias</span>
                                                    </div>
                                                ) : <span style={{ color: '#cbd5e1', fontWeight: 800, marginLeft: '1rem' }}>-</span>}
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                                                {formatCurrency(wo.totalCost)}
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                                <div className="flex justify-end gap-2" style={{ alignItems: 'center' }}>
                                                    {isReady && (
                                                        <button 
                                                            style={{
                                                                width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                borderRadius: '0.5rem', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0',
                                                                cursor: 'pointer', transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#bbf7d0'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#dcfce7'}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                sendManualBilling(wo);
                                                            }}
                                                            title="Enviar cobrança via WhatsApp"
                                                        >
                                                            <MessageSquare size={16} style={{ fill: 'currentColor' }} />
                                                        </button>
                                                    )}
                                                    <button
                                                        style={{
                                                            height: '36px', padding: '0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                            borderRadius: '0.5rem', backgroundColor: 'transparent', color: '#2563eb', fontWeight: 700, fontSize: '0.8rem',
                                                            cursor: 'pointer', transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/os/${wo.id}`);
                                                        }}
                                                    >
                                                        <span>Abrir</span>
                                                        <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Nenhuma Ordem de Serviço encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkOrders;
