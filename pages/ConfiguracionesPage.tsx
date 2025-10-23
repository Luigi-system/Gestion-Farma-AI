// FIX: Import `useRef` from React to resolve the "Cannot find name 'useRef'" error.
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { Product } from "../types";
import { BuildingIcon, WhatsAppIcon, SaveIcon, CodeIcon, AlertTriangleIcon, LayoutTemplateIcon, LinkIcon, StarIcon, TrashIcon, FacebookIcon, InstagramIcon, TwitterIcon, TikTokIcon, MailIcon, SparklesIcon, ChevronRightIcon } from '../components/icons';
import * as whatsappService from "../services/whatsappService";
import { useAuth } from "../components/Auth";

const inputStyle = "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";

const socialIcons: { [key: string]: React.FC<{className?: string}> } = {
    whatsapp: WhatsAppIcon,
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    twitter: TwitterIcon,
    tiktok: TikTokIcon,
    email: MailIcon
};
const socialLabels: { [key: string]: string } = {
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'X (Twitter)',
    tiktok: 'TikTok',
    email: 'Correo'
};


const EmpresaConfig: React.FC = () => {
    const [config, setConfig] = useState({
        empresa_nombre: '',
        empresa_ruc: '',
        empresa_direccion: '',
        empresa_telefono: '',
        empresa_email: '',
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const keys = Object.keys(config);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('configuraciones').select('key, value').in('key', keys);
            if (error) {
                setError("Error al cargar la configuración de la empresa: " + error.message);
            } else {
                const configMap = new Map((data || []).map(item => [item.key, item.value]));
                setConfig({
                    empresa_nombre: String(configMap.get('empresa_nombre') || ''),
                    empresa_ruc: String(configMap.get('empresa_ruc') || ''),
                    empresa_direccion: String(configMap.get('empresa_direccion') || ''),
                    empresa_telefono: String(configMap.get('empresa_telefono') || ''),
                    empresa_email: String(configMap.get('empresa_email') || ''),
                });
            }
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        const configToSave = Object.entries(config).map(([key, value]) => ({ key, value }));
        const { error: saveError } = await supabase.from('configuraciones').upsert(configToSave, { onConflict: 'key' });
        if (saveError) {
            setError("Error al guardar la configuración: " + saveError.message);
        } else {
            alert("Datos de la empresa guardados exitosamente.");
        }
        setIsSaving(false);
    };

    if (loading) return <div className="text-center p-10">Cargando...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800 space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Datos de la Empresa</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Esta información se usará en boletas, facturas y otros documentos.</p>
            </div>
            
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900/50 dark:text-red-200">{error}</div>}
            
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre o Razón Social</label>
                        <input type="text" name="empresa_nombre" value={config.empresa_nombre} onChange={handleInputChange} className={inputStyle} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RUC</label>
                        <input type="text" name="empresa_ruc" value={config.empresa_ruc} onChange={handleInputChange} className={inputStyle} />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                    <input type="text" name="empresa_direccion" value={config.empresa_direccion} onChange={handleInputChange} className={inputStyle} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                        <input type="text" name="empresa_telefono" value={config.empresa_telefono} onChange={handleInputChange} className={inputStyle} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" name="empresa_email" value={config.empresa_email} onChange={handleInputChange} className={inputStyle} />
                    </div>
                </div>
            </div>

            <div className="text-right">
                <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center px-4 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                    <SaveIcon className="mr-2 w-5 h-5" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
        </div>
    );
};

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => {
    return (
        <div className="border rounded-md dark:border-gray-700 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
                <ChevronRightIcon className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 border-t dark:border-gray-700">
                    {children}
                </div>
            )}
        </div>
    );
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

