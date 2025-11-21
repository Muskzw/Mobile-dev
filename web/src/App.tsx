import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanySetup from './pages/CompanySetup';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Settings from './pages/Settings';
import QuotesPage from './pages/quotes/QuotesPage';
import QuoteEditor from './pages/quotes/QuoteEditor';
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceEditor from './pages/invoices/InvoiceEditor';
import ProformaPage from './pages/proforma/ProformaPage';
import ProformaEditor from './pages/proforma/ProformaEditor';
import DeliveryNotesPage from './pages/delivery-notes/DeliveryNotesPage';
import DeliveryNoteEditor from './pages/delivery-notes/DeliveryNoteEditor';
import ReceiptsPage from './pages/receipts/ReceiptsPage';
import ReceiptEditor from './pages/receipts/ReceiptEditor';
import SubscriptionPage from './pages/SubscriptionPage';

// Components
import { TrialBanner } from './components/TrialBanner';
import { ThemeToggle } from './components/ThemeToggle';

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <TrialBanner />
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/companies" element={
              <PrivateRoute>
                <Companies />
              </PrivateRoute>
            } />
            <Route path="/companies/setup" element={
              <PrivateRoute>
                <CompanySetup />
              </PrivateRoute>
            } />
            <Route path="/clients" element={
              <PrivateRoute>
                <Clients />
              </PrivateRoute>
            } />
            <Route path="/products" element={
              <PrivateRoute>
                <Products />
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } />

            {/* Quotes */}
            <Route path="/quotes" element={
              <PrivateRoute>
                <QuotesPage />
              </PrivateRoute>
            } />
            <Route path="/quotes/new" element={
              <PrivateRoute>
                <QuoteEditor />
              </PrivateRoute>
            } />
            <Route path="/quotes/:id" element={
              <PrivateRoute>
                <QuoteEditor />
              </PrivateRoute>
            } />

            {/* Invoices */}
            <Route path="/invoices" element={
              <PrivateRoute>
                <InvoicesPage />
              </PrivateRoute>
            } />
            <Route path="/invoices/new" element={
              <PrivateRoute>
                <InvoiceEditor />
              </PrivateRoute>
            } />
            <Route path="/invoices/:id" element={
              <PrivateRoute>
                <InvoiceEditor />
              </PrivateRoute>
            } />

            {/* Proforma */}
            <Route path="/proforma" element={
              <PrivateRoute>
                <ProformaPage />
              </PrivateRoute>
            } />
            <Route path="/proforma/new" element={
              <PrivateRoute>
                <ProformaEditor />
              </PrivateRoute>
            } />
            <Route path="/proforma/:id" element={
              <PrivateRoute>
                <ProformaEditor />
              </PrivateRoute>
            } />

            {/* Delivery Notes */}
            <Route path="/delivery-notes" element={
              <PrivateRoute>
                <DeliveryNotesPage />
              </PrivateRoute>
            } />
            <Route path="/delivery-notes/new" element={
              <PrivateRoute>
                <DeliveryNoteEditor />
              </PrivateRoute>
            } />
            <Route path="/delivery-notes/:id" element={
              <PrivateRoute>
                <DeliveryNoteEditor />
              </PrivateRoute>
            } />

            {/* Receipts */}
            <Route path="/receipts" element={
              <PrivateRoute>
                <ReceiptsPage />
              </PrivateRoute>
            } />
            <Route path="/receipts/new" element={
              <PrivateRoute>
                <ReceiptEditor />
              </PrivateRoute>
            } />
            <Route path="/receipts/:id" element={
              <PrivateRoute>
                <ReceiptEditor />
              </PrivateRoute>
            } />

            {/* Subscription */}
            <Route path="/subscription" element={
              <PrivateRoute>
                <SubscriptionPage />
              </PrivateRoute>
            } />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
