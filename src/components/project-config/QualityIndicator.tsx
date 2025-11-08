import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { useProject } from '@/hooks/useProject';

export const QualityIndicator = () => {
  const { activeProject } = useProject();
  const [quality, setQuality] = useState(0);

  useEffect(() => {
    if (!activeProject) {
      setQuality(0);
      return;
    }

    let totalFields = 0;
    let filledFields = 0;

    // Identity fields (5 fields: brand_name, sector, central_purpose, brand_personality, keywords)
    totalFields += 5;
    if (activeProject.brand_name) filledFields++;
    if (activeProject.sector) filledFields++;
    if (activeProject.central_purpose) filledFields++;
    if (activeProject.brand_personality?.length) filledFields++;
    if (activeProject.keywords?.length) filledFields++;

    // Audience segments (count as 1 field if any segment exists, +1 if all required fields filled)
    if (activeProject.audience_segments?.length) {
      totalFields += 2;
      filledFields++;
      const allSegmentsFilled = activeProject.audience_segments.every(seg => 
        seg.avatar && seg.segment && seg.current_situation && seg.desired_result
      );
      if (allSegmentsFilled) filledFields++;
    } else {
      totalFields += 2;
    }

    // Offers (count as 1 field if any offer exists, +1 if all required fields filled)
    if (activeProject.offers?.length) {
      totalFields += 2;
      filledFields++;
      const allOffersFilled = activeProject.offers.every(offer => 
        offer.name && offer.short_description && offer.main_benefit && offer.unique_mechanism && offer.cta
      );
      if (allOffersFilled) filledFields++;
    } else {
      totalFields += 2;
    }

    const percentage = Math.round((filledFields / totalFields) * 100);
    setQuality(percentage);
  }, [activeProject]);

  const getQualityColor = () => {
    if (quality >= 80) return 'bg-green-500';
    if (quality >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getQualityLabel = () => {
    if (quality >= 80) return 'Excelente';
    if (quality >= 50) return 'Bom';
    if (quality >= 25) return 'Regular';
    return 'Incompleto';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Qualidade do Projeto</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{quality}%</span>
          <span className="text-sm text-muted-foreground">({getQualityLabel()})</span>
        </div>
      </div>
      <Progress value={quality} className="h-3" />
      <p className="text-sm text-muted-foreground mt-2">
        Preencha mais informações para melhorar a qualidade do seu projeto
      </p>
    </div>
  );
};
