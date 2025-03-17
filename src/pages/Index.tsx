import React, { useState, useEffect } from 'react';
import { useAccelerometer } from '@/hooks/useAccelerometer';
import AccelerometerDisplay from '@/components/AccelerometerDisplay';
import SaveScoreDialog from '@/components/SaveScoreDialog';
import AuthDialog from '@/components/AuthDialog';
import { useToast } from '@/components/ui/use-toast';
import {calculateScore, cn} from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import Menu from '@/components/Menu';
import { Card } from '@/components/ui/card';
import { Gauge, Wind, TrendingUp } from 'lucide-react';
import DriveDetailModal from '@/components/DriveDetailModal';

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
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [timeThresholdMet, setTimeThresholdMet] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [lastSavedScore, setLastSavedScore] = useState<{
    score: number;
    time: number;
    date: string;
    topSpeed: number;
    averageSpeed: number;
    id: string;
  } | null>(null);

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

    checkUser().then();

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

    requestPermission().then();
  }, [error, toast]);

  useEffect(() => {
    if (isRunning && accelerometerData.elapsedTime >= 30) {
      setTimeThresholdMet(true);
    } else {
      setTimeThresholdMet(false);
    }
  }, [isRunning, accelerometerData.elapsedTime]);

  const saveScoreToDatabase = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        return false;
      }

      const { data, error } = await supabase
        .from('driving_scores')
        .insert([
          {
            user_id: userData.user.id,
            score: calculateScore(accelerometerData),
            time_seconds: accelerometerData.elapsedTime,
            top_speed: accelerometerData.topSpeed,
            average_speed: accelerometerData.averageSpeed,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving score:', error);
        toast({
          title: "Error",
          description: "Failed to save your score. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      setLastSavedScore({
        score: accelerometerData.averageAcceleration,
        time: accelerometerData.elapsedTime,
        date: new Date().toISOString(),
        topSpeed: accelerometerData.topSpeed,
        averageSpeed: accelerometerData.averageSpeed,
        id: data.id
      });

      toast({
        title: "Success",
        description: "Your driving score has been saved!",
      });

      return true;
    } catch (error) {
      console.error('Unexpected error saving score:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleToggle = async () => {
    if (isRunning && timeThresholdMet) {
      toggleAccelerometer();

      if (isAuthenticated) {
        const success = await saveScoreToDatabase();
        if (success) {
          setShowDetailModal(true);
        }
      } else {
        setShowSaveDialog(true);
      }
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

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
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

  const handleLoginClick = () => {
    setShowAuthDialog(true);
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
      "min-h-screen flex flex-col",
      "transition-colors duration-500 ease-in-out bg-background",
    )}>
      <div className="w-full max-w-xl mx-auto">
          <header className="text-center mt-8 mb-20 animate-fade-in">
              <div className="flex justify-center items-center relative mb-4">
                  <div className="absolute left-0">
                      <Menu
                          isAuthenticated={isAuthenticated}
                          onLoginClick={handleLoginClick}
                          userProfile={userProfile}
                      />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">Driver</h1>
              </div>
          </header>

          <AccelerometerDisplay
          score={calculateScore(accelerometerData)}
          elapsedTime={accelerometerData.elapsedTime}
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

      {lastSavedScore && (
        <DriveDetailModal
          isOpen={showDetailModal}
          onClose={handleDetailModalClose}
          score={lastSavedScore.score}
          time={lastSavedScore.time}
          date={lastSavedScore.date}
          topSpeed={lastSavedScore.topSpeed}
          averageSpeed={lastSavedScore.averageSpeed}
          profileId={userProfile?.id || ''}
        />
      )}
    </div>
  );
};

export default Index;
