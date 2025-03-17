
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import DriveDetailModal from '@/components/DriveDetailModal';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [longestDrive, setLongestDrive] = useState<number | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        // If no userId is provided, use the current user's ID
        if (!userId) {
          navigate(`/profile/${data.user.id}`);
        } else {
          // Check if viewing own profile
          setIsCurrentUser(data.user.id === userId);
        }
      } else if (!userId) {
        // If not logged in and no userId provided, redirect to home
        navigate('/');
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your profile.",
          variant: "destructive",
        });
      }
    };

    getCurrentUser();
  }, [userId, navigate, toast]);

  // Fetch profile and scores data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Get profile data - Using maybeSingle() instead of single() to handle the case of no rows
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Get scores data
        const { data: scoresData, error: scoresError } = await supabase
          .from('driving_scores')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (scoresError) throw scoresError;
        setScores(scoresData || []);

        // Calculate stats
        if (scoresData && scoresData.length > 0) {
          // Best score (lowest is better)
          const best = Math.min(...scoresData.map(s => s.score));
          setBestScore(best);

          // Longest drive in seconds
          const longest = Math.max(...scoresData.map(s => s.time_seconds));
          setLongestDrive(longest);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, toast]);

  const handleViewDriveDetails = (drive: any) => {
    setSelectedDrive(drive);
    setShowDriveModal(true);
  };

  const handleCloseDriveModal = () => {
    setShowDriveModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p>Profile not found.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // Calculate normalized score (0-100) for display
  const normalizedBestScore = bestScore !== null ? Math.max(0, Math.min(100, 100 - bestScore * 10)) : null;

  return (
    <div className="min-h-screen flex flex-col p-6">
      <Button 
        variant="ghost" 
        className="mb-6 self-start" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col items-center mb-8">
        <Avatar className="h-24 w-24 mb-4">
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={profile.username} />
          ) : (
            <AvatarFallback className="text-lg">{profile.username?.charAt(0) || "U"}</AvatarFallback>
          )}
        </Avatar>
        <h1 className="text-2xl font-bold">{profile.username || "User"}</h1>
        {isCurrentUser && <p className="text-sm text-muted-foreground">This is your profile</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Best Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {normalizedBestScore !== null ? `${normalizedBestScore.toFixed(0)}/100` : "No scores yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Longest Drive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {longestDrive !== null ? `${longestDrive.toFixed(1)}s` : "No drives yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Driving History</h2>
      {scores.length > 0 ? (
        <div className="space-y-4">
          {scores.map((score) => (
            <Card 
              key={score.id} 
              className="hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => handleViewDriveDetails(score)}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    Score: {Math.max(0, Math.min(100, 100 - score.score * 10)).toFixed(0)}/100
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Time: {score.time_seconds.toFixed(1)}s
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(score.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">No driving scores yet.</p>
      )}

      {selectedDrive && (
        <DriveDetailModal
          isOpen={showDriveModal}
          onClose={handleCloseDriveModal}
          score={selectedDrive.score}
          time={selectedDrive.time_seconds}
          date={selectedDrive.created_at}
          topSpeed={selectedDrive.top_speed || 0}
          averageSpeed={selectedDrive.average_speed || 0}
          profileId={userId || ''}
        />
      )}
    </div>
  );
};

export default ProfilePage;