const PaginaBienvenidaConfig: React.FC = () => {
    const { empresa } = useAuth();
    const configKey = useMemo(() => empresa ? `landing_page_settings_empresa_${empresa.id}` : null, [empresa]);

    const [config, setConfig] = useState(defaultConfig);
    const [productSearch, setProductSearch] = useState<{ [sectionId: string]: string }>({});
    const [productSuggestions, setProductSuggestions] = useState<{ [sectionId: string]: Product[] }>({});
    const [activeAccordion, setActiveAccordion] = useState<string | null>('hero');
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            if (!configKey) {
                setError("Debes pertenecer a una empresa para configurar la página de bienvenida.");
                setConfig(defaultConfig);
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            const { data, error } = await supabase.from('configuraciones').select('value').eq('key', configKey).single();
            
            if (error && error.code !== 'PGRST116') { // Ignore "not found" error
                setError("Error al cargar la configuración: " + error.message);
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
                        mergedConfig.productSections = savedConfig.productSections.map((s: any) => ({
                            ...s,
                            products: (s.productIds || []).map((id: number) => productsMap.get(id)).filter(Boolean)
                        }));
                    }
                    setConfig(mergedConfig);
                } catch (e) {
                    setError("Error al procesar la configuración guardada.");
                }
            } else {
                setConfig(defaultConfig); // No config for this empresa, reset to default
            }
            setLoading(false);
        };
        fetchConfig();
    }, [configKey]);

    const handleConfigChange = (section: keyof typeof config, key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const handleSocialChange = (key: string, field: 'enabled' | 'url', value: any) => {
        setConfig(prev => ({
            ...prev,
            socials: {
                ...prev.socials,
                [key]: {
                    ...prev.socials[key as keyof typeof prev.socials],
                    [field]: value
                }
            }
        }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleConfigChange('logo', 'base64', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSearchChange = async (sectionId: string, term: string) => {
        setProductSearch(prev => ({ ...prev, [sectionId]: term }));
        if (term.length < 2) {
            setProductSuggestions(prev => ({ ...prev, [sectionId]: [] }));
            return;
        }
        const { data } = await supabase.from('productos').select('*').ilike('nombre', `%${term}%`).limit(5);
        setProductSuggestions(prev => ({ ...prev, [sectionId]: data || [] }));
    };

    const handleAddSection = () => {
        setConfig(prev => ({...prev, productSections: [...prev.productSections, { id: `new_${Date.now()}`, title: 'Nueva Sección', products: [] }]}));
    };
    
    const handleDeleteSection = (sectionId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta sección?")) {
            setConfig(prev => ({...prev, productSections: prev.productSections.filter(s => s.id !== sectionId)}));
        }
    };
    
    const handleSectionTitleChange = (sectionId: string, newTitle: string) => {
        setConfig(prev => ({...prev, productSections: prev.productSections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s)}));
    };
    
    const handleAddProductToSection = (sectionId: string, product: Product) => {
        setConfig(prev => ({
            ...prev,
            productSections: prev.productSections.map(s => {
                if (s.id === sectionId && !s.products.some(p => p.id === product.id)) {
                    return { ...s, products: [...s.products, product] };
                }
                return s;
            })
        }));
        setProductSearch(prev => ({ ...prev, [sectionId]: '' }));
        setProductSuggestions(prev => ({ ...prev, [sectionId]: [] }));
    };
    
    const handleRemoveProductFromSection = (sectionId: string, productId: number) => {
         setConfig(prev => ({...prev, productSections: prev.productSections.map(s => s.id === sectionId ? { ...s, products: s.products.filter(p => p.id !== productId) } : s)}));
    };

    const handleSave = async () => {
        if (!configKey) {
            setError("No se puede guardar. No perteneces a una empresa.");
            return;
        }
        setIsSaving(true);
        setError(null);
        
        const configToSave = {
            ...config,
            productSections: config.productSections.map(s => ({
                id: s.id,
                title: s.title,
                productIds: s.products.map(p => p.id)
            }))
        };
        
        const { error: saveError } = await supabase.from('configuraciones').upsert({ key: configKey, value: JSON.stringify(configToSave) }, { onConflict: 'key' });
        
        if (saveError) {
            setError("Error al guardar la configuración: " + saveError.message);
        } else {
            alert("Configuración de la página de bienvenida guardada exitosamente.");
        }
        setIsSaving(false);
    };

    const getYouTubeVideoId = (url: string): string | null => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const renderSimulatorHeroMedia = () => {
        if (!config.hero.mediaUrl) return null;

        if (config.hero.mediaType === 'video') {
            const videoId = getYouTubeVideoId(config.hero.mediaUrl);
            if (videoId) {
                return (
                    <iframe
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`}
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                        title="YouTube Preview"
                    ></iframe>
                );
            }
            return <video src={config.hero.mediaUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover pointer-events-none" />;
        }
        return <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${config.hero.mediaUrl})`}}></div>;
    };


    if (loading) return <div className="text-center p-10">Cargando constructor visual...</div>;

    // FIX: Cast `val` to avoid `unknown` type error with Object.entries.
    const enabledSocials = Object.entries(config.socials).filter(([, val]) => (val as { enabled: boolean, url: string }).enabled && (val as { enabled: boolean, url: string }).url);

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Editor Visual (Empresa: <span className="text-clinical-blue">{empresa?.nombre || 'Ninguna'}</span>)
                </h3>
                 <button onClick={handleSave} disabled={isSaving || !configKey} className="inline-flex items-center px-4 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                    <SaveIcon className="mr-2 w-5 h-5" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
            {error && <p className="text-red-500 bg-red-100 p-2 rounded-md">{error}</p>}
            
            <div className={`grid grid-cols-1 xl:grid-cols-2 gap-8 ${!configKey ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* --- CONTROLS PANEL --- */}
                <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800 space-y-4 max-h-[70vh] overflow-y-auto">
                    <AccordionItem title="Sección Principal (Hero)" isOpen={activeAccordion === 'hero'} onToggle={() => setActiveAccordion(activeAccordion === 'hero' ? null : 'hero')}>
                        <div className="space-y-4">
                            <div><label className="text-sm font-medium">Título Principal</label><input type="text" value={config.hero.title} onChange={e => handleConfigChange('hero', 'title', e.target.value)} className={inputStyle} /></div>
                            <div><label className="text-sm font-medium">Subtítulo</label><input type="text" value={config.hero.subtitle} onChange={e => handleConfigChange('hero', 'subtitle', e.target.value)} className={inputStyle} /></div>
                            <div>
                                <label className="text-sm font-medium">URL de Imagen o Video de Fondo</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Puedes usar un enlace a una imagen, un video directo (.mp4) o un link de YouTube.</p>
                                <input type="text" value={config.hero.mediaUrl} onChange={e => handleConfigChange('hero', 'mediaUrl', e.target.value)} className={inputStyle} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Tipo de Fondo</label>
                                <div className="flex items-center gap-4 mt-1"><label><input type="radio" name="mediaType" value="image" checked={config.hero.mediaType === 'image'} onChange={e => handleConfigChange('hero', 'mediaType', e.target.value)} /> Imagen</label><label><input type="radio" name="mediaType" value="video" checked={config.hero.mediaType === 'video'} onChange={e => handleConfigChange('hero', 'mediaType', e.target.value)} /> Video</label></div>
                            </div>
                            <div>
                                <label className="flex items-center space-x-2 mt-2">
                                    <input type="checkbox" checked={config.hero.overlayEnabled} onChange={e => handleConfigChange('hero', 'overlayEnabled', e.target.checked)} className="h-4 w-4 rounded text-clinical-blue focus:ring-clinical-blue" />
                                    <span className="text-sm font-medium">Habilitar sombreado sobre el fondo (mejora legibilidad)</span>
                                </label>
                            </div>
                        </div>
                    </AccordionItem>

                     <AccordionItem title="Logo de la Empresa" isOpen={activeAccordion === 'logo'} onToggle={() => setActiveAccordion(activeAccordion === 'logo' ? null : 'logo')}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Subir Logo</label>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            </div>
                            {config.logo.base64 && (
                                <div><label className="text-sm font-medium">Vista Previa:</label><img src={config.logo.base64} alt="Logo Preview" className="mt-2 h-16 w-auto bg-gray-200 p-1 rounded-md" /></div>
                            )}
                        </div>
                    </AccordionItem>

                     <AccordionItem title="Redes Sociales" isOpen={activeAccordion === 'socials'} onToggle={() => setActiveAccordion(activeAccordion === 'socials' ? null : 'socials')}>
                         <div className="space-y-4">
                            {/* FIX: Use Object.keys for type-safe iteration over config.socials */}
                            {Object.keys(config.socials).map((key) => {
                                const socialKey = key as keyof typeof config.socials;
                                const value = config.socials[socialKey];
                                const Icon = socialIcons[key];
                                return (
                                <div key={key} className="flex items-center gap-4">
                                    <input type="checkbox" checked={value.enabled} onChange={e => handleSocialChange(key, 'enabled', e.target.checked)} className="h-5 w-5 rounded"/>
                                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                                    <div className="flex-grow"><label className="font-medium">{socialLabels[key]}</label><input type="text" placeholder="URL completa..." value={value.url} onChange={e => handleSocialChange(key, 'url', e.target.value)} disabled={!value.enabled} className={`${inputStyle} !mt-0 disabled:bg-gray-100 dark:disabled:bg-gray-900`} /></div>
                                </div>
                            )})}
                        </div>
                    </AccordionItem>
                    
                    <AccordionItem title="Secciones de Productos" isOpen={activeAccordion === 'products'} onToggle={() => setActiveAccordion(activeAccordion === 'products' ? null : 'products')}>
                         <div className="space-y-6">
                            <div className="flex justify-end"><button onClick={handleAddSection} className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200">Añadir Sección</button></div>
                            {config.productSections.map(section => (
                                <div key={section.id} className="p-4 border rounded-md dark:border-gray-600 space-y-3 bg-gray-50 dark:bg-gray-900">
                                    <div className="flex justify-between items-center"><input type="text" value={section.title} onChange={e => handleSectionTitleChange(section.id, e.target.value)} className={`${inputStyle} text-lg font-semibold !mt-0`} /><button onClick={() => handleDeleteSection(section.id)} className="ml-4 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button></div>
                                    <div className="relative"><input type="text" value={productSearch[section.id] || ''} onChange={e => handleSearchChange(section.id, e.target.value)} placeholder="Buscar producto para añadir..." className={inputStyle}/>{productSuggestions[section.id]?.length > 0 && (<ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">{productSuggestions[section.id].map(p => <li key={p.id} onClick={() => handleAddProductToSection(section.id, p)} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm">{p.nombre}</li>)}</ul>)}</div>
                                    <div className="space-y-2">{section.products.map(p => (<div key={p.id} className="flex items-center justify-between p-2 text-sm bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700"><span className="font-medium truncate">{p.nombre}</span><button onClick={() => handleRemoveProductFromSection(section.id, p.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4"/></button></div>))}{section.products.length === 0 && <p className="text-xs text-center text-gray-500 py-2">No hay productos en esta sección.</p>}</div>
                                </div>
                            ))}
                        </div>
                    </AccordionItem>
                    
                    <AccordionItem title="Opciones Generales" isOpen={activeAccordion === 'general'} onToggle={() => setActiveAccordion(activeAccordion === 'general' ? null : 'general')}>
                        <div className="flex items-center">
                            <input id="enable-reg" type="checkbox" checked={config.registration.enabled} onChange={e => handleConfigChange('registration', 'enabled', e.target.checked)} className="h-5 w-5 rounded"/>
                            <label htmlFor="enable-reg" className="ml-2 font-medium">Habilitar botón de registro para clientes</label>
                        </div>
                    </AccordionItem>
                </div>

                {/* --- SIMULATOR PANEL --- */}
                <div className="bg-gray-200 dark:bg-black p-4 rounded-xl">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full h-full max-h-[65vh] overflow-y-auto">
                        <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                             <div className="flex items-center">{config.logo.base64 ? <img src={config.logo.base64} alt="Logo" className="h-8 w-auto"/> : <><SparklesIcon className="h-8 w-8 text-clinical-blue" /> <h1 className="ml-2 text-2xl font-bold text-gray-800 dark:text-gray-100">Logo</h1></>}</div>
                             <div className="flex items-center gap-2">{config.registration.enabled && <span className="px-4 py-1.5 text-sm border-2 border-clinical-blue text-clinical-blue font-semibold rounded-md">Registrarse</span>}<span className="px-4 py-1.5 text-sm bg-clinical-blue text-white font-semibold rounded-md">Iniciar Sesión</span></div>
                        </header>
                         <section className="relative w-full h-64 bg-gray-300 dark:bg-gray-700 bg-cover bg-center flex items-center justify-center text-center p-4 overflow-hidden">
                            {renderSimulatorHeroMedia()}
                            {config.hero.overlayEnabled && <div className="absolute inset-0 bg-black/50"></div>}
                            <div className="relative text-white">
                                <h2 className="text-2xl font-bold">{config.hero.title}</h2>
                                <p className="mt-2 text-sm max-w-lg mx-auto">{config.hero.subtitle}</p>
                            </div>
                        </section>
                        <div className="p-4 space-y-8">{config.productSections.map(section => (<div key={section.id}><h3 className="text-xl font-semibold mb-4">{section.title}</h3><div className="grid grid-cols-2 gap-4">{section.products.map(p => (<div key={p.id} className="border dark:border-gray-700 rounded-lg overflow-hidden"><div className="w-full h-24 bg-gray-200 dark:bg-gray-700"></div><div className="p-2"><h4 className="text-sm font-semibold truncate">{p.nombre}</h4><p className="mt-1 text-sm font-bold text-clinical-blue">S/ {p.unid_pv?.toFixed(2)}</p></div></div>))}{section.products.length === 0 && <p className="text-xs text-gray-400 col-span-2 text-center py-4">Añade productos para ver la vista previa.</p>}</div></div>))}</div>
                         <footer className="bg-gray-100 dark:bg-gray-800 p-4 border-t dark:border-gray-700 flex justify-between items-center">
                            <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} GestionFarma</p>
                            {enabledSocials.length > 0 && <div className="flex items-center space-x-3">{enabledSocials.map(([key]) => { const Icon = socialIcons[key]; return <Icon key={key} className="w-5 h-5 text-gray-500"/> })}</div>}
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WhatsAppConfig: React.FC = () => {
    const [config, setConfig] = useState({
        whatsapp_provider: 'api',
        whatsapp_api_url: '',
        whatsapp_api_key: '',
        whatsapp_session_name: 'my-session',
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for QR Code tab
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [waStatus, setWaStatus] = useState<{ status: string; message: string }>({ status: 'LOADING', message: 'Cargando estado...' });
    const [isPolling, setIsPolling] = useState(false);
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const keys = Object.keys(config);

    const fetchFullConfig = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('configuraciones').select('key, value').in('key', keys);
        if (error) {
            setError("Error al cargar la configuración de WhatsApp: " + error.message);
        } else {
            const configMap = new Map((data || []).map(item => [item.key, item.value]));
            setConfig(prev => ({
                ...prev,
                whatsapp_provider: String(configMap.get('whatsapp_provider') || 'api'),
                whatsapp_api_url: String(configMap.get('whatsapp_api_url') || ''),
                whatsapp_api_key: String(configMap.get('whatsapp_api_key') || ''),
                whatsapp_session_name: String(configMap.get('whatsapp_session_name') || 'my-session'),
            }));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchFullConfig();
    }, [fetchFullConfig]);

    const pollStatusAndQR = useCallback(async () => {
        if (!config.whatsapp_api_url) {
            setWaStatus({ status: 'ERROR', message: 'URL del servicio no configurada.' });
            return;
        }
        try {
            const statusRes = await whatsappService.getStatus(config.whatsapp_api_url, config.whatsapp_api_key);
            let message = `Estado: ${statusRes.status}`;
            if (statusRes.status === 'CONNECTED') {
                message = '¡Conectado! Listo para enviar mensajes.';
                setQrCode(null); // Clear QR if connected
                if (pollInterval.current) { // Stop polling if connected
                    clearInterval(pollInterval.current);
                    setIsPolling(false);
                }
            } else if (statusRes.status === 'QR_READY') {
                message = 'Escanea el código QR con tu celular.';
                const qrRes = await whatsappService.getQr(config.whatsapp_api_url, config.whatsapp_api_key);
                setQrCode(qrRes.qr);
            } else if (statusRes.status === 'DISCONNECTED' || statusRes.status === 'ERROR') {
                message = 'Desconectado. Inicia la sesión.';
                setQrCode(null);
            }
            setWaStatus({ status: statusRes.status, message });
        } catch (err: any) {
            setWaStatus({ status: 'ERROR', message: `Fallo de conexión: ${err.message}` });
            setQrCode(null);
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                setIsPolling(false);
            }
        }
    }, [config.whatsapp_api_url, config.whatsapp_api_key]);


    useEffect(() => {
        if (config.whatsapp_provider === 'web-qr' && isPolling) {
            pollStatusAndQR(); // Initial call
            pollInterval.current = setInterval(pollStatusAndQR, 5000); // Poll every 5 seconds
        }
        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, [config.whatsapp_provider, isPolling, pollStatusAndQR]);

    const handleProviderChange = (provider: string) => {
        setConfig(prev => ({...prev, whatsapp_provider: provider }));
        if (provider === 'web-qr' && !isPolling) {
            setIsPolling(true);
        } else if (provider !== 'web-qr' && pollInterval.current) {
            clearInterval(pollInterval.current);
            setIsPolling(false);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        const configToSave = Object.entries(config).map(([key, value]) => ({ key, value }));
        const { error: saveError } = await supabase.from('configuraciones').upsert(configToSave, { onConflict: 'key' });
        if (saveError) {
            setError("Error al guardar la configuración: " + saveError.message);
        } else {
            alert("Configuración de WhatsApp guardada.");
        }
        setIsSaving(false);
    };

    if (loading) return <div className="text-center p-10">Cargando...</div>;

    const TabButton: React.FC<{ provider: string, label: string }> = ({ provider, label }) => (
        <button
            onClick={() => handleProviderChange(provider)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${config.whatsapp_provider === provider ? 'bg-clinical-blue text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800 space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Integración con WhatsApp</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Elige tu método de conexión para enviar boletas y notificaciones.</p>
            </div>
            
            <div className="flex space-x-2 border-b dark:border-gray-700 pb-2">
                <TabButton provider="api" label="API Externa" />
                <TabButton provider="web-qr" label="WhatsApp Web (QR)" />
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900/50 dark:text-red-200">{error}</div>}
            
            {config.whatsapp_provider === 'api' ? (
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">Conecta un servicio externo (ej: Evolution API) que gestiona tu WhatsApp.</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL del Servicio API</label>
                        <input type="text" name="whatsapp_api_url" value={config.whatsapp_api_url} onChange={handleInputChange} placeholder="http://localhost:3000" className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key (si es requerida)</label>
                        <input type="password" name="whatsapp_api_key" value={config.whatsapp_api_key} onChange={handleInputChange} className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Sesión</label>
                        <input type="text" name="whatsapp_session_name" value={config.whatsapp_session_name} onChange={handleInputChange} className={inputStyle} />
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-4">
                    <p className="text-xs text-gray-500">Conecta directamente escaneando un código QR. Requiere un servicio compatible (ej: whatsapp-web.js) corriendo en tu servidor.</p>
                    <div className="p-4 rounded-md bg-gray-100 dark:bg-gray-700">
                        <p className="font-semibold">{waStatus.message}</p>
                    </div>
                    {qrCode ? (
                        <img src={`data:image/png;base64,${qrCode}`} alt="Escanea para conectar WhatsApp" className="mx-auto border-4 border-white dark:border-gray-600 rounded-lg shadow-lg" />
                    ) : waStatus.status === 'LOADING' || waStatus.status === 'QR_READY' ? (
                        <div className="w-64 h-64 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto flex items-center justify-center animate-pulse">
                            <p className="text-gray-500">Esperando QR...</p>
                        </div>
                    ) : null}
                    {!isPolling && waStatus.status !== 'CONNECTED' && (
                        <button onClick={() => setIsPolling(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg">Iniciar Sesión y Obtener QR</button>
                    )}
                </div>
            )}

            <div className="text-right">
                <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center px-4 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                    <SaveIcon className="mr-2 w-5 h-5" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
        </div>
    );
};

const IAConfig: React.FC = () => {
    const [config, setConfig] = useState({
        ai_service_provider: 'gemini',
        openai_api_key: '',
        public_chatbot_instruction: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            const { data } = await supabase.from('configuraciones').select('key, value').in('key', ['ai_service_provider', 'openai_api_key', 'public_chatbot_instruction']);
            const configMap = new Map(data?.map(item => [item.key, item.value]));
            setConfig({
                ai_service_provider: String(configMap.get('ai_service_provider') || 'gemini'),
                openai_api_key: String(configMap.get('openai_api_key') || ''),
                public_chatbot_instruction: String(configMap.get('public_chatbot_instruction') || '')
            });
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        const configToSave = Object.entries(config).map(([key, value]) => ({ key, value }));
        const { error } = await supabase.from('configuraciones').upsert(configToSave, { onConflict: 'key' });
        if (error) { alert("Error al guardar: " + error.message); }
        else { alert("Configuración de IA guardada."); }
        setIsSaving(false);
    };

    if (loading) return <div className="text-center p-10">Cargando...</div>;
    
    return (
         <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800 space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Servicios de IA</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Configura el motor de inteligencia artificial para las consultas y el chatbot.</p>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor de IA</label>
                <div className="mt-2 flex space-x-4">
                    <label className="flex items-center"><input type="radio" name="ai_service_provider" value="gemini" checked={config.ai_service_provider === 'gemini'} onChange={e => setConfig(c => ({...c, ai_service_provider: e.target.value}))} className="h-4 w-4 text-clinical-blue focus:ring-clinical-blue" /> <span className="ml-2">Google Gemini</span></label>
                    <label className="flex items-center"><input type="radio" name="ai_service_provider" value="openai" checked={config.ai_service_provider === 'openai'} onChange={e => setConfig(c => ({...c, ai_service_provider: e.target.value}))} className="h-4 w-4 text-clinical-blue focus:ring-clinical-blue" /> <span className="ml-2">OpenAI</span></label>
                </div>
            </div>

            {config.ai_service_provider === 'gemini' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/40 dark:border-blue-700">
                    <p className="text-sm text-blue-700 dark:text-blue-300">La API Key para Gemini se gestiona de forma segura a través de variables de entorno y no requiere configuración aquí.</p>
                </div>
            )}

            {config.ai_service_provider === 'openai' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">OpenAI API Key</label>
                    <input type="password" value={config.openai_api_key} onChange={e => setConfig(c => ({...c, openai_api_key: e.target.value}))} className={inputStyle} />
                </div>
            )}
            
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instrucción de Sistema para el Chatbot Público</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Define el comportamiento del chatbot en tu página de bienvenida.</p>
                <textarea value={config.public_chatbot_instruction} onChange={e => setConfig(c => ({...c, public_chatbot_instruction: e.target.value}))} rows={6} className={inputStyle} placeholder="Ej: Eres un asistente amigable..."></textarea>
            </div>
             <div className="text-right">
                <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center px-4 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                    <SaveIcon className="mr-2 w-5 h-5" />
                    {isSaving ? "Guardando..." : "Guardar Configuración de IA"}
                </button>
            </div>
        </div>
    );
};

const SUPABASE_URL = 'https://qohzstheshebjlscuihc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvaHpzdGhlc2hlYmpsc2N1aWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwODY3NDEsImV4cCI6MjA3MTY2Mjc0MX0.eNT-YtX0ALCky-dHTmM9GaTXfcCCdTEn0n8hwpyWneU';

const DeveloperConfig: React.FC = () => {
    const handleClearCache = () => {
        if (window.confirm("¿Estás seguro? Esta acción borrará los datos de la aplicación almacenados en tu navegador, como ventas pendientes no guardadas. Serás desconectado.")) {
            const theme = localStorage.getItem('theme');
            localStorage.clear();
            if (theme) localStorage.setItem('theme', theme);
            window.location.reload();
        }
    };

    return (
         <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800 space-y-6">
             <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Modo Desarrollador</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Configuraciones avanzadas y de depuración.</p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Conexión a Base de Datos (Supabase)</h4>
                <p className="text-xs text-gray-500">Estos valores están definidos en el código fuente por seguridad y no pueden ser modificados desde aquí.</p>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Supabase URL</label>
                    <input type="text" readOnly value={SUPABASE_URL} className={`${inputStyle} bg-gray-200 dark:bg-gray-900/50 cursor-not-allowed`} />
                </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Supabase Anon Key</label>
                    <input type="text" readOnly value={SUPABASE_ANON_KEY} className={`${inputStyle} bg-gray-200 dark:bg-gray-900/50 cursor-not-allowed`} />
                </div>
            </div>

            <div className="p-4 border border-red-300 bg-red-50 rounded-lg dark:border-red-700 dark:bg-red-900/40">
                <h4 className="font-bold text-red-800 dark:text-red-200 flex items-center gap-2"><AlertTriangleIcon className="w-5 h-5" /> Zona Peligrosa</h4>
                <div className="mt-4">
                     <p className="text-sm text-red-700 dark:text-red-300 mb-2">Limpia el almacenamiento local del navegador. Útil si la aplicación no funciona correctamente. Se cerrará tu sesión.</p>
                     <button onClick={handleClearCache} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                        Limpiar Caché del Navegador
                    </button>
                </div>
            </div>
        </div>
    );
};


const ConfiguracionesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("empresa");

  const TabButton: React.FC<{
    tabId: string;
    label: string;
    Icon: React.ElementType;
  }> = ({ tabId, label, Icon }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tabId
          ? "bg-clinical-blue text-white"
          : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Configuraciones del Sistema
      </h2>
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg shadow-sm dark:bg-gray-800">
        <TabButton tabId="empresa" label="Empresa" Icon={BuildingIcon} />
        <TabButton tabId="pagina_bienvenida" label="Página de Bienvenida" Icon={LayoutTemplateIcon} />
        <TabButton tabId="ia_servicios" label="IA y Servicios" Icon={SparklesIcon} />
        <TabButton tabId="whatsapp" label="WhatsApp" Icon={WhatsAppIcon} />
        <TabButton tabId="desarrollador" label="Modo Desarrollador" Icon={CodeIcon} />
      </div>

      {activeTab === "empresa" && <EmpresaConfig />}
      {activeTab === "pagina_bienvenida" && <PaginaBienvenidaConfig />}
      {activeTab === "ia_servicios" && <IAConfig />}
      {activeTab === "whatsapp" && <WhatsAppConfig />}
      {activeTab === "desarrollador" && <DeveloperConfig />}
    </div>
  );
};

export default ConfiguracionesPage;