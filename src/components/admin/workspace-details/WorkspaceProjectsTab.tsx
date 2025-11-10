import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Project {
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

interface WorkspaceProjectsTabProps {
  projects: Project[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const WorkspaceProjectsTab = ({ projects, isLoading, onRefresh }: WorkspaceProjectsTabProps) => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete);

      if (error) throw error;

      toast.success('Projeto deletado com sucesso');
      setProjectToDelete(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erro ao deletar projeto');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum projeto encontrado neste workspace</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Projeto</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Segments</TableHead>
              <TableHead>Ofertas</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const segmentsCount = Array.isArray(project.audience_segments) 
                ? project.audience_segments.length 
                : 0;
              const offersCount = Array.isArray(project.offers) 
                ? project.offers.length 
                : 0;

              return (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.brand_name || '-'}</TableCell>
                  <TableCell>{project.sector || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{segmentsCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{offersCount}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(project.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProject(project)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/project-config/${project.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProjectToDelete(project.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Project Details Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Informações Gerais</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Marca:</span>{' '}
                      {selectedProject.brand_name || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Setor:</span>{' '}
                      {selectedProject.sector || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criado em:</span>{' '}
                      {format(new Date(selectedProject.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Atualizado em:</span>{' '}
                      {format(new Date(selectedProject.updated_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </div>

              {selectedProject.central_purpose && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Propósito Central</h4>
                  <p className="text-sm text-muted-foreground">{selectedProject.central_purpose}</p>
                </div>
              )}

              {selectedProject.voice_tones && selectedProject.voice_tones.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Tons de Voz</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.voice_tones.map((tone, idx) => (
                      <Badge key={idx} variant="secondary">{tone}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedProject.brand_personality && selectedProject.brand_personality.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Personalidade da Marca</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.brand_personality.map((trait, idx) => (
                      <Badge key={idx} variant="secondary">{trait}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedProject.keywords && selectedProject.keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Palavras-chave</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedProject.audience_segments) && selectedProject.audience_segments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Segmentos de Audiência ({selectedProject.audience_segments.length})</h4>
                  <div className="space-y-2">
                    {selectedProject.audience_segments.map((segment: any, idx: number) => (
                      <Card key={idx} className="p-3">
                        <p className="font-medium">{segment.name || `Segmento ${idx + 1}`}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedProject.offers) && selectedProject.offers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Ofertas ({selectedProject.offers.length})</h4>
                  <div className="space-y-2">
                    {selectedProject.offers.map((offer: any, idx: number) => (
                      <Card key={idx} className="p-3">
                        <p className="font-medium">{offer.name || `Oferta ${idx + 1}`}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este projeto? Todas as copies associadas também serão deletadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
