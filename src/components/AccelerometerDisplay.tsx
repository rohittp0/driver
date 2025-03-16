
import React from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import CircularProgress from './CircularProgress';
import { Button } from '@/components/ui/button';

interface AccelerometerDisplayProps {
  averageAcceleration: number;
  isRunning: boolean;
  onToggle: () => void;
  className?: string;
  maxAcceleration?: number;
}

const AccelerometerDisplay = ({
  averageAcceleration,
  isRunning,
  onToggle,
  className,
  maxAcceleration = 20 // Max value for the progress bar
}: AccelerometerDisplayProps) => {
  // Calculate score based on proximity to 9.8 (gravity)
  // 9.8 is 100% score, deviations reduce the score linearly
  const perfectScore = 9.8;
  const calculatedScore = Math.max(0, 100 - (Math.abs(averageAcceleration - perfectScore) / perfectScore) * 100);
  
  // Format the acceleration value for display
  const formattedAcceleration = averageAcceleration.toFixed(2);
  const formattedScore = calculatedScore.toFixed(0);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-8", className)}>
      <div className="flex flex-col items-center animate-fade-in">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Driver Score
        </div>
        <div className="text-3xl font-bold tracking-tight">
          {formattedScore}<span className="text-lg font-normal text-muted-foreground">%</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Avg. Acceleration: {formattedAcceleration} <span>m/s²</span>
        </div>
      </div>
      
      <div className="relative">
        <CircularProgress 
          value={calculatedScore} 
          size={300}
          strokeWidth={12}
          color="stroke-primary"
          backgroundColor="stroke-secondary/30"
          animate={true}
          className="transition-all duration-300"
        >
          <Button
            onClick={onToggle}
            variant="outline"
            size="icon"
            className={cn(
              "h-24 w-24 rounded-full shadow-md transition-all duration-300 bg-background",
              isRunning ? "bg-destructive/10 hover:bg-destructive/20" : "bg-primary/10 hover:bg-primary/20"
            )}
          >
            {isRunning ? (
              <Pause className="h-12 w-12 text-destructive" />
            ) : (
              <Play className="h-12 w-12 text-primary ml-1" />
            )}
            
            {/* Pulse animation when active */}
            {isRunning && (
              <span className="absolute inset-0 rounded-full animate-pulse-ring bg-destructive opacity-20"></span>
            )}
          </Button>
        </CircularProgress>
      </div>
      
      <div className="text-center animate-slide-up">
        <p className="text-sm text-muted-foreground max-w-md">
          {isRunning 
            ? "Driving in progress. Stay smooth to get a better score!" 
            : "Tap the button to start measuring your driving smoothness."}
        </p>
      </div>
    </div>
  );
};

export default AccelerometerDisplay;
