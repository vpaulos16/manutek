import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search,
    Paperclip,
    Send,
    MoreVertical,
    CheckCheck,
    Wrench,
    Clock,
    FileText,
    ExternalLink,
    Zap,
    MessageSquare,
    Phone,
    User,
    AlertCircle,
    Check
} from 'lucide-react';
import './Chat.css';
import { useStore } from '../lib/store';

const Chat: React.FC = () => {
    const { communications, customers, workOrders, logCommunication } = useStore();
    const [activeContactPhone, setActiveContactPhone] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Group communications by phone number
    const conversations = useMemo(() => {
        const grouped = communications.reduce((acc, comm) => {
            if (!acc[comm.customerPhone]) {
                acc[comm.customerPhone] = [];
            }
            acc[comm.customerPhone].push(comm);
            return acc;
        }, {} as Record<string, typeof communications>);

        // Sort each conversation by timestamp
        for (const phone in grouped) {
            grouped[phone].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }

        return grouped;
    }, [communications]);

    // Format helpers
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return formatTime(isoString);
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ontem';
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    };

    // Formata links na mensagem
    const formatMessageWithLinks = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {part}
                    </a>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    // Derived active chat data payload matching the previous mock structure functionally
    const activeChat = useMemo(() => {
        if (!activeContactPhone || !conversations[activeContactPhone]) return null;

        const contactMsgs = conversations[activeContactPhone];
        const lastMsg = contactMsgs[contactMsgs.length - 1];

        // Link to a recognized customer
        const customer = customers.find(c => c.whatsapp === activeContactPhone);

        // Context Info
        let osNumber: string | null = null;
        let osStatus: string | null = null;
        let osCost = 0;

        if (customer) {
            const activeOS = workOrders
                .filter(wo => wo.customerId === customer.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            if (activeOS) {
                osNumber = activeOS.number.toString();
                osStatus = activeOS.status;
                osCost = activeOS.totalCost;
            }
        }

        return {
            id: activeContactPhone,
            customerName: customer ? customer.name : activeContactPhone,
            phone: activeContactPhone,
            avatar: customer ? customer.name.substring(0, 2).toUpperCase() : '👤',
            online: false, // Could be bound to a real presence ping
            lastMessage: lastMsg.message,
            time: formatDate(lastMsg.timestamp),
            unreadCount: contactMsgs.filter(m => m.status !== 'read' && m.direction === 'inbound').length,
            isTyping: false,
            osNumber,
            osStatus,
            osCost,
            messages: contactMsgs
        };
    }, [activeContactPhone, conversations, customers, workOrders]);

    // Active Contacts List
    const chatListItems = useMemo(() => {
        const list = Object.keys(conversations).map(phone => {
            const customer = customers.find(c => c.whatsapp === phone);
            const contactMsgs = conversations[phone];
            const lastMsg = contactMsgs[contactMsgs.length - 1];

            // Context logic
            let osNumber: string | null = null;
            if (customer) {
                const activeOS = workOrders.filter(wo => wo.customerId === customer.id)[0];
                if (activeOS) osNumber = activeOS.number.toString();
            }

            return {
                id: phone,
                customerName: customer ? customer.name : phone,
                phone: phone,
                avatar: customer ? customer.name.substring(0, 2).toUpperCase() : '👤',
                online: false,
                lastMessage: lastMsg.message,
                time: formatDate(lastMsg.timestamp),
                realTimeDate: new Date(lastMsg.timestamp).getTime(),
                unreadCount: contactMsgs.filter(m => m.status !== 'read' && m.direction === 'inbound').length,
                isTyping: false,
                osNumber
            };
        });

        // Filter and sort
        return list
            .filter(c => c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
            .sort((a, b) => b.realTimeDate - a.realTimeDate);
    }, [conversations, customers, workOrders, searchTerm]);

    // Scroll to bottom on new msg
    useEffect(() => {
        if (activeChat) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeChat?.messages.length]);

    // Dummy Loading Simulator
    const handleSelectChat = (phone: string) => {
        setIsLoading(true);
        setActiveContactPhone(phone);
        setTimeout(() => setIsLoading(false), 300); // UI micro-interaction speed
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeContactPhone) return;

        // Find attached OS from customer if they exist
        const customer = customers.find(c => c.whatsapp === activeContactPhone);
        let workOrderId: string | null = null;
        if (customer) {
            const activeOS = workOrders
                .filter(wo => wo.customerId === customer.id && !['completed', 'delivered'].includes(wo.status))
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
            if (activeOS) workOrderId = activeOS.id;
        }

        logCommunication({
            id: crypto.randomUUID(),
            workOrderId,
            customerPhone: activeContactPhone,
            message: inputText,
            status: 'sent',
            direction: 'outbound',
            timestamp: new Date().toISOString(),
            type: 'chat'
        });

        setInputText('');
    };

    const handleSendTrackingLink = () => {
        if (!activeChat?.osNumber || !activeContactPhone) return;

        const customer = customers.find(c => c.whatsapp === activeContactPhone);
        let workOrderId: string | null = null;
        if (customer) {
            const activeOS = workOrders.filter(wo => wo.number.toString() === activeChat.osNumber)[0];
            if (activeOS) workOrderId = activeOS.id;
        }

        const baseUrl = window.location.origin;
        const trackingUrl = `${baseUrl}/rastreio/${activeChat.osNumber}`;
        const message = `Olá! Acompanhe o status e detalhes do seu serviço (OS #${activeChat.osNumber}) através deste link:\n\n${trackingUrl}`;

        logCommunication({
            id: crypto.randomUUID(),
            workOrderId,
            customerPhone: activeContactPhone,
            message,
            status: 'sent',
            direction: 'outbound',
            timestamp: new Date().toISOString(),
            type: 'chat'
        });
    };

    return (
        <div className="chat-container">

            {/* COLUNA ESQUERDA: LISTA DE CONVERSAS */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <div className="chat-sidebar-header-top">
                        <h2 className="chat-sidebar-title">Mensagens</h2>
                        <button className="btn-new-chat">
                            <MessageSquare size={16} /> Nova
                        </button>
                    </div>
                    <div className="chat-search-container">
                        <Search className="chat-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente, número ou OS..."
                            className="chat-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="chat-list">
                    {chatListItems.length === 0 ? (
                        <div className="p-6 text-center text-[#64748b]">Nenhum chat.</div>
                    ) : chatListItems.map((chat) => (
                        <div
                            key={chat.id}
                            className={`chat-item ${activeContactPhone === chat.id ? 'active' : ''}`}
                            onClick={() => handleSelectChat(chat.id)}
                        >
                            <div className="chat-avatar">
                                {chat.avatar}
                                <span className={`status-indicator ${chat.online ? 'online' : 'offline'}`}></span>
                            </div>
                            <div className="chat-item-content">
                                <div className="chat-item-header">
                                    <h4 className="chat-item-name">{chat.customerName}</h4>
                                    <span className="chat-item-time">{chat.time}</span>
                                </div>
                                <div className="chat-item-preview">
                                    <p className={`chat-item-last-message ${chat.isTyping ? 'typing' : ''}`}>
                                        {chat.lastMessage}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <span className="chat-badge">{chat.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                            {chat.osNumber && (
                                <div className="os-link-badge">OS #{chat.osNumber}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ÁREA CENTRAL: CHAT ATIVO */}
            {activeChat ? (
                <div className="chat-main">
                    {/* Header do Chat */}
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <div className="chat-avatar" style={{ margin: '0 16px 0 0', width: 40, height: 40, fontSize: '1rem' }}>
                                {activeChat.avatar}
                            </div>
                            <div className="chat-header-text">
                                <h3 className="chat-header-name">{activeChat.customerName}</h3>
                                <p className="chat-header-status">
                                    {activeChat.phone} • {activeChat.online ? <span style={{ color: '#10b981' }}>Online agora</span> : 'Visto recentemente'}
                                </p>
                            </div>
                        </div>
                        <div className="chat-header-actions">
                            {activeChat.osNumber && (
                                <div className="os-quick-badge">
                                    <Wrench size={16} /> OS #{activeChat.osNumber}
                                </div>
                            )}
                            <button className="chat-btn"><MoreVertical size={20} /></button>
                        </div>
                    </div>

                    {/* Mensagens */}
                    <div className="chat-messages">
                        {isLoading ? (
                            <div className="flex flex-col gap-4 animate-pulse p-4">
                                <div className="h-10 bg-gray-200 rounded w-1/3 self-end"></div>
                                <div className="h-10 bg-gray-200 rounded w-1/4 self-start"></div>
                                <div className="h-16 bg-gray-200 rounded w-1/2 self-start"></div>
                            </div>
                        ) : (
                            activeChat.messages.map((msg) => (
                                msg.type === 'general' || msg.type === 'approved' || msg.type === 'rejected' ? (
                                    <div key={msg.id} className="message-system">
                                        <CheckCheck size={14} className="inline mr-1 text-green-600" />
                                        {msg.message} • {formatTime(msg.timestamp)}
                                    </div>
                                ) : (
                                    <div key={msg.id} className={`message-wrapper ${msg.direction === 'outbound' ? 'sent' : 'received'}`}>
                                        <div className="message-bubble whitespace-pre-wrap">
                                            {formatMessageWithLinks(msg.message)}
                                        </div>
                                        <span className="message-time">
                                            {formatTime(msg.timestamp)}
                                            {msg.direction === 'outbound' && (
                                                msg.status === 'read' || msg.status === 'delivered' ? (
                                                    <CheckCheck size={14} className={msg.status === 'read' ? 'text-blue-500' : 'text-gray-500'} />
                                                ) : <Check size={14} className="text-gray-500" />
                                            )}
                                        </span>
                                    </div>
                                )
                            ))
                        )}
                        <div ref={messagesEndRef} className="h-2" />
                        {activeChat.isTyping && !isLoading && (
                            <div className="message-wrapper received mt-2">
                                <div className="message-bubble" style={{ color: '#64748b', fontStyle: 'italic', padding: '6px 12px' }}>
                                    digitando...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Input */}
                    <form className="chat-footer" onSubmit={handleSendMessage}>
                        <button type="button" className="chat-btn">
                            <Paperclip size={20} />
                        </button>
                        <div className="chat-input-wrapper">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Digite uma mensagem..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                        </div>
                        <button type="button" className="chat-btn" title="Respostas Rápidas">
                            <Zap size={20} />
                        </button>
                        <button type="submit" className="chat-btn send" disabled={!inputText.trim()}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            ) : (
                <div className="chat-empty-state">
                    <div className="chat-empty-icon">
                        <MessageSquare size={48} />
                    </div>
                    <h2 style={{ color: '#1e293b', marginBottom: 8 }}>Central de Atendimento</h2>
                    <p style={{ maxWidth: 400, textAlign: 'center', lineHeight: 1.5 }}>
                        Selecione uma conversa na lista lateral para visualizar o histórico de mensagens e responder ao cliente pelo WhatsApp.
                    </p>
                </div>
            )}

            {/* COLUNA DIREITA: CONTEXTO DO CLIENTE (Visível apenas se houver chat ativo) */}
            {activeChat && (
                <div className="chat-context">
                    <div className="context-header">
                        <div className="context-avatar-large">{activeChat.avatar}</div>
                        <h3 className="context-name">{activeChat.customerName}</h3>
                        <p className="context-phone">{activeChat.phone}</p>
                    </div>

                    <div className="context-card">
                        <h4 className="context-card-title flex items-center gap-2">
                            <User size={16} /> Resumo do Cliente
                        </h4>
                        <div className="context-data-row">
                            <span className="context-data-label">Total de OS</span>
                            <span className="context-data-value">3 antendimentos</span>
                        </div>
                        <div className="context-data-row">
                            <span className="context-data-label">Último contato</span>
                            <span className="context-data-value">Hoje</span>
                        </div>
                    </div>

                    {activeChat.osNumber ? (
                        <div className="context-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                            <h4 className="context-card-title flex items-center gap-2">
                                <FileText size={16} /> OS Vinculada
                            </h4>
                            <div className="context-data-row">
                                <span className="context-data-label">Número</span>
                                <span className="context-data-value">#{activeChat.osNumber}</span>
                            </div>
                            <div className="context-data-row">
                                <span className="context-data-label">Status</span>
                                <span className="context-data-value">{activeChat.osStatus === 'ready' ? 'Pronto Retirada' : 'Em Análise'}</span>
                            </div>
                            <div className="context-data-row">
                                <span className="context-data-label">Valor</span>
                                <span className="context-data-value highlight">R$ {activeChat.osCost.toFixed(2)}</span>
                            </div>
                            <button className="context-btn-outline">
                                Abrir Detalhes da OS <ExternalLink size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="context-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', textAlign: 'center' }}>
                            <AlertCircle size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Nenhuma Ordem de Serviço em aberto no momento.</p>
                            <button className="context-btn-outline" style={{ marginTop: 16 }}>
                                Nova OS
                            </button>
                        </div>
                    )}

                    <div className="context-card">
                        <h4 className="context-card-title flex items-center gap-2">
                            <Zap size={16} /> Ações Rápidas
                        </h4>
                        <div className="action-list">
                            <div
                                className="action-item"
                                onClick={handleSendTrackingLink}
                                style={{ cursor: activeChat.osNumber ? 'pointer' : 'not-allowed', opacity: activeChat.osNumber ? 1 : 0.5 }}
                            >
                                <FileText size={18} className="action-item-icon" /> Enviar Link de Rastreio
                            </div>
                            <div className="action-item">
                                <Clock size={18} className="action-item-icon" /> Aguardando Retirada
                            </div>
                            <div className="action-item">
                                <Phone size={18} className="action-item-icon" /> Adicionar Observação
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
