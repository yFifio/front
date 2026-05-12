import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { PsychedelicOverlay } from "@/components/PsychedelicOverlay";
import { StarCursor } from "@/components/StarCursor";
import { applyStoreTheme, getStoredStoreTheme } from '@/lib/storeTheme';

import { AuthProvider } from "./hooks/useAuth";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import MyDownloads from "./pages/MyDownloads";
import Profile from "./pages/Profile";
import ColorirLoja from './pages/ColorirLoja';
import NotFound from "./pages/NotFound";

import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import Operations from "./pages/admin/Operations";
import ProductFormPage from "./pages/admin/ProductFormPage";
import OperationsListPage from "./pages/admin/OperationsListPage";
import OperationFormPage from "./pages/admin/OperationFormPage";
import Settings from "./pages/admin/Settings";

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    applyStoreTheme(getStoredStoreTheme());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" enableSystem>
        <AuthProvider>
          <Router>
            <div className="cursor-none">
              <PsychedelicOverlay />
              <StarCursor />
              <Toaster />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/my-downloads" element={<MyDownloads />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/colorir-loja" element={<ColorirLoja />} />
                
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="users" element={<Users />} />
                  <Route path="operations" element={<Operations />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="products/new" element={<ProductFormPage />} />
                  <Route path="products/edit/:id" element={<ProductFormPage />} />
                  <Route path="operations/:resource" element={<OperationsListPage />} />
                  <Route path="operations/:resource/new" element={<OperationFormPage />} />
                  <Route path="operations/:resource/edit/:id" element={<OperationFormPage />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}