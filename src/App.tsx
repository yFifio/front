import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";

import { AuthProvider } from "./hooks/useAuth";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import MyDownloads from "./pages/MyDownloads";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

import ProductFormPage from "./pages/admin/ProductFormPage";
import OperationsListPage from "./pages/admin/OperationsListPage";
import OperationFormPage from "./pages/admin/OperationFormPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" enableSystem>
        <AuthProvider>
          <Router>
            <Toaster />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/my-downloads" element={<MyDownloads />} />
              <Route path="/profile" element={<Profile />} />
              
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products/new" element={<ProductFormPage />} />
              <Route path="/admin/products/edit/:id" element={<ProductFormPage />} />
              <Route path="/admin/operations/:resource" element={<OperationsListPage />} />
              <Route path="/admin/operations/:resource/new" element={<OperationFormPage />} />
              <Route path="/admin/operations/:resource/edit/:id" element={<OperationFormPage />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}