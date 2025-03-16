
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  backgroundColor?: string;
  animate?: boolean;
  max?: number;
}

const CircularProgress = ({
  value,
  size = 200,
  strokeWidth = 10,
  className,
  children,
  color = 'stroke-primary',
  backgroundColor = 'stroke-secondary',
  animate = true,
  max = 100
}: CircularProgressProps) => {
  const circleRef = useRef<SVGCircleElement>(null);
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate stroke dash based on value
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const strokeDashoffset = circumference - (normalizedValue / max) * circumference;
  
  // Update the progress indicator with animation
  useEffect(() => {
    if (circleRef.current && animate) {
      circleRef.current.style.strokeDashoffset = strokeDashoffset.toString();
    }
  }, [strokeDashoffset, animate]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("opacity-20", backgroundColor)}
        />
        
        {/* Progress indicator */}
        <circle
          ref={circleRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : strokeDashoffset}
          className={cn("progress-indicator", color)}
          style={!animate ? { strokeDashoffset } : undefined}
        />
      </svg>
      
      {/* Content inside the circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
