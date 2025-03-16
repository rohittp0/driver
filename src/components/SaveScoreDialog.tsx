
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
}

const SaveScoreDialog = ({ isOpen, onClose, score, elapsedTime }: SaveScoreDialogProps) => {
  const { toast } = useToast();
  
  const saveScore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Not signed in",
          description: "You need to be signed in to save your score.",
          variant: "destructive",
        });
        onClose();
        return;
      }
      
      const { error } = await supabase
        .from('driving_scores')
        .insert([
          { 
            user_id: user.id,
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
          <Button onClick={saveScore} className="w-full">
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
