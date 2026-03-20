/**
 * WhatsApp Bot Integration Service (Nest.js + whatsapp-web.js)
 */
import { useStore } from './store';

interface SendMessagePayload {
    to: string;
    message: string;
}

export interface WhatsAppStatus {
    connected: boolean;
    qr: string | null;
    timestamp: string;
}

export const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
    try {
        const storeState = useStore.getState();
        const baseUrl = storeState.whatsappBotUrl || 'http://localhost:3000';

        // Format phone number
        let formattedPhone = phone.replace(/\D/g, ''); 
        // Ensure it has country code if missing (example for Brazil)
        if (formattedPhone.length === 11 && !formattedPhone.startsWith('55')) {
            formattedPhone = `55${formattedPhone}`;
        }

        const payload: SendMessagePayload = {
            to: formattedPhone,
            message: message
        };

        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const fullEndpoint = `${cleanBaseUrl}/whatsapp/send`;

        console.log(`[WhatsApp Bot] Sending message to ${formattedPhone} via ${fullEndpoint}`);

        const response = await fetch(fullEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[WhatsApp Bot] Error sending message:', errorText);
            return false;
        }

        console.log(`[WhatsApp Bot] Message successfully sent to ${formattedPhone}`);
        return true;
    } catch (error) {
        console.error('[WhatsApp Bot] Exception caught while sending message:', error);
        return false;
    }
};

/**
 * Checks the connection status of the WhatsApp bot.
 */
export const checkWhatsAppStatus = async (): Promise<WhatsAppStatus | null> => {
    try {
        const storeState = useStore.getState();
        const baseUrl = storeState.whatsappBotUrl || 'http://localhost:3000';
        
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const response = await fetch(`${cleanBaseUrl}/whatsapp/status`);
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('[WhatsApp Bot] Error checking status:', error);
        return null;
    }
};
