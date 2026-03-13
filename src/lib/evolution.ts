/**
 * Evolution API Integration Service
 * 
 * Uses configured URL and API Key stored in Settings.
 * Falls back to local ENV vars if configured.
 */
import { useStore } from './store';

interface SendMessagePayload {
    number: string;
    text: string;
}

export const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
    try {
        const storeState = useStore.getState();
        const baseUrl = storeState.evolutionApiUrl || import.meta.env.VITE_EVOLUTION_API_URL;
        const instanceName = storeState.evolutionInstanceName || import.meta.env.VITE_EVOLUTION_INSTANCE_NAME;
        const apiKey = storeState.evolutionApiKey || import.meta.env.VITE_EVOLUTION_APIKEY;

        // In development/mock mode without env vars or settings, return true (simulate success)
        if (!baseUrl || !instanceName || !apiKey) {
            console.warn('[Evolution API Mock] Sending message to:', phone);
            console.warn('[Evolution API Mock] Message:', message);
            return true;
        }

        // Format phone number to standard Evolution format (e.g., usually missing + and sometimes DDD needs formatting, usually 5511999999999)
        const formattedPhone = phone.replace(/\D/g, ''); // Remove non-numeric
        const finalPhone = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

        const payload: SendMessagePayload = {
            number: finalPhone,
            text: message
        };

        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const fullEndpoint = `${cleanBaseUrl}/message/sendText/${instanceName}`;

        const response = await fetch(fullEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('[Evolution API] Error sending message:', await response.text());
            return false;
        }

        console.log(`[Evolution API] Message successfully sent to ${finalPhone}`);
        return true;
    } catch (error) {
        console.error('[Evolution API] Exception caught while sending message:', error);
        return false;
    }
};

/**
 * Polls the Evolution API for new messages.
 * Note: For production use, Webhooks are highly recommended over polling.
 * Since this is a pure React Frontend without a public IP, polling is used as a fallback.
 */
export const syncEvolutionMessages = async () => {
    try {
        const storeState = useStore.getState();
        const baseUrl = storeState.evolutionApiUrl || import.meta.env.VITE_EVOLUTION_API_URL;
        const instanceName = storeState.evolutionInstanceName || import.meta.env.VITE_EVOLUTION_INSTANCE_NAME;
        const apiKey = storeState.evolutionApiKey || import.meta.env.VITE_EVOLUTION_APIKEY;

        if (!baseUrl || !instanceName || !apiKey) return;

        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

        // 1. Fetch all chats to find ones with unread messages
        const chatsResponse = await fetch(`${cleanBaseUrl}/chat/findChats/${instanceName}`, {
            headers: { 'apikey': apiKey }
        });

        if (!chatsResponse.ok) return;
        const chats = await chatsResponse.json();

        // 2. Iterate through chats that might have new messages
        for (const chat of chats) {
            if (chat.unreadCount > 0) {
                // Fetch the messages for this chat
                const msgsResponse = await fetch(`${cleanBaseUrl}/chat/findMessages/${instanceName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': apiKey
                    },
                    body: JSON.stringify({
                        remoteJid: chat.id || chat.remoteJid,
                        page: 1,
                        limit: chat.unreadCount // Get only the unread ones
                    })
                });

                if (msgsResponse.ok) {
                    const messages = await msgsResponse.json();
                    const incomingMsgs = messages.messages || []; // fallback array

                    incomingMsgs.forEach((msg: any) => {
                        // Ensure it's not a message sent by ourselves
                        if (!msg.fromMe && msg.message?.conversation) {
                            const phone = (chat.id || chat.remoteJid).split('@')[0];
                            const text = msg.message.conversation;

                            // Check if this exact message isn't already in the store (prevent duplicates)
                            const exists = useStore.getState().communications.some(c =>
                                c.customerPhone.includes(phone) &&
                                c.message === text &&
                                c.direction === 'inbound' &&
                                // message arrived in the last 5 minutes roughly
                                new Date(c.timestamp).getTime() > Date.now() - 300000
                            );

                            if (!exists) {
                                useStore.getState().receiveWhatsAppMessage(phone, text);
                            }
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('[Evolution API Sync] Polling Error:', error);
    }
};

// Global hook for external webhook wrappers (e.g if user wraps this in Electron or NextJS later)
(window as any).receiveEvolutionWebhook = (phone: string, message: string) => {
    if (phone && message) {
        useStore.getState().receiveWhatsAppMessage(phone, message);
    }
};
