import { AdminLayout } from "@/components/admin/AdminLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { User, FolderOpen, FileText } from "phosphor-react";

interface ClienteData {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
  copies_count: number;
}

interface Copy {
  id: string;
  title: string;
  copy_type: string;
  status: string;
  created_at: string;
  workspace_name: string;
}

export default function AdminClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeSection, setActiveSection] = useState('informacoes');

  useEffect(() => {
    const fetchClienteData = async () => {
      if (!id) return;

      try {
        // Buscar perfil do cliente
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError || !profile) {
          setNotFound(true);
          return;
        }

        setCliente(profile);

        // Buscar workspaces do cliente
        const { data: workspaceMemberships } = await supabase
          .from('workspace_members')
          .select(`
            role,
            workspace:workspaces (
              id,
              name
            )
          `)
          .eq('user_id', id);

        // Para cada workspace, buscar contagem de copies
        const workspacesWithCounts = await Promise.all(
          (workspaceMemberships || []).map(async (membership: any) => {
            const { count } = await supabase
              .from('copies')
              .select('id', { count: 'exact', head: true })
              .eq('created_by', id)
              .eq('workspace_id', membership.workspace.id);

            return {
              id: membership.workspace.id,
              name: membership.workspace.name,
              role: membership.role,
              copies_count: count || 0,
            };
          })
        );

        setWorkspaces(workspacesWithCounts);

        // Buscar copies do cliente
        const { data: copiesData } = await supabase
          .from('copies')
          .select(`
            id,
            title,
            copy_type,
            status,
            created_at,
            workspace:workspaces (
              name
            )
          `)
          .eq('created_by', id)
          .order('created_at', { ascending: false });

        setCopies(
          (copiesData || []).map((copy: any) => ({
            id: copy.id,
            title: copy.title,
            copy_type: copy.copy_type,
            status: copy.status,
            created_at: copy.created_at,
            workspace_name: copy.workspace?.name || 'N/A',
          }))
        );
      } catch (error) {
        console.error('Error fetching cliente data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClienteData();
  }, [id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-100px 0px -60% 0px' }
    );

    const sections = ['informacoes', 'workspaces', 'copies'];
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [loading]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  if (notFound) {
    return <Navigate to="/painel/admin/clientes" replace />;
  }

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'editor':
        return 'Editor';
      default:
        return role;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <AdminLayout>
      <div className="flex min-h-full">
        {/* Sidebar do Cliente */}
        <aside className="w-80 border-r bg-background p-6 space-y-6">
          {loading ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="text-center space-y-2">
                  <Skeleton className="h-6 w-32 mx-auto" />
                  <Skeleton className="h-4 w-40 mx-auto" />
                </div>
              </div>
            </>
          ) : cliente ? (
            <>
              <div className="flex flex-col items-center gap-4 pb-6 border-b">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={cliente.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getUserInitials(cliente.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-bold">{cliente.name}</h2>
                  <p className="text-sm text-muted-foreground">{cliente.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => scrollToSection('informacoes')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    activeSection === 'informacoes'
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <User size={20} />
                  <span>Informações</span>
                </button>
                <button
                  onClick={() => scrollToSection('workspaces')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    activeSection === 'workspaces'
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <FolderOpen size={20} />
                  <span>Workspaces</span>
                </button>
                <button
                  onClick={() => scrollToSection('copies')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    activeSection === 'copies'
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <FileText size={20} />
                  <span>Copies</span>
                </button>
              </nav>
            </>
          ) : null}
        </aside>

        {/* Conteúdo Principal */}
        <div className="flex-1 p-6 space-y-6">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : cliente ? (
            <>
              <div id="informacoes" className="scroll-mt-6">
                <h1 className="text-3xl font-bold">Informações do Cliente</h1>
                <p className="text-muted-foreground">Dados e estatísticas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Workspaces
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workspaces.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Copies Criadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{copies.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Membro desde
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {format(new Date(cliente.created_at), "MMM yyyy", { locale: ptBR })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card id="workspaces" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle>Workspaces</CardTitle>
                </CardHeader>
                <CardContent>
                  {workspaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum workspace encontrado
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead className="text-right">Copies</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workspaces.map((workspace) => (
                          <TableRow key={workspace.id}>
                            <TableCell className="font-medium">{workspace.name}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(workspace.role)}>
                                {getRoleLabel(workspace.role)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{workspace.copies_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card id="copies" className="scroll-mt-6">
                <CardHeader>
                  <CardTitle>Copies Criadas</CardTitle>
                </CardHeader>
                <CardContent>
                  {copies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma copy encontrada
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Workspace</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {copies.map((copy) => (
                          <TableRow key={copy.id}>
                            <TableCell className="font-medium">{copy.title}</TableCell>
                            <TableCell>{copy.workspace_name}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(copy.status)}>
                                {copy.status === 'published' ? 'Publicado' : 'Rascunho'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(copy.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  );
};
