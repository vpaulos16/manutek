import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { PackagePlus, Search, X } from 'lucide-react';
import type { Product } from '../types';

const Products: React.FC = () => {
    const { products, customers, addProduct } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        customerId: '',
        brand: '',
        model: '',
        serialNumber: '',
        category: '',
        color: '',
        voltage: '110V' as '110V' | '220V' | 'Bivolt'
    });

    const filteredProducts = products.filter(p =>
        p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.serialNumber.includes(searchTerm) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newProduct: Product = {
            id: crypto.randomUUID(),
            ...formData
        };
        addProduct(newProduct);
        setIsModalOpen(false);
        setFormData({ customerId: '', brand: '', model: '', serialNumber: '', category: '', color: '', voltage: '110V' });
    };

    const getCustomerName = (id: string) => {
        return customers.find(c => c.id === id)?.name || 'Desconhecido';
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-h1">Produtos</h1>
                    <p className="text-subtitle">Mapeamento de eletroportáteis dos clientes</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <PackagePlus size={18} /> Novo Produto
                </button>
            </div>

            <div className="card">
                <div className="card-header flex justify-between items-center">
                    <div className="search-bar" style={{ width: '400px' }}>
                        <Search size={18} color="var(--color-text-muted)" />
                        <input
                            type="text"
                            placeholder="Buscar por modelo, marca ou Nº de Série..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Nº Série</th>
                                <th>Categoria</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(p => (
                                    <tr key={p.id}>
                                        <td className="font-semibold">{getCustomerName(p.customerId)}</td>
                                        <td>{p.brand}</td>
                                        <td>{p.model}</td>
                                        <td>{p.serialNumber}</td>
                                        <td>
                                            <span className="badge badge-neutral">{p.category}</span>
                                        </td>
                                        <td>
                                            <button className="btn-icon">Histórico</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center p-6 text-muted">Nenhum produto encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-primary rounded-lg">
                                    <PackagePlus size={20} />
                                </div>
                                <h2 className="modal-title">Cadastrar Aparelho</h2>
                            </div>
                            <button className="btn-icon modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <p className="text-subtitle mb-4">Vincule o equipamento a um cliente para facilitar o rastreio técnico.</p>
                                
                                <div className="input-group">
                                    <label className="input-label">Proprietário (Cliente)</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={formData.customerId}
                                        onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                    >
                                        <option value="">Selecione o Cliente</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} - {c.document}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">Marca</label>
                                        <input required type="text" className="input-field" placeholder="Ex: Walita" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Modelo</label>
                                        <input required type="text" className="input-field" placeholder="Ex: RI2110" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Categoria / Tipo</label>
                                    <input required type="text" className="input-field" placeholder="Ex: Liquidificador, Air Fryer" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Número de Série</label>
                                    <input type="text" className="input-field" placeholder="Opcional" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">Cor</label>
                                        <input type="text" className="input-field" placeholder="Ex: Preto" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Voltagem</label>
                                        <select className="input-field" value={formData.voltage} onChange={e => setFormData({ ...formData, voltage: e.target.value as any })}>
                                            <option value="110V">110V</option>
                                            <option value="220V">220V</option>
                                            <option value="Bivolt">Bivolt</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-slate-50">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Produto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Products;
