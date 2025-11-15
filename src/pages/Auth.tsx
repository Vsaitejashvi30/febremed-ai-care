import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Activity, ArrowLeft } from "lucide-react";
import { Session, User } from "@supabase/supabase-js";
import Logo from "@/components/Logo";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect authenticated users to home
        if (session?.user) {
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid login")) {
          toast.error("Invalid email or password. Please check your credentials.");
        } else if (error.message.includes("Email not confirmed") || error.message.includes("email_not_confirmed")) {
          toast.error("Please check your email and confirm your account before logging in.");
        } else if (error.message.includes("User not found")) {
          toast.error("No account found with this email. Please sign up first.");
        } else {
          toast.error(error.message || "Login failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        toast.success("Successfully logged in!");
        // Small delay to show the success message
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else if (data.user && !data.session) {
        toast.error("Please confirm your email before logging in.");
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login");
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (signupData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          toast.error("This email is already registered. Please login instead.");
          // Pre-fill login email
          setLoginData({ email: signupData.email, password: "" });
          // Switch to login tab
          setActiveTab("login");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        // If user.email_confirmed_at is null, email confirmation is required
        if (!data.user.email_confirmed_at && data.session === null) {
          toast.success("Account created! Please check your email to confirm your account before logging in.");
          // Pre-fill login email
          setLoginData({ email: signupData.email, password: "" });
          // Clear signup form
          setSignupData({ email: "", password: "", confirmPassword: "" });
          // Switch to login tab
          setActiveTab("login");
        } else if (data.session) {
          // User is automatically logged in (email confirmation disabled)
          toast.success("Account created successfully!");
          navigate('/');
        } else {
          // Email confirmation required
          toast.success("Account created! Please check your email to confirm your account.");
          // Pre-fill login email
          setLoginData({ email: signupData.email, password: "" });
          setSignupData({ email: "", password: "", confirmPassword: "" });
          setActiveTab("login");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-secondary/30 via-secondary/15 to-transparent pointer-events-none" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 animate-in fade-in duration-500">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="hover:bg-secondary/50 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          <Card className="border-2 shadow-2xl bg-white/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom duration-500 delay-150">
            <CardHeader className="text-center bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b pb-6">
              <div className="flex justify-center mb-4 animate-in zoom-in duration-500 delay-300">
                <Logo size="lg" clickable={false} />
              </div>
              <CardTitle className="text-3xl font-bold mb-2">Welcome to FebreMed</CardTitle>
              <CardDescription className="text-base">
                Sign in to access your assessment history
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 animate-in fade-in duration-300">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 animate-in fade-in duration-300">
                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Sign Up'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
