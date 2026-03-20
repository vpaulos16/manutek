import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, QrCode, RefreshCcw } from 'lucide-react';
import { checkWhatsAppStatus, type WhatsAppStatus } from '../lib/whatsapp';
import './WhatsappStatus.css';

const WhatsappStatus: React.FC = () => {
    const [status, setStatus] = useState<WhatsAppStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);

    const fetchStatus = async () => {
        const result = await checkWhatsAppStatus();
        setStatus(result);
        setLoading(false);
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading && !status) {
        return <div className="whatsapp-status-loading">Verificando WhatsApp...</div>;
    }

    const isConnected = status?.connected || false;

    return (
        <div className="whatsapp-status-container">
            <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? (
                    <CheckCircle2 size={16} />
                ) : (
                    <XCircle size={16} />
                )}
                <span>{isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}</span>
            </div>

            {!isConnected && status?.qr && (
                <div className="status-actions">
                    <button 
                        className="btn-qr" 
                        onClick={() => setShowQR(!showQR)}
                        title="Mostrar QR Code para conectar"
                    >
                        <QrCode size={16} />
                        {showQR ? 'Ocultar QR' : 'Conectar'}
                    </button>
                    <button className="btn-refresh" onClick={fetchStatus}>
                        <RefreshCcw size={14} />
                    </button>
                </div>
            )}

            {showQR && !isConnected && status?.qr && (
                <div className="qr-overlay">
                    <div className="qr-modal">
                        <h3>Escaneie o QR Code</h3>
                        <div className="qr-image-container">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(status.qr)}&size=200x200`} 
                                alt="WhatsApp QR Code" 
                            />
                        </div>
                        <p>Abra o WhatsApp no seu celular e escaneie este código para conectar o bot.</p>
                        <button onClick={() => setShowQR(false)}>Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsappStatus;
