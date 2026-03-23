import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { CheckCircle2, Circle, Wrench, Watch, XCircle } from 'lucide-react';
import type { OSStatus } from '../types';

const flowOrder: { status: OSStatus, label: string, desc: string }[] = [
    { status: 'received', label: 'Recebido', desc: 'Seu produto deu entrada na nossa assistência.' },
    { status: 'analyzing', label: 'Em Análise', desc: 'Nossos técnicos estão avaliando o defeito.' },
    { status: 'awaiting_approval', label: 'Aguardando Aprovação', desc: 'Orçamento gerado! Aguardando sua resposta.' },
    { status: 'approved', label: 'Aprovado', desc: 'Orçamento aprovado. Preparando para o conserto.' },
    { status: 'in_maintenance', label: 'Em Manutenção', desc: 'O aparelho está na bancada sendo consertado.' },
    { status: 'completed', label: 'Concluído', desc: 'Reparo finalizado com sucesso!' },
    { status: 'ready', label: 'Pronto para Retirada', desc: 'Seu aparelho já pode ser ser retirado na loja.' },
    { status: 'delivered', label: 'Entregue', desc: 'Aparelho entregue. Obrigado pela preferência!' }
];

const TimelineTracker: React.FC = () => {
    const { id } = useParams();
    const { workOrders, customers, products, updateWorkOrderStatus, logCommunication } = useStore();
    const [approvedMsg, setApprovedMsg] = useState(false);
    const [rejectedMsg, setRejectedMsg] = useState(false);

    const wo = workOrders.find(w => w.number.toString() === id);
    const customer = wo ? customers.find(c => c.id === wo.customerId) : null;
    const product = wo ? products.find(p => p.id === wo.productId) : null;

    const handleApprove = () => {
        if (wo) {
            updateWorkOrderStatus(wo.id, 'approved');
            setApprovedMsg(true);

            if (customer) {
                logCommunication({
                    id: crypto.randomUUID(),
                    workOrderId: wo.id,
                    customerPhone: customer.whatsapp,
                    message: `Olá ${customer.name.split(' ')[0]}! Resposta recebida da OS #${wo.number}. Você *APROVOU* o orçamento. Nossa equipe iniciará o reparo em breve.`,
                    status: 'delivered',
                    direction: 'outbound',
                    timestamp: new Date().toISOString(),
                    type: 'approved'
                });
            }
        }
    };

    const handleReject = () => {
        if (wo) {
            updateWorkOrderStatus(wo.id, 'rejected');
            setRejectedMsg(true);

            if (customer) {
                logCommunication({
                    id: crypto.randomUUID(),
                    workOrderId: wo.id,
                    customerPhone: customer.whatsapp,
                    message: `Olá ${customer.name.split(' ')[0]}! Resposta automática da OS #${wo.number}: Registramos que você *RECUSOU* o orçamento. Seu aparelho já se encontra disponível para retirada em nossa loja.`,
                    status: 'delivered',
                    direction: 'outbound',
                    timestamp: new Date().toISOString(),
                    type: 'rejected'
                });
            }
        }
    };

    if (!wo) {
        return (
            <div className="app-container justify-center items-center bg-gray-50 flex-col" style={{ height: '100vh', width: '100vw' }}>
                <Wrench size={48} className="text-muted mb-4" />
                <h1 className="text-h2">OS Não encontrada</h1>
                <p className="text-subtitle">Verifique o link enviado pelo WhatsApp.</p>
            </div>
        );
    }

    const currentStatusIndex = flowOrder.findIndex(f => f.status === wo.status);

    return (
        <div className="app-container justify-center bg-gray-50" style={{ height: '100vh', width: '100vw', overflowY: 'auto', padding: '2rem 1rem' }}>
            <div className="card w-full animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', alignSelf: 'flex-start' }}>
                <div className="card-header text-center" style={{ backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
                    <div className="flex justify-center mb-2">
                        <div className="bg-white rounded-full p-2 text-primary shadow-sm">
                            <Wrench size={24} />
                        </div>
                    </div>
                    <h1 className="text-h2 mb-1" style={{ color: 'white' }}>Acompanhamento de OS</h1>
                    <p style={{ opacity: 0.9 }}>#{wo.number} - {product?.brand} {product?.model}</p>
                </div>

                {approvedMsg && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 mt-4 mx-4 animate-fade-in" role="alert">
                        <p className="font-bold">Orçamento Aprovado!</p>
                        <p>Muito obrigado! Nossa equipe já foi notificada e iniciaremos o reparo do seu aparelho imediatamente.</p>
                    </div>
                )}

                {rejectedMsg && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 mt-4 mx-4 animate-fade-in" role="alert">
                        <p className="font-bold flex items-center gap-2"><XCircle size={18} /> Orçamento Recusado</p>
                        <p>Recebemos sua resposta. O conserto não será realizado. Por favor, venha retirar o seu aparelho em nossa loja física nos próximos dias.</p>
                    </div>
                )}

                {(wo.status === 'rejected' && (!rejectedMsg)) && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-4 mt-4 mx-4 rounded-md">
                        <p className="font-semibold flex items-center gap-2"><XCircle size={18} /> Orçamento Recusado Anteriormente</p>
                        <p className="text-small">O conserto deste aparelho foi declinado. Verifique a disponibilidade para retirada.</p>
                    </div>
                )}

                <div className="card-body">
                    <div className="mb-6 p-4 rounded-md" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                        <p className="text-small text-muted font-medium uppercase tracking-wider mb-2">Dados do Cliente</p>
                        <p className="font-semibold">{customer?.name}</p>
                        <p className="text-small text-muted mt-1">Defeito relatado: {wo.reportedDefect}</p>
                    </div>

                    {['analyzing', 'awaiting_approval', 'approved', 'in_maintenance', 'completed', 'ready', 'delivered'].includes(wo.status) && (
                        <div className="mb-6 p-4 rounded-md border border-slate-200 bg-white">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                                <Wrench size={16} className="text-primary" />
                                Detalhes do Orçamento
                            </h3>
                            
                            {wo.technicalDiagnostic && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Diagnóstico Técnico</p>
                                    <p className="text-sm text-slate-700 mt-1 italic">{wo.technicalDiagnostic}</p>
                                </div>
                            )}

                            {wo.items && wo.items.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Peças e Serviços</p>
                                    <div className="space-y-2">
                                        {wo.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm py-1 border-b border-dotted border-slate-100 last:border-0">
                                                <span className="text-slate-600">{item.name} (x{item.quantity})</span>
                                                <span className="font-medium text-slate-900">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between text-sm py-2 border-t border-slate-100 mt-2">
                                <span className="text-slate-600 font-medium">Mão de Obra</span>
                                <span className="font-medium text-slate-900">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wo.laborCost || 0)}
                                </span>
                            </div>

                            <div className="flex justify-between text-main font-bold py-2 border-t border-slate-200 mt-2 bg-slate-50 px-2 rounded">
                                <span>VALOR TOTAL</span>
                                <span>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wo.totalCost)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="timeline relative pl-4 border-l-2 ml-4 mb-6" style={{ borderColor: 'var(--color-border)' }}>
                        {flowOrder.map((step, index) => {
                            const isCompleted = index <= currentStatusIndex;
                            const isCurrent = index === currentStatusIndex;
                            const historyEvent = (wo.history || []).find(h => h.status === step.status);

                            return (
                                <div key={step.status} className="mb-6 relative">
                                    <div className="absolute -left-6 bg-white rounded-full" style={{ padding: '2px' }}>
                                        {isCompleted ? (
                                            <CheckCircle2 size={24} color={isCurrent ? 'var(--color-primary)' : 'var(--color-success)'}
                                                fill={isCurrent ? 'white' : 'var(--color-success)'}
                                                className={isCompleted && !isCurrent ? 'text-white' : ''} />
                                        ) : (
                                            <Circle size={24} color="var(--color-border)" fill="white" />
                                        )}
                                    </div>
                                    <div className="pl-6">
                                        <h3 className={`font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-main' : 'text-muted'}`}>
                                            {step.label}
                                        </h3>
                                        <p className={`text-small ${isCurrent ? 'text-main' : 'text-muted'}`}>{step.desc}</p>
                                        {historyEvent && (
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <Watch size={12} /> {new Date(historyEvent.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                        )}
                                        {(isCurrent && wo.status === 'awaiting_approval') && !approvedMsg && !rejectedMsg && (
                                            <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-md">
                                                <p className="font-semibold text-orange-800 mb-2">Orçamento Disponível</p>
                                                <p className="text-small text-orange-600 mb-3">Valor Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wo.totalCost)}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={handleReject} className="btn btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200 w-full justify-center flex-1">Recusar</button>
                                                    <button onClick={handleApprove} className="btn btn-primary bg-orange-600 hover:bg-orange-700 w-full justify-center flex-1">Aprovar Serviço</button>
                                                </div>
                                            </div>
                                        )}
                                        {wo.status === 'approved' && isCurrent && (
                                            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                                                <CheckCircle2 size={18} className="text-green-600" />
                                                <p className="font-semibold text-green-800">Orçamento Aprovado pelo Cliente</p>
                                            </div>
                                        )}
                                        {isCurrent && wo.status === 'ready' && wo.billingStatus === 'active' && wo.totalStorageFee && wo.totalStorageFee > 0 ? (
                                            <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-md">
                                                <p className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                                    <Watch size={18} /> Taxa de Armazenamento
                                                </p>
                                                <p className="text-small text-red-700 mb-2">
                                                    Atenção: Seu aparelho está aguardando retirada há <strong>{wo.daysPending} dias</strong>. Conforme nossos termos, uma taxa diária foi aplicada pelo armazenamento prolongado.
                                                </p>
                                                <div className="flex justify-between items-center bg-white p-2 rounded border border-red-100 mt-2">
                                                    <span className="text-sm font-medium text-gray-700">Serviço: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wo.totalCost)}</span>
                                                    <span className="text-sm font-bold text-red-600">Multa/Taxa: +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wo.totalStorageFee)}</span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center pt-4 border-t border-gray-200">
                        <p className="text-small text-muted">Dúvidas? Fale conosco pelo WhatsApp: {customer?.whatsapp}</p>
                        <Link to="/dashboard" className="text-small text-primary hover:underline mt-2 inline-block">← Voltar Sistema (Modo Admin)</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineTracker;
