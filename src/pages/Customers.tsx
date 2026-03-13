import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { UserPlus, Search, X } from 'lucide-react';
import type { Customer } from '../types';

const Customers: React.FC = () => {
    const { customers, addCustomer } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsapp: '',
        document: '',
        address: ''
    });

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.document.includes(searchTerm)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newCustomer: Customer = {
            id: crypto.randomUUID(),
            ...formData,
            createdAt: new Date().toISOString()
        };
        addCustomer(newCustomer);
        setIsModalOpen(false);
        setFormData({ name: '', phone: '', whatsapp: '', document: '', address: '' });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-h1">Clientes</h1>
                    <p className="text-subtitle">Gerenciamento de clientes da assistência</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <UserPlus size={18} /> Novo Cliente
                </button>
            </div>

            <div className="card">
                <div className="card-header flex justify-between items-center">
                    <div className="search-bar" style={{ width: '400px' }}>
                        <Search size={18} color="var(--color-text-muted)" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>CPF / CNPJ</th>
                                <th>Telefone / WhatsApp</th>
                                <th>Endereço</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(c => (
                                    <tr key={c.id}>
                                        <td className="font-semibold">{c.name}</td>
                                        <td>{c.document}</td>
                                        <td>{c.phone} {c.whatsapp !== c.phone ? ` / ${c.whatsapp}` : ''}</td>
                                        <td>{c.address}</td>
                                        <td>
                                            <button className="btn-icon">Visualizar</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center p-6 text-muted">Nenhum cliente encontrado.</td>
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
                                    <UserPlus size={20} />
                                </div>
                                <h2 className="modal-title">Novo Cliente</h2>
                            </div>
                            <button className="btn-icon modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <p className="text-subtitle mb-4">Insira os dados cadastrais do cliente para prosseguir com a assistência.</p>
                                
                                <div className="input-group">
                                    <label className="input-label">Nome Completo</label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Ex: João Silva da Costa"
                                        value={formData.name} 
                                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">Telefone</label>
                                        <input 
                                            required 
                                            type="text" 
                                            className="input-field" 
                                            placeholder="(00) 00000-0000"
                                            value={formData.phone} 
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">WhatsApp</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            placeholder="(00) 00000-0000"
                                            value={formData.whatsapp} 
                                            onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">CPF / CNPJ</label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="000.000.000-00"
                                        value={formData.document} 
                                        onChange={e => setFormData({ ...formData, document: e.target.value })} 
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Endereço Completo</label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Rua, Número, Bairro, Cidade"
                                        value={formData.address} 
                                        onChange={e => setFormData({ ...formData, address: e.target.value })} 
                                    />
                                </div>
                            </div>
                            <div className="modal-footer bg-slate-50">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Cliente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
