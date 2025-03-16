
import React, { useState, useEffect } from 'react';
import { useAccelerometer } from '@/hooks/useAccelerometer';
import AccelerometerDisplay from '@/components/AccelerometerDisplay';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const Index = () => {
  const { toast } = useToast();
  const {
    isAvailable,
    isRunning, 
    error,
    data: accelerometerData,
    toggleAccelerometer,
    resetAccelerometer
  } = useAccelerometer();
  
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);
  
  // Handle errors and permissions
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
    
    // Request permission for DeviceMotion on iOS
    const requestPermission = async () => {
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          setPermissionGranted(permission === 'granted');
          
          if (permission !== 'granted') {
            toast({
              title: "Permission Denied",
              description: "Accelerometer access is required for this app to function correctly.",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error('Error requesting motion permission:', err);
          setPermissionGranted(false);
          toast({
            title: "Permission Error",
            description: "Could not request accelerometer permission.",
            variant: "destructive",
          });
        }
      }
    };
    
    requestPermission();
  }, [error, toast]);

  // Check if the device/browser supports accelerometer
  if (!isAvailable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="max-w-md p-8 rounded-2xl glass-morphism">
          <h1 className="text-2xl font-bold mb-4">Device Not Supported</h1>
          <p className="text-muted-foreground mb-6">
            Your device or browser doesn't support accelerometer access. 
            Please try on a mobile device with a compatible browser.
          </p>
          <p className="text-sm text-muted-foreground">
            For testing purposes, you can still use the app, but data will be simulated.
          </p>
        </div>
      </div>
    );
  }

  // Handle permission denied scenario
  if (!permissionGranted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="max-w-md p-8 rounded-2xl glass-morphism">
          <h1 className="text-2xl font-bold mb-4">Permission Required</h1>
          <p className="text-muted-foreground mb-6">
            This app needs access to your device's motion and orientation data.
            Please enable it in your device settings and reload the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-6",
      "transition-colors duration-500 ease-in-out",
      isRunning ? "bg-background" : "bg-background"
    )}>
      <div className="w-full max-w-xl mx-auto">
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Accelerometer Tracker</h1>
          <p className="text-muted-foreground">
            Measure and track your device's acceleration
          </p>
        </header>
        
        <AccelerometerDisplay
          averageAcceleration={accelerometerData.averageAcceleration}
          isRunning={isRunning}
          onToggle={toggleAccelerometer}
          className="mb-12"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-scale-in">
          <div className="p-4 rounded-xl bg-secondary/50 shadow-sm backdrop-blur-sm">
            <div className="text-sm font-medium text-muted-foreground">X-axis</div>
            <div className="text-2xl font-semibold">{accelerometerData.x.toFixed(2)}</div>
          </div>
          
          <div className="p-4 rounded-xl bg-secondary/50 shadow-sm backdrop-blur-sm">
            <div className="text-sm font-medium text-muted-foreground">Y-axis</div>
            <div className="text-2xl font-semibold">{accelerometerData.y.toFixed(2)}</div>
          </div>
          
          <div className="p-4 rounded-xl bg-secondary/50 shadow-sm backdrop-blur-sm">
            <div className="text-sm font-medium text-muted-foreground">Z-axis</div>
            <div className="text-2xl font-semibold">{accelerometerData.z.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-in">
          <p>
            Elapsed time: <span className="font-medium">{accelerometerData.elapsedTime.toFixed(1)}s</span> | 
            Accumulated: <span className="font-medium">{accelerometerData.accumulatedAcceleration.toFixed(2)}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
