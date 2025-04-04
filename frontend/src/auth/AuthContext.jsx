import { confirmSignIn, getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  useEffect(() => {
    checkUserAuthentication();
  }, []);

  async function checkUserAuthentication() {
    try {
      console.log("Checking authentication...");
      const userData = await getCurrentUser();
      console.log("Authentication successful:", userData);
      setUser(userData);
    } catch (error) {
      // This is expected for unauthenticated users - not an actual error case
      console.log("Not authenticated yet, user needs to sign in");
      setUser(null);
    } finally {
      console.log("Authentication check completed");
      setLoading(false);
    }
  }

  async function login(username, password) {
    try {
      console.log("Attempting login for:", username);
      const result = await signIn({ username, password });
      console.log("Sign in result:", result);
      
      // If there's a valid session, the user is authenticated
      if (result.signInUserSession) {
        console.log("User has a valid session, login successful");
        const userData = await getCurrentUser();
        setUser(userData);
        return { success: true, user: userData };
      }
      
      // Handle password change requirement - FIXED THE CHECK HERE
      if (result.nextStep && 
          (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD' || 
           result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED')) {
        console.log("Password change required");
        setPasswordChangeRequired(true);
        setTempUser(result);
        return { success: false, challengeName: 'NEW_PASSWORD_REQUIRED' };
      }
      
      // Handle "DONE" case - this means authentication is complete
      if (result.nextStep && result.nextStep.signInStep === 'DONE') {
        console.log("Authentication complete (DONE step)");
        const userData = await getCurrentUser();
        setUser(userData);
        return { success: true, user: userData };
      }
      
      // Log unknown next steps for debugging
      if (result.nextStep) {
        console.log("Unhandled next step:", result.nextStep);
        // Important: Add this line to still trigger password change for any unhandled step types
        if (result.nextStep.signInStep.includes('NEW_PASSWORD')) {
          setPasswordChangeRequired(true);
          setTempUser(result);
          return { success: false, challengeName: 'NEW_PASSWORD_REQUIRED' };
        }
      }
      
      console.log("Login failed, no valid result conditions met");
      return { success: false };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async function completePasswordChange(newPassword) {
    try {
      if (!tempUser) {
        throw new Error('No pending authentication challenge');
      }

      console.log("Completing password change");
      const result = await confirmSignIn({
        challengeResponse: newPassword
      });
      console.log("Password change result:", result);
      
      if (result.isSignedIn) {
        console.log("Password changed successfully, user is now signed in");
        const userData = await getCurrentUser();
        setUser(userData);
        setPasswordChangeRequired(false);
        setTempUser(null);
        return { success: true, user: userData };
      }
      
      console.log("Password change did not result in successful sign in");
      return { success: false };
    } catch (error) {
      console.error("Password change error:", error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut();
      setUser(null);
      setPasswordChangeRequired(false);
      setTempUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      passwordChangeRequired,
      completePasswordChange
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}