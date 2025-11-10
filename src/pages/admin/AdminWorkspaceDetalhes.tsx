import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, FolderOpen, FileText, Receipt } from "lucide-react";
import { useWorkspaceDetails } from "@/hooks/useWorkspaceDetails";
import { useWorkspacePlan } from "@/hooks/useWorkspacePlan";
import { WorkspaceMembersTab } from "@/components/admin/workspace-details/WorkspaceMembersTab";
import { WorkspaceProjectsTab } from "@/components/admin/workspace-details/WorkspaceProjectsTab";
import { WorkspaceCopiesTab } from "@/components/admin/workspace-details/WorkspaceCopiesTab";
import { WorkspacePlanBillingTab } from "@/components/admin/workspace-details/WorkspacePlanBillingTab";
import { format } from "date-fns";

interface WorkspaceProject {
  id: string;
  name: string;
  brand_name: string | null;
  sector: string | null;
  central_purpose: string | null;
  created_at: string;
  updated_at: string;
  audience_segments: any;
  offers: any;
  voice_tones: string[] | null;
  brand_personality: string[] | null;
  keywords: string[] | null;
}

const AdminWorkspaceDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useWorkspaceDetails(id || '');
  const { data: plan } = useWorkspacePlan(id);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data?.workspace) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Workspace não encontrado</p>
            <Button onClick={() => navigate('/painel/admin/workspaces')} className="mt-4">
              Voltar
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { workspace, members, projects } = data;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/painel/admin/workspaces')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={workspace.avatar_url || ''} />
              <AvatarFallback>
                {workspace.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{workspace.name}</h1>
                {plan && (
                  <Badge variant="secondary">{plan.plan_name}</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Criado em {format(new Date(workspace.created_at), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Membros</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projetos</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plano Atual</p>
                  <p className="text-lg font-semibold">{plan?.plan_name || 'Free'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FolderOpen className="h-4 w-4 mr-2" />
              Projetos
            </TabsTrigger>
            <TabsTrigger value="copies">
              <FileText className="h-4 w-4 mr-2" />
              Copies
            </TabsTrigger>
            <TabsTrigger value="billing">
              <Receipt className="h-4 w-4 mr-2" />
              Plano & Faturas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-6">
            <WorkspaceMembersTab workspaceId={id!} />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <WorkspaceProjectsTab 
              projects={projects as WorkspaceProject[]} 
              isLoading={isLoading}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="copies" className="mt-6">
            <WorkspaceCopiesTab workspaceId={id!} />
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <WorkspacePlanBillingTab workspaceId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminWorkspaceDetalhes;
