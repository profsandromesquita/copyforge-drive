import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'phosphor-react';

export const ProfileHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="border-b border-border bg-background sticky top-0 z-10">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          title="Voltar ao Dashboard"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
      </div>
    </div>
  );
};
