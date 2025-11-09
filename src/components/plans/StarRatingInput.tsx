import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  error?: string;
}

export const StarRatingInput = ({ value, onChange, error }: StarRatingInputProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const currentRating = hoverRating || value;
  
  return (
    <div className="space-y-2">
      <div 
        className="flex items-center gap-2"
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            onMouseEnter={() => setHoverRating(rating)}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label={`Avaliar ${rating} estrela${rating > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                rating <= currentRating
                  ? "fill-yellow-500 text-yellow-500"
                  : "fill-muted text-muted hover:text-yellow-400"
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            {value} {value === 1 ? 'estrela' : 'estrelas'}
          </span>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
