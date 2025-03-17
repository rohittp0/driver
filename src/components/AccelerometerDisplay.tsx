
import React from 'react';
import { Play, Pause } from 'lucide-react';
import {cn} from '@/lib/utils';
import CircularProgress from './CircularProgress';
import { Button } from '@/components/ui/button';

interface AccelerometerDisplayProps {
  score: number;
  elapsedTime: number;
  isRunning: boolean;
  onToggle: () => void;
  className?: string;
}

const AccelerometerDisplay = ({
  score,
  elapsedTime,
  isRunning,
  onToggle,
  className,
}: AccelerometerDisplayProps) => {
  // Format the acceleration value for display
  const formattedScore = score.toFixed(0);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-8", className)}>
      <div className="flex flex-col items-center animate-fade-in">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Driver Score
        </div>
        <div className="text-3xl font-bold tracking-tight">
          {formattedScore}<span className="text-lg font-normal text-muted-foreground">%</span>
        </div>
      </div>

      <div className="relative">
        <CircularProgress
          value={score}
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
            ? <p>Driving time: <span className="font-medium">{elapsedTime.toFixed(1)}s</span></p>
            : "Tap the button to start measuring your driving smoothness."}
        </p>
      </div>
    </div>
  );
};

export default AccelerometerDisplay;
