interface DropIndicatorProps {
  isVisible: boolean;
}

export const DropIndicator = ({ isVisible }: DropIndicatorProps) => {
  if (!isVisible) return null;

  return (
    <div className="h-1 bg-primary rounded-full my-2 animate-pulse shadow-lg shadow-primary/50" />
  );
};
