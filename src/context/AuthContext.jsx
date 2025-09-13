import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, staffService } from '../lib/supabaseClient';


const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStaffMember, setCurrentStaffMember] = useState(null);

  // Authentication state management
  useEffect(() => {
    let isMounted = true;

    console.log("Auth effect starting...");

    // Initial session check
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("Initial getSession:", { data, error });
      if (isMounted && data.session) {
        handleSessionChange(data.session, "initial");
      }
    })();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state change:", _event, session?.user?.email);
        if (isMounted) handleSessionChange(session, "auth change");
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSessionChange = async (session, source) => {
    console.log(`handleSessionChange called with source: ${source}`);
    
    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
      console.log(`Processing user from ${source}...`);
      try {
        const staffData = await staffService.getAllStaff();
        const userStaff = staffData.find(s => s.user_id === session.user.id);
        setCurrentStaffMember(userStaff);
      } catch (err) {
        console.error("Error fetching staff data:", err);
      }
    } else {
      setCurrentStaffMember(null);
    }

    setLoading(false);
  };

  const handleAuth = async (authData, authMode) => {
    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password,
        });
        
        if (error) throw error;
        return { success: true };
      } else {
        // Sign up new user
        const { data: authResult, error: signUpError } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: {
            data: {
              name: authData.name,
              role: authData.role
            }
          }
        });

        if (signUpError) throw signUpError;

        // Create staff record
        if (authResult.user) {
          await staffService.createStaff({
            user_id: authResult.user.id,
            name: authData.name,
            email: authData.email,
            role: authData.role,
            avatar: authData.name.split(' ').map(n => n[0]).join('').toUpperCase()
          });
        }
        
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isAdmin = () => {
    return currentStaffMember?.role === 'admin' || currentStaffMember?.role === 'manager';
  };

  const value = {
    user,
    session,
    loading,
    currentStaffMember,
    handleAuth,
    handleSignOut,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};