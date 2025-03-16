
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full p-8 rounded-2xl glass-morphism text-center animate-fade-in">
        <h1 className="text-5xl font-bold mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Page not found</p>
        <p className="text-sm text-muted-foreground mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button asChild variant="default" className="gap-2">
          <a href="/">
            <ArrowLeft className="h-4 w-4" />
            <span>Return Home</span>
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
