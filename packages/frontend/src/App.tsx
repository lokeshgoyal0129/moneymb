import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { PassbookPage } from './pages/PassbookPage';
import { DisputesPage } from './pages/DisputesPage';
import { SettlementBankPage } from './pages/SettlementBankPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { DmtPage } from './pages/DmtPage';
import { AepsPage } from './pages/AepsPage';
import { SummaryPage } from './pages/SummaryPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="dmt" element={<DmtPage />} />
          <Route path="aeps" element={<AepsPage />} />
          <Route path="summary" element={<SummaryPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="cms-transactions" element={<TransactionsPage />} />
          <Route path="travel" element={<DashboardPage />} />
          <Route path="qr-orders" element={<TransactionsPage />} />
          <Route path="refund-pending" element={<DisputesPage />} />
          <Route path="fund-request" element={<DashboardPage />} />
          <Route path="passbook" element={<PassbookPage />} />
          <Route path="gateway-orders" element={<TransactionsPage />} />
          <Route path="complaint" element={<DisputesPage />} />
          <Route path="settlement-bank" element={<SettlementBankPage />} />
          <Route path="settings" element={<SettlementBankPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;
