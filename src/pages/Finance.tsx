import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { 
    TrendingUp, 
    Wrench, 
    Clock, 
    CheckCircle, 
    Download, 
    BarChart3,
    PieChart as PieChartIcon,
    ArrowRight
} from 'lucide-react';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfYear, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Finance: React.FC = () => {
    const navigate = useNavigate();
    const { workOrders, technicians, customers, products } = useStore();
    const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | 'current_month' | 'year'>('30d');
    const [activeTab, setActiveTab] = useState<'billing' | 'ready' | 'services' | 'parts' | 'performance'>('billing');

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const dateRange = useMemo(() => {
        const now = new Date();
        switch (periodFilter) {
            case '7d': return { start: subDays(now, 7), end: now };
            case '30d': return { start: subDays(now, 30), end: now };
            case 'current_month': return { start: startOfMonth(now), end: endOfMonth(now) };
            case 'year': return { start: startOfYear(now), end: now };
            default: return { start: subDays(now, 30), end: now };
        }
    }, [periodFilter]);

    const stats = useMemo(() => {
        const finalizedInPeriod = workOrders.filter(wo => {
            if (wo.status !== 'delivered') return false;
            const date = parseISO(wo.updatedAt || wo.createdAt);
            return isWithinInterval(date, dateRange);
        });

        const ready = workOrders.filter(wo => wo.status === 'ready');
        const revenueTotal = finalizedInPeriod.reduce((acc, wo) => acc + (wo.totalCost || 0), 0);
        const revenueLabor = finalizedInPeriod.reduce((acc, wo) => acc + (wo.laborCost || 0), 0);
        const revenueParts = finalizedInPeriod.reduce((acc, wo) => acc + ((wo.totalCost || 0) - (wo.laborCost || 0)), 0);
        
        return {
            revenueTotal,
            revenueLabor,
            revenueParts,
            repairedCount: finalizedInPeriod.length,
            readyValue: ready.reduce((acc, wo) => acc + (wo.totalCost || 0), 0),
            readyCount: ready.length
        };
    }, [workOrders, dateRange]);

    const chartMonthlyRevenue = useMemo(() => {
        const months = Array.from({ length: 6 }).map((_, i) => {
            const d = subDays(new Date(), (5 - i) * 30);
            return format(d, 'MMM/yy', { locale: ptBR });
        });

        return months.map(monthYear => {
            const total = workOrders
                .filter(wo => wo.status === 'delivered' && format(parseISO(wo.updatedAt || wo.createdAt), 'MMM/yy', { locale: ptBR }) === monthYear)
                .reduce((acc, wo) => acc + (wo.totalCost || 0), 0);
            return { name: monthYear, valor: total };
        });
    }, [workOrders]);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header - Identical to Dashboard */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Painel Financeiro</h1>
                    <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.9rem' }}>Acompanhe o desempenho real baseado em ordens entregues e pagas.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: 'white', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                    {(['7d', '30d', 'current_month', 'year'] as const).map(p => (
                        <button 
                            key={p}
                            onClick={() => setPeriodFilter(p)}
                            style={{ 
                                padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '0.5rem', transition: 'all 0.2s',
                                backgroundColor: periodFilter === p ? '#3b82f6' : 'transparent',
                                color: periodFilter === p ? 'white' : '#64748b'
                            }}
                        >
                            {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : p === 'current_month' ? 'Mês' : 'Ano'}
                        </button>
                    ))}
                    <div style={{ width: 1, height: 20, backgroundColor: '#e2e8f0', margin: '0 0.25rem' }} />
                    <button style={{ padding: '0.5rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Cards - Identical to Dashboard Pattern */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                <FinCard 
                    title="Receita Real (Entregues)" 
                    value={formatCurrency(stats.revenueTotal)} 
                    icon={TrendingUp} 
                    color="#3b82f6" 
                    bg="#eff6ff" 
                />
                <FinCard 
                    title="Mão de Obra Bruta" 
                    value={formatCurrency(stats.revenueLabor)} 
                    icon={Wrench} 
                    color="#10b981" 
                    bg="#f0fdf4" 
                />
                <FinCard 
                    title="Aguardando Retirada" 
                    value={formatCurrency(stats.readyValue)} 
                    icon={Clock} 
                    color="#f59e0b" 
                    bg="#fffbeb" 
                />
                <FinCard 
                    title="Volume de Entregas" 
                    value={stats.repairedCount} 
                    icon={CheckCircle} 
                    color="#6366f1" 
                    bg="#eef2ff" 
                />
            </div>

            {/* Visual Analysis - Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Evolution Chart */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '0.5rem' }}>
                            <BarChart3 size={18} />
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Evolução de Faturamento</h3>
                    </div>
                    <div style={{ padding: '1.5rem', height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartMonthlyRevenue}>
                                <defs>
                                    <linearGradient id="colorFin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `R$ ${val/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                                    formatter={(value) => formatCurrency(value as number)}
                                />
                                <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFin)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Composition Chart */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f0fdf4', color: '#10b981', borderRadius: '0.5rem' }}>
                            <PieChartIcon size={18} />
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Composição da Receita</h3>
                    </div>
                    <div style={{ padding: '1.5rem', height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Mão de Obra', value: stats.revenueLabor },
                                        { name: 'Peças e Itens', value: stats.revenueParts }
                                    ]}
                                    innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value"
                                >
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#10b981" />
                                </Pie>
                                <Tooltip formatter={(val) => formatCurrency(val as number)} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                            <LegendItem color="#3b82f6" label="Mão de Obra" />
                            <LegendItem color="#10b981" label="Peças / Itens" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Reports - Tab System */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', display: 'flex', backgroundColor: '#f8fafc' }}>
                    <Tab active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} label="Faturamento Mensal" />
                    <Tab active={activeTab === 'ready'} onClick={() => setActiveTab('ready')} label="Equipamentos no Pátio" />
                    <Tab active={activeTab === 'services'} onClick={() => setActiveTab('services')} label="Log de Entregas" />
                    <Tab active={activeTab === 'parts'} onClick={() => setActiveTab('parts')} label="Peças Utilizadas" />
                    <Tab active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} label="Desempenho por Técnico" />
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                    {activeTab === 'billing' && <ReportBilling workOrders={workOrders} formatCurrency={formatCurrency} />}
                    {activeTab === 'ready' && <ReportReady workOrders={workOrders} customers={customers} products={products} formatCurrency={formatCurrency} />}
                    {activeTab === 'services' && <ReportServices workOrders={workOrders} customers={customers} technicians={technicians} formatCurrency={formatCurrency} />}
                    {activeTab === 'parts' && <ReportParts workOrders={workOrders} formatCurrency={formatCurrency} />}
                    {activeTab === 'performance' && <ReportPerformance workOrders={workOrders} technicians={technicians} formatCurrency={formatCurrency} />}
                </div>
            </div>
        </div>
    );
};

