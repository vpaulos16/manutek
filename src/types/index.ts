export type UserRole = 'admin' | 'attendant' | 'technician' | 'seller';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    email: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    whatsapp: string;
    document: string; // CPF/CNPJ
    address: string;
    createdAt: string;
}

export interface Product {
    id: string;
    customerId: string;
    brand: string;
    model: string;
    serialNumber: string;
    category: string;
    color?: string;
    voltage?: '110V' | '220V' | 'Bivolt';
}

export interface Technician {
    id: string;
    name: string;
    role: string;
    active: boolean;
}

export type OSStatus =
    | 'received' // Produto recebido
    | 'analyzing' // Em análise técnica
    | 'awaiting_approval' // Aguardando aprovação
    | 'approved' // Aprovado
    | 'rejected' // Orçamento recusado pelo cliente
    | 'in_maintenance' // Em manutenção
    | 'completed' // Serviço concluído
    | 'ready' // Pronto para retirada
    | 'delivered'; // Finalizado/Entregue

export interface WorkOrderItem {
    partId: string;
    name: string;
    quantity: number;
    price: number;
}

export interface WorkOrder {
    id: string;
    number: number; // Sequencial único
    customerId: string;
    productId: string;
    status: OSStatus;
    statusEntryDate: string; // Nova: Trava de ordenação
    technicianId?: string;
    reportedDefect: string;
    serviceDescription?: string; // Descrição geral
    technicalDiagnostic?: string; // Diagnóstico inicial
    
    // Novos campos de Reparo Técnico
    repairDescription?: string; 
    repairDate?: string;
    serviceTime?: string;

    items: WorkOrderItem[];
    laborCost: number;
    totalCost: number;

    // Advanced Input Fields (PRD requirement)
    isUnderWarranty?: boolean;
    hasInvoice?: boolean;
    productCondition?: {
        hasScratches: boolean;
        wasOpenedBefore: boolean;
        hasDropSigns: boolean;
        hasWaterDamage: boolean;
        visualObservations: string;
    };
    accessories?: {
        cup: boolean;
        lid: boolean;
        base: boolean;
        powerCable: boolean;
        originalBox: boolean;
        manual: boolean;
        others: string;
    };
    termsAccepted?: boolean;
    attendantId?: string;
    attendantName?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    serviceOrigin?: 'balcao' | 'garantia' | 'parceiro';
    entryImages?: string[];

    estimatedCompletionDate?: string;
    createdAt: string;
    updatedAt: string;
    history: OSHistoryEvent[];

    // Uncollected Device Tracking
    readyForPickupDate?: string;
    daysPending?: number;
    billingStatus?: 'active' | 'paused' | 'finished';
    lastNotificationSent?: string;
    totalStorageFee?: number;
    lastFeeCalculationDate?: string;
}

export interface BillingTemplate {
    id: string;
    name: string;
    content: string;
    triggerDays: number;
    isActive: boolean;
}

export interface BillingSettings {
    isActive: boolean;
    gracePeriodDays: number;
    dailyFee: number;
}

export interface OSHistoryEvent {
    id: string;
    status: OSStatus;
    timestamp: string;
    type: 'status' | 'edit' | 'communication';
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    note?: string;
}

export interface Part {
    id: string;
    code: string;
    description: string;
    stock: number;
    costPrice: number;
    sellingPrice: number;
    minStockAlert: number;
}

export interface SaleItem {
    partId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Sale {
    id: string;
    date: string;
    customerId?: string;
    items: SaleItem[];
    total: number;
    paymentMethod: string;
}

export interface CommunicationLog {
    id: string;
    workOrderId: string | null;
    customerPhone: string;
    message: string;
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'received'; // received added for inbound
    direction: 'inbound' | 'outbound';
    timestamp: string;
    type: OSStatus | 'general' | 'chat';
}
