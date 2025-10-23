import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Gasto, GastoCategoria } from '../types';
import DataTable from '../components/DataTable';
import { FileTextIcon, DollarSignIcon, PlusCircleIcon, EditIcon, TrashIcon } from '../components/icons';
import { useAuth } from '../components/Auth';

const GastosPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'listado' | 'categorias'>('listado');
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <FileTextIcon className="h-8 w-8 text-gray-700 dark:text-gray-200" />
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Gestión de Gastos</h2>
                    <p className="text-gray-600 dark:text-gray-400">Registra y categoriza todas las salidas de dinero para un mejor control financiero.</p>
                </div>
            </div>
                <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                    <TabButton tabId="listado" label="Listado de Gastos" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tabId="categorias" label="Gestionar Categorías" activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

            {activeTab === 'listado' && <ListadoGastosView />}
            {activeTab === 'categorias' && <GestionCategoriasView />}
        </div>
    );
};

const TabButton: React.FC<{ tabId: string; label: string; activeTab: string; setActiveTab: (tabId: any) => void; }> = ({ tabId, label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tabId
                ? 'bg-clinical-blue text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
    >
        {label}
    </button>
);

// --- VISTA DE LISTADO DE GASTOS ---
const ListadoGastosView: React.FC = () => {
    const { sede, empresa, profile } = useAuth();
    const [gastos, setGastos] = useState<(Gasto & { gastos_categorias: { nombre: string } | null, usuarios: { usuario: string } | null })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGasto, setCurrentGasto] = useState<Partial<Gasto> | null>(null);

    const fetchGastos = useCallback(async () => {
        if (!sede || !empresa) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('gastos')
            .select('*, gastos_categorias(nombre), usuarios(nombres, apellidos)')
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .order('fecha', { ascending: false });

        if (error) {
            setError(`Error al cargar gastos: ${error.message}`);
        } else {
            setGastos((data as any) || []);
        }
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => {
        fetchGastos();
    }, [fetchGastos]);

    const openModalForNew = () => {
        setCurrentGasto({ fecha: new Date().toISOString().split('T')[0], monto: undefined, descripcion: '', categoria_id: undefined });
        setIsModalOpen(true);
    };

    const totalGastos = useMemo(() => gastos.reduce((sum, g) => sum + g.monto, 0), [gastos]);

    const columns = [
        { header: 'Fecha', accessor: 'fecha' as keyof Gasto, render: (item: Gasto) => new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-PE') },
        { header: 'Descripción', accessor: 'descripcion' as keyof Gasto },
        { header: 'Categoría', accessor: 'gastos_categorias' as keyof Gasto, render: (item: any) => item.gastos_categorias?.nombre || 'Sin categoría' },
        { header: 'Monto', accessor: 'monto' as keyof Gasto, render: (item: Gasto) => <span className="font-semibold text-red-600 dark:text-red-400">S/ {item.monto.toFixed(2)}</span> },
        { header: 'Usuario', accessor: 'usuarios' as keyof Gasto, render: (item: any) => item.usuarios ? `${item.usuarios.nombres} ${item.usuarios.apellidos}` : profile?.nombres },
        { header: 'Acciones', accessor: 'id' as keyof Gasto, render: (item: Gasto) => (
            <div className="flex space-x-2">
                <button onClick={() => { setCurrentGasto(item); setIsModalOpen(true); }}><EditIcon className="w-5 h-5 text-blue-500" /></button>
            </div>
        )},
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm flex items-center col-span-1 md:col-span-3">
                    <div className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50"><DollarSignIcon /></div>
                    <div className="ml-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total de Gastos Registrados</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">S/ {totalGastos.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Historial de Gastos</h3>
                    <button onClick={openModalForNew} className="flex items-center gap-2 px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600">
                        <PlusCircleIcon className="w-5 h-5"/> Registrar Gasto
                    </button>
                </div>
                {loading ? <div className="text-center py-10">Cargando...</div> : error ? <div className="text-red-500">{error}</div> : <DataTable data={gastos} columns={columns} title="" />}
            </div>
            {isModalOpen && <GastoModal gasto={currentGasto} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchGastos(); }} />}
        </div>
    );
};

// --- VISTA PARA GESTIONAR CATEGORÍAS ---
const GestionCategoriasView: React.FC = () => {
    const { sede, empresa } = useAuth();
    const [categorias, setCategorias] = useState<GastoCategoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategoria, setCurrentCategoria] = useState<Partial<GastoCategoria> | null>(null);

    const fetchCategorias = useCallback(async () => {
        if (!sede || !empresa) return;
        setLoading(true);
        const { data, error } = await supabase.from('gastos_categorias').select('*').eq('sede_id', sede.id).eq('empresa_id', empresa.id).order('nombre');
        if (error) setError(`Error al cargar categorías: ${error.message}`);
        else setCategorias(data || []);
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

    const openModalForNew = () => {
        setCurrentCategoria({ nombre: '', descripcion: '' });
        setIsModalOpen(true);
    };

    const columns = [
        { header: 'Nombre', accessor: 'nombre' as keyof GastoCategoria },
        { header: 'Descripción', accessor: 'descripcion' as keyof GastoCategoria },
        { header: 'Acciones', accessor: 'id' as keyof GastoCategoria, render: (item: GastoCategoria) => (
            <div className="flex space-x-2"><button onClick={() => { setCurrentCategoria(item); setIsModalOpen(true); }}><EditIcon className="w-5 h-5 text-blue-500" /></button></div>
        )},
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Categorías de Gastos</h3>
                <button onClick={openModalForNew} className="flex items-center gap-2 px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600">
                    <PlusCircleIcon className="w-5 h-5"/> Crear Categoría
                </button>
            </div>
            {loading ? <div className="text-center py-10">Cargando...</div> : error ? <div className="text-red-500">{error}</div> : <DataTable data={categorias} columns={columns} title="" />}
            {isModalOpen && <CategoriaGastoModal categoria={currentCategoria} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchCategorias(); }} />}
        </div>
    );
};

