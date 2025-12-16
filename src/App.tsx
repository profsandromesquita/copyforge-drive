import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { ProjectProvider } from "@/hooks/useProject";
import { DriveProvider } from "@/hooks/useDrive";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import Discover from "./pages/Discover";
import CopyEditor from "./pages/CopyEditor";
import MyProject from "./pages/MyProject";
import PublicCopy from "./pages/PublicCopy";
import SuperAdmin from "./pages/SuperAdmin";
import ProjectConfig from "./pages/ProjectConfig";
import SignupInvite from "./pages/SignupInvite";
import AcceptInvite from "./pages/AcceptInvite";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminClienteDetalhes from "./pages/admin/AdminClienteDetalhes";
import AdminCopies from "./pages/admin/AdminCopies";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminWorkspaces from "./pages/admin/AdminWorkspaces";
import AdminWorkspaceDetalhes from "./pages/admin/AdminWorkspaceDetalhes";
import AdminTransactions from "./pages/admin/AdminTransactions";
import Plans from "./pages/Plans";
import Onboarding from "./pages/Onboarding";

// Wrapper para permitir tema apenas no CopyEditor
const CopyEditorWithTheme = () => {
  const { setTheme } = useTheme();
  
  useEffect(() => {
    const editorTheme = localStorage.getItem('editor-theme');
    if (editorTheme) {
      setTheme(editorTheme);
    }
    
    return () => {
      setTheme('light');
    };
  }, [setTheme]);
  
  return <CopyEditor />;
};

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/my-project" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/signup-invite" element={<SignupInvite />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/super-admin" element={<SuperAdmin />} />
      <Route path="/view/:id" element={<PublicCopy />} />
      <Route path="/drive" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/my-project" element={<ProtectedRoute><MyProject /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
      <Route path="/copy/:id" element={<ProtectedRoute><CopyEditorWithTheme /></ProtectedRoute>} />
      <Route path="/project/:id" element={<ProtectedRoute><ProjectConfig /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/painel/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/painel/admin/clientes" element={<AdminRoute><AdminClientes /></AdminRoute>} />
      <Route path="/painel/admin/clientes/:id" element={<AdminRoute><AdminClienteDetalhes /></AdminRoute>} />
      <Route path="/painel/admin/copies" element={<AdminRoute><AdminCopies /></AdminRoute>} />
      <Route path="/painel/admin/workspaces" element={<AdminRoute><AdminWorkspaces /></AdminRoute>} />
      <Route path="/painel/admin/workspaces/:id" element={<AdminRoute><AdminWorkspaceDetalhes /></AdminRoute>} />
      <Route path="/painel/admin/transacoes" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
      <Route path="/painel/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/planos" element={<Plans />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <WorkspaceProvider>
              <ProjectProvider>
                <DriveProvider>
                  <AppContent />
                </DriveProvider>
              </ProjectProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
