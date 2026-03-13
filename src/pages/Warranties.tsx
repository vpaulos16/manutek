import React from 'react';
import { useStore } from '../lib/store';
import { ShieldAlert, Search } from 'lucide-react';

const Warranties: React.FC = () => {
    const { workOrders, products, customers } = useStore();

    const deliveredOrders = workOrders.filter(wo => wo.status === 'delivered');

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-h1">Garantias</h1>
                    <p className="text-subtitle">Controle de equipamentos em período de garantia</p>
                </div>
            </div>

            <div className="card">
                <div className="card-header flex justify-between items-center">
                    <div className="search-bar" style={{ width: '400px' }}>
                        <Search size={18} color="var(--color-text-muted)" />
                        <input type="text" placeholder="Buscar por número de série ou OS..." />
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nº OS Original</th>
                                <th>Cliente</th>
                                <th>Aparelho</th>
                                <th>Nº Série</th>
                                <th>Data de Entrega</th>
                                <th>Vencimento Garantia (90d)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveredOrders.length > 0 ? (
                                deliveredOrders.map(wo => {
                                    const customer = customers.find(c => c.id === wo.customerId);
                                    const product = products.find(p => p.id === wo.productId);
                                    const devDate = new Date(wo.updatedAt);
                                    const expDate = new Date(devDate);
                                    expDate.setDate(expDate.getDate() + 90);
                                    const isValid = expDate > new Date();

                                    return (
                                        <tr key={wo.id} style={{ opacity: isValid ? 1 : 0.6 }}>
                                            <td className="font-medium text-primary">#{wo.number}</td>
                                            <td>{customer?.name}</td>
                                            <td>{product?.brand} {product?.model}</td>
                                            <td>{product?.serialNumber}</td>
                                            <td>{devDate.toLocaleDateString('pt-BR')}</td>
                                            <td className={isValid ? 'font-semibold' : ''}>{expDate.toLocaleDateString('pt-BR')}</td>
                                            <td>
                                                {isValid ? (
                                                    <span className="badge badge-success flex items-center gap-1 w-max">
                                                        <ShieldAlert size={12} /> Ativa
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-danger">Expirada</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center p-6 text-muted">Ainda não há produtos entregues para controle de garantia.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Warranties;
