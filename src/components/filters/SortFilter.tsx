import { SortAscending, Heart } from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type SortType = 'popular' | 'recent' | 'most_liked';

interface SortFilterProps {
  selectedSort: SortType;
  onSortChange: (sort: SortType) => void;
}

export const SortFilter = ({ selectedSort, onSortChange }: SortFilterProps) => {
  const getLabel = () => {
    switch (selectedSort) {
      case 'popular':
        return 'Populares';
      case 'most_liked':
        return 'Mais Curtidas';
      case 'recent':
      default:
        return 'Recentes';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 bg-background">
          <SortAscending size={16} weight="bold" />
          {getLabel()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40 bg-background">
        <DropdownMenuItem
          onClick={() => onSortChange('popular')}
          className={selectedSort === 'popular' ? 'bg-accent' : ''}
        >
          Populares
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSortChange('most_liked')}
          className={selectedSort === 'most_liked' ? 'bg-accent' : ''}
        >
          <Heart size={16} className="mr-2" />
          Mais Curtidas
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSortChange('recent')}
          className={selectedSort === 'recent' ? 'bg-accent' : ''}
        >
          Recentes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
