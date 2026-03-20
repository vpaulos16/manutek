import { Search, Bell, ChevronDown, Menu } from 'lucide-react';

interface TopbarProps {
    onToggleSidebar: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
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

                <div className="user-profile">
                    <div className="avatar">A</div>
                    <div className="user-info">
                        <span className="user-name">Admin</span>
                        <span className="user-role">Gerente</span>
                    </div>
                    <ChevronDown size={16} color="var(--color-text-muted)" />
                </div>
            </div>
        </header>
    );
};

export default Topbar;
