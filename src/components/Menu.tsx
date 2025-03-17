import React from 'react';
import {
    Menu as MenuIcon,
    LogIn,
    Trophy,
    Home, User
} from 'lucide-react';
import {Button} from "@/components/ui/button";
import {supabase} from '@/integrations/supabase/client';
import {useToast} from "@/components/ui/use-toast";
import {Link} from 'react-router-dom';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

interface MenuProps {
    isAuthenticated: boolean;
    onLoginClick: () => void;
    userProfile?: {
        username?: string;
        avatar_url?: string;
    } | null;
}

const Menu = ({isAuthenticated, onLoginClick, userProfile}: MenuProps) => {
    const {toast} = useToast();
    const [open, setOpen] = React.useState(false);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast({
                title: "Signed Out",
                description: "You have been signed out successfully.",
            });
            setOpen(false);
        } catch (error) {
            console.error('Error signing out:', error);
            toast({
                title: "Error",
                description: "Something went wrong while signing out.",
                variant: "destructive",
            });
        }
    };

    const handleLoginClick = () => {
        onLoginClick();
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <MenuIcon className="h-5 w-5"/>
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:max-w-xs flex flex-col">
                <SheetHeader className="mb-6">
                    <SheetTitle>Driver</SheetTitle>
                </SheetHeader>

                {isAuthenticated && userProfile && (
                    <div className="flex items-center space-x-4 mb-6 p-4 bg-secondary/30 rounded-lg">
                        <Avatar className="h-12 w-12">
                            {userProfile.avatar_url ? (
                                <AvatarImage src={userProfile.avatar_url} alt={userProfile.username || "User"}/>
                            ) : (
                                <AvatarFallback>{userProfile.username?.charAt(0) || "U"}</AvatarFallback>
                            )}
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{userProfile.username || "User"}</p>
                            {isAuthenticated && (
                                <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground"
                                        onClick={handleLogout}>
                                    Sign out
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-2 flex-1">
                    {!isAuthenticated && (
                        <Button variant="ghost" className="w-full justify-start" onClick={handleLoginClick}>
                            <LogIn className="mr-2 h-5 w-5"/>
                            Sign In
                        </Button>
                    )}
                    <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
                        <Link to="/">
                            <Home className="mr-2 h-5 w-5"/>
                            Home
                        </Link>
                    </Button>

                    <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
                        <Link to="/leaderboard">
                            <Trophy className="mr-2 h-5 w-5"/>
                            Leaderboard
                        </Link>
                    </Button>

                    {isAuthenticated && (
                        <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
                            <Link to="/profile">
                                <User className="mr-2 h-5 w-5"/>
                                My Profile
                            </Link>
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default Menu;
