import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { UserCheck, Search, X, Plus, Trash2, Edit2 } from 'lucide-react';
import type { Technician } from '../types';

const Technicians: React.FC = () => {
    const { technicians, addTechnician, updateTechnician, deleteTechnician } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTech, setEditingTech] = useState<Technician | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        role: 'Técnico',
        active: true
    });

    const filteredTechs = technicians.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (tech?: Technician) => {
        if (tech) {
            setEditingTech(tech);
            setFormData({ name: tech.name, role: tech.role, active: tech.active });
        } else {
            setEditingTech(null);
            setFormData({ name: '', role: 'Técnico', active: true });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTech) {
                await updateTechnician({ ...editingTech, ...formData });
            } else {
                await addTechnician({
                    id: crypto.randomUUID(),
                    ...formData
                });
            }
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao salvar colaborador.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este colaborador?')) {
            try {
                await deleteTechnician(id);
            } catch (error) {
                alert('Erro ao remover colaborador. Verifique se ele possui ordens de serviço vinculadas.');
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-h1">Equipe</h1>
                    <p className="text-subtitle">Gerencie sua equipe técnica e atendentes</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Novo Colaborador
                </button>
            </div>

            <div className="card">
                <div className="card-header flex justify-between items-center">
                    <div className="search-bar" style={{ width: '400px' }}>
                        <Search size={18} color="var(--color-text-muted)" />
                        <input
                            type="text"
                            placeholder="Buscar colaborador por nome..."
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
                                <th>Cargo / Função</th>
                                <th>Status</th>
                                <th className="text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTechs.length > 0 ? (
                                filteredTechs.map(t => (
                                    <tr key={t.id}>
                                        <td className="font-semibold">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold">
                                                    {t.name.charAt(0).toUpperCase()}
                                                </div>
                                                {t.name}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${t.role === 'Técnico' ? 'badge-info' : 'badge-neutral'}`}>
                                                {t.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${t.active ? 'badge-success' : 'badge-danger'}`}>
                                                {t.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="btn-icon text-primary" onClick={() => handleOpenModal(t)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn-icon text-danger" onClick={() => handleDelete(t.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-6 text-muted">Nenhum colaborador cadastrado.</td>
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
                                    <UserCheck size={20} />
                                </div>
                                <h2 className="modal-title">{editingTech ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
                            </div>
                            <button className="btn-icon modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <p className="text-subtitle mb-4">Gerencie os dados e funções da sua equipe.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">Nome Completo</label>
                                        <input 
                                            required 
                                            type="text" 
                                            className="input-field" 
                                            placeholder="Ex: Carlos Oliveira"
                                            value={formData.name} 
                                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Cargo / Função</label>
                                        <select 
                                            required 
                                            className="input-field" 
                                            value={formData.role} 
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="Técnico">Técnico</option>
                                            <option value="Atendente">Atendente</option>
                                            <option value="Gerente">Gerente</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg mt-4 border border-slate-100">
                                    <input 
                                        type="checkbox" 
                                        id="tech-active" 
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        checked={formData.active} 
                                        onChange={e => setFormData({ ...formData, active: e.target.checked })} 
                                    />
                                    <label htmlFor="tech-active" className="text-sm font-medium text-slate-700 cursor-pointer">
                                        Colaborador Ativo (Aparece nas seleções do sistema)
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer bg-slate-50">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingTech ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Technicians;
