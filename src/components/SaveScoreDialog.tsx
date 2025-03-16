
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SaveScoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  elapsedTime: number;
  onLoginRequired: () => void;
}

const SaveScoreDialog = ({ isOpen, onClose, score, elapsedTime, onLoginRequired }: SaveScoreDialogProps) => {
  const { toast } = useToast();
  
  const checkAuthAndSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to auth flow instead of showing an error
        onLoginRequired();
        return;
      }
      
      await saveScore(user.id);
    } catch (error) {
      console.error('Unexpected error checking auth:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const saveScore = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('driving_scores')
        .insert([
          { 
            user_id: userId,
            score,
            time_seconds: elapsedTime,
          }
        ]);
      
      if (error) {
        console.error('Error saving score:', error);
        toast({
          title: "Error",
          description: "Failed to save your score. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Your driving score has been saved!",
        });
        onClose();
      }
    } catch (error) {
      console.error('Unexpected error saving score:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Your Score</DialogTitle>
          <DialogDescription>
            Your driving performance was {score.toFixed(2)} over {elapsedTime.toFixed(1)} seconds.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button onClick={checkAuthAndSave} className="w-full">
            Save Score
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Don't Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveScoreDialog;
