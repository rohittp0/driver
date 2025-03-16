import React, { useState, useEffect } from 'react';
import { useAccelerometer } from '@/hooks/useAccelerometer';
import AccelerometerDisplay from '@/components/AccelerometerDisplay';
import SaveScoreDialog from '@/components/SaveScoreDialog';
import AuthDialog from '@/components/AuthDialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import Menu from '@/components/Menu';

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
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [timeThresholdMet, setTimeThresholdMet] = useState<boolean>(false);
  
  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data.user);
    };
    
    checkUser();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      
      if (event === 'SIGNED_IN') {
        toast({
          title: "Signed In",
          description: "You have successfully signed in.",
        });
        
        // If user was trying to save a score, reopen save dialog
        if (showAuthDialog) {
          setShowAuthDialog(false);
          setShowSaveDialog(true);
        }
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed Out",
          description: "You have signed out.",
        });
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [showAuthDialog, toast]);
  
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
              description: "Accelerometer access is required for this game to function correctly.",
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

  // Check for time threshold (30 seconds)
  useEffect(() => {
    if (isRunning && accelerometerData.elapsedTime >= 30) {
      setTimeThresholdMet(true);
    } else {
      setTimeThresholdMet(false);
    }
  }, [isRunning, accelerometerData.elapsedTime]);

  // Handle toggling the accelerometer
  const handleToggle = () => {
    // If stopping and time threshold met, show save dialog
    if (isRunning && timeThresholdMet) {
      toggleAccelerometer();
      setShowSaveDialog(true);
    } else {
      // If starting, reset accelerometer
      if (!isRunning) {
        resetAccelerometer();
      }
      toggleAccelerometer();
    }
  };

  // Handle save dialog close
  const handleSaveDialogClose = () => {
    setShowSaveDialog(false);
  };

  // Handle auth dialog
  const handleLoginRequired = () => {
    setShowSaveDialog(false);
    setShowAuthDialog(true);
  };
  
  const handleAuthClose = () => {
    setShowAuthDialog(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    setShowSaveDialog(true);
  };
  
  // Handle login
  const handleLoginClick = () => {
    setShowAuthDialog(true);
  };

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
            This game needs access to your device's motion data to measure your driving smoothness.
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
        <header className="text-center mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold tracking-tight">Smooth Driver Challenge</h1>
            <Menu 
              isAuthenticated={isAuthenticated}
              onLoginClick={handleLoginClick} 
            />
          </div>
          <p className="text-muted-foreground">
            Drive smoothly to achieve the highest score
          </p>
        </header>
        
        <AccelerometerDisplay
          averageAcceleration={accelerometerData.averageAcceleration}
          isRunning={isRunning}
          onToggle={handleToggle}
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
            Driving time: <span className="font-medium">{accelerometerData.elapsedTime.toFixed(1)}s</span>
            {timeThresholdMet && !isRunning && " (Eligible to save score)"}
          </p>
          {isAuthenticated && (
            <p className="mt-2 text-green-500">
              You're signed in and ready to save scores
            </p>
          )}
        </div>
      </div>

      {/* Save Score Dialog */}
      <SaveScoreDialog 
        isOpen={showSaveDialog} 
        onClose={handleSaveDialogClose}
        score={accelerometerData.averageAcceleration}
        elapsedTime={accelerometerData.elapsedTime}
        onLoginRequired={handleLoginRequired}
      />
      
      {/* Auth Dialog */}
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;

