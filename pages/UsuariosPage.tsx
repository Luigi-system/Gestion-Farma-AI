import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import DataTable from '../components/DataTable';
import { Usuario, Cargo, Sede } from '../types';
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

const UsuariosPage: React.FC = () => {
    const { empresa } = useAuth();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUsuario, setCurrentUsuario] = useState<Partial<Usuario> | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        if (!empresa) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const [usersResponse, cargosResponse, sedesResponse] = await Promise.all([
            supabase.from('usuarios').select('*').eq('empresa_id', empresa.id).order('nombres', { ascending: true }),
            supabase.from('cargos').select('*').order('nombre', { ascending: true }),
            supabase.from('sedes').select('*').eq('empresa_id', empresa.id).order('nombre', { ascending: true })
        ]);

        if (usersResponse.error) setError(`Error al cargar usuarios: ${usersResponse.error.message}.`);
        else setUsuarios((usersResponse.data as Usuario[]) || []);

        if (cargosResponse.error) setError(prev => (prev ? `${prev} ` : '') + cargosResponse.error.message);
        else setCargos((cargosResponse.data as Cargo[]) || []);
        
        if (sedesResponse.error) setError(prev => (prev ? `${prev} ` : '') + sedesResponse.error.message);
        else setSedes((sedesResponse.data as Sede[]) || []);

        setLoading(false);
    }, [empresa]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModalForNew = () => {
        setCurrentUsuario({
            nombres: '', apellidos: '', dni: '', cel: '', email: '', role_id: cargos[0]?.id, sede_id: sedes[0]?.id
        });
        setIsModalOpen(true);
    };

    const openModalForEdit = (usuario: Usuario) => {
        setCurrentUsuario(usuario);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentUsuario(null);
    };

    const openConfirmModal = (usuario: Usuario) => {
        setUsuarioToDelete(usuario);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setUsuarioToDelete(null);
    };

    const handleDelete = async () => {
        if (!usuarioToDelete) return;
        const { error } = await supabase.from('usuarios').delete().eq('id', usuarioToDelete.id);
        closeConfirmModal();
        if (error) {
            alert(`Error al eliminar el usuario: ${error.message}`);
        } else {
            fetchData();
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUsuario || !empresa) return;
        
        const { id, created_at, sedes, empresas, ...userData } = currentUsuario as (Usuario & { sedes?: any; empresas?: any });
        const dataToSubmit = { ...userData, empresa_id: empresa.id };

        let response;
        if (id) {
            response = await supabase.from('usuarios').update(dataToSubmit).eq('id', id);
        } else {
            // NOTE: This only creates the user profile. The actual user login must be created
            // separately in the Supabase Auth dashboard for security reasons.
            response = await supabase.from('usuarios').insert([dataToSubmit]);
        }

        if (response.error) {
            alert(`Error al guardar el usuario: ${response.error.message}`);
        } else {
            closeModal();
            fetchData();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setCurrentUsuario(prev => ({ 
            ...prev, 
            [name]: type === 'select-one' ? parseInt(value) : value 
        }));
    };
    
    const filteredUsuarios = useMemo(() => {
        return usuarios.filter(u =>
            `${u.nombres} ${u.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, usuarios]);

    const getCargoName = (roleId: number) => cargos.find(r => r.id === roleId)?.nombre || 'Desconocido';

    const columns = [
        { header: 'Nombre Completo', accessor: 'nombres' as keyof Usuario, render: (item: Usuario) => `${item.nombres} ${item.apellidos}` },
        { header: 'Email de Acceso', accessor: 'email' as keyof Usuario },
        { header: 'DNI', accessor: 'dni' as keyof Usuario },
        { header: 'Cargo', accessor: 'role_id' as keyof Usuario, render: (item: Usuario) => getCargoName(item.role_id) },
        {
            header: 'Acciones',
            accessor: 'id' as keyof Usuario,
            render: (item: Usuario) => (
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
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Gestión de Usuarios</h2>
                <button onClick={openModalForNew} className="px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors">
                    Añadir Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <input
                    type="text"
                    placeholder="Buscar por nombre, DNI o email..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-clinical-blue focus:border-clinical-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <DataTable<Usuario>
                title="Listado de Usuarios"
                columns={columns}
                data={filteredUsuarios}
            />

            {isModalOpen && currentUsuario && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-6 dark:text-gray-100">{currentUsuario.id ? 'Editar Usuario' : 'Añadir Usuario'}</h3>
                        <div className="text-sm p-3 mb-4 bg-yellow-100 text-yellow-800 rounded-md dark:bg-yellow-900/50 dark:text-yellow-200">
                            <strong>Nota:</strong> Este formulario gestiona el perfil del usuario. El acceso (login) debe ser creado por un administrador en el panel de Autenticación de Supabase.
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="nombres" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Nombres</label>
                                    <input type="text" name="nombres" id="nombres" value={currentUsuario.nombres || ''} onChange={handleInputChange} required className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="apellidos" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Apellidos</label>
                                    <input type="text" name="apellidos" id="apellidos" value={currentUsuario.apellidos || ''} onChange={handleInputChange} required className="mt-1 block w-full input-style" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="dni" className="block text-sm font-medium text-gray-900 dark:text-gray-300">DNI</label>
                                    <input type="text" name="dni" id="dni" value={currentUsuario.dni || ''} onChange={handleInputChange} required className="mt-1 block w-full input-style" />
                                </div>
                                 <div>
                                    <label htmlFor="cel" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Celular</label>
                                    <input type="tel" name="cel" id="cel" value={currentUsuario.cel || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Email de Acceso</label>
                                <input type="email" name="email" id="email" value={currentUsuario.email || ''} onChange={handleInputChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="role_id" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Cargo</label>
                                    <select name="role_id" id="role_id" value={currentUsuario.role_id || ''} onChange={handleInputChange} required className="mt-1 block w-full input-style">
                                        {cargos.map(cargo => (
                                            <option key={cargo.id} value={cargo.id}>{cargo.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="sede_id" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Sede Asignada</label>
                                    <select name="sede_id" id="sede_id" value={currentUsuario.sede_id || ''} onChange={handleInputChange} required className="mt-1 block w-full input-style">
                                        {sedes.map(sede => (
                                            <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                                        ))}
                                    </select>
                                </div>
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

            {isConfirmModalOpen && usuarioToDelete && (
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
                                        ¿Estás seguro de que quieres eliminar a <strong>{usuarioToDelete.nombres} {usuarioToDelete.apellidos}</strong>?
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

export default UsuariosPage;