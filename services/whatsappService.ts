// services/whatsappService.ts

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Error ${response.status}: ${errorData.message || 'Error desconocido'}`);
    }
    return response.json();
};

// Get current status from backend. Backend exposes /status (no sessionName) in the Whatsapp-web local service.
export const getStatus = async (apiUrl: string, apiKey?: string): Promise<{ status: string }> => {
    const headers: Record<string,string> = {};
    if (apiKey) headers['apikey'] = apiKey;
    const base = apiUrl.replace(/\/qr\/?$/i, '').replace(/\/$/, '');

    const response = await fetch(`${base}/status`, {
        method: 'GET',
        headers,
    });
    return handleResponse(response);
};

// Fetch the latest QR from the backend. If the backend returns 404 (QR not generated yet) we return { qr: null }
export const getQr = async (apiUrl: string, apiKey?: string): Promise<{ qr: string | null }> => {
    const base = apiUrl.replace(/\/qr\/?$/i, '').replace(/\/$/, '');
     const headers: Record<string,string> = {'Content-Type': 'application/json'};
    if (apiKey) headers['apikey'] = apiKey;

    const response = await fetch(`${base}/qr`, {
        method: 'GET',
        headers,
    });

    if (response.status === 404) {
        // QR not generated yet
        return { qr: null };
    }

    return handleResponse(response);
};

export const getChats = async (apiUrl: string, sessionName: string, apiKey?: string): Promise<{ ok: boolean; chats: Array<any> }> => {
    const base = apiUrl.replace(/\/qr\/?$/i, '').replace(/\/$/, '');
    const headers: Record<string,string> = {};
    if (apiKey) headers['apikey'] = apiKey;
    const response = await fetch(`${base}/message/chats/${encodeURIComponent(sessionName)}`, { headers });
    return handleResponse(response);
};

export const getMessages = async (apiUrl: string, sessionName: string, chatId: string, limit = 50, apiKey?: string): Promise<{ ok: boolean; messages: Array<any> }> => {
    const base = apiUrl.replace(/\/qr\/?$/i, '').replace(/\/$/, '');
    const headers: Record<string,string> = {};
    if (apiKey) headers['apikey'] = apiKey;
    const response = await fetch(`${base}/message/messages/${encodeURIComponent(sessionName)}/${encodeURIComponent(chatId)}?limit=${limit}`, { headers });
    return handleResponse(response);
};

export const getUnread = async (apiUrl: string, sessionName: string, apiKey?: string): Promise<{ ok: boolean; unread: Array<any> }> => {
    const base = apiUrl.replace(/\/qr\/?$/i, '').replace(/\/$/, '');
    const headers: Record<string,string> = {};
    if (apiKey) headers['apikey'] = apiKey;
    const response = await fetch(`${base}/message/unread/${encodeURIComponent(sessionName)}`, { headers });
    return handleResponse(response);
};

export const markRead = async (apiUrl: string, sessionName: string, chatId: string, apiKey?: string): Promise<any> => {
    const base = apiUrl.replace(/\/qr\/?$/i, '').replace(/\/$/, '');
    const headers: Record<string,string> = {'Content-Type': 'application/json'};
    if (apiKey) headers['apikey'] = apiKey;
    const response = await fetch(`${base}/message/read/${encodeURIComponent(sessionName)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ chatId }),
    });
    return handleResponse(response);
};

export const sendMedia = async (apiUrl: string, sessionName: string, number: string, mediaUrl: string, caption?: string, apiKey?: string): Promise<any> => {
    const base = apiUrl.replace(/\/qr\/?$/i, '').replace(/\/$/, '');
    const headers: Record<string,string> = {'Content-Type': 'application/json'};
    if (apiKey) headers['apikey'] = apiKey;
    const response = await fetch(`${base}/message/sendMedia/${encodeURIComponent(sessionName)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ number, mediaUrl, caption }),
    });
    return handleResponse(response);
};

export const sendPdf = async (apiUrl: string, sessionName: string, number: string, html: string, filename?: string, apiKey?: string): Promise<any> => {
    const base = apiUrl.replace(/\/qr\/?$/i, '').replace(/\/$/, '');
    const headers: Record<string,string> = {'Content-Type': 'application/json'};
    if (apiKey) headers['apikey'] = apiKey;
    const response = await fetch(`${base}/message/sendPdf/${encodeURIComponent(sessionName)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ number, html, filename }),
    });
    return handleResponse(response);
};

export const sendMessage = async (apiUrl: string, sessionName: string, apiKey: string, number: string, message: string): Promise<any> => {
    const base = apiUrl.replace(/\/qr\/?$/i, '').replace(/\/$/, '');
    const response = await fetch(`${base}/message/sendText/${encodeURIComponent(sessionName)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
        },
        body: JSON.stringify({
            number: number,
            options: {
                delay: 1200,
                presence: 'composing',
            },
            textMessage: {
                text: message,
            },
        }),
    });
    return handleResponse(response);
};