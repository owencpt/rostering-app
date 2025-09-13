import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { staffService } from '../lib/supabaseClient';

export const useAuth = () => {
  // Authentication states
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentStaffMember, setCurrentStaffMember] = useState(null);

  // Authentication effect
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

  const handleSessionChange = (session, source) => {
    console.log(`handleSessionChange called with source: ${source}`);
    
    setSession(session);
    setUser(session?.user ?? null);
    setShowAuth(!session);

    if (session?.user) {
      console.log(`Processing user from ${source}...`);
      staffService.getAllStaff()
        .then(staffData => {
          const userStaff = staffData.find(s => s.user_id === session.user.id);
          setCurrentStaffMember(userStaff);
        })
        .catch(err => {
          console.error("Error fetching staff data:", err);
        });
    } else {
      setCurrentStaffMember(null);
    }

    setLoading(false);
  };

  // Authentication functions
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password,
        });
        
        if (error) throw error;
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
      }
      
      setAuthData({ email: '', password: '', name: '', role: 'staff' });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Helper function to check if current user is admin
  const isAdmin = () => {
    return currentStaffMember?.role === 'admin' || currentStaffMember?.role === 'manager';
  };

  // Reset auth form
  const resetAuthForm = () => {
    setAuthData({ email: '', password: '', name: '', role: 'staff' });
    setAuthError('');
  };

  // Switch auth mode
  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    resetAuthForm();
  };

  return {
    // State
    user,
    session,
    loading,
    showAuth,
    authMode,
    authData,
    showPassword,
    authError,
    authLoading,
    currentStaffMember,
    
    // Setters
    setAuthMode,
    setAuthData,
    setShowPassword,
    setAuthError,
    
    // Functions
    handleAuth,
    handleSignOut,
    isAdmin,
    resetAuthForm,
    switchAuthMode,
  };
};