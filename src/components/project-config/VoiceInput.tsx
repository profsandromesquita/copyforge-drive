import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Microphone, MicrophoneSlash } from 'phosphor-react';
import { toast } from 'sonner';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceInput = ({ onTranscript }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        return;
      }

      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';

      recognitionInstance.onresult = (event: any) => {
        // Pegar apenas o último resultado (mais recente)
        const lastResultIndex = event.results.length - 1;
        const lastResult = event.results[lastResultIndex];
        
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript;
          onTranscript(transcript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Permissão de microfone negada');
        } else {
          toast.error('Erro ao reconhecer voz');
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.info('Fale agora...');
    }
  };

  if (!recognition) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute bottom-2 right-2 h-8 w-8"
      onClick={toggleListening}
    >
      {isListening ? (
        <MicrophoneSlash size={20} className="text-destructive animate-pulse" />
      ) : (
        <Microphone size={20} className="text-muted-foreground hover:text-foreground" />
      )}
    </Button>
  );
};