// --- Pattern Helper Components ---

const FinCard: React.FC<{ title: string, value: string | number, icon: any, color: string, bg: string }> = ({ title, value, icon: Icon, color, bg }) => (
    <div
        className="card"
        style={{
            padding: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderLeft: `4px solid ${color}`,
            transition: 'box-shadow 0.2s, transform 0.2s',
            cursor: 'default'
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
        <div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{title}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>{value}</p>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: bg, color: color }}>
            <Icon size={28} />
        </div>
    </div>
);

const Tab: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
    <button 
        onClick={onClick}
        style={{ 
            padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, 
            color: active ? '#3b82f6' : '#64748b',
            borderBottom: active ? '2px solid #3b82f6' : 'none',
            backgroundColor: active ? 'white' : 'transparent',
            transition: 'all 0.2s', border: 'none', cursor: 'pointer',
            borderRight: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}
    >
        {label}
    </button>
);

const LegendItem = ({ color, label }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{label}</span>
    </div>
);

// --- Report Components - Enhanced Table Style ---

const ReportBilling = ({ workOrders, formatCurrency }: any) => {
    const billing = useMemo(() => {
        const months: Record<string, any> = {};
        workOrders.filter((wo: any) => wo.status === 'delivered').forEach((wo: any) => {
            const m = format(parseISO(wo.updatedAt || wo.createdAt), 'MMMM/yyyy', { locale: ptBR });
            if (!months[m]) months[m] = { m, total: 0, labor: 0, count: 0 };
            months[m].total += (wo.totalCost || 0);
            months[m].labor += (wo.laborCost || 0);
            months[m].count++;
        });
        return Object.values(months).reverse();
    }, [workOrders]);

    return (
        <div className="table-container shadow-none">
            <table className="table">
                <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ color: '#475569' }}>Período</th>
                        <th style={{ color: '#475569' }}>Faturamento Total</th>
                        <th style={{ color: '#475569' }}>Mão de Obra</th>
                        <th style={{ color: '#475569' }}>Peças / Itens</th>
                        <th style={{ color: '#475569' }}>OS Entregues</th>
                        <th style={{ color: '#475569' }}>Ticket Médio</th>
                    </tr>
                </thead>
                <tbody>
                    {billing.length > 0 ? billing.map((row: any) => (
                        <tr key={row.m}>
                            <td style={{ fontWeight: 700, color: '#1e293b', textTransform: 'capitalize' }}>{row.m}</td>
                            <td style={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(row.total)}</td>
                            <td style={{ fontWeight: 600, color: '#475569' }}>{formatCurrency(row.labor)}</td>
                            <td style={{ color: '#64748b' }}>{formatCurrency(row.total - row.labor)}</td>
                            <td style={{ fontWeight: 600 }}>{row.count}</td>
                            <td style={{ fontWeight: 800, color: '#3b82f6' }}>{formatCurrency(row.total / row.count)}</td>
                        </tr>
                    )) : <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Sem dados no período</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

const ReportReady = ({ workOrders, customers, products, formatCurrency }: any) => {
    const readyItems = workOrders.filter((wo: any) => wo.status === 'ready');
    return (
        <div className="table-container shadow-none">
            <table className="table">
                <thead>
                    <tr style={{ backgroundColor: '#fff7ed' }}>
                        <th style={{ color: '#9a3412' }}>OS</th>
                        <th style={{ color: '#9a3412' }}>Cliente</th>
                        <th style={{ color: '#9a3412' }}>Equipamento</th>
                        <th style={{ color: '#9a3412' }}>Pronto em</th>
                        <th style={{ color: '#9a3412' }}>Dias Parado</th>
                        <th style={{ color: '#9a3412' }}>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {readyItems.map(wo => {
                        const customer = customers.find((c: any) => c.id === wo.customerId);
                        const product = products.find((p: any) => p.id === wo.productId);
                        const days = wo.readyForPickupDate ? differenceInDays(new Date(), parseISO(wo.readyForPickupDate)) : 0;
                        return (
                            <tr key={wo.id}>
                                <td style={{ fontWeight: 800, color: '#3b82f6' }}>#{wo.number}</td>
                                <td style={{ fontWeight: 600 }}>{customer?.name}</td>
                                <td>{product?.brand} {product?.model}</td>
                                <td>{wo.readyForPickupDate ? format(parseISO(wo.readyForPickupDate), 'dd/MM/yy') : '-'}</td>
                                <td>
                                    <span style={{ 
                                        padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800,
                                        backgroundColor: days > 10 ? '#fee2e2' : '#ffedd5', color: days > 10 ? '#ef4444' : '#ea580c'
                                    }}>
                                        {days} DIAS
                                    </span>
                                </td>
                                <td style={{ fontWeight: 800 }}>{formatCurrency(wo.totalCost)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const ReportServices = ({ workOrders, customers, technicians, formatCurrency }: any) => {
    const delivered = [...workOrders]
        .filter(wo => wo.status === 'delivered')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return (
        <div className="table-container shadow-none">
            <table className="table">
                <thead><tr style={{ backgroundColor: '#f8fafc' }}><th>OS</th><th>Cliente</th><th>Técnico</th><th>M.O.</th><th>Total</th><th>Entregue</th></tr></thead>
                <tbody>
                    {delivered.map(wo => {
                        const customer = customers.find((c: any) => c.id === wo.customerId);
                        const tech = technicians.find((t: any) => t.id === wo.technicianId);
                        return (
                            <tr key={wo.id}>
                                <td style={{ fontWeight: 700 }}>#{wo.number}</td>
                                <td>{customer?.name}</td>
                                <td>{tech?.name || '-'}</td>
                                <td>{formatCurrency(wo.laborCost)}</td>
                                <td style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(wo.totalCost)}</td>
                                <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{format(parseISO(wo.updatedAt || wo.createdAt), 'dd/MM/yy')}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const ReportParts = ({ workOrders, formatCurrency }: any) => {
    const partsUsage = useMemo(() => {
        const usage: Record<string, any> = {};
        workOrders.forEach((wo: any) => {
            wo.items?.forEach((item: any) => {
                if (!usage[item.name]) usage[item.name] = { name: item.name, quantity: 0, total: 0 };
                usage[item.name].quantity += item.quantity;
                usage[item.name].total += (item.price * item.quantity);
            });
        });
        return Object.values(usage).sort((a: any, b: any) => b.quantity - a.quantity);
    }, [workOrders]);

    return (
        <div className="table-container shadow-none">
            <table className="table">
                <thead><tr style={{ backgroundColor: '#f8fafc' }}><th>Item</th><th>Quantidade</th><th>Total Faturado</th></tr></thead>
                <tbody>
                    {partsUsage.map((p: any) => (
                        <tr key={p.name}>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td style={{ fontWeight: 700 }}>{p.quantity} un</td>
                            <td style={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(p.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ReportPerformance = ({ workOrders, technicians, formatCurrency }: any) => {
    const performance = technicians.map(tech => {
        const finished = workOrders.filter(wo => wo.technicianId === tech.id && wo.status === 'delivered');
        const totalValue = finished.reduce((acc, wo) => acc + (wo.totalCost || 0), 0);
        return { name: tech.name, count: finished.length, value: totalValue };
    }).sort((a, b) => b.count - a.count);

    return (
        <div className="table-container shadow-none">
            <table className="table">
                <thead><tr style={{ backgroundColor: '#f1f5f9' }}><th>Técnico</th><th>OS Entregues</th><th>Valor Gerado</th><th>Média</th></tr></thead>
                <tbody>
                    {performance.map(row => (
                        <tr key={row.name}>
                            <td style={{ fontWeight: 700 }}>{row.name}</td>
                            <td style={{ fontWeight: 600 }}>{row.count}</td>
                            <td style={{ fontWeight: 800, color: '#3b82f6' }}>{formatCurrency(row.value)}</td>
                            <td>{formatCurrency(row.count > 0 ? row.value / row.count : 0)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Finance;
