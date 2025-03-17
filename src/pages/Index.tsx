import React, { useState, useEffect } from 'react';
import { useAccelerometer } from '@/hooks/useAccelerometer';
import AccelerometerDisplay from '@/components/AccelerometerDisplay';
import SaveScoreDialog from '@/components/SaveScoreDialog';
import AuthDialog from '@/components/AuthDialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import Menu from '@/components/Menu';
import { Card } from '@/components/ui/card';
import { Gauge, Wind, TrendingUp } from 'lucide-react';

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
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const isAuth = !!data.user;
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
          
        setUserProfile(profileData);
      }
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session?.user);
      
      if (event === 'SIGNED_IN') {
        toast({
          title: "Signed In",
          description: "You have successfully signed in.",
        });
        
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setUserProfile(profileData);
        }
        
        if (showAuthDialog) {
          setShowAuthDialog(false);
          setShowSaveDialog(true);
        }
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed Out",
          description: "You have signed out.",
        });
        setUserProfile(null);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [showAuthDialog, toast]);
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
    
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

  useEffect(() => {
    if (isRunning && accelerometerData.elapsedTime >= 30) {
      setTimeThresholdMet(true);
    } else {
      setTimeThresholdMet(false);
    }
  }, [isRunning, accelerometerData.elapsedTime]);

  const handleToggle = () => {
    if (isRunning && timeThresholdMet) {
      toggleAccelerometer();
      setShowSaveDialog(true);
    } else {
      if (!isRunning) {
        resetAccelerometer();
      }
      toggleAccelerometer();
    }
  };

  const handleSaveDialogClose = () => {
    setShowSaveDialog(false);
  };

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
              userProfile={userProfile}
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
          <Card className="p-4 rounded-xl bg-secondary/50 shadow-sm backdrop-blur-sm">
            <div className="flex items-center mb-2">
              <Gauge className="mr-2 h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">Current Speed</div>
            </div>
            <div className="text-2xl font-semibold">{accelerometerData.currentSpeed.toFixed(1)} <span className="text-sm font-normal">km/h</span></div>
          </Card>
          
          <Card className="p-4 rounded-xl bg-secondary/50 shadow-sm backdrop-blur-sm">
            <div className="flex items-center mb-2">
              <TrendingUp className="mr-2 h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">Top Speed</div>
            </div>
            <div className="text-2xl font-semibold">{accelerometerData.topSpeed.toFixed(1)} <span className="text-sm font-normal">km/h</span></div>
          </Card>
          
          <Card className="p-4 rounded-xl bg-secondary/50 shadow-sm backdrop-blur-sm">
            <div className="flex items-center mb-2">
              <Wind className="mr-2 h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">Avg Speed</div>
            </div>
            <div className="text-2xl font-semibold">{accelerometerData.averageSpeed.toFixed(1)} <span className="text-sm font-normal">km/h</span></div>
          </Card>
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

      <SaveScoreDialog 
        isOpen={showSaveDialog} 
        onClose={handleSaveDialogClose}
        score={accelerometerData.averageAcceleration}
        elapsedTime={accelerometerData.elapsedTime}
        onLoginRequired={handleLoginRequired}
        topSpeed={accelerometerData.topSpeed}
        averageSpeed={accelerometerData.averageSpeed}
      />
      
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
