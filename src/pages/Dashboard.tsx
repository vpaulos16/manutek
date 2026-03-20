import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { ClipboardList, Wrench, CheckCircle, DollarSign, Play, Watch, Send, ArrowRight, Package, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { workOrders, customers, setOSModalOpen, simulateDailyBillingCron } = useStore();

    const openOS = workOrders.filter(wo => !['completed', 'ready', 'delivered', 'rejected'].includes(wo.status)).length;
    const inProgressOS = workOrders.filter(wo => wo.status === 'in_maintenance').length;

    const today = new Date().toISOString().split('T')[0];
    const completedToday = workOrders.filter(wo =>
        ['completed', 'ready', 'delivered'].includes(wo.status) &&
        (wo.updatedAt?.startsWith(today) || wo.createdAt.startsWith(today))
    ).length;

    const revenueToday = workOrders
        .filter(wo => wo.status === 'delivered' &&
            (wo.updatedAt?.startsWith(today) || wo.createdAt.startsWith(today)))
        .reduce((acc, wo) => acc + (wo.totalCost || 0), 0);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const pendingPickup = workOrders.filter(wo => wo.status === 'ready');
    const recentOrders = workOrders.slice(-5).reverse();

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            received: 'Recebido', analyzing: 'Em Análise', approved: 'Aprovado',
            awaiting_approval: 'Aguardando', budget_sent: 'Orçamento Enviado',
            in_maintenance: 'Em Conserto', ready: 'Pronto', delivered: 'Entregue',
            completed: 'Concluído', rejected: 'Rejeitado'
        };
        return map[status] || status;
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            received: '#3b82f6', analyzing: '#d97706', approved: '#059669',
            awaiting_approval: '#ea580c', budget_sent: '#7c3aed',
            in_maintenance: '#6366f1', ready: '#7c3aed', delivered: '#64748b',
            completed: '#059669', rejected: '#dc2626'
        };
        return map[status] || '#94a3b8';
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Painel de Controle</h1>
                    <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.9rem' }}>Bem-vindo(a) de volta! Veja como está sua assistência hoje.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn"
                        style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                        onClick={() => simulateDailyBillingCron()}
                    >
                        <Play size={16} /> Rotina Diária
                    </button>
                    <button 
                        className="btn btn-primary" 
                        style={{ 
                            padding: '0.75rem 1.5rem', 
                            borderRadius: '1rem', 
                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }} 
                        onClick={() => setOSModalOpen(true)}
                    >
                        <Zap size={18} className="fill-current text-amber-300" /> 
                        <span style={{ fontWeight: 700 }}>Nova Ordem de Serviço</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                {[
                    { label: 'OS Abertas', value: openOS, color: '#3b82f6', bg: '#eff6ff', icon: ClipboardList, link: '/os' },
                    { label: 'Em Manutenção', value: inProgressOS, color: '#f59e0b', bg: '#fffbeb', icon: Wrench, link: '/os' },
                    { label: 'Concluídas Hoje', value: completedToday, color: '#10b981', bg: '#f0fdf4', icon: CheckCircle, link: '/os' },
                    { label: 'Faturamento Hoje', value: formatCurrency(revenueToday), color: '#059669', bg: '#ecfdf5', icon: DollarSign, link: '/financas' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        onClick={() => navigate(stat.link)}
                        className="card"
                        style={{
                            padding: '1.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: 'pointer',
                            borderLeft: `4px solid ${stat.color}`,
                            transition: 'box-shadow 0.2s, transform 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                    >
                        <div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{stat.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>{stat.value}</p>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: stat.bg, color: stat.color }}>
                            <stat.icon size={28} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

                {/* Aguardando Retirada */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', backgroundColor: '#fff7ed', color: '#ea580c', borderRadius: '0.5rem' }}>
                                <Watch size={18} />
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Aguardando Retirada</h3>
                        </div>
                        <span style={{
                            fontSize: '0.65rem', fontWeight: 700, color: '#9a3412',
                            backgroundColor: '#ffedd5', padding: '0.25rem 0.75rem',
                            borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {pendingPickup.length} no pátio
                        </span>
                    </div>

                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        {pendingPickup.length === 0 ? (
                            <div style={{
                                padding: '3rem 2rem', textAlign: 'center',
                                backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #e2e8f0'
                            }}>
                                <Package size={36} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                                <p style={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>Pátio vazio</p>
                                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>Nenhum aparelho aguardando retirada.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {pendingPickup.sort((a, b) => (b.daysPending || 0) - (a.daysPending || 0)).map(wo => {
                                    const customer = customers.find(c => c.id === wo.customerId);
                                    const isUrgent = (wo.daysPending || 0) > 7;
                                    return (
                                        <div key={wo.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '1rem 1.25rem',
                                            backgroundColor: isUrgent ? '#fef2f2' : '#fffbeb',
                                            borderRadius: '0.75rem',
                                            borderLeft: `3px solid ${isUrgent ? '#ef4444' : '#f59e0b'}`,
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{customer?.name || 'Cliente'}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                                                    OS #{wo.number} · {wo.daysPending || 0} dias
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '1rem' }}>
                                                    {formatCurrency(wo.totalStorageFee || 0)}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate('/chat'); }}
                                                    style={{
                                                        padding: '0.5rem', borderRadius: '0.5rem',
                                                        backgroundColor: '#e0e7ff', color: '#4338ca',
                                                        border: 'none', cursor: 'pointer'
                                                    }}
                                                    title="Enviar Lembrete"
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Últimas Entradas */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', backgroundColor: '#eef2ff', color: '#4338ca', borderRadius: '0.5rem' }}>
                                <ClipboardList size={18} />
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Últimas Entradas</h3>
                        </div>
                        <button
                            onClick={() => navigate('/os')}
                            style={{
                                fontSize: '0.75rem', fontWeight: 700, color: '#4338ca',
                                background: 'none', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.25rem'
                            }}
                        >
                            Ver todas <ArrowRight size={12} />
                        </button>
                    </div>

                    <div style={{ padding: '0.5rem 0' }}>
                        {recentOrders.length === 0 ? (
                            <div style={{
                                padding: '3rem 2rem', textAlign: 'center', margin: '1rem 1.5rem',
                                backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #e2e8f0'
                            }}>
                                <ClipboardList size={36} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                                <p style={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>Nenhuma entrada</p>
                                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>Novas OS aparecerão aqui.</p>
                            </div>
                        ) : (
                            recentOrders.map((wo, idx) => {
                                const customer = customers.find(c => c.id === wo.customerId);
                                return (
                                    <div
                                        key={wo.id}
                                        onClick={() => navigate('/os')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            padding: '0.9rem 1.5rem',
                                            cursor: 'pointer',
                                            borderBottom: idx < recentOrders.length - 1 ? '1px solid #f1f5f9' : 'none',
                                            transition: 'background-color 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                                    >
                                        {/* Status dot */}
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                            backgroundColor: getStatusColor(wo.status)
                                        }} />

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                                                {customer?.name || 'Cliente'}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                                                OS #{wo.number}
                                            </p>
                                        </div>

                                        {/* Status badge */}
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 700,
                                            color: getStatusColor(wo.status),
                                            backgroundColor: `${getStatusColor(wo.status)}15`,
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '999px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.03em',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {getStatusLabel(wo.status)}
                                        </span>

                                        {/* Date */}
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                            {new Date(wo.createdAt).toLocaleDateString('pt-BR')}
                                        </span>

                                        <ArrowRight size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
