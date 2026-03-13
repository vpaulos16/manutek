import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../lib/store';
import { MessageCircle, X, Check, CheckCheck, User, Search, MoreVertical, Users, CircleDashed, Filter, Smile, Paperclip, Mic } from 'lucide-react';

const WhatsAppSimulator: React.FC = () => {
    const { communications } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [hasNew, setHasNew] = useState(false);
    const [activeContact, setActiveContact] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'favorites'>('all');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Group communications by customer phone
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

    // Get list of contacts sorted by most recent message
    const contacts = useMemo(() => {
        return Object.keys(conversations).sort((a, b) => {
            const lastMsgA = conversations[a][conversations[a].length - 1];
            const lastMsgB = conversations[b][conversations[b].length - 1];
            return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
        });
    }, [conversations]);

    const filteredContacts = useMemo(() => {
        let filtered = contacts.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

        // Simple filter logic for simulation
        if (activeFilter === 'unread') {
            filtered = filtered.filter(c => conversations[c].some(m => m.status !== 'read'));
        }

        return filtered;
    }, [contacts, searchQuery, activeFilter, conversations]);

    // Auto-open ou mostrar badge quando nova mensagem chega
    useEffect(() => {
        if (communications.length > 0) {
            setHasNew(true);
            // Default select the most recent contact if none is selected
            if (!activeContact && contacts.length > 0) {
                setActiveContact(contacts[0]);
            }
        }
    }, [communications, activeContact, contacts]);

    // Scroll automatically to bottom when new messages arrive
    useEffect(() => {
        if (isOpen && activeContact) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [communications, isOpen, activeContact]);

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

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, width: '60px', height: '60px' }}>
            <button
                className={`w-full h-full rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white transition-all duration-300 hover:scale-105 flex items-center justify-center ${hasNew && !isOpen ? 'animate-bounce' : ''}`}
                style={{ backgroundColor: '#25D366', border: 'none', cursor: 'pointer' }}
                onClick={() => { setIsOpen(!isOpen); setHasNew(false); }}
                title="Simulador de WhatsApp"
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <MessageCircle size={32} />
                </div>
                {hasNew && !isOpen && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[50] flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsOpen(false)}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', flexDirection: 'row', width: '100%', maxWidth: '1024px', height: '85vh', minHeight: '500px' }}
                    >
                        {/* Left Sidebar - Contact List */}
                        <div className="border-r border-gray-200 bg-white z-20" style={{ width: '30%', minWidth: '320px', maxWidth: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Sidebar Header */}
                            <div className="h-[59px] min-h-[59px] flex items-center justify-between px-4 bg-[#f0f2f5] w-full">
                                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden cursor-pointer">
                                    <User size={24} className="text-white" />
                                </div>
                                <div className="flex gap-4 text-[#54656f] items-center">
                                    <Users size={20} className="cursor-pointer hover:text-gray-700" />
                                    <CircleDashed size={20} className="cursor-pointer hover:text-gray-700" />
                                    <MessageCircle size={20} className="cursor-pointer hover:text-gray-700" />
                                    <MoreVertical size={20} className="cursor-pointer hover:text-gray-700" />
                                </div>
                            </div>

                            {/* Search Bar & Filters */}
                            <div className="bg-white flex flex-col border-b border-gray-200 w-full flex-shrink-0">
                                <div className="p-2 flex items-center gap-2">
                                    <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 py-1.5 flex-1 h-[35px]">
                                        <Search size={16} className="text-[#54656f] mr-4 flex-shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar..."
                                            className="bg-transparent border-none outline-none text-[14px] w-full text-[#111b21] placeholder-[#54656f]"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button className="p-1.5 flex-shrink-0 text-[#54656f] hover:bg-gray-100 rounded-lg">
                                        <Filter size={18} />
                                    </button>
                                </div>

                                {/* Filter Chips */}
                                <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar w-full">
                                    <button
                                        className={`px-3 py-1 whitespace-nowrap rounded-full text-[14px] font-medium ${activeFilter === 'all' ? 'bg-[#e7fce3] text-[#0f5132]' : 'bg-[#f0f2f5] text-[#54656f]'}`}
                                        onClick={() => setActiveFilter('all')}
                                    >
                                        Tudo
                                    </button>
                                    <button
                                        className={`px-3 py-1 whitespace-nowrap rounded-full text-[14px] font-medium ${activeFilter === 'unread' ? 'bg-[#e7fce3] text-[#0f5132]' : 'bg-[#f0f2f5] text-[#54656f]'}`}
                                        onClick={() => setActiveFilter('unread')}
                                    >
                                        Não lidas
                                    </button>
                                    <button
                                        className={`px-3 py-1 whitespace-nowrap rounded-full text-[14px] font-medium ${activeFilter === 'favorites' ? 'bg-[#e7fce3] text-[#0f5132]' : 'bg-[#f0f2f5] text-[#54656f]'}`}
                                        onClick={() => setActiveFilter('favorites')}
                                    >
                                        Favoritos
                                    </button>
                                </div>
                            </div>

                            {/* Contact List */}
                            <div className="flex-1 overflow-y-auto bg-white w-full custom-scrollbar" style={{ display: 'flex', flexDirection: 'column' }}>
                                {filteredContacts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[#54656f] p-4 text-center">
                                        <p className="text-[14px]">Nenhuma conversa encontrada</p>
                                    </div>
                                ) : (
                                    filteredContacts.map((phone) => {
                                        const contactMsgs = conversations[phone];
                                        const lastMsg = contactMsgs[contactMsgs.length - 1];
                                        const isActive = activeContact === phone;

                                        return (
                                            <div
                                                key={phone}
                                                onClick={() => setActiveContact(phone)}
                                                className={`flex items-center gap-3 px-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors relative h-[72px] ${isActive ? 'bg-[#f0f2f5]' : ''}`}
                                                style={{ minHeight: '72px' }}
                                            >
                                                <div className="w-[49px] h-[49px] rounded-full bg-[#dfe5e7] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                    <User size={32} className="text-white mt-1.5" />
                                                </div>
                                                <div className="flex-1 border-b border-gray-100 flex flex-col justify-center h-full pr-1 px-1 overflow-hidden" style={{ minWidth: 0, overflow: 'hidden' }}>
                                                    <div className="flex justify-between items-baseline mb-[2px] w-full" style={{ minWidth: 0 }}>
                                                        <h4 className="font-normal text-[#111b21] text-[17px] truncate pr-2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{phone}</h4>
                                                        <span className={`text-[12px] flex-shrink-0 mt-1 ${lastMsg.status !== 'read' ? 'text-[#25D366] font-medium' : 'text-[#667781]'}`}>
                                                            {formatDate(lastMsg.timestamp)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[13px] text-[#667781] w-full" style={{ minWidth: 0 }}>
                                                        {lastMsg.status === 'delivered' || lastMsg.status === 'read' ? (
                                                            <CheckCheck size={16} className={`flex-shrink-0 ${lastMsg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`} />
                                                        ) : (
                                                            <Check size={16} className="text-[#8696a0] flex-shrink-0" />
                                                        )}
                                                        <span className="truncate flex-1 font-normal leading-5 text-left" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', minWidth: 0 }}>
                                                            {lastMsg.message}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Main Area - Chat window */}
                    <div className="flex-1 flex flex-col relative bg-[#efeae2] min-w-[300px]">
                        {activeContact ? (
                            <>
                                {/* Chat Header */}
                                <div className="h-[59px] flex-shrink-0 flex items-center justify-between px-4 z-10 bg-[#f0f2f5] border-l border-gray-200">
                                    <div className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 pr-4">
                                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                            <User size={24} className="text-white mt-1" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-[#111b21] text-[16px] leading-tight truncate">{activeContact}</h3>
                                            <p className="text-[13px] text-[#667781] truncate">visto por último hoje às {formatTime(conversations[activeContact][conversations[activeContact].length - 1].timestamp)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-[#54656f] items-center flex-shrink-0">
                                        <Search size={22} className="cursor-pointer hover:text-gray-700" />
                                        <MoreVertical size={22} className="cursor-pointer hover:text-gray-700 hidden sm:block" />
                                        <button onClick={() => setIsOpen(false)} className="hover:bg-gray-200 p-2 rounded-full transition-colors ml-1 -mr-2">
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                {/* Chat Body */}
                                <div
                                    className="flex-1 overflow-y-auto p-4 md:px-[6%] lg:px-[9%] relative flex flex-col gap-1.5"
                                    style={{
                                        backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                                        backgroundSize: '400px',
                                        backgroundRepeat: 'repeat',
                                        opacity: 0.95
                                    }}
                                >
                                    <div className="flex justify-center mb-2 mt-2">
                                        <span className="bg-white/90 text-[#54656f] text-[12.5px] py-1.5 px-3 rounded-lg shadow-sm">
                                            Hoje
                                        </span>
                                    </div>

                                    {/* Security message */}
                                    <div className="flex justify-center mb-4">
                                        <div className="bg-[#ffeecd] text-[#544F49] text-[12.5px] py-2 px-3.5 rounded-lg shadow-sm text-center max-w-sm flex items-center gap-2">
                                            <span className="leading-snug">As mensagens são protegidas com a criptografia de ponta a ponta. Ninguém fora desta conversa pode ler ou ouvi-las.</span>
                                        </div>
                                    </div>

                                    {conversations[activeContact].map((msg) => {
                                        // Visual simulation: always show the green chat bubble tail
                                        const showTail = true;

                                        // Formata links na mensagem
                                        const formatMessageWithLinks = (text: string) => {
                                            const urlRegex = /(https?:\/\/[^\s]+)/g;
                                            const parts = text.split(urlRegex);
                                            return parts.map((part, i) => {
                                                if (part.match(urlRegex)) {
                                                    return (
                                                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#0369a1] hover:underline break-all">
                                                            {part}
                                                        </a>
                                                    );
                                                }
                                                return <span key={i}>{part}</span>;
                                            });
                                        };

                                        return (
                                            <div key={msg.id} className="flex flex-col items-end w-full animate-fade-in group">
                                                <div
                                                    className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-1.5 shadow-sm relative ${showTail ? 'rounded-tr-none' : ''}`}
                                                    style={{ backgroundColor: '#d9fdd3' }}
                                                >
                                                    {/* Message Tail SVG */}
                                                    {showTail && (
                                                        <span className="absolute top-0 right-[-8px] text-[#d9fdd3]">
                                                            <svg viewBox="0 0 8 13" width="8" height="13" className="">
                                                                <path opacity=".13" fill="#0000000" d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                                                                <path fill="currentColor" d="M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"></path>
                                                            </svg>
                                                        </span>
                                                    )}

                                                    <div className="pl-1.5 pr-2 pt-1 pb-4 relative">
                                                        <p className="text-[#111b21] text-[14.2px] leading-[19px] whitespace-pre-wrap font-normal break-words">
                                                            {formatMessageWithLinks(msg.message)}
                                                            {/* Invisible spacer to push time to right */}
                                                            <span className="inline-block w-16 invisible">&#160;</span>
                                                        </p>
                                                    </div>

                                                    <div className="absolute bottom-1 right-1.5 flex justify-end items-center gap-[3px] bg-transparent pb-0.5">
                                                        <span className="text-[11px] text-[#667781] leading-none mt-0.5">
                                                            {formatTime(msg.timestamp)}
                                                        </span>
                                                        {msg.status === 'delivered' || msg.status === 'read' ? (
                                                            <CheckCheck size={15} className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#8696a0]'} />
                                                        ) : (
                                                            <Check size={15} className="text-[#8696a0]" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} className="h-2" />
                                </div>

                                {/* Chat Footer / Input area */}
                                <div className="h-[62px] flex-shrink-0 px-4 py-2 flex items-center gap-3 z-10 bg-[#f0f2f5] border-l border-gray-200">
                                    <div className="flex gap-3 text-[#54656f]">
                                        <Smile size={26} className="cursor-pointer hover:text-gray-700" />
                                        <Paperclip size={24} className="cursor-pointer hover:text-gray-700" />
                                    </div>
                                    <div className="flex-1 bg-white rounded-lg px-4 py-[9px] text-[15px] text-[#8696a0] shadow-[0_1px_1px_rgba(0,0,0,0.05)] border border-transparent flex items-center cursor-not-allowed overflow-hidden">
                                        <span className="select-none text-[#54656f] text-opacity-80 truncate">Mensagem simulada (Apenas leitura)</span>
                                    </div>
                                    <div className="text-[#54656f] pl-1">
                                        <Mic size={24} className="cursor-pointer hover:text-gray-700" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Empty State when no contact is selected */
                            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f0f2f5] border-b-[6px] border-[#25D366] h-full relative border-l border-gray-200 min-w-0">
                                <div className="flex flex-col items-center max-w-[460px] text-center mt-[-40px]">
                                    <div className="w-[280px] sm:w-[320px] h-[160px] sm:h-[188px] mb-8 bg-contain bg-no-repeat bg-center" style={{ backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669aeJeom.png")' }}></div>
                                    <h2 className="text-[28px] sm:text-[32px] font-light text-[#41525d] mb-4 tracking-tight">Baixe o WhatsApp para Windows</h2>
                                    <p className="text-[#667781] text-[14px] leading-relaxed mb-8 hidden sm:block">
                                        Faça chamadas, compartilhe sua tela e tenha uma experiência de uso mais rápida baixando o aplicativo para Windows.
                                    </p>
                                    <button className="bg-[#008069] text-white rounded-full px-6 py-2.5 font-medium hover:bg-[#017561] transition-colors mb-4 whitespace-nowrap">
                                        Baixar o aplicativo
                                    </button>
                                </div>

                                <div className="absolute bottom-10 text-[#8696a0] flex items-center gap-1.5 text-[12px] sm:text-[13px] w-full justify-center px-4 text-center">
                                    <span>🔒</span>
                                    <span>Suas mensagens pessoais possuem a criptografia de ponta a ponta</span>
                                </div>

                                <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:bg-gray-200 p-2 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppSimulator;
