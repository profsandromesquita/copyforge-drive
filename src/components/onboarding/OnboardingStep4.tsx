import { useEffect } from "react";
import copyDriveIcon from "@/assets/copydrive-icon.svg";

interface OnboardingStep4Props {
  firstName: string;
  onComplete: () => void;
  onBack: () => void;
}

const OnboardingStep4 = ({ firstName, onComplete, onBack }: OnboardingStep4Props) => {
  useEffect(() => {
    console.log('[OnboardingStep4] Iniciando timer de 3 segundos...');
    const timer = setTimeout(() => {
      console.log('[OnboardingStep4] Timer concluído, chamando onComplete');
      onComplete();
    }, 3000);

    return () => {
      console.log('[OnboardingStep4] Limpando timer');
      clearTimeout(timer);
    };
  }, []); // Array vazio para executar apenas uma vez na montagem
  return (
    <div className="max-w-xl mx-auto text-center animate-fade-in">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <img 
          src={copyDriveIcon} 
          alt="CopyDrive" 
          className="w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8 animate-pulse"
        />
        
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
          Criando Projeto
        </h1>
        
        <div className="flex gap-1.5 mt-6">
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep4;
