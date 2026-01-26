import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ['user-admin-check', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return data === true;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Show loading while checking auth state
  if (authLoading || (user && roleLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect to home if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default AdminRoute;
