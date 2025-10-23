import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Product, Client } from '../types';
import { PillIcon, MessageCircleIcon, SunIcon, MoonIcon, FacebookIcon, InstagramIcon, TwitterIcon, TikTokIcon, MailIcon, WhatsAppIcon, SparklesIcon } from '../components/icons';
import Chatbot from '../components/Chatbot';
import { useTheme } from '../components/ThemeContext';

const socialIcons: { [key: string]: React.FC<{className?: string}> } = {
    whatsapp: WhatsAppIcon,
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    twitter: TwitterIcon,
    tiktok: TikTokIcon,
    email: MailIcon
};

type ProductSection = {
    id: string; 
    title: string;
    products: Product[];
};

const defaultConfig = {
    hero: {
        title: 'Tu salud, nuestra prioridad.',
        subtitle: 'Encuentra los medicamentos y productos de cuidado personal que necesitas.',
        mediaUrl: '',
        mediaType: 'image',
        overlayEnabled: true,
    },
    logo: {
        base64: ''
    },
    socials: {
        whatsapp: { enabled: false, url: '' },
        facebook: { enabled: false, url: '' },
        instagram: { enabled: false, url: '' },
        twitter: { enabled: false, url: '' },
        tiktok: { enabled: false, url: '' },
        email: { enabled: false, url: '' }
    },
    productSections: [] as ProductSection[],
    registration: {
        enabled: false
    }
};


const formatImageUrl = (imageString: string | null | undefined): string | undefined => {
    if (!imageString) return undefined;
    if (imageString.startsWith('data:image') || imageString.startsWith('http')) {
        return imageString;
    }
    return undefined;
};


const RegistrationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [nombres, setNombres] = useState('');
    const [dni, setDni] = useState('');
    const [celular, setCelular] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const { error: insertError } = await supabase.from('clientes').insert({
            nombres,
            dni,
            celular,
            puntos: 0
        });

        if (insertError) {
            setError(`Error en el registro: ${insertError.message}`);
        } else {
            setSuccess(true);
            setNombres('');
            setDni('');
            setCelular('');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">Crea tu Cuenta</h2>
                {success ? (
                    <div className="text-center py-8">
                        <p className="text-lg text-green-600 dark:text-green-400">¡Registro exitoso!</p>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">Gracias por unirte a GestionFarma.</p>
                        <button onClick={onClose} className="mt-6 px-5 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Cerrar</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        {error && <p className="text-sm text-red-600 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                            <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} required className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">DNI</label>
                            <input type="text" value={dni} onChange={e => setDni(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Celular</label>
                            <input type="tel" value={celular} onChange={e => setCelular(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                            <button type="submit" disabled={loading} className="px-5 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300">{loading ? 'Registrando...' : 'Registrarse'}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const LandingPage: React.FC = () => {
    const [config, setConfig] = useState(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
    
            // Determine which company's config to load. Default to the first one found.
            const { data: firstEmpresa, error: empresaError } = await supabase
                .from('empresas')
                .select('id')
                .order('id', { ascending: true })
                .limit(1)
                .single();
    
            let configKey: string | null = null;
            if (firstEmpresa) {
                configKey = `landing_page_settings_empresa_${firstEmpresa.id}`;
            }
    
            if (!configKey) {
                console.warn("No se encontraron empresas. Mostrando contenido de respaldo.");
                const { data: defaultProducts } = await supabase.from('productos').select('*').limit(4);
                setConfig(prev => ({...prev, productSections: [{ id: 'default', title: 'Productos Destacados', products: defaultProducts || [] }]}))
                setLoading(false);
                return;
            }
            
            const { data, error } = await supabase.from('configuraciones').select('value').eq('key', configKey).single();
    
            if (error && error.code !== 'PGRST116') { // Ignore "not found" error
                console.error(`Error fetching config for key ${configKey}:`, error);
            } else if (data && data.value) {
                try {
                    const savedConfig = JSON.parse(data.value);
                    const mergedConfig = {
                        ...defaultConfig,
                        ...savedConfig,
                        hero: { ...defaultConfig.hero, ...savedConfig.hero },
                        logo: { ...defaultConfig.logo, ...savedConfig.logo },
                        socials: { ...defaultConfig.socials, ...savedConfig.socials },
                        registration: { ...defaultConfig.registration, ...savedConfig.registration },
                    };
                    
                    const productIds = (savedConfig.productSections || []).flatMap((s: any) => s.productIds || []);
    
                    if (productIds.length > 0) {
                        const { data: productsData, error: productsError } = await supabase.from('productos').select('*').in('id', productIds);
                        if (productsError) throw productsError;
    
                        const productsMap = new Map(productsData?.map(p => [p.id, p]));
                        mergedConfig.productSections = (savedConfig.productSections || []).map((s: any) => ({
                            id: s.id,
                            title: s.title,
                            products: (s.productIds || []).map((id: number) => productsMap.get(id)).filter(Boolean)
                        }));
                    }
                    setConfig(mergedConfig);
    
                } catch (e) {
                     console.error("Error parsing landing config, using defaults.", e);
                     const { data: defaultProducts } = await supabase.from('productos').select('*').limit(4);
                     setConfig(prev => ({...prev, productSections: [{ id: 'default', title: 'Productos Destacados', products: defaultProducts || [] }]}))
                }
            } else {
                 console.warn(`No config found for key ${configKey}. Displaying default content.`);
                 const { data: defaultProducts } = await supabase.from('productos').select('*').limit(4);
                 setConfig(prev => ({...prev, productSections: [{ id: 'default', title: 'Productos Destacados', products: defaultProducts || [] }]}))
            }
            
            setLoading(false);
        };
        fetchContent();
    }, []);

    const getYouTubeVideoId = (url: string): string | null => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const renderHeroMedia = () => {
        if (!config.hero.mediaUrl) return null;

        if (config.hero.mediaType === 'video') {
            const videoId = getYouTubeVideoId(config.hero.mediaUrl);
            if (videoId) {
                return (
                    <iframe
                        className="hero-background pointer-events-none"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`}
                        frameBorder="0"
                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube Background Video"
                    ></iframe>
                );
            }
            // Fallback for direct video links
            return <video src={config.hero.mediaUrl} autoPlay loop muted playsInline className="hero-background" />;
        }

        // Image case
        return <div className="hero-background bg-cover bg-center" style={{backgroundImage: `url(${config.hero.mediaUrl})`}}></div>;
    };

    // FIX: Cast `val` to avoid `unknown` type error with Object.entries.
    const enabledSocials = Object.entries(config.socials).filter(([, val]) => (val as { enabled: boolean, url: string }).enabled && (val as { enabled: boolean, url: string }).url);

    return (
        <div className="bg-soft-gray-100 dark:bg-gray-900 min-h-screen font-sans">
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        {config.logo.base64 ? <img src={config.logo.base64} alt="Logo" className="h-8 w-auto"/> : <PillIcon className="h-8 w-8 text-clinical-blue" />}
                        <h1 className="ml-2 text-2xl font-bold text-gray-800 dark:text-gray-100">Gestion<span className="text-clinical-blue">Farma</span></h1>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-soft-gray-100 text-gray-500 transition-colors dark:hover:bg-gray-700 dark:text-gray-400" aria-label="Toggle theme">
                            {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                        </button>
                        {config.registration.enabled && (
                            <button onClick={() => setIsRegisterModalOpen(true)} className="px-5 py-2 bg-transparent text-clinical-blue font-semibold rounded-lg border-2 border-clinical-blue hover:bg-clinical-blue/10 transition-colors">
                                Registrarse
                            </button>
                        )}
                        <Link to="/login" className="px-5 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            Iniciar Sesión
                        </Link>
                    </div>
                </nav>
            </header>

            <main>
                <section className="relative w-full h-[60vh] bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-center p-4 overflow-hidden group">
                     {renderHeroMedia()}
                     {config.hero.overlayEnabled && <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors duration-500 ease-in-out"></div>}
                    <div className="relative text-white">
                        <h2 className="text-4xl md:text-5xl font-bold">{config.hero.title}</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-200">{config.hero.subtitle}</p>
                    </div>
                </section>

                <div className="container mx-auto px-6 py-12">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-64"><div className="w-full h-3/5 bg-gray-300 dark:bg-gray-700 rounded-t-lg"></div><div className="p-4 space-y-2"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></div></div>
                            ))}
                        </div>
                    ) : config.productSections.length > 0 ? (
                        config.productSections.map(section => (
                            <section key={section.id} className="mb-12">
                                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">{section.title}</h3>
                                {section.products.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {section.products.map(product => (
                                            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group transform hover:-translate-y-1 transition-transform duration-300">
                                                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><img src={formatImageUrl(product.imagen) || 'https://placehold.co/300x200'} alt={product.nombre} className="w-full h-full object-cover"/></div>
                                                <div className="p-4"><h4 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{product.nombre}</h4><p className="text-sm text-gray-500 dark:text-gray-400">{product.laboratorio || 'Genérico'}</p><p className="mt-2 text-lg font-bold text-clinical-blue">S/ {product.unid_pv?.toFixed(2) || 'N/A'}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-gray-400">No hay productos destacados en esta sección.</p>
                                )}
                            </section>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400">No hay secciones para mostrar. Configúralas en el panel de administración.</p>
                    )}
                </div>
            </main>
            
            <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12">
                <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">&copy; {new Date().getFullYear()} GestionFarma. Todos los derechos reservados.</p>
                    {enabledSocials.length > 0 && (
                        <div className="flex items-center space-x-4 mt-4 md:mt-0">
                            {enabledSocials.map(([key, value]) => {
                                // FIX: Cast `value` to access its properties safely.
                                const socialValue = value as { url: string };
                                const Icon = socialIcons[key];
                                const href = key === 'email' ? `mailto:${socialValue.url}` : socialValue.url.startsWith('http') ? socialValue.url : `https://${socialValue.url}`;
                                return (
                                    <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-clinical-blue dark:text-gray-400 dark:hover:text-clinical-blue transition-colors">
                                        <Icon className="w-6 h-6" />
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </footer>

            <button onClick={() => setIsChatbotOpen(true)} className="fixed bottom-6 right-6 bg-clinical-blue text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clinical-blue transition-transform transform hover:scale-110" aria-label="Abrir chat de ayuda">
                <MessageCircleIcon className="w-7 h-7" />
            </button>
            
            {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} />}
            {isRegisterModalOpen && <RegistrationModal onClose={() => setIsRegisterModalOpen(false)} />}

            <style>{`
                .hero-background {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    animation: kenburns-pan 20s ease-in-out infinite alternate;
                }
                .group:hover .hero-background {
                    animation-play-state: paused;
                    transform: scale(1.05) rotate(1deg);
                    filter: brightness(1.1);
                    transition: transform 0.5s ease-out, filter 0.5s ease-out;
                }
                @keyframes kenburns-pan {
                  0% {
                    transform: scale(1) rotate(0deg);
                  }
                  100% {
                    transform: scale(1.1) rotate(-1deg);
                  }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;