import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AddFundModal } from '../modals/AddFundModal';

export const DashboardLayout: React.FC = () => {
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9]">
      <Navbar onOpenAddFund={() => setIsAddFundOpen(true)} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet context={{ openAddFund: () => setIsAddFundOpen(true) }} />
        </main>
      </div>

      {isAddFundOpen && <AddFundModal isOpen={isAddFundOpen} onClose={() => setIsAddFundOpen(false)} />}
    </div>
  );
};
