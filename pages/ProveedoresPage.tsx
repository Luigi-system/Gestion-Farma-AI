import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import DataTable from '../components/DataTable';
import { Proveedor } from '../types';
import { useAuth } from '../components/Auth';

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ProveedoresPage: React.FC = () => {
    const { sede, empresa } = useAuth();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProveedor, setCurrentProveedor] = useState<Partial<Proveedor> | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProveedores = useCallback(async () => {
        if (!sede || !empresa) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('proveedores')
            .select('*')
            .eq('sede_id', sede.id)
            .eq('empresa_id', empresa.id)
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error fetching suppliers:', error);
            setError(`Error al cargar proveedores: ${error.message}.`);
        } else {
            setProveedores((data as Proveedor[]) || []);
            setError(null);
        }
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores]);

    const openModalForNew = () => {
        setCurrentProveedor({
            nombre: '', ruc: '', nombre_contacto: '', cel1: '', cel2: '', direccion: '', email: ''
        });
        setIsModalOpen(true);
    };

    const openModalForEdit = (proveedor: Proveedor) => {
        setCurrentProveedor(proveedor);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProveedor(null);
    };

    const openConfirmModal = (proveedor: Proveedor) => {
        setProveedorToDelete(proveedor);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setProveedorToDelete(null);
    };

    const handleDelete = async () => {
        if (!proveedorToDelete) return;
        const { error } = await supabase.from('proveedores').delete().eq('id', proveedorToDelete.id);
        closeConfirmModal();
        if (error) {
            alert(`Error al eliminar el proveedor: ${error.message}`);
        } else {
            fetchProveedores();
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProveedor || !sede || !empresa) return;

        const { id, created_at, ...proveedorData } = currentProveedor;

        Object.keys(proveedorData).forEach(key => {
            const field = key as keyof typeof proveedorData;
            if (proveedorData[field] === '') {
                (proveedorData as any)[field] = null;
            }
        });
        
        const dataWithTenant = {
            ...proveedorData,
            sede_id: sede.id,
            empresa_id: empresa.id,
        };

        let response;
        if (id) {
            response = await supabase.from('proveedores').update(dataWithTenant).eq('id', id);
        } else {
            response = await supabase.from('proveedores').insert([dataWithTenant]);
        }

        if (response.error) {
            alert(`Error al guardar el proveedor: ${response.error.message}`);
        } else {
            closeModal();
            fetchProveedores();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentProveedor(prev => ({ ...prev, [name]: value }));
    };
    
    const filteredProveedores = useMemo(() => {
        return proveedores.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.ruc?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, proveedores]);

    const columns = [
        { header: 'Nombre', accessor: 'nombre' as keyof Proveedor },
        { header: 'RUC', accessor: 'ruc' as keyof Proveedor },
        { header: 'Contacto', accessor: 'nombre_contacto' as keyof Proveedor },
        { header: 'Celular', accessor: 'cel1' as keyof Proveedor },
        { header: 'Email', accessor: 'email' as keyof Proveedor },
        {
            header: 'Acciones',
            accessor: 'id' as keyof Proveedor,
            render: (item: Proveedor) => (
                <div className="flex items-center space-x-2">
                    <button onClick={() => openModalForEdit(item)} className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => openConfirmModal(item)} className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                </div>
            )
        }
    ];
    
    if (loading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>;
    if (error) return <div className="text-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-300 p-4 rounded-lg">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Gestión de Proveedores</h2>
                <button onClick={openModalForNew} className="px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors">
                    Añadir Proveedor
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <input
                    type="text"
                    placeholder="Buscar por nombre o RUC..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-clinical-blue focus:border-clinical-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <DataTable<Proveedor>
                title="Listado de Proveedores"
                columns={columns}
                data={filteredProveedores}
            />

            {isModalOpen && currentProveedor && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-6 dark:text-gray-100">{currentProveedor.id ? 'Editar Proveedor' : 'Añadir Proveedor'}</h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Nombre o Razón Social</label>
                                    <input type="text" name="nombre" id="nombre" value={currentProveedor.nombre || ''} onChange={handleInputChange} required className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="ruc" className="block text-sm font-medium text-gray-900 dark:text-gray-300">RUC</label>
                                    <input type="text" name="ruc" id="ruc" value={currentProveedor.ruc || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="nombre_contacto" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Nombre de Contacto</label>
                                <input type="text" name="nombre_contacto" id="nombre_contacto" value={currentProveedor.nombre_contacto || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="cel1" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Celular 1</label>
                                    <input type="tel" name="cel1" id="cel1" value={currentProveedor.cel1 || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="cel2" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Celular 2</label>
                                    <input type="tel" name="cel2" id="cel2" value={currentProveedor.cel2 || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="direccion" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Dirección</label>
                                <input type="text" name="direccion" id="direccion" value={currentProveedor.direccion || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Email</label>
                                <input type="email" name="email" id="email" value={currentProveedor.email || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                            </div>
                            
                            <style>{`
                                .input-style {
                                    @apply bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-400 dark:placeholder-gray-500;
                                }
                            `}</style>
                            <div className="flex justify-end pt-4 space-x-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isConfirmModalOpen && proveedorToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl sm:my-8 sm:max-w-lg sm:w-full sm:p-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangleIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Confirmar Eliminación</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        ¿Estás seguro de que quieres eliminar a <strong>{proveedorToDelete.nombre}</strong>? Esta acción no se puede deshacer.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button type="button" onClick={handleDelete} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">
                                Eliminar
                            </button>
                            <button type="button" onClick={closeConfirmModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto sm:text-sm">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProveedoresPage;