import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Notification, Usuario } from '../types';
import NotificationsPanel from './NotificationsPanel';
import { BellIcon, SunIcon, MoonIcon, LogOutIcon, UserIcon, BuildingIcon } from './icons';
import { useTheme } from './ThemeContext';
import { useAuth } from './Auth';

// --- PROFILE MODAL ---
const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<Partial<Usuario> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const authUserEmail = user?.email;

            if (!authUserEmail) {
                setError('No se pudo identificar al usuario actual.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', authUserEmail)
                .single();
            
            if (error) {
                setError('No se pudo cargar tu perfil. Asegúrate de que tu email de acceso esté en la tabla de usuarios.');
                console.error("Profile fetch error:", error);
            } else {
                setProfile(data);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user]);

     const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user || !profile) {
            return;
        }
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        setUploading(true);
        setError(null);

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            setError(`Error subiendo imagen: ${uploadError.message}`);
            setUploading(false);
            return;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
        
        const newAvatarUrl = data.publicUrl;

        const { error: updateError } = await supabase
            .from('usuarios')
            .update({ avatar_url: newAvatarUrl })
            .eq('id', profile.id!);

        if (updateError) {
            setError(`Error actualizando perfil: ${updateError.message}`);
        } else {
            setProfile(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
             // Manually trigger a refresh of the auth context to update the header immediately
            const event = new Event('storage');
            window.dispatchEvent(event);
            alert('Foto de perfil actualizada.');
        }

        setUploading(false);
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        const authUserEmail = user?.email;
        if (!authUserEmail) {
            setError("Sesión inválida. No se puede actualizar el perfil.");
            return;
        }

        setIsSaving(true);
        setError(null);

        const { id, created_at, sedes, empresas, ...profileData } = profile as Usuario;
        const { error: updateError } = await supabase
            .from('usuarios')
            .update(profileData)
            .eq('email', authUserEmail);
        
        if (updateError) {
            setError(`Error al actualizar perfil: ${updateError.message}`);
        } else {
            alert('Perfil actualizado con éxito.');
        }

        setIsSaving(false);
    };
    
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        setIsSaving(true);
        setError(null);

        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });

        if (passwordError) {
             setError(`Error al cambiar la contraseña: ${passwordError.message}`);
        } else {
            alert('Contraseña actualizada con éxito. Se cerrará la sesión por seguridad.');
            setNewPassword('');
            setConfirmPassword('');
            // Sign out after password change for security
            setTimeout(() => {
                signOut();
            }, 1500);
        }
        setIsSaving(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => prev ? { ...prev, [name]: value } : null);
    };
    
    const inputStyle = "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Mi Perfil</h3>
                    <button onClick={onClose} className="text-2xl p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 leading-none">&times;</button>
                </div>
                {loading ? (
                    <p>Cargando perfil...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : profile && (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-6 p-4 border rounded-md dark:border-gray-700">
                            <img 
                                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.nombres}+${profile.apellidos}&background=random`} 
                                alt="Avatar" 
                                className="w-24 h-24 rounded-full object-cover ring-4 ring-clinical-blue/20"
                            />
                            <div>
                                <label htmlFor="avatar-upload" className="cursor-pointer px-4 py-2 bg-clinical-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                    {uploading ? 'Subiendo...' : 'Cambiar Foto'}
                                </label>
                                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
                                <p className="text-xs text-gray-500 mt-2">Sube una imagen (JPG, PNG).</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-4 p-4 border rounded-md dark:border-gray-700">
                             <h4 className="font-medium text-gray-900 dark:text-gray-200">Datos Personales</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombres</label>
                                    <input type="text" name="nombres" value={profile.nombres || ''} onChange={handleInputChange} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellidos</label>
                                    <input type="text" name="apellidos" value={profile.apellidos || ''} onChange={handleInputChange} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">DNI</label>
                                    <input type="text" name="dni" value={profile.dni || ''} onChange={handleInputChange} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Celular</label>
                                    <input type="text" name="cel" value={profile.cel || ''} onChange={handleInputChange} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email de Acceso</label>
                                    <input type="text" value={profile.email || ''} readOnly disabled className={`${inputStyle} bg-gray-100 dark:bg-gray-900/50`} />
                                </div>
                             </div>
                             <div className="text-right">
                                 <button type="submit" disabled={isSaving} className="px-4 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                                     {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                 </button>
                             </div>
                        </form>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4 p-4 border rounded-md dark:border-gray-700">
                             <h4 className="font-medium text-gray-900 dark:text-gray-200">Cambiar Contraseña</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputStyle} placeholder="Mínimo 6 caracteres"/>
                                  </div>
                                   <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputStyle} />
                                  </div>
                              </div>
                               <div className="text-right">
                                 <button type="submit" disabled={isSaving || !newPassword} className="px-4 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                                     {isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
                                 </button>
                             </div>
                        </form>
                    </div>
                )}
            </div>
             <style>{`.animate-fade-in { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};


// --- ICONS ---
const ClockIcon: React.FC<{className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const CashRegisterIcon: React.FC<{className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 6h14"/><path d="M2 12h20"/><path d="M5 18h14"/><path d="M19 6V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1"/><path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6"/></svg>);
const BoxIcon: React.FC<{className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>);
const ReceiptIcon: React.FC<{className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h6"/><path d="M12 14v2"/></svg>);
const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const DollarSignIcon: React.FC<{className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>);
const SmartphoneIcon: React.FC<{className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>);
const BankIcon: React.FC<{className?: string}> = ({className}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 18-0"/><path d="M5 21V10l7-5 7 5v11"/><path d="M11 21V17a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4"/></svg>);

const StatCard: React.FC<{icon: React.ReactNode, label: string, value: string | number, color?: string, valueClass?: string}> = ({icon, label, value, color, valueClass}) => (
    <div className="flex items-center space-x-3 flex-shrink-0">
        <div className={`p-2 rounded-full ${color || 'bg-gray-100 dark:bg-gray-700'}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-500 whitespace-nowrap dark:text-gray-400">{label}</p>
            <p className={`font-semibold text-gray-800 dark:text-gray-100 ${valueClass || 'text-sm'}`}>{value}</p>
        </div>
    </div>
);


const Header: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut, profile, empresa, sede } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const [headerStats, setHeaderStats] = useState({
        cajaOpenTime: '--:--',
        salesCount: 0,
        totalSold: 0,
        cajaStatus: '...',
        totalEfectivo: 0,
        totalYape: 0,
        totalTransferencia: 0,
        totalOtros: 0,
    });

    const fetchHeaderStats = useCallback(async () => {
        if (!user || !profile || !sede) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        try {
            const [cajaRes, salesRes] = await Promise.all([
                supabase.from('caja').select('f_apertura, estado').eq('sede_id', sede.id).eq('estado', 'abierta').order('f_apertura', { ascending: false }).limit(1).maybeSingle(),
                supabase.from('ventas').select('total, tipo_pago').eq('sede_id', sede.id).eq('estado', 'Completada').gte('created_at', todayISO),
            ]);
            
            let cajaOpenTime = 'Cerrada';
            let cajaStatus = 'Cerrada';
            if (cajaRes.data && cajaRes.data.estado === 'abierta') {
                cajaStatus = 'Abierta';
                cajaOpenTime = cajaRes.data.f_apertura ? new Date(cajaRes.data.f_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            }

            let salesCount = 0, totalSold = 0;
            let totalEfectivo = 0, totalYape = 0, totalTransferencia = 0, totalOtros = 0;

            if (salesRes.data && salesRes.data.length > 0) {
                salesCount = salesRes.data.length;
                salesRes.data.forEach(sale => {
                    const saleTotal = sale.total || 0;
                    totalSold += saleTotal;
                    switch(sale.tipo_pago) {
                        case 'Efectivo': totalEfectivo += saleTotal; break;
                        case 'Yape': totalYape += saleTotal; break;
                        case 'Transferencia': totalTransferencia += saleTotal; break;
                        case 'Otros': totalOtros += saleTotal; break;
                        default: totalEfectivo += saleTotal;
                    }
                });
            }
            setHeaderStats({ cajaOpenTime, salesCount, totalSold, cajaStatus, totalEfectivo, totalYape, totalTransferencia, totalOtros });

        } catch (error: any) {
            console.error("Error fetching header stats:", error.message || error);
        }
    }, [user, profile, sede]);
    
    const fetchNotifications = useCallback(async () => {
        if (!user || !sede) return;

        const { data, error, count } = await supabase
            .from('notificaciones')
            .select('*', { count: 'exact' })
            .eq('estado', 'no leido')
            .eq('sede_id', sede.id)
            .order('fecha_creacion', { ascending: false });

        if (error) {
            console.error("Error fetching notifications:", error);
        } else {
            const { data: allData } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('sede_id', sede.id)
                .order('fecha_creacion', { ascending: false })
                .limit(20);
            
            setNotifications(allData || []);
            setUnreadCount(count || 0);
        }
    }, [user, sede]);

    useEffect(() => {
        if (user && sede) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user, sede, fetchNotifications]);

    useEffect(() => {
        if(user && sede) {
            fetchHeaderStats();
            const interval = setInterval(fetchHeaderStats, 30000);
            const handleSaleCompletion = () => fetchHeaderStats();
            document.addEventListener('saleCompleted', handleSaleCompletion);
            return () => {
                clearInterval(interval);
                document.removeEventListener('saleCompleted', handleSaleCompletion);
            };
        }
    }, [user, sede, fetchHeaderStats]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleMarkAsRead = async (id: number) => {
        const { error } = await supabase.from('notificaciones').update({ estado: 'leido' }).eq('id', id).eq('estado', 'no leido');
        if (!error) fetchNotifications();
    };

    const handleMarkAllAsRead = async () => {
        if (!sede) return;
        const { error } = await supabase.from('notificaciones').update({ estado: 'leido' }).eq('estado', 'no leido').eq('sede_id', sede.id);
        if (!error) fetchNotifications();
    };

  return (
    <>
    <header className="flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between h-20 px-6 bg-white border-b border-soft-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-4">
                {empresa ? (
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{empresa.nombre}</h2>
                ) : (
                    <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400">No perteneces a una empresa</h2>
                )}
                {sede && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-clinical-blue/10 rounded-full text-sm text-clinical-blue dark:bg-clinical-blue/20">
                        <BuildingIcon className="w-4 h-4" />
                        <span className="font-semibold">{sede.nombre}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-4">
                 <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                </button>
                <div className="relative" ref={notificationsRef}>
                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                        <BellIcon className="w-6 h-6" />
                        {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span></span>}
                    </button>
                    {isNotificationsOpen && <NotificationsPanel notifications={notifications} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} onClose={() => setIsNotificationsOpen(false)} />}
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-soft-gray-100 dark:hover:bg-gray-700">
                        <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.nombres}+${profile?.apellidos}&background=random`} 
                            alt="User avatar" 
                        />
                        <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl z-50 border dark:bg-gray-800 dark:border-gray-600 animate-fade-in-down">
                            <div className="p-4 border-b dark:border-gray-700">
                                <p className="font-semibold text-gray-900 truncate dark:text-gray-100">{profile ? `${profile.nombres} ${profile.apellidos}` : 'Cargando...'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
                            </div>
                            <div className="p-2">
                                <button onClick={() => { setIsProfileModalOpen(true); setIsDropdownOpen(false); }} className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-soft-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"><UserIcon className="w-4 h-4 mr-2" /> Mi Perfil</button>
                                <button onClick={signOut} className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-soft-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"><LogOutIcon className="w-4 h-4 mr-2" /> Cerrar Sesión</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-2 md:space-x-4 lg:space-x-6 overflow-x-auto p-3 bg-gray-50 border-b dark:bg-gray-800/50 dark:border-gray-700">
            <StatCard icon={<ClockIcon className="w-5 h-5 text-blue-600"/>} label="Apertura" value={headerStats.cajaOpenTime} color="bg-blue-100 dark:bg-blue-900/50" />
            <StatCard icon={<CashRegisterIcon className={`w-5 h-5 ${headerStats.cajaStatus === 'Abierta' ? 'text-green-600' : 'text-red-600'}`}/>} label="Estado Caja" value={headerStats.cajaStatus} color={headerStats.cajaStatus === 'Abierta' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'} valueClass={`text-sm font-bold ${headerStats.cajaStatus === 'Abierta' ? 'text-pharmacy-green' : 'text-red-500'}`} />
            <div className="border-l h-10 border-gray-200 dark:border-gray-600"></div>
            <StatCard icon={<ReceiptIcon className="w-5 h-5 text-purple-600"/>} label="Ventas Hoy" value={headerStats.salesCount} color="bg-purple-100 dark:bg-purple-900/50" />
            <div className="border-l h-10 border-gray-200 dark:border-gray-600"></div>
            <StatCard icon={<DollarSignIcon className="w-5 h-5 text-green-600"/>} label="Efectivo" value={`S/ ${headerStats.totalEfectivo.toFixed(2)}`} color="bg-green-100 dark:bg-green-900/50" />
            <StatCard icon={<SmartphoneIcon className="w-5 h-5 text-indigo-600"/>} label="Yape/Plin" value={`S/ ${(headerStats.totalYape + headerStats.totalOtros).toFixed(2)}`} color="bg-indigo-100 dark:bg-indigo-900/50" />
            <StatCard icon={<BankIcon className="w-5 h-5 text-pink-600"/>} label="Transferencia" value={`S/ ${headerStats.totalTransferencia.toFixed(2)}`} color="bg-pink-100 dark:bg-pink-900/50" />
            <div className="border-l h-10 border-gray-200 dark:border-gray-600"></div>
            <StatCard icon={<DollarSignIcon className="w-6 h-6 text-gray-800 dark:text-gray-100"/>} label="Total del Día" value={`S/ ${headerStats.totalSold.toFixed(2)}`} color="bg-gray-200 dark:bg-gray-600" valueClass="text-base font-bold text-gray-900 dark:text-white" />
        </div>
        <style>{`@keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 0.2s ease-out; }`}</style>
    </header>
    {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} />}
    </>
  );
};

export default Header;