import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OSModal from '../OSModal';
import './Layout.css';

const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    // Close sidebar on route change (navigation)
    const location = React.useRef(window.location.pathname);
    React.useEffect(() => {
        if (location.current !== window.location.pathname) {
            closeSidebar();
            location.current = window.location.pathname;
        }
    });

    return (
        <div className="app-container">
            <div 
                className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
                onClick={closeSidebar}
            />
            <Sidebar isOpen={isSidebarOpen} />
            <div className="main-content">
                <Topbar onToggleSidebar={toggleSidebar} />
                <main className="scroll-area gap-6">
                    <Outlet context={{ closeSidebar }} />
                </main>
            </div>
            <OSModal />
        </div>
    );
};

export default MainLayout;
