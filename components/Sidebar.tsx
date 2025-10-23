import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    HomeIcon, CashRegisterIcon, PackageIcon, BrainCircuitIcon, PillIcon,
    ShieldCheckIcon, TrendingUpIcon, ChevronRightIcon
} from './icons';

// Define the structure for nested items
interface NavItem {
    path?: string;
    label: string;
    icon?: React.FC<{ className?: string }>;
    children?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
  { path: '/app/dashboard', label: 'Home', icon: HomeIcon },
  {
    label: 'Operaciones',
    icon: CashRegisterIcon,
    children: [
      { path: '/app/caja', label: 'Caja' },
      { path: '/app/ventas', label: 'Ventas' },
      { path: '/app/gastos', label: 'Gastos' },
    ],
  },
  {
    label: 'Inventario',
    icon: PackageIcon,
    children: [
      { path: '/app/almacen', label: 'Almacén' },
      { path: '/app/inventario', label: 'Inventario' },
      { path: '/app/kardex', label: 'Kardex' },
    ],
  },
  {
    label: 'Comercial',
    icon: TrendingUpIcon,
    children: [
      { path: '/app/clientes', label: 'Clientes' },
      { path: '/app/pedidos', label: 'Pedidos Clientes' },
      { path: '/app/proveedores', label: 'Proveedores' },
      { path: '/app/promociones', label: 'Promociones' },
      { path: '/app/comisiones', label: 'Comisiones' },
    ],
  },
  {
    label: 'Administración',
    icon: ShieldCheckIcon,
    children: [
      { path: '/app/usuarios', label: 'Usuarios' },
      { path: '/app/sedes', label: 'Sedes' },
      { path: '/app/configuraciones', label: 'Configuraciones' },
      { path: '/app/administracion', label: 'Administración' },
      { path: '/app/registros', label: 'Registros' },
    ],
  },
   {
    label: 'Herramientas IA',
    icon: BrainCircuitIcon,
    children: [
        { path: '/app/consultas-ia', label: 'Consultas IA' },
    ],
  },
];


const Sidebar: React.FC = () => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const activeParent = navItems.find(item => 
      item.children?.some(child => location.pathname.startsWith(child.path))
    );
    setOpenMenu(activeParent?.label || null);
  }, [location.pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenu(openMenu === label ? null : label);
  };
  
  const isParentActive = (item: NavItem) => {
      return item.children?.some(child => location.pathname.startsWith(child.path));
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-soft-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-center h-20 border-b border-soft-gray-200 dark:border-gray-700">
        <PillIcon className="h-8 w-8 text-clinical-blue" />
        <h1 className="ml-2 text-2xl font-bold text-gray-800 dark:text-gray-100">Gestion<span className="text-clinical-blue">Farma</span></h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              // It's a parent menu item
              if (item.children) {
                const Icon = item.icon!;
                const isOpen = openMenu === item.label;
                const isActive = isParentActive(item);

                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-gray-600 transition-colors duration-200 transform rounded-lg dark:text-gray-300 ${isActive ? 'bg-clinical-blue/10 dark:bg-clinical-blue/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-clinical-blue' : ''}`} />
                        <span className={`mx-4 font-medium ${isActive ? 'text-clinical-blue' : ''}`}>{item.label}</span>
                      </div>
                      <ChevronRightIcon className={`h-5 w-5 transform transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}
                    >
                      <ul className="pl-8 pt-2 space-y-2">
                        {item.children.map(child => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              className={({ isActive }) => 
                                `block px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                  isActive 
                                    ? 'bg-clinical-blue text-white' 
                                    : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                                }`
                              }
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }
              
              // It's a standalone link
              const Icon = item.icon!;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path!}
                    className={({ isActive }) => 
                       `flex items-center px-4 py-3 text-gray-600 transition-colors duration-200 transform rounded-lg dark:text-gray-300 ${
                            isActive 
                            ? 'bg-clinical-blue/10 text-clinical-blue dark:bg-clinical-blue/20' 
                            : 'hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                        }`
                    }
                    end
                  >
                    <Icon className="h-5 w-5" />
                    <span className="mx-4 font-medium">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
