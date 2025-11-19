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
import Documents from './pages/Documents';
import DocumentCreate from './pages/DocumentCreate';
import DocumentView from './pages/DocumentView';
import Settings from './pages/Settings';
import QuotesPage from './pages/quotes/QuotesPage';
import QuoteEditor from './pages/quotes/QuoteEditor';

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <PrivateRoute>
                <Companies />
              </PrivateRoute>
            }
          />
          <Route
            path="/companies/setup"
            element={
              <PrivateRoute>
                <CompanySetup />
              </PrivateRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <Clients />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <PrivateRoute>
                <Documents />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents/create"
            element={
              <PrivateRoute>
                <DocumentCreate />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <PrivateRoute>
                <DocumentView />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/quotes"
            element={
              <PrivateRoute>
                <QuotesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/quotes/new"
            element={
              <PrivateRoute>
                <QuoteEditor />
              </PrivateRoute>
            }
          />
          <Route
            path="/quotes/:id"
            element={
              <PrivateRoute>
                <QuoteEditor />
              </PrivateRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

