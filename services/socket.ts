import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (apiUrl.startsWith('http')) {
        // If it's an absolute URL like http://localhost:5000/api, remove /api
        return apiUrl.split('/api')[0];
    }
    if (typeof window !== 'undefined') {
        // Fallback for local development if relative path is used
        return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                console.log('Connected to socket server');
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
        }
        return this.socket;
    }

    join(room: string) {
        if (this.socket) {
            this.socket.emit('join', room);
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
