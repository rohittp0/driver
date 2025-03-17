
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  score: number;
  time_seconds: number;
  user_id: string;
  created_at: string;
  profile: {
    username: string;
    avatar_url: string;
  };
}

interface TopPlayer {
  user_id: string;
  username: string;
  avatar_url: string;
  score: number;
}

const LeaderboardPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentLeaderboard, setCurrentLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastMonthLeaderboard, setLastMonthLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topThreeLastMonth, setTopThreeLastMonth] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoading(true);
      try {
        // Get current month's start and end dates
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        
        // Get last month's start and end dates
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

        // Fetch current month leaderboard
        const { data: currentData, error: currentError } = await supabase
          .from('driving_scores')
          .select(`
            score,
            time_seconds,
            user_id,
            created_at,
            profile:profiles(username, avatar_url)
          `)
          .gte('created_at', currentMonthStart)
          .lte('created_at', currentMonthEnd)
          .order('score', { ascending: true })
          .limit(20);

        if (currentError) throw currentError;
        setCurrentLeaderboard(currentData || []);

        // Fetch last month leaderboard
        const { data: lastMonthData, error: lastMonthError } = await supabase
          .from('driving_scores')
          .select(`
            score,
            time_seconds,
            user_id,
            created_at,
            profile:profiles(username, avatar_url)
          `)
          .gte('created_at', lastMonthStart)
          .lte('created_at', lastMonthEnd)
          .order('score', { ascending: true })
          .limit(20);

        if (lastMonthError) throw lastMonthError;
        setLastMonthLeaderboard(lastMonthData || []);

        // Extract top 3 from last month
        if (lastMonthData && lastMonthData.length > 0) {
          // Get unique users with their best scores
          const userBestScores = new Map<string, TopPlayer>();
          
          lastMonthData.forEach(entry => {
            const userId = entry.user_id;
            const currentBest = userBestScores.get(userId);
            
            if (!currentBest || entry.score < currentBest.score) {
              userBestScores.set(userId, {
                user_id: userId,
                username: entry.profile?.username || 'Unknown',
                avatar_url: entry.profile?.avatar_url || '',
                score: entry.score
              });
            }
          });
          
          // Sort by score and take top 3
          const topThree = Array.from(userBestScores.values())
            .sort((a, b) => a.score - b.score)
            .slice(0, 3);
          
          setTopThreeLastMonth(topThree);
        }

      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load leaderboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [toast]);

  const handlePlayerClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const renderPodium = () => {
    if (topThreeLastMonth.length === 0) {
      return <p className="text-center text-muted-foreground my-8">No data from last month</p>;
    }

    const podiumOrder = [1, 0, 2]; // Silver, Gold, Bronze positions
    
    return (
      <div className="flex justify-center items-end gap-4 my-8">
        {podiumOrder.map((index, position) => {
          if (index >= topThreeLastMonth.length) return null;
          
          const player = topThreeLastMonth[index];
          const podiumHeight = position === 1 ? "h-32" : "h-24";
          const medalColor = position === 1 ? "text-yellow-500" : position === 0 ? "text-gray-400" : "text-amber-700";
          const podiumPosition = position === 1 ? "1st" : position === 0 ? "2nd" : "3rd";

          return (
            <div key={player.user_id} className="flex flex-col items-center">
              <div 
                className="cursor-pointer transition-transform hover:scale-105" 
                onClick={() => handlePlayerClick(player.user_id)}
              >
                <Avatar className="h-16 w-16 mb-2 border-2" style={{ borderColor: medalColor.replace('text-', '') }}>
                  {player.avatar_url ? (
                    <AvatarImage src={player.avatar_url} alt={player.username} />
                  ) : (
                    <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <p className="text-center font-medium text-sm">{player.username}</p>
                <p className="text-center text-xs">{player.score.toFixed(2)}</p>
              </div>
              <div 
                className={`${podiumHeight} w-20 rounded-t-md mt-2 flex items-center justify-center bg-secondary/50`}
              >
                <Trophy className={`${medalColor} h-6 w-6`} />
                <span className="text-xs font-bold ml-1">{podiumPosition}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLeaderboard = (data: LeaderboardEntry[]) => {
    if (data.length === 0) {
      return <p className="text-center text-muted-foreground">No scores recorded yet.</p>;
    }

    return (
      <div className="space-y-3">
        {data.map((entry, index) => (
          <div 
            key={`${entry.user_id}-${entry.created_at}`} 
            className="flex items-center p-3 bg-secondary/20 rounded-lg cursor-pointer hover:bg-secondary/40 transition-colors"
            onClick={() => handlePlayerClick(entry.user_id)}
          >
            <div className="flex-shrink-0 w-8 text-center font-semibold">
              {index + 1}.
            </div>
            <Avatar className="h-10 w-10 mr-3">
              {entry.profile?.avatar_url ? (
                <AvatarImage src={entry.profile.avatar_url} alt={entry.profile?.username || "User"} />
              ) : (
                <AvatarFallback>{entry.profile?.username?.charAt(0) || "U"}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{entry.profile?.username || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">{entry.score.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{entry.time_seconds.toFixed(1)}s</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-3xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6 self-start" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold text-center mb-6">Leaderboard</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-center">Last Month's Champions</CardTitle>
        </CardHeader>
        <CardContent>
          {renderPodium()}
        </CardContent>
      </Card>

      <Tabs defaultValue="current">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="current">Current Month</TabsTrigger>
          <TabsTrigger value="last">Last Month</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Current Month Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(currentLeaderboard)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="last">
          <Card>
            <CardHeader>
              <CardTitle>Last Month Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(lastMonthLeaderboard)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaderboardPage;
