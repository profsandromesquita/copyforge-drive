import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('=== AdminRoute Check ===');
      console.log('Loading:', loading);
      console.log('User:', user?.id);
      console.log('User email:', user?.email);
      
      if (loading) {
        console.log('Still loading auth...');
        return;
      }

      if (!user) {
        console.log('No user, redirecting to dashboard');
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      console.log('Checking super_admin role for user:', user.id);
      
      try {
        const { data, error } = await supabase
          .rpc('has_system_role', {
            _user_id: user.id,
            _role: 'super_admin'
          });

        console.log('RPC Result:', { data, error });

        if (error) {
          console.error('RPC Error:', error);
          setIsAdmin(false);
          setChecking(false);
          return;
        }

        console.log('User is admin:', data);
        setIsAdmin(data);
        setChecking(false);
      } catch (err) {
        console.error('Exception checking admin:', err);
        setIsAdmin(false);
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, loading]);

  console.log('AdminRoute render - checking:', checking, 'isAdmin:', isAdmin, 'loading:', loading);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    console.log('Redirecting to my-project - user:', !!user, 'isAdmin:', isAdmin);
    return <Navigate to="/my-project" replace />;
  }

  console.log('Admin access granted!');
  return <>{children}</>;
};
