import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-soft-gray-100 font-sans dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-soft-gray-100 p-6 md:p-8 dark:bg-gray-900">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