// --- MODAL PARA GASTOS ---
const GastoModal: React.FC<{ gasto: Partial<Gasto> | null; onClose: () => void; onSave: () => void; }> = ({ gasto, onClose, onSave }) => {
    const { sede, empresa, profile } = useAuth();
    const [currentGasto, setCurrentGasto] = useState(gasto);
    const [categorias, setCategorias] = useState<GastoCategoria[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchCategorias = async () => {
            if (!sede || !empresa) return;
            const { data } = await supabase.from('gastos_categorias').select('*').eq('sede_id', sede.id).eq('empresa_id', empresa.id);
            setCategorias(data || []);
        };
        fetchCategorias();
    }, [sede, empresa]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setCurrentGasto(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentGasto?.categoria_id) { alert("Selecciona una categoría."); return; }
        if (!profile || !sede || !empresa) { alert("No se pudo identificar la sesión del usuario."); return; }
        setIsSaving(true);
        
        const { id, ...dataToSave } = currentGasto;
        
        const finalData = { ...dataToSave, usuario_id: profile.id, sede_id: sede.id, empresa_id: empresa.id };

        const { error } = id 
            ? await supabase.from('gastos').update(finalData).eq('id', id)
            : await supabase.from('gastos').insert([finalData]);
        
        if (error) {
            alert(`Error al guardar el gasto: ${error.message}`);
        } else {
            onSave();
        }
        setIsSaving(false);
    };
    
    const inputStyle = "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">{currentGasto?.id ? 'Editar' : 'Registrar'} Gasto</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Fecha</label>
                            <input type="date" name="fecha" value={currentGasto?.fecha} onChange={handleInputChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Monto (S/)</label>
                            <input type="number" step="0.01" name="monto" value={currentGasto?.monto || ''} onChange={handleInputChange} required className={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Categoría</label>
                        <select name="categoria_id" value={currentGasto?.categoria_id || ''} onChange={handleInputChange} required className={inputStyle}>
                            <option value="" disabled>Seleccionar...</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descripción</label>
                        <textarea name="descripcion" value={currentGasto?.descripcion} onChange={handleInputChange} required rows={3} className={inputStyle}></textarea>
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600 disabled:bg-green-300">{isSaving ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MODAL PARA CATEGORÍAS DE GASTOS ---
const CategoriaGastoModal: React.FC<{ categoria: Partial<GastoCategoria> | null; onClose: () => void; onSave: () => void; }> = ({ categoria, onClose, onSave }) => {
    const { sede, empresa } = useAuth();
    const [currentCategoria, setCurrentCategoria] = useState(categoria);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentCategoria(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sede || !empresa) { alert("No se pudo identificar la sesión."); return; }
        setIsSaving(true);

        const { id, ...dataToSave } = currentCategoria!;
        const dataWithTenant = { ...dataToSave, sede_id: sede.id, empresa_id: empresa.id };

        const { error } = id 
            ? await supabase.from('gastos_categorias').update(dataWithTenant).eq('id', id)
            : await supabase.from('gastos_categorias').insert([dataWithTenant]);
        
        if (error) {
            alert(`Error al guardar la categoría: ${error.message}`);
        } else {
            onSave();
        }
        setIsSaving(false);
    };

    const inputStyle = "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">{currentCategoria?.id ? 'Editar' : 'Crear'} Categoría</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre</label>
                        <input type="text" name="nombre" value={currentCategoria?.nombre || ''} onChange={handleInputChange} required className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                        <textarea name="descripcion" value={currentCategoria?.descripcion || ''} onChange={handleInputChange} rows={3} className={inputStyle}></textarea>
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600 disabled:bg-green-300">{isSaving ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default GastosPage;