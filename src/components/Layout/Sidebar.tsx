import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Wrench,
    ClipboardList,
    ShoppingCart,
    ShieldCheck,
    Settings,
    LineChart,
    MessageCircle,
    UserCheck
} from 'lucide-react';
import WhatsappStatus from '../WhatsappStatus';

interface SidebarProps {
    isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Mensagens', path: '/mensagens', icon: <MessageCircle size={20} /> },
        { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
        { name: 'Produtos', path: '/produtos', icon: <Wrench size={20} /> },
        { name: 'Técnicos', path: '/tecnicos', icon: <UserCheck size={20} /> },
        { name: 'Ordens de Serviço', path: '/os', icon: <ClipboardList size={20} /> },
        { name: 'Ponto de Venda', path: '/pdv', icon: <ShoppingCart size={20} /> },
        { name: 'Financeiro', path: '/financeiro', icon: <LineChart size={20} /> },
        { name: 'Garantias', path: '/garantias', icon: <ShieldCheck size={20} /> },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <Wrench className="logo-icon" size={24} />
                    <h2>ServiTrak</h2>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <WhatsappStatus />
                <NavLink
                    to="/configuracoes"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Settings size={20} />
                    <span>Configurações</span>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
