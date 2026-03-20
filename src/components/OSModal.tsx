import { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { X, Camera, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import type { WorkOrder, Customer, Product } from '../types';

const OSModal: React.FC = () => {
    const { 
        isOSModalOpen, 
        setOSModalOpen, 
        workOrders, 
        customers, 
        technicians,
        addWorkOrder, 
        addCustomer, 
        addProduct,
        logCommunication 
    } = useStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        deviceType: '',
        brand: '',
        model: '',
        reportedDefect: '',
        isUnderWarranty: false,
        invoiceNumber: '',
        attendantName: '',
        termsAccepted: true
    });

    const [images, setImages] = useState<{url: string, caption: string}[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customerExists, setCustomerExists] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers
                .replace(/^(\d{2})(\d)/g, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2')
                .slice(0, 15);
        }
        return value;
    };

    // Efeito para busca automática de cliente
    useEffect(() => {
        const cleanPhone = formData.customerPhone.replace(/\D/g, '');
        if (cleanPhone.length >= 10) {
            const customer = customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone);
            if (customer) {
                setFormData(prev => ({ ...prev, customerName: customer.name }));
                setCustomerExists(true);
            } else {
                setCustomerExists(false);
            }
        }
    }, [formData.customerPhone, customers]);

    if (!isOSModalOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (images.length + files.length > 5) {
            alert('Você pode anexar no máximo 5 fotos.');
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, { url: reader.result as string, caption: '' }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const updateImageCaption = (index: number, caption: string) => {
        setImages(prev => prev.map((img, i) => i === index ? { ...img, caption } : img));
    };

    const nextStep = () => {
        if (currentStep < 5) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (currentStep < 5) {
            nextStep();
            return;
        }

        if (!formData.attendantName) {
            setError('O nome do atendente é obrigatório.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // 1. Lidar com Cliente
            let customer = customers.find(c => c.phone.replace(/\D/g, '') === formData.customerPhone.replace(/\D/g, ''));
            let customerId = customer?.id;

            if (!customer) {
                customerId = crypto.randomUUID();
                const newCustomer: Customer = {
                    id: customerId,
                    name: formData.customerName,
                    phone: formData.customerPhone,
                    whatsapp: formData.customerPhone,
                    document: '',
                    address: '',
                    createdAt: new Date().toISOString()
                };
                await addCustomer(newCustomer);
                customer = newCustomer;
            }

            // 2. Lidar com Produto
            const productId = crypto.randomUUID();
            const newProduct: Product = {
                id: productId,
                customerId: customerId!,
                brand: formData.brand,
                model: formData.model || 'Não informado',
                category: formData.deviceType,
                serialNumber: 'S/N',
            };
            await addProduct(newProduct);

            // 3. Criar OS
            const newWO: WorkOrder = {
                id: crypto.randomUUID(),
                number: workOrders.length > 0 ? Math.max(...workOrders.map(w => w.number)) + 1 : 1000,
                customerId: customerId!,
                productId: productId,
                status: 'received',
                statusEntryDate: new Date().toISOString(),
                reportedDefect: formData.reportedDefect,
                isUnderWarranty: formData.isUnderWarranty,
                attendantName: formData.attendantName || 'Sistema',
                entryImages: images.map(img => img.url),
                items: [],
                laborCost: 0,
                totalCost: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                history: [{ id: crypto.randomUUID(), status: 'received', timestamp: new Date().toISOString(), type: 'status' }],
                productCondition: {
                    hasScratches: false,
                    wasOpenedBefore: false,
                    hasDropSigns: false,
                    hasWaterDamage: false,
                    visualObservations: images.map(img => img.caption).filter(Boolean).join(' | ')
                },
                accessories: {
                    cup: false, lid: false, base: false, powerCable: false, originalBox: false, manual: false, others: ''
                },
                termsAccepted: formData.termsAccepted
            };

            await addWorkOrder(newWO);

            // WhatsApp Automático
            await logCommunication({
                id: crypto.randomUUID(),
                workOrderId: newWO.id,
                customerPhone: customer.whatsapp,
                message: `Olá ${customer.name.split(' ')[0]}! Seu equipamento foi registrado para análise. Recebemos seu ${formData.deviceType} (${formData.brand}). Acompanhe aqui: ${window.location.origin}/rastreio/${newWO.number}`,
                status: 'delivered',
                timestamp: new Date().toISOString(),
                type: 'received'
            });

            closeModal();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar OS.');
        } finally {
            setIsSaving(false);
        }
    };

    const closeModal = () => {
        setOSModalOpen(false);
        setCurrentStep(1);
        setFormData({
            customerName: '',
            customerPhone: '',
            deviceType: '',
            brand: '',
            model: '',
            reportedDefect: '',
            isUnderWarranty: false,
            invoiceNumber: '',
            attendantName: '',
            termsAccepted: true
        });
        setImages([]);
        setError(null);    }

    const steps = [
        { id: 1, label: 'Cliente' },
        { id: 2, label: 'Aparelho' },
        { id: 3, label: 'Defeito' },
        { id: 4, label: 'Fotos (Opcional)' },
        { id: 5, label: 'Finalizar' },
    ];

    return (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '40px 16px' }}>
            <div className="modal-content animate-fade-in" style={{ maxWidth: '720px', width: '100%', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                
                {/* 1 - HEADER & STEPPER */}
                <div style={{ padding: '24px 32px 0 32px', backgroundColor: 'white' }}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-h2">Nova Ordem de Serviço</h2>
                            <p className="text-subtitle mt-1">Siga as etapas para registrar a entrada do equipamento.</p>
                        </div>
                        <button className="btn-icon" onClick={closeModal} type="button">
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', width: '100%', position: 'relative', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                            <div 
                                style={{ 
                                    position: 'absolute', top: '16px', left: '10%', height: '2px', background: 'var(--color-primary)', 
                                    zIndex: 0, transition: 'all 0.5s ease',
                                    width: `${((currentStep - 1) / (steps.length - 1)) * 80}%` 
                                }}
                            ></div>

                            {steps.map((s) => {
                                const isActive = currentStep === s.id;
                                const isCompleted = currentStep > s.id;

                                return (
                                    <div key={s.id} style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1, minWidth: 0 }}>
                                        <div className="transition-all duration-300" style={{ 
                                            width: '28px', height: '28px', borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: isActive || isCompleted ? 'var(--color-primary)' : '#ffffff',
                                            borderColor: isActive ? 'var(--color-primary)' : isCompleted ? 'var(--color-primary)' : '#e2e8f0',
                                            color: isActive || isCompleted ? '#ffffff' : '#94a3b8',
                                            transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                            boxShadow: isActive ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none'
                                        }}>
                                            {isCompleted ? <CheckCircle2 size={16} strokeWidth={3} /> : <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{s.id}</span>}
                                        </div>
                                        <span style={{ 
                                            fontSize: '10px', fontWeight: isActive ? '700' : '600', textAlign: 'center',
                                            color: isActive ? 'var(--color-primary)' : '#64748b',
                                            whiteSpace: 'nowrap',
                                            marginTop: '2px'
                                        }}>
                                            {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* FORM WRAPPER */}
                <form onSubmit={handleSubmit}>
                    {/* CONTEUDO */}
                    <div className="px-8 py-2">
                        {error && (
                            <div className="mb-4 p-4 flex items-center gap-2 animate-shake" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c' }}>
                                <AlertCircle size={18} />
                                <p className="text-small font-medium">{error}</p>
                            </div>
                        )}

                        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '20px' }}>
                            {currentStep === 1 && (
                                <div className="animate-fade-in space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="input-group">
                                            <label className="input-label">WhatsApp do Cliente</label>
                                            <input required autoFocus type="text" className="input-field" placeholder="(00) 00000-0000" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: formatPhone(e.target.value) })} />
                                            {customerExists && <span className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1"><CheckCircle2 size={12} /> Cliente já cadastrado</span>}
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Nome Completo</label>
                                            <input required type="text" className="input-field" placeholder="Ex: João da Silva" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="animate-fade-in space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="input-group">
                                            <label className="input-label">Aparelho</label>
                                            <input required type="text" className="input-field" placeholder="Ex: AirFryer..." value={formData.deviceType} onChange={e => setFormData({ ...formData, deviceType: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Marca</label>
                                            <input required type="text" className="input-field" placeholder="Ex: Samsung" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Modelo (Opcional)</label>
                                            <input type="text" className="input-field" placeholder="Ex: RI2110" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="input-group mt-6">
                                        <label className="input-label mb-2 border-b pb-2">Garantia e Condições</label>
                                        <div className="flex items-center gap-4 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={!formData.isUnderWarranty} onChange={() => setFormData({ ...formData, isUnderWarranty: false })} className="w-4 h-4 text-primary" /> <span className="text-sm font-medium">Orçamento</span></label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={formData.isUnderWarranty} onChange={() => setFormData({ ...formData, isUnderWarranty: true })} className="w-4 h-4 text-primary" /> <span className="text-sm font-medium">Em Garantia</span></label>
                                        </div>
                                    </div>
                                    {formData.isUnderWarranty && (
                                        <div className="input-group mt-4">
                                            <label className="input-label">Número da Nota Fiscal</label>
                                            <input required type="text" className="input-field w-full md:w-1/2" placeholder="Ex: NF-000123" value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="animate-fade-in space-y-4">
                                    <div className="input-group">
                                        <label className="input-label">Defeito Reclamado</label>
                                        <textarea required autoFocus className="input-field min-h-[150px] resize-none" placeholder="Descreva o defeito..." value={formData.reportedDefect} onChange={e => setFormData({ ...formData, reportedDefect: e.target.value })}></textarea>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="animate-fade-in space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b">
                                        <div><h3 className="text-h3">Fotos (Opcional)</h3><p className="text-small">Até 5 fotos do estado do aparelho.</p></div>
                                        <button type="button" className="btn btn-secondary text-xs" onClick={() => fileInputRef.current?.click()}><Camera size={16} className="text-primary" /> ADICIONAR</button>
                                    </div>
                                    <input type="file" min="0" max="5" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                                    
                                    {images.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-slate-50 text-slate-400">
                                            <Camera size={48} strokeWidth={1} className="mb-2" />
                                            <p className="text-sm">Nenhuma foto adicionada.</p>
                                            <p className="text-xs">As fotos ajudam na comprovação do estado inicial.</p>
                                            <button type="button" className="btn btn-secondary mt-4 text-xs" onClick={nextStep}>Pular esta etapa</button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 border rounded-lg">
                                                    <div className="relative w-16 h-16 rounded border bg-white overflow-hidden group">
                                                        <img src={img.url} className="w-full h-full object-cover" alt="Preview" />
                                                        <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                                                    </div>
                                                    <input type="text" className="input-field flex-1 text-xs h-9" placeholder="Legenda" value={img.caption} onChange={e => updateImageCaption(idx, e.target.value)} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-4 animate-fade-in pb-4">
                                    <div className="input-group">
                                        <label className="input-label font-bold text-primary">Atendente Responsável*</label>
                                        <select 
                                            required 
                                            className="input-field"
                                            value={formData.attendantName} 
                                            onChange={e => {
                                                const selectedName = e.target.value;
                                                setFormData({ 
                                                    ...formData, 
                                                    attendantName: selectedName 
                                                });
                                            }}
                                        >
                                            <option value="">Selecione quem está atendendo...</option>
                                            {technicians
                                                .filter(t => t.active && (t.role === 'Atendente' || t.role === 'Gerente'))
                                                .map(t => (
                                                    <option key={t.id} value={t.name}>{t.name}</option>
                                                ))
                                            }
                                        </select>
                                        {technicians.filter(t => t.active && (t.role === 'Atendente' || t.role === 'Gerente')).length === 0 && (
                                            <p className="text-[10px] text-red-500 mt-1">Nenhum Atendente cadastrado na página de Equipe.</p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-1">Selecione seu nome para finalizar o registro da OS.</p>
                                    </div>

                                    <div className="bg-slate-50 border rounded-lg overflow-hidden">
                                        <div className="p-3 bg-white border-b flex justify-between items-center">
                                            <h3 className="text-sm font-bold">Resumo da Ordem</h3>
                                            <span className="text-[10px] font-bold text-primary bg-blue-50 px-2 py-0.5 rounded uppercase">Revisão Final</span>
                                        </div>
                                        <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase opacity-50 block">Cliente</span>
                                                <p className="font-medium text-slate-900">{formData.customerName}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold uppercase opacity-50 block">Aparelho</span>
                                                <p className="font-medium text-slate-900">{formData.deviceType} {formData.brand}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-[10px] font-bold uppercase opacity-50 block">Defeito</span>
                                                <p className="text-slate-700 italic truncate" title={formData.reportedDefect}>"{formData.reportedDefect}"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
                            <p className="text-small font-medium text-slate-600 m-0">O WhatsApp será utilizado para enviar o rastreio automaticamente ao cliente.</p>
                        </div>
                    </div>

                    {/* 5 - FOOTER */}
                    <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 rounded-b-xl mt-4">
                        <button type="button" className="btn btn-secondary px-6" onClick={currentStep === 1 ? closeModal : prevStep} disabled={isSaving}>
                            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
                        </button>
                        {currentStep < 5 ? (
                            <button type="submit" className="btn btn-primary px-8">Avançar <ArrowRight size={16} /></button>
                        ) : (
                            <button type="submit" className="btn btn-primary px-10 shadow-lg shadow-blue-500/20" disabled={isSaving}>
                                {isSaving ? 'Salvando...' : 'GERAR ORDEM DE SERVIÇO'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OSModal;
