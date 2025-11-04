import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { ProjectProvider } from "@/hooks/useProject";
import { DriveProvider } from "@/hooks/useDrive";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import Discover from "./pages/Discover";
import CopyEditor from "./pages/CopyEditor";
import PublicCopy from "./pages/PublicCopy";
import SuperAdmin from "./pages/SuperAdmin";
import ProjectConfig from "./pages/ProjectConfig";
import SignupInvite from "./pages/SignupInvite";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            <ProjectProvider>
              <DriveProvider>
                <Routes>
                <Route path="/" element={<Navigate to="/auth" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signup-invite" element={<SignupInvite />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />
                <Route path="/super-admin" element={<SuperAdmin />} />
                <Route path="/view/:id" element={<PublicCopy />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
                <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
                <Route path="/copy/:id" element={<ProtectedRoute><CopyEditor /></ProtectedRoute>} />
                <Route path="/project/:id" element={<ProtectedRoute><ProjectConfig /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </DriveProvider>
            </ProjectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
