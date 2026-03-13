import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import WhatsAppSimulator from '../../components/WhatsAppSimulator';
import OSModal from '../OSModal';
import './Layout.css';

const MainLayout: React.FC = () => {
    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                <Topbar />
                <main className="scroll-area gap-6">
                    <Outlet />
                </main>
            </div>
            <WhatsAppSimulator />
            <OSModal />
        </div>
    );
};

export default MainLayout;
