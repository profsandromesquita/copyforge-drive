import { House, CaretRight } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { useDrive } from '@/hooks/useDrive';

export const Breadcrumbs = () => {
  const { breadcrumbs, navigateToFolder } = useDrive();

  return (
    <div className="flex items-center gap-2 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigateToFolder(null)}
        className="gap-2"
      >
        <House size={16} weight="bold" />
        Drive
      </Button>
      
      {breadcrumbs.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          <CaretRight size={16} className="text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToFolder(folder.id)}
            className={index === breadcrumbs.length - 1 ? 'font-semibold' : ''}
          >
            {folder.name}
          </Button>
        </div>
      ))}
    </div>
  );
};