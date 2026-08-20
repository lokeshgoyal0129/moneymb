import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AddFundModal } from '../modals/AddFundModal';

export const DashboardLayout: React.FC = () => {
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9] overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        onOpenAddFund={() => setIsAddFundOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex flex-1 relative">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            onClick={closeSidebar}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* Sidebar (Drawer on mobile/tablet, Fixed column on desktop) */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Main Content Viewport */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto max-w-[1600px] w-full mx-auto min-w-0">
          <Outlet context={{ openAddFund: () => setIsAddFundOpen(true) }} />
        </main>
      </div>

      {/* Add Fund Modal */}
      {isAddFundOpen && <AddFundModal isOpen={isAddFundOpen} onClose={() => setIsAddFundOpen(false)} />}
    </div>
  );
};

export default DashboardLayout;
