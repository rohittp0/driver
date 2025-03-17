
import React, { useRef, useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Trophy, Clock, Wind, TrendingUp } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import html2canvas from "html2canvas";

interface DriveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  time: number;
  date: string;
  topSpeed?: number;
  averageSpeed?: number;
  profileId: string;
}

const DriveDetailModal = ({
  isOpen,
  onClose,
  score,
  time,
  date,
  topSpeed = 0,
  averageSpeed = 0,
  profileId
}: DriveDetailModalProps) => {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  
  // Calculate a normalized score for the progress bar (0-100)
  const normalizedScore = Math.max(0, Math.min(100, 100 - score * 10));
  
  // Update progress value after component has rendered to ensure it's visible in the screenshot
  useEffect(() => {
    if (isOpen) {
      // Use a small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        setProgressValue(normalizedScore);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, normalizedScore]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      setSharing(true);
      
      // Ensure styles are fully applied before capturing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create a canvas from the card element
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        onclone: (document, element) => {
          // Force update progress element in the cloned node
          const progressElement = element.querySelector('[role="progressbar"] > div');
          if (progressElement) {
            (progressElement as HTMLElement).style.transform = `translateX(-${100 - normalizedScore}%)`;
          }
        }
      });
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob as Blob);
        }, 'image/png');
      });
      
      // Create shareable data
      if (navigator.share && navigator.canShare) {
        // Use Web Share API if available
        const shareData = {
          title: 'My Smooth Driver Score',
          text: `Check out my driving score of ${score.toFixed(2)}! Top speed: ${topSpeed.toFixed(1)} km/h`,
          url: `${window.location.origin}/profile/${profileId}`,
          files: [new File([blob], 'driving-score.png', { type: 'image/png' })]
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast({
            title: "Shared!",
            description: "Your score has been shared successfully.",
          });
        } else {
          // Fallback if files can't be shared
          await navigator.share({
            title: 'My Smooth Driver Score',
            text: `Check out my driving score of ${score.toFixed(2)}! Top speed: ${topSpeed.toFixed(1)} km/h`,
            url: `${window.location.origin}/profile/${profileId}`,
          });
        }
      } else {
        // Fallback for browsers without Web Share API
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'driving-score.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Image Downloaded",
          description: "Your score card has been downloaded as an image.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Sharing Failed",
        description: "There was a problem sharing your score.",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Drive Details</DialogTitle>
          <DialogDescription>
            Your driving performance from {new Date(date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <div ref={cardRef} className="bg-card rounded-lg p-6 space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Smooth Driver Score</div>
            <div className="flex items-center justify-between mb-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{normalizedScore.toFixed(0)}</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Bumpy</span>
              <span>Smooth</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <TrendingUp className="h-5 w-5 text-primary mb-1" />
                <div className="text-xs text-muted-foreground">Top Speed</div>
                <div className="text-lg font-semibold">{topSpeed.toFixed(1)} <span className="text-xs">km/h</span></div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <Wind className="h-5 w-5 text-primary mb-1" />
                <div className="text-xs text-muted-foreground">Avg Speed</div>
                <div className="text-lg font-semibold">{averageSpeed.toFixed(1)} <span className="text-xs">km/h</span></div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {time.toFixed(1)} seconds
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Acceleration: {score.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleShare} disabled={sharing}>
            <Share2 className="mr-2 h-4 w-4" />
            {sharing ? 'Sharing...' : 'Share'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DriveDetailModal;
