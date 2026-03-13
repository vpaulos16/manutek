import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

const Topbar: React.FC = () => {
    return (
        <header className="topbar">
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
