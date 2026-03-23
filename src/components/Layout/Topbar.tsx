import { Search, Bell, Menu, LogOut } from 'lucide-react';
import { useStore } from '../../lib/store';

interface TopbarProps {
    onToggleSidebar: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
    const { user, signOut } = useStore();

    const handleLogout = async () => {
        if (confirm('Deseja realmente sair?')) {
            await signOut();
        }
    };

    return (
        <header className="topbar">
            <button className="menu-toggle" onClick={onToggleSidebar}>
                <Menu size={24} />
            </button>
            
            <div className="search-bar">
                <Search size={18} color="var(--color-text-muted)" />
                <input type="text" placeholder="Buscar por cliente, OS ou placa..." />
            </div>

            <div className="topbar-actions">
                <button className="btn-icon notification-btn">
                    <Bell size={20} />
                    <span className="notification-badge"></span>
                </button>

                <div className="user-profile group relative cursor-pointer" onClick={handleLogout}>
                    <div className="avatar bg-primary text-white">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.email?.split('@')[0] || 'Usuário'}</span>
                        <span className="user-role">Administrador</span>
                    </div>
                    <LogOut size={16} className="text-slate-400 group-hover:text-danger transition-colors ml-2" />
                </div>
            </div>
        </header>
    );
};

export default Topbar;
