import React from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {supabase} from "@/integrations/supabase/client";

interface AuthDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AuthDialog = ({isOpen, onClose, onSuccess}: AuthDialogProps) => {
    const handleGoogleSignIn = async () => {
        try {
            const {error} = await supabase.auth.signInWithOAuth({
                provider: 'google', options: {
                    redirectTo: window.location.origin,
                }
            });

            if (error) {
                console.error('Error signing in with Google:', error);
            }
        } catch (error) {
            console.error('Unexpected error during sign in:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Sign in to save your score</DialogTitle>
                    <DialogDescription>
                        Sign in with Google to save your driving score and compare with others.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button onClick={handleGoogleSignIn} className="w-full">
                        Sign in with Google
                    </Button>
                    <Button variant="outline" onClick={onClose} className="w-full">
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthDialog;
