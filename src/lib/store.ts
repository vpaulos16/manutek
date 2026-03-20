import { create } from 'zustand';
import type {
    Customer, Product, WorkOrder, Part, Sale, CommunicationLog,
    BillingSettings, BillingTemplate, Technician, OSStatus
} from '../types';
import { supabase } from './supabase';
import { sendWhatsAppMessage } from './whatsapp';

interface AppState {
    customers: Customer[];
    products: Product[];
    workOrders: WorkOrder[];
    technicians: Technician[];
    parts: Part[];
    sales: Sale[];
    communications: CommunicationLog[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchData: () => Promise<void>;
    addCustomer: (customer: Customer) => Promise<void>;
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
    addProduct: (product: Product) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    addWorkOrder: (wo: WorkOrder) => Promise<void>;
    updateWorkOrderStatus: (id: string, status: WorkOrder['status']) => Promise<void>;
    updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<void>;
    updateWorkOrderTotalCost: (id: string, cost: number) => Promise<void>;
    assignTechnicianToOS: (id: string, technicianId: string) => Promise<void>;
    addTechnician: (tech: Technician) => Promise<void>;
    updateTechnician: (tech: Technician) => Promise<void>;
    deleteTechnician: (id: string) => Promise<void>;
    addPart: (part: Part) => Promise<void>;
    updatePartStock: (id: string, quantityChange: number) => void;
    addSale: (sale: Sale) => void;
    logCommunication: (log: Omit<CommunicationLog, 'direction'> & { direction?: 'inbound' | 'outbound' }) => void;
    receiveWhatsAppMessage: (phone: string, message: string) => void;
    isOSModalOpen: boolean;
    setOSModalOpen: (isOpen: boolean) => void;

    // WhatsApp Bot Settings
    whatsappBotUrl: string;
    setWhatsappBotConfig: (url: string) => void;

    // Billing Automation
    billingSettings: BillingSettings;
    billingTemplates: BillingTemplate[];
    updateBillingSettings: (settings: BillingSettings) => void;
    updateBillingTemplate: (template: BillingTemplate) => void;
    simulateDailyBillingCron: () => void;
}

const initialBillingSettings: BillingSettings = {
    isActive: true,
    gracePeriodDays: 7,
    dailyFee: 10
};

const initialBillingTemplates: BillingTemplate[] = [
    { id: 't1', name: 'Pronto para Retirada', content: 'Olá {nome_cliente}! Seu aparelho (OS #{numero_os}) está pronto para retirada. Valor do serviço: R$ {valor_servico}. Acesre: {link_rastreio}', triggerDays: 0, isActive: true },
    { id: 't2', name: 'Lembrete (3 dias)', content: 'Lembrete: seu aparelho (OS #{numero_os}) já está pronto para retirada. Evite atrasos retirando o quanto antes.', triggerDays: 3, isActive: true },
    { id: 't3', name: 'Aviso (7 dias)', content: 'Aviso: Seu aparelho aguarda retirada há 7 dias. Após este prazo poderão ser aplicadas taxas de armazenamento.', triggerDays: 7, isActive: true },
    { id: 't4', name: 'Cobrança (15 dias)', content: 'Aviso Importante: Seu aparelho está disponível. Foi iniciada a aplicação de taxa de armazenamento diária.', triggerDays: 15, isActive: true },
    { id: 't5', name: 'Aviso Legal (30 dias)', content: 'ÚLTIMO AVISO: Após 30 dias sem retirada, o equipamento (OS #{numero_os}) poderá ser destinado para cobertura de custos operacionais.', triggerDays: 30, isActive: true },
];

export const useStore = create<AppState>()((set, get) => ({
    customers: [],
    products: [],
    workOrders: [],
    technicians: [],
    parts: [],
    sales: [],
    communications: [],
    isLoading: false,
    error: null,

    fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
            const [customersRes, productsRes, workOrdersRes, techsRes, partsRes, historyRes, commsRes] = await Promise.all([
                supabase.from('customers').select('*'),
                supabase.from('products').select('*'),
                supabase.from('work_orders').select('*'),
                supabase.from('technicians').select('*'),
                supabase.from('parts').select('*'),
                supabase.from('work_order_history').select('*'),
                supabase.from('communication_logs').select('*').order('timestamp', { ascending: true })
            ]);

            if (customersRes.error) throw customersRes.error;
            if (productsRes.error) throw productsRes.error;
            if (workOrdersRes.error) throw workOrdersRes.error;
            if (techsRes.error) throw techsRes.error;

            const parsedWorkOrders: WorkOrder[] = (workOrdersRes.data || []).map(wo => ({
                id: wo.id,
                number: wo.number,
                customerId: wo.customer_id,
                productId: wo.product_id,
                technicianId: wo.technician_id,
                status: wo.status as OSStatus,
                statusEntryDate: wo.status_entry_date || wo.created_at,
                reportedDefect: wo.reported_defect,
                serviceDescription: wo.service_description,
                technicalDiagnostic: wo.technical_diagnostic,
                items: wo.items || [],
                laborCost: parseFloat(wo.labor_cost) || 0,
                totalCost: parseFloat(wo.total_cost) || 0,
                isUnderWarranty: wo.is_under_warranty,
                hasInvoice: wo.has_invoice,
                productCondition: wo.product_condition,
                accessories: wo.accessories,
                termsAccepted: wo.terms_accepted,
                attendantId: wo.attendant_id,
                attendantName: wo.attendant_name || wo.attendant_id, // Usando o nome se disponível
                priority: wo.priority,
                serviceOrigin: wo.service_origin,
                estimatedCompletionDate: wo.estimated_completion_date,
                createdAt: wo.created_at,
                updatedAt: wo.updated_at,
                history: (historyRes.data || []).filter(h => h.work_order_id === wo.id).map(h => ({
                    id: h.id,
                    status: h.status as OSStatus,
                    timestamp: h.timestamp,
                    type: h.type || 'status',
                    fieldName: h.field_name,
                    oldValue: h.old_value,
                    newValue: h.new_value,
                    note: h.note
                }))
            }));

            set({
                customers: (customersRes.data || []).map(c => ({
                    ...c,
                    createdAt: c.created_at
                })),
                products: productsRes.data?.map(p => ({
                    ...p,
                    customerId: p.customer_id,
                    serialNumber: p.serial_number,
                    createdAt: p.created_at
                })) || [],
                technicians: techsRes.data || [],
                workOrders: parsedWorkOrders,
                parts: partsRes.data || [],
                communications: (commsRes.data || []).map(c => ({
                    id: c.id,
                    workOrderId: c.work_order_id,
                    customerPhone: c.customer_phone,
                    message: c.message,
                    status: c.status,
                    direction: c.direction,
                    type: c.type,
                    timestamp: c.timestamp
                })),
                isLoading: false
            });
        } catch (error: any) {
            console.error('Erro ao buscar dados do Supabase:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    addCustomer: async (customer) => {
        const { error } = await supabase.from('customers').insert([{
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            whatsapp: customer.whatsapp,
            document: customer.document,
            address: customer.address,
            created_at: customer.createdAt || new Date().toISOString()
        }]);
        if (error) {
            console.error('Erro ao adicionar cliente:', error);
            throw error;
        }
        set((state) => ({ customers: [...state.customers, customer] }));
    },
    updateCustomer: async (id, updates) => {
        const { error } = await supabase.from('customers').update({
            name: updates.name,
            phone: updates.phone,
            whatsapp: updates.whatsapp,
            document: updates.document,
            address: updates.address
        }).eq('id', id);
        if (error) {
            console.error('Erro ao atualizar cliente:', error);
            throw error;
        }
        set((state) => ({
            customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
    },
    addProduct: async (product) => {
        const { error } = await supabase.from('products').insert([{
            id: product.id,
            customer_id: product.customerId,
            brand: product.brand,
            model: product.model,
            serial_number: product.serialNumber,
            category: product.category,
            color: product.color,
            voltage: product.voltage,
            created_at: (product as any).createdAt || new Date().toISOString()
        }]);
        if (error) {
            console.error('Erro ao adicionar produto:', error);
            throw error;
        }
        set((state) => ({ products: [...state.products, product] }));
    },
    updateProduct: async (id, updates) => {
        const { error } = await supabase.from('products').update({
            brand: updates.brand,
            model: updates.model,
            serial_number: updates.serialNumber,
            category: updates.category,
            color: updates.color,
            voltage: updates.voltage
        }).eq('id', id);
        if (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
        set((state) => ({
            products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
    },
    addWorkOrder: async (wo) => {
        const { history, items, ...woData } = wo;
        const req = {
            id: woData.id,
            customer_id: woData.customerId,
            product_id: woData.productId,
            status: woData.status,
            status_entry_date: woData.statusEntryDate || woData.createdAt,
            reported_defect: woData.reportedDefect,
            labor_cost: woData.laborCost,
            total_cost: woData.totalCost,
            is_under_warranty: woData.isUnderWarranty,
            has_invoice: woData.hasInvoice,
            product_condition: woData.productCondition,
            accessories: woData.accessories,
            terms_accepted: woData.termsAccepted,
            priority: woData.priority,
            service_origin: woData.serviceOrigin,
            service_description: woData.serviceDescription,
            attendant_id: woData.attendantId,
            attendant_name: woData.attendantName,
            entry_images: woData.entryImages,
            items: items || [],
            created_at: woData.createdAt,
            updated_at: woData.updatedAt
        };

        const { error } = await supabase.from('work_orders').insert([req]);
        if (error) {
            console.error('Erro ao adicionar OS:', error);
            throw error;
        }

        // Também salva o primeiro registro no histórico
        await supabase.from('work_order_history').insert([{
            work_order_id: woData.id,
            status: woData.status,
            timestamp: woData.createdAt,
            type: 'status'
        }]);

        set((state) => ({ workOrders: [...state.workOrders, { ...wo, statusEntryDate: woData.statusEntryDate || woData.createdAt }] }));
    },
    updateWorkOrderStatus: async (id, status) => {
        const now = new Date().toISOString();

        // 1. Atualizar a tabela WorkOrders
        const { error: woError } = await supabase.from('work_orders')
            .update({ 
                status, 
                updated_at: now,
                status_entry_date: now // Aqui é a TRAVA de ordenação
            })
            .eq('id', id);

        // 2. Inserir no Histórico
        if (!woError) {
            await supabase.from('work_order_history').insert([{
                work_order_id: id,
                status: status,
                timestamp: now,
                type: 'status'
            }]);
        }

        set((state) => {
            return {
                workOrders: state.workOrders.map((wo) => {
                    if (wo.id !== id) return wo;

                    let billingUpdates = {};
                    if (status === 'ready') {
                        billingUpdates = {
                            readyForPickupDate: now,
                            daysPending: 0,
                            billingStatus: 'active',
                            totalStorageFee: 0
                        };
                    } else if (['completed', 'delivered'].includes(status)) {
                        billingUpdates = { billingStatus: 'finished' };
                    }

                    return {
                        ...wo,
                        ...billingUpdates,
                        status,
                        statusEntryDate: now, // Atualiza a trava
                        updatedAt: now,
                        history: [...wo.history, { 
                            id: crypto.randomUUID(), 
                            status, 
                            timestamp: now,
                            type: 'status'
                        }]
                    };
                })
            }
        });
    },
    // NOVO: Método genérico para atualizar OS com histórico
    updateWorkOrder: async (id, updates) => {
        const state = get();
        const oldWO = state.workOrders.find(w => w.id === id);
        if (!oldWO) return;

        const now = new Date().toISOString();
        const historyEntries: any[] = [];

        // Compara campos alterados para o histórico
        Object.keys(updates).forEach(key => {
            const oldValue = (oldWO as any)[key];
            const newValue = (updates as any)[key];
            
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                historyEntries.push({
                    work_order_id: id,
                    status: oldWO.status,
                    timestamp: now,
                    type: 'edit',
                    field_name: key,
                    old_value: oldValue,
                    new_value: newValue,
                    user_name: 'Sistema' // Pode ser expandido futuramente
                });
            }
        });

        const mappedUpdates: any = { updated_at: now };
        if (updates.status !== undefined) mappedUpdates.status = updates.status;
        if (updates.reportedDefect !== undefined) mappedUpdates.reported_defect = updates.reportedDefect;
        if (updates.technicalDiagnostic !== undefined) mappedUpdates.technical_diagnostic = updates.technicalDiagnostic;
        if (updates.laborCost !== undefined) mappedUpdates.labor_cost = updates.laborCost;
        if (updates.totalCost !== undefined) mappedUpdates.total_cost = updates.totalCost;
        if (updates.isUnderWarranty !== undefined) mappedUpdates.is_under_warranty = updates.isUnderWarranty;
        if (updates.hasInvoice !== undefined) mappedUpdates.has_invoice = updates.hasInvoice;
        if (updates.readyForPickupDate !== undefined) mappedUpdates.ready_for_pickup_date = updates.readyForPickupDate;
        if (updates.billingStatus !== undefined) mappedUpdates.billing_status = updates.billingStatus;
        if (updates.totalStorageFee !== undefined) mappedUpdates.total_storage_fee = updates.totalStorageFee;
        if (updates.lastNotificationSent !== undefined) mappedUpdates.last_notification_sent = updates.lastNotificationSent;
        if (updates.lastFeeCalculationDate !== undefined) mappedUpdates.last_fee_calculation_date = updates.lastFeeCalculationDate;
        if (updates.items !== undefined) mappedUpdates.items = updates.items;

        const { error } = await supabase.from('work_orders')
            .update(mappedUpdates)
            .eq('id', id);

        if (error) {
            console.error('Supabase update work_orders failed:', error);
            throw error;
        }

        if (historyEntries.length > 0) {
            await supabase.from('work_order_history').insert(historyEntries);
        }

        set((state) => ({
            workOrders: state.workOrders.map((wo) =>
                wo.id === id ? { 
                    ...wo, 
                    ...updates, 
                    updatedAt: now,
                    history: [...wo.history, ...historyEntries.map(h => ({
                        id: crypto.randomUUID(),
                        ...h,
                        timestamp: now
                    }))]
                } : wo
            )
        }));
    },
    updateWorkOrderTotalCost: async (id, totalCost) => {
        await supabase.from('work_orders').update({ total_cost: totalCost }).eq('id', id);
        set((state) => ({
            workOrders: state.workOrders.map((wo) =>
                wo.id === id ? { ...wo, totalCost, updatedAt: new Date().toISOString() } : wo
            )
        }));
    },
    addTechnician: async (tech) => {
        const { error } = await supabase.from('technicians').insert([{
            id: tech.id,
            name: tech.name,
            role: tech.role,
            active: tech.active
        }]);
        if (error) {
            console.error('Erro ao adicionar técnico:', error);
            throw error;
        }
        set((state) => ({ technicians: [...state.technicians, tech] }));
    },
    updateTechnician: async (tech) => {
        const { error } = await supabase.from('technicians').update({
            name: tech.name,
            role: tech.role,
            active: tech.active
        }).eq('id', tech.id);
        if (error) {
            console.error('Erro ao atualizar técnico:', error);
            throw error;
        }
        set((state) => ({ technicians: state.technicians.map((t) => (t.id === tech.id ? tech : t)) }));
    },
    deleteTechnician: async (id) => {
        const { error } = await supabase.from('technicians').delete().eq('id', id);
        if (error) {
            console.error('Erro ao deletar técnico:', error);
            throw error;
        }
        set((state) => ({ technicians: state.technicians.filter((t) => t.id !== id) }));
    },
    assignTechnicianToOS: async (id, technicianId) => {
        await supabase.from('work_orders').update({ technician_id: technicianId }).eq('id', id);
        set((state) => ({
            workOrders: state.workOrders.map((wo) =>
                wo.id === id ? { ...wo, technicianId, updatedAt: new Date().toISOString() } : wo
            )
        }));
    },
    addPart: async (part) => set((state) => ({ parts: [...state.parts, part] })),
    updatePartStock: (id, quantityChange) => set((state) => ({
        parts: state.parts.map((p) => p.id === id ? { ...p, stock: p.stock + quantityChange } : p)
    })),
    addSale: (sale) => set((state) => ({ sales: [...state.sales, sale] })),
    logCommunication: async (log) => {
        const completeLog: CommunicationLog = {
            ...log,
            direction: log.direction || 'outbound'
        };

        // Persiste no Supabase
        const { error } = await supabase.from('communication_logs').insert([{
            id: completeLog.id,
            work_order_id: completeLog.workOrderId,
            customer_phone: completeLog.customerPhone,
            message: completeLog.message,
            status: completeLog.status,
            direction: completeLog.direction,
            type: completeLog.type,
            timestamp: completeLog.timestamp
        }]);

        if (error) console.error('Erro ao logar comunicação no Supabase:', error);

        set((state) => ({ communications: [...state.communications, completeLog] }));

        if (completeLog.direction === 'outbound') {
            sendWhatsAppMessage(log.customerPhone, log.message);
        }
    },
    receiveWhatsAppMessage: (phone, message) => {
        set((state) => {
            const customer = state.customers.find(c => c.whatsapp.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-8)));

            let workOrderId: string | null = null;
            if (customer) {
                const activeOS = state.workOrders
                    .filter(wo => wo.customerId === customer.id && !['completed', 'delivered'].includes(wo.status))
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

                if (activeOS) {
                    workOrderId = activeOS.id;
                }
            }

            const newLog: CommunicationLog = {
                id: crypto.randomUUID(),
                workOrderId,
                customerPhone: phone,
                message,
                status: 'received',
                direction: 'inbound',
                timestamp: new Date().toISOString(),
                type: 'chat'
            };

            return { communications: [...state.communications, newLog] };
        });
    },
    isOSModalOpen: false,
    setOSModalOpen: (isOpen) => set({ isOSModalOpen: isOpen }),
    whatsappBotUrl: localStorage.getItem('whatsapp_bot_url') || 'http://localhost:3000',
    setWhatsappBotConfig: (url) => {
        localStorage.setItem('whatsapp_bot_url', url);
        set({ whatsappBotUrl: url });
    },

    billingSettings: (() => {
        try {
            const saved = localStorage.getItem('billing_settings');
            return saved ? JSON.parse(saved) : initialBillingSettings;
        } catch { return initialBillingSettings; }
    })(),
    billingTemplates: (() => {
        try {
            const saved = localStorage.getItem('billing_templates');
            return saved ? JSON.parse(saved) : initialBillingTemplates;
        } catch { return initialBillingTemplates; }
    })(),
    updateBillingSettings: (settings) => {
        localStorage.setItem('billing_settings', JSON.stringify(settings));
        set({ billingSettings: settings });
    },
    updateBillingTemplate: (template) => set((state) => {
        const updated = state.billingTemplates.map(t => t.id === template.id ? template : t);
        localStorage.setItem('billing_templates', JSON.stringify(updated));
        return { billingTemplates: updated };
    }),
    simulateDailyBillingCron: () => {
        set((state) => {
            if (!state.billingSettings.isActive) return state;

            const now = new Date();
            const updatedOs = state.workOrders.map(wo => {
                if (wo.status !== 'ready' || wo.billingStatus !== 'active' || !wo.readyForPickupDate) return wo;

                const readyDate = new Date(wo.readyForPickupDate);
                const diffTime = Math.abs(now.getTime() - readyDate.getTime());
                const daysPending = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                let totalStorageFee = wo.totalStorageFee || 0;
                if (daysPending > state.billingSettings.gracePeriodDays) {
                    totalStorageFee = (daysPending - state.billingSettings.gracePeriodDays) * state.billingSettings.dailyFee;
                }

                const activeTemplates = state.billingTemplates.filter(t => t.isActive);
                const templateToSend = activeTemplates.find(t => t.triggerDays === daysPending);

                let lastNotificationSent = wo.lastNotificationSent;

                if (templateToSend && lastNotificationSent !== templateToSend.id) {
                    const customer = state.customers.find(c => c.id === wo.customerId);
                    if (customer && customer.whatsapp) {
                        let message = templateToSend.content;
                        message = message.replace('{nome_cliente}', customer.name);
                        message = message.replace('{numero_os}', wo.number.toString());
                        message = message.replace('{valor_servico}', wo.totalCost.toFixed(2));
                        message = message.replace('{taxa_armazenamento}', totalStorageFee.toFixed(2));
                        message = message.replace('{dias_parados}', daysPending.toString());

                        const baseUrl = window.location.origin;
                        message = message.replace('{link_rastreio}', `${baseUrl}/rastreio/${wo.number}`);

                        sendWhatsAppMessage(customer.whatsapp, message);

                        state.communications.push({
                            id: crypto.randomUUID(),
                            workOrderId: wo.id,
                            customerPhone: customer.whatsapp,
                            message,
                            status: 'sent',
                            direction: 'outbound',
                            timestamp: now.toISOString(),
                            type: 'general'
                        });
                    }
                    lastNotificationSent = templateToSend.id;
                }

                return {
                    ...wo,
                    daysPending,
                    totalStorageFee,
                    lastNotificationSent,
                    lastFeeCalculationDate: now.toISOString()
                };
            });

            return { ...state, workOrders: updatedOs };
        });
    }
}));

// Real-time Supabase Listener for Auto-Updates
supabase.channel('custom-all-channel')
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        () => useStore.getState().fetchData()
    )
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communication_logs' },
        (payload) => {
            console.log('New message received!', payload);
            const newMsg = payload.new;
            // Otimização: Só adiciona se não for duplicado e se for inbound (bot salvou)
            // Na verdade, fetch data é mais seguro para sincronizar tudo
            useStore.getState().fetchData(); 
        }
    )
    .subscribe();
