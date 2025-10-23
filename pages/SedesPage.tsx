import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import DataTable from '../components/DataTable';
import { Sede } from '../types';
import { BuildingIcon, EditIcon, TrashIcon, AlertTriangleIcon } from '../components/icons';
import { useAuth } from '../components/Auth';

const SedesPage: React.FC = () => {
    const { empresa } = useAuth();
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSede, setCurrentSede] = useState<Partial<Sede> | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [sedeToDelete, setSedeToDelete] = useState<Sede | null>(null);

    const fetchSedes = useCallback(async () => {
        if (!empresa) {
            setError("Usuario no asignado a una empresa. No se pueden cargar las sedes.");
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('sedes')
            .select('*')
            .eq('empresa_id', empresa.id)
            .order('nombre', { ascending: true });

        if (error) {
            setError(`Error al cargar las sedes: ${error.message}. Asegúrate de que la tabla 'sedes' exista y tenga RLS habilitado para lectura.`);
        } else {
            setSedes(data || []);
            setError(null);
        }
        setLoading(false);
    }, [empresa]);

    useEffect(() => {
        fetchSedes();
    }, [fetchSedes]);

    const openModalForNew = () => {
        setCurrentSede({ nombre: '', direccion: '', telefono: '' });
        setIsModalOpen(true);
    };

    const openModalForEdit = (sede: Sede) => {
        setCurrentSede(sede);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentSede(null);
    };

    const openConfirmModal = (sede: Sede) => {
        setSedeToDelete(sede);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setSedeToDelete(null);
    };

    const handleDelete = async () => {
        if (!sedeToDelete) return;
        const { error } = await supabase.from('sedes').delete().eq('id', sedeToDelete.id);
        closeConfirmModal();
        if (error) {
            alert(`Error al eliminar la sede: ${error.message}`);
        } else {
            fetchSedes();
        }
    };

    const columns: { header: string; accessor: keyof Sede; render?: (item: Sede) => React.ReactNode }[] = [
        { header: 'Nombre de la Sede', accessor: 'nombre' },
        { header: 'Dirección', accessor: 'direccion' },
        { header: 'Teléfono', accessor: 'telefono' },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: Sede) => (
                <div className="flex items-center space-x-2">
                    <button onClick={() => openModalForEdit(item)} className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Editar"><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => openConfirmModal(item)} className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>
                </div>
            )
        }
    ];

    if (loading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div></div>;
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <BuildingIcon className="h-8 w-8 text-gray-700 dark:text-gray-200" />
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Gestión de Sedes</h2>
                        <p className="text-gray-600 dark:text-gray-400">Administra las diferentes sucursales o locales de tu farmacia.</p>
                    </div>
                </div>
                <button onClick={openModalForNew} disabled={!empresa} className="px-4 py-2 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Añadir Nueva Sede
                </button>
            </div>

            {error ? (
                 <div className="text-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-300 p-4 rounded-lg">{error}</div>
            ) : (
                <DataTable<Sede>
                    title="Listado de Sedes"
                    columns={columns}
                    data={sedes}
                />
            )}


            {isModalOpen && (
                <SedeModal 
                    sede={currentSede} 
                    empresaId={empresa?.id}
                    onClose={closeModal} 
                    onSave={() => {
                        closeModal();
                        fetchSedes();
                    }} 
                />
            )}

            {isConfirmModalOpen && sedeToDelete && (
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
                                        ¿Estás seguro de que quieres eliminar la sede <strong>{sedeToDelete.nombre}</strong>? Esta acción no se puede deshacer.
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

// --- Modal Component for Sede ---
const SedeModal: React.FC<{ sede: Partial<Sede> | null; empresaId: number | undefined; onClose: () => void; onSave: () => void; }> = ({ sede, empresaId, onClose, onSave }) => {
    const [currentSede, setCurrentSede] = useState(sede);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentSede(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSede || !currentSede.nombre) return;
        if (!empresaId) {
            alert("Error: No se ha podido identificar la empresa actual.");
            return;
        }
        setIsSaving(true);
        
        const { id, created_at, ...sedeData } = currentSede;

        const dataWithEmpresa = { ...sedeData, empresa_id: empresaId };

        const { error } = id
            ? await supabase.from('sedes').update(dataWithEmpresa).eq('id', id)
            : await supabase.from('sedes').insert([dataWithEmpresa]);

        if (error) {
            alert(`Error al guardar la sede: ${error.message}`);
        } else {
            onSave();
        }
        setIsSaving(false);
    };

    const inputStyle = "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-400 dark:placeholder-gray-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg z-50">
                <h3 className="text-xl font-semibold mb-6 dark:text-gray-100">{currentSede?.id ? 'Editar Sede' : 'Añadir Nueva Sede'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Nombre de la Sede</label>
                        <input type="text" name="nombre" id="nombre" value={currentSede?.nombre || ''} onChange={handleInputChange} required className={`mt-1 ${inputStyle}`} />
                    </div>
                    <div>
                        <label htmlFor="direccion" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Dirección</label>
                        <input type="text" name="direccion" id="direccion" value={currentSede?.direccion || ''} onChange={handleInputChange} className={`mt-1 ${inputStyle}`} />
                    </div>
                    <div>
                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Teléfono</label>
                        <input type="tel" name="telefono" id="telefono" value={currentSede?.telefono || ''} onChange={handleInputChange} className={`mt-1 ${inputStyle}`} />
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-pharmacy-green text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-green-300">{isSaving ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SedesPage;