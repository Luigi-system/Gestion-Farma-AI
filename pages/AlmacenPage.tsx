import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Product, Categoria, Sede, Empresa } from '../types';
import DataTable from '../components/DataTable';
import { EditIcon, TrashIcon, SearchIcon, PlusCircleIcon, ChevronRightIcon, FolderIcon } from '../components/icons';
import { useAuth } from '../components/Auth';

type CategoryNodeData = Categoria & { children: CategoryNodeData[] };

// --- CATEGORY MANAGEMENT COMPONENTS (for Categorías Tab) ---
interface CategoryNodeProps {
    category: CategoryNodeData;
    level: number;
    onAddSubcategory: (parentId: number) => void;
    onEdit: (category: Categoria) => void;
    onDelete: (category: Categoria) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({ category, level, onAddSubcategory, onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = category.children.length > 0;

    return (
        <div>
            <div
                className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 group"
                style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
            >
                <div className="flex items-center flex-grow cursor-pointer" onClick={() => hasChildren && setIsOpen(!isOpen)}>
                    {hasChildren ? (
                        <ChevronRightIcon className={`w-4 h-4 text-gray-500 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    ) : (
                        <span className="w-4 h-4"></span> // Spacer
                    )}
                    <FolderIcon className="w-5 h-5 text-yellow-500 mx-2" />
                    <span className="text-gray-800 dark:text-gray-200">{category.nombre}</span>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onAddSubcategory(category.id)} title="Añadir subcategoría" className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50"><PlusCircleIcon className="w-4 h-4 text-green-500" /></button>
                    <button onClick={() => onEdit(category)} title="Editar" className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><EditIcon className="w-4 h-4 text-blue-500" /></button>
                    <button onClick={() => onDelete(category)} title="Eliminar" className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div>
                    {category.children.map(child => (
                        <CategoryNode key={child.id} category={child} level={level + 1} onAddSubcategory={onAddSubcategory} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

const CategoriaModal: React.FC<{ categoria: Partial<Categoria> | null; onClose: () => void; onSave: () => void; sede: Sede | null; empresa: Empresa | null; }> = ({ categoria, onClose, onSave, sede, empresa }) => {
    const [currentCategoria, setCurrentCategoria] = useState(categoria);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentCategoria(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCategoria || !currentCategoria.nombre) return;
        if (!sede || !empresa) {
            alert("No se ha podido identificar la sede o empresa. Por favor, reinicie la sesión.");
            return;
        }
        setIsSaving(true);

        const { id, ...dataToSave } = currentCategoria;
        const finalData = { ...dataToSave, sede_id: sede.id, empresa_id: empresa.id };

        const { error } = id 
            ? await supabase.from('categorias').update(finalData).eq('id', id)
            : await supabase.from('categorias').insert([finalData]);
        
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{currentCategoria?.parent_id ? 'Creando una subcategoría.' : 'Creando una categoría principal.'}</p>
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

const GestionCategoriasView: React.FC<{ sede: Sede | null; empresa: Empresa | null }> = ({ sede, empresa }) => {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategoria, setCurrentCategoria] = useState<Partial<Categoria> | null>(null);

    const fetchCategorias = useCallback(async () => {
        if (!sede || !empresa) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase.from('categorias').select('*').eq('sede_id', sede.id).eq('empresa_id', empresa.id).order('nombre');
        if (error) setError(`Error al cargar categorías: ${error.message}`);
        else setCategorias(data || []);
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

    const categoryTree = useMemo((): CategoryNodeData[] => {
        const map = new Map<number, CategoryNodeData>();
        const roots: CategoryNodeData[] = [];

        categorias.forEach(cat => {
            map.set(cat.id, { ...cat, children: [] });
        });

        categorias.forEach(cat => {
            if (cat.parent_id && map.has(cat.parent_id)) {
                map.get(cat.parent_id)!.children.push(map.get(cat.id)!);
            } else {
                roots.push(map.get(cat.id)!);
            }
        });
        return roots;
    }, [categorias]);

    const handleAddRootCategory = () => {
        setCurrentCategoria({ nombre: '', descripcion: '', parent_id: null });
        setIsModalOpen(true);
    };
    
    const handleAddSubcategory = (parentId: number) => {
        setCurrentCategoria({ nombre: '', descripcion: '', parent_id: parentId });
        setIsModalOpen(true);
    };

    const handleEdit = (category: Categoria) => {
        setCurrentCategoria(category);
        setIsModalOpen(true);
    };
    
    const handleDelete = async (category: Categoria) => {
        const hasChildren = categorias.some(c => c.parent_id === category.id);
        const confirmationMessage = hasChildren
            ? `¿Estás seguro de que quieres eliminar "${category.nombre}"? Sus subcategorías se convertirán en categorías principales.`
            : `¿Estás seguro de que quieres eliminar "${category.nombre}"?`;

        if (window.confirm(confirmationMessage)) {
            const { error } = await supabase.from('categorias').delete().eq('id', category.id);
            if (error) {
                alert(`Error al eliminar: ${error.message}`);
            } else {
                fetchCategorias();
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Categorías de Productos</h3>
                <button onClick={handleAddRootCategory} className="flex items-center gap-2 px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600">
                    <PlusCircleIcon className="w-5 h-5"/> Crear Categoría Principal
                </button>
            </div>
            {loading ? <div className="text-center py-10">Cargando...</div> : error ? <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/40 rounded-md">{error}</div> : (
                <div className="border rounded-lg dark:border-gray-700 p-2">
                    {categoryTree.length > 0 ? categoryTree.map(cat => (
                        <CategoryNode key={cat.id} category={cat} level={0} onAddSubcategory={handleAddSubcategory} onEdit={handleEdit} onDelete={handleDelete} />
                    )) : (
                        <p className="text-center text-gray-500 py-8">No hay categorías. ¡Crea la primera!</p>
                    )}
                </div>
            )}
            {isModalOpen && <CategoriaModal categoria={currentCategoria} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchCategorias(); }} sede={sede} empresa={empresa} />}
        </div>
    );
};

// --- PRODUCT MANAGEMENT COMPONENTS (for Productos Tab) ---
const ProductosView: React.FC<{ sede: Sede | null; empresa: Empresa | null; }> = ({ sede, empresa }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        if (!sede || !empresa) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        const [productsRes, categoriesRes] = await Promise.all([
            supabase.from('productos').select('*').eq('sede_id', sede.id).eq('empresa_id', empresa.id).order('nombre'),
            supabase.from('categorias').select('*').eq('sede_id', sede.id).eq('empresa_id', empresa.id)
        ]);

        if (productsRes.error) {
            setError(`Error al cargar productos: ${productsRes.error.message}`);
        } else {
            setProducts(productsRes.data || []);
        }

        if (categoriesRes.error) {
            setError(prev => `${prev ? prev + ' ' : ''}Error al cargar categorías: ${categoriesRes.error.message}`);
        } else {
            setCategories(categoriesRes.data || []);
        }
        
        setLoading(false);
    }, [sede, empresa]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getCategoryPath = useCallback((categoryName?: string | null): string => {
        if (!categoryName) return 'Sin categoría';
        if (categories.length === 0) return categoryName;

        const findPath = (catId: number, cats: Categoria[]): string[] => {
            const cat = cats.find(c => c.id === catId);
            if (!cat) return [];
            if (cat.parent_id) {
                return [...findPath(cat.parent_id, cats), cat.nombre];
            }
            return [cat.nombre];
        };

        const selectedCat = categories.find(c => c.nombre === categoryName);
        if (!selectedCat) return categoryName; // Fallback to just the name

        return findPath(selectedCat.id, categories).join(' / ');
    }, [categories]);
    
    const filteredProducts = useMemo(() => {
        return products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);
    
    const columns = [
        { header: 'Nombre', accessor: 'nombre' as keyof Product },
        { header: 'Categoría', accessor: 'categoria' as keyof Product, render: (item: Product) => getCategoryPath(item.categoria) },
        { header: 'Stock', accessor: 'stock_unid' as keyof Product },
        { header: 'P. Venta', accessor: 'unid_pv' as keyof Product, render: (item: Product) => item.unid_pv ? `S/ ${item.unid_pv.toFixed(2)}` : '-' },
        {
            header: 'Acciones', accessor: 'id' as keyof Product, render: (item: Product) => (
                <div className="flex space-x-2">
                    <button onClick={() => { setCurrentProduct(item); setIsModalOpen(true); }}><EditIcon className="w-5 h-5 text-blue-500"/></button>
                    <button onClick={() => handleDelete(item.id)}><TrashIcon className="w-5 h-5 text-red-500"/></button>
                </div>
            )
        }
    ];

    const handleDelete = async (id: number) => {
        if(window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            const { error } = await supabase.from('productos').delete().eq('id', id);
            if (error) alert(`Error al eliminar: ${error.message}`);
            else fetchData();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
                <div className="relative w-1/3">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                </div>
                <button onClick={() => { setCurrentProduct(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-clinical-blue text-white rounded-lg hover:bg-blue-600">
                    <PlusCircleIcon className="w-5 h-5"/> Añadir Producto
                </button>
            </div>
            {loading ? <div className="text-center py-10">Cargando productos...</div> : error ? <div className="text-red-500 p-4 bg-red-100 rounded-md dark:bg-red-900/40 dark:text-red-300">{error}</div> : <DataTable data={filteredProducts} columns={columns} title="" />}
            {isModalOpen && <ProductoModal product={currentProduct} categories={categories} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchData(); }} sede={sede} empresa={empresa}/>}
        </div>
    );
};

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex justify-between items-center p-3 text-left font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
        >
            <span>{title}</span>
            <ChevronRightIcon className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg">
                {children}
            </div>
        </div>
    </div>
);


const ProductoModal: React.FC<{ product: Partial<Product> | null; categories: Categoria[]; onClose: () => void; onSave: () => void; sede: Sede | null; empresa: Empresa | null; }> = ({ product, categories, onClose, onSave, sede, empresa }) => {
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>(product || { activo: true });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(product?.imagen || null);
    const [isSaving, setIsSaving] = useState(false);
    const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>('basic');
    const categoryButtonRef = useRef<HTMLButtonElement>(null);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setCurrentProduct(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setCurrentProduct(prev => ({ ...prev, [name]: value === '' ? null : parseFloat(value) }));
        } else {
            setCurrentProduct(prev => ({ ...prev, [name]: value === '' ? null : value }));
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setCurrentProduct(prev => ({ ...prev, imagen: null }));
    }

    const handleSelectCategory = (categoryId: number) => {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
            setCurrentProduct(prev => ({...prev, categoria: category.nombre }));
        }
        setIsCategorySelectorOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sede || !empresa) {
            alert("No se ha podido identificar la sede o empresa. Por favor, reinicie la sesión.");
            return;
        }
        setIsSaving(true);
        const { id, ...productData } = currentProduct as any;

        const dataToSave = { ...productData, sede_id: sede.id, empresa_id: empresa.id };
        
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError, data: uploadData } = await supabase.storage.from('avatars').upload(`public/${fileName}`, imageFile);

            if (uploadError) {
                alert(`Error subiendo imagen: ${uploadError.message}`);
                setIsSaving(false);
                return;
            }
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
            dataToSave.imagen = urlData.publicUrl;
        } else if (imagePreview === null) {
            dataToSave.imagen = null;
        }

        const { error } = id
            ? await supabase.from('productos').update(dataToSave).eq('id', id)
            : await supabase.from('productos').insert([dataToSave]);

        if(error) alert(`Error: ${error.message}`);
        else onSave();
        setIsSaving(false);
    };
    
    const getCategoryPath = (categoryName?: string | null): string => {
        if (!categoryName) return 'Seleccionar categoría';
        const findPath = (catId: number, cats: Categoria[]): string[] => {
            const cat = cats.find(c => c.id === catId);
            if (!cat) return [];
            if (cat.parent_id) return [...findPath(cat.parent_id, cats), cat.nombre];
            return [cat.nombre];
        };
        const selectedCat = categories.find(c => c.nombre === categoryName);
        if (!selectedCat) return categoryName;
        return findPath(selectedCat.id, categories).join(' / ');
    };

    const inputStyle = "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5";
    const toggleSection = (section: string) => setOpenSection(openSection === section ? null : section);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <h3 className="text-xl font-bold mb-4 flex-shrink-0">{product?.id ? 'Editar' : 'Nuevo'} Producto</h3>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-3">
                    <AccordionSection title="Información Básica" isOpen={openSection === 'basic'} onToggle={() => toggleSection('basic')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2"><label className="block text-sm mb-1">Nombre</label><input type="text" name="nombre" value={currentProduct.nombre || ''} onChange={handleInputChange} required className={inputStyle} /></div>
                             <div><label className="block text-sm mb-1">Código de Barras/SKU</label><input type="text" name="codigo" value={currentProduct.codigo || ''} onChange={handleInputChange} className={inputStyle} /></div>
                             <div className="relative">
                                <label className="block text-sm mb-1">Categoría</label>
                                <button ref={categoryButtonRef} type="button" onClick={() => setIsCategorySelectorOpen(!isCategorySelectorOpen)} className={`${inputStyle} text-left flex justify-between items-center`}>
                                    <span className="truncate">{getCategoryPath(currentProduct.categoria)}</span><ChevronRightIcon className="w-4 h-4 text-gray-500 transform rotate-90"/>
                                </button>
                                {isCategorySelectorOpen && <CategorySelectorPopover allCategories={categories} onSelect={handleSelectCategory} onClose={() => setIsCategorySelectorOpen(false)} parentRef={categoryButtonRef} />}
                             </div>
                             <div className="md:col-span-2"><label className="block text-sm mb-1">Laboratorio</label><input type="text" name="laboratorio" value={currentProduct.laboratorio || ''} onChange={handleInputChange} className={inputStyle} /></div>
                        </div>
                    </AccordionSection>
                     <AccordionSection title="Detalles Farmacéuticos" isOpen={openSection === 'pharma'} onToggle={() => toggleSection('pharma')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2"><label className="block text-sm mb-1">Principio Activo</label><input type="text" name="principio_activo" value={currentProduct.principio_activo || ''} onChange={handleInputChange} className={inputStyle} /></div>
                             <div className="md:col-span-2"><label className="block text-sm mb-1">Acción Terapéutica</label><textarea name="accion_terapeutica" value={currentProduct.accion_terapeutica || ''} onChange={handleInputChange} rows={2} className={inputStyle}></textarea></div>
                             <div><label className="block text-sm mb-1">Código DIGEMID</label><input type="text" name="codigo_digemid" value={currentProduct.codigo_digemid || ''} onChange={handleInputChange} className={inputStyle} /></div>
                             <div><label className="block text-sm mb-1">Registro Sanitario</label><input type="text" name="r_sanitario" value={currentProduct.r_sanitario || ''} onChange={handleInputChange} className={inputStyle} /></div>
                        </div>
                    </AccordionSection>
                    <AccordionSection title="Precios y Unidades" isOpen={openSection === 'prices'} onToggle={() => toggleSection('prices')}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2"><label className="block text-sm mb-1">Costo por Unidad (S/)</label><input type="number" step="0.01" name="costo_x_unid" value={currentProduct.costo_x_unid ?? ''} onChange={handleInputChange} className={inputStyle} /></div>
                            <div className="md:col-span-2"><label className="block text-sm mb-1">Precio Venta por Unidad (S/)</label><input type="number" step="0.01" name="unid_pv" value={currentProduct.unid_pv ?? ''} onChange={handleInputChange} className={inputStyle} /></div>
                            <hr className="md:col-span-4 my-2 dark:border-gray-600" />
                            <div className="md:col-span-2"><label className="block text-sm mb-1">Unidades por Blister</label><input type="number" name="blister_u" value={currentProduct.blister_u ?? ''} onChange={handleInputChange} className={inputStyle} /></div>
                            <div className="md:col-span-2"><label className="block text-sm mb-1">Precio Venta Blister (S/)</label><input type="number" step="0.01" name="blister_pv" value={currentProduct.blister_pv ?? ''} onChange={handleInputChange} className={inputStyle} /></div>
                            <div className="md:col-span-2"><label className="block text-sm mb-1">Unidades por Caja</label><input type="number" name="caja_u" value={currentProduct.caja_u ?? ''} onChange={handleInputChange} className={inputStyle} /></div>
                            <div className="md:col-span-2"><label className="block text-sm mb-1">Precio Venta Caja (S/)</label><input type="number" step="0.01" name="caja_pv" value={currentProduct.caja_pv ?? ''} onChange={handleInputChange} className={inputStyle} /></div>
                        </div>
                    </AccordionSection>
                    <AccordionSection title="Inventario y Lote" isOpen={openSection === 'stock'} onToggle={() => toggleSection('stock')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm mb-1">Stock Actual (Unidades)</label><input type="number" name="stock_unid" value={currentProduct.stock_unid ?? ''} onChange={handleInputChange} className={inputStyle} /></div>
                            <div><label className="block text-sm mb-1">Stock Mínimo</label><input type="number" name="stock_min" value={currentProduct.stock_min ?? ''} onChange={handleInputChange} className={inputStyle} /></div>
                            <div><label className="block text-sm mb-1">Lote</label><input type="text" name="lote" value={currentProduct.lote || ''} onChange={handleInputChange} className={inputStyle} /></div>
                            <div><label className="block text-sm mb-1">Fecha de Vencimiento</label><input type="date" name="f_vencimiento" value={currentProduct.f_vencimiento || ''} onChange={handleInputChange} className={inputStyle} /></div>
                        </div>
                    </AccordionSection>
                    <AccordionSection title="Control y Clasificación" isOpen={openSection === 'flags'} onToggle={() => toggleSection('flags')}>
                        <div className="space-y-3">
                            <label className="flex items-center"><input type="checkbox" name="psicotropico" checked={!!currentProduct.psicotropico} onChange={handleInputChange} className="h-4 w-4 rounded mr-2" /> Es Psicotrópico</label>
                            <label className="flex items-center"><input type="checkbox" name="controlado" checked={!!currentProduct.controlado} onChange={handleInputChange} className="h-4 w-4 rounded mr-2" /> Es Controlado</label>
                            <label className="flex items-center"><input type="checkbox" name="is_combo" checked={!!currentProduct.is_combo} onChange={handleInputChange} className="h-4 w-4 rounded mr-2" /> Es un Combo/Kit</label>
                            <label className="flex items-center"><input type="checkbox" name="activo" checked={!!currentProduct.activo} onChange={handleInputChange} className="h-4 w-4 rounded mr-2" /> Producto Activo (visible para venta)</label>
                        </div>
                    </AccordionSection>
                     <AccordionSection title="Imagen del Producto" isOpen={openSection === 'image'} onToggle={() => toggleSection('image')}>
                        <div className="flex items-center gap-6">
                            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
                                {imagePreview ? <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">Sin imagen</span>}
                            </div>
                            <div>
                                <input type="file" id="image-upload" accept="image/*" onChange={handleImageChange} className="hidden" />
                                <label htmlFor="image-upload" className="cursor-pointer px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200">Subir Imagen</label>
                                {imagePreview && <button type="button" onClick={removeImage} className="ml-2 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 rounded-lg">Quitar</button>}
                            </div>
                        </div>
                    </AccordionSection>
                </form>
                <div className="flex justify-end pt-4 space-x-2 mt-auto flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSaving} className="px-4 py-2 bg-pharmacy-green text-white rounded-lg hover:bg-green-600 disabled:bg-green-300">{isSaving ? 'Guardando...' : 'Guardar Producto'}</button>
                </div>
            </div>
        </div>
    );
};

const CategorySelectorPopover: React.FC<{ allCategories: Categoria[], onSelect: (id: number) => void, onClose: () => void, parentRef: React.RefObject<HTMLButtonElement> }> = ({ allCategories, onSelect, onClose, parentRef }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && parentRef.current && !parentRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, parentRef]);

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return allCategories;
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchingIds = new Set<number>();
        
        allCategories.forEach(cat => {
            if (cat.nombre.toLowerCase().includes(lowerSearchTerm)) {
                matchingIds.add(cat.id);
                let current = cat;
                while (current.parent_id) {
                    matchingIds.add(current.parent_id);
                    current = allCategories.find(c => c.id === current.parent_id)!;
                }
            }
        });
        return allCategories.filter(cat => matchingIds.has(cat.id));
    }, [searchTerm, allCategories]);

    const categoryTree = useMemo((): CategoryNodeData[] => {
        const map = new Map<number, CategoryNodeData>();
        const roots: CategoryNodeData[] = [];
        filteredCategories.forEach(cat => map.set(cat.id, { ...cat, children: [] }));
        filteredCategories.forEach(cat => {
            if (cat.parent_id && map.has(cat.parent_id)) map.get(cat.parent_id)!.children.push(map.get(cat.id)!);
            else roots.push(map.get(cat.id)!);
        });
        return roots;
    }, [filteredCategories]);
    
    const SelectionCategoryNode: React.FC<{node: CategoryNodeData, level: number}> = ({ node, level }) => {
        const [isOpen, setIsOpen] = useState(!!searchTerm);
        return (
            <div style={{ paddingLeft: `${level * 1}rem` }}>
                <div className="flex items-center p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50">
                    {node.children.length > 0 ? (
                        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer p-1 -ml-1">
                            <ChevronRightIcon className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-90' : ''}`}/>
                        </div>
                    ) : (
                        <span className="w-6 h-4"></span>
                    )}
                    <div onClick={() => onSelect(node.id)} className="ml-1 cursor-pointer flex-grow">{node.nombre}</div>
                </div>
                {isOpen && node.children.map(child => <SelectionCategoryNode key={child.id} node={child} level={level + 1} />)}
            </div>
        )
    };

    return (
        <div ref={popoverRef} className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg max-h-64 flex flex-col">
            <div className="p-2 border-b dark:border-gray-700">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar categoría..." className="w-full text-sm p-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div className="overflow-y-auto p-2">
                {categoryTree.map(node => <SelectionCategoryNode key={node.id} node={node} level={0}/>)}
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
const AlmacenPage: React.FC = () => {
    const { sede, empresa } = useAuth();
    const [activeTab, setActiveTab] = useState('productos');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Gestión de Almacén</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <button onClick={() => setActiveTab('productos')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'productos' ? 'bg-clinical-blue text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}>Productos</button>
                <button onClick={() => setActiveTab('categorias')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'categorias' ? 'bg-clinical-blue text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}>Categorías</button>
            </div>
            
            {activeTab === 'productos' && <ProductosView sede={sede} empresa={empresa} />}
            {activeTab === 'categorias' && <GestionCategoriasView sede={sede} empresa={empresa} />}
        </div>
    );
};

export default AlmacenPage;
