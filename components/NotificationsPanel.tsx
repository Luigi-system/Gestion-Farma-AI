import React from 'react';
import { Notification } from '../types';
import { AlertCircleIcon, CalendarClockIcon, DollarSignIcon, PackageIcon, UserPlusIcon } from './icons';

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'stock_bajo':
            return <AlertCircleIcon className="w-5 h-5 text-red-500" />;
        case 'vencimiento_proximo':
            return <CalendarClockIcon className="w-5 h-5 text-yellow-500" />;
        case 'producto_vencido':
            return <AlertCircleIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
        case 'venta_grande':
             return <DollarSignIcon className="w-5 h-5 text-green-500" />;
        case 'nuevo_cliente':
             return <UserPlusIcon className="w-5 h-5 text-blue-500" />;
        default:
            return <PackageIcon className="w-5 h-5 text-gray-500" />;
    }
};

const getNotificationColor = (type: string) => {
    switch (type) {
        case 'stock_bajo': return 'bg-red-50 dark:bg-red-900/50';
        case 'vencimiento_proximo': return 'bg-yellow-50 dark:bg-yellow-900/50';
        case 'producto_vencido': return 'bg-gray-200 dark:bg-gray-600';
        case 'venta_grande': return 'bg-green-50 dark:bg-green-900/50';
        case 'nuevo_cliente': return 'bg-blue-50 dark:bg-blue-900/50';
        default: return 'bg-gray-50 dark:bg-gray-700';
    }
}

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}a`;
    
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}m`;

    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;

    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;

    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}min`;

    return `${Math.floor(seconds)}s`;
};


interface NotificationsPanelProps {
    notifications: Notification[];
    onMarkAsRead: (id: number) => void;
    onMarkAllAsRead: () => void;
    onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }) => {
    const unreadCount = notifications.filter(n => n.estado === 'no leido').length;

    return (
        <div 
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl z-50 border border-soft-gray-200 animate-fade-in-down dark:bg-gray-800 dark:border-gray-600 dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]"
            role="menu"
            aria-orientation="vertical"
        >
            <div className="flex justify-between items-center p-4 border-b border-soft-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h3>
                {unreadCount > 0 && (
                    <button 
                        onClick={onMarkAllAsRead}
                        className="text-xs font-medium text-clinical-blue hover:underline"
                    >
                        Marcar todas como leídas
                    </button>
                )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div 
                            key={notification.id} 
                            onClick={() => onMarkAsRead(notification.id)}
                            className={`flex items-start p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${notification.estado === 'no leido' ? 'bg-blue-50 dark:bg-blue-900/40' : ''}`}
                        >
                            <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${getNotificationColor(notification.tipo)}`}>
                                {getNotificationIcon(notification.tipo)}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm text-gray-700 dark:text-gray-200">{notification.mensaje}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(notification.fecha_creacion)}</p>
                            </div>
                            {notification.estado === 'no leido' && (
                                <div className="w-2.5 h-2.5 bg-clinical-blue rounded-full self-center ml-2 flex-shrink-0"></div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 px-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No tienes notificaciones.</p>
                    </div>
                )}
            </div>
            <style>{`
              @keyframes fade-in-down {
                0% { opacity: 0; transform: translateY(-10px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in-down { animation: fade-in-down 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default NotificationsPanel;