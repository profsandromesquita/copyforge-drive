import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, FileText } from 'lucide-react';

interface TextDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

type ReadingSpeed = 'slow' | 'normal' | 'fast';

const READING_SPEEDS = {
  slow: { label: 'Lento', wpm: 150 },
  normal: { label: 'Normal', wpm: 200 },
  fast: { label: 'Rápida', wpm: 300 },
};

export const TextDetailsModal = ({ isOpen, onClose, content }: TextDetailsModalProps) => {
  const [readingSpeed, setReadingSpeed] = useState<ReadingSpeed>('normal');

  // Remove HTML tags and count words
  const wordCount = useMemo(() => {
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return textContent.length > 0 ? textContent.split(' ').length : 0;
  }, [content]);

  // Calculate reading time based on speed
  const readingTime = useMemo(() => {
    const wpm = READING_SPEEDS[readingSpeed].wpm;
    const minutes = Math.ceil(wordCount / wpm);
    return minutes;
  }, [wordCount, readingSpeed]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Texto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Word Count Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade de palavras</p>
                  <p className="text-2xl font-bold">{wordCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reading Speed Selector */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Velocidade de Leitura</Label>
            <RadioGroup value={readingSpeed} onValueChange={(value) => setReadingSpeed(value as ReadingSpeed)}>
              {Object.entries(READING_SPEEDS).map(([key, { label, wpm }]) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="cursor-pointer font-normal">
                    {label} <span className="text-muted-foreground">({wpm} palavras/min)</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Reading Time Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo médio de leitura</p>
                  <p className="text-2xl font-bold text-primary">
                    {readingTime} {readingTime === 1 ? 'minuto' : 'minutos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
