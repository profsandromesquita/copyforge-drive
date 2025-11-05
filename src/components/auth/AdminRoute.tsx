import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Wait for auth to finish loading
      if (loading) {
        console.log('Auth still loading...');
        return;
      }

      console.log('Checking admin status for user:', user?.id);
      
      if (!user) {
        console.log('No user found, setting isAdmin to false');
        setIsAdmin(false);
        return;
      }

      console.log('Calling has_system_role RPC...');
      const { data, error } = await supabase
        .rpc('has_system_role', {
          _user_id: user.id,
          _role: 'super_admin'
        });

      console.log('RPC response:', { data, error });

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      console.log('Setting isAdmin to:', data);
      setIsAdmin(data);
    };

    checkAdminStatus();
  }, [user, loading]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
