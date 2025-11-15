import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Activity, History, Stethoscope, Heart, Shield, Brain, ArrowRight } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import Logo from "@/components/Logo";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-secondary/40 via-secondary/20 to-transparent pointer-events-none" />
      
      {/* Navigation */}
      <div className="relative z-50 absolute top-4 left-4 right-4 flex items-center justify-between animate-in fade-in duration-500">
        <Logo size="md" />
        <UserMenu />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Visual Element */}
            <div className="hidden lg:block relative animate-in fade-in slide-in-from-left duration-700">
              <div className="relative h-[600px] rounded-3xl overflow-hidden bg-gradient-to-br from-secondary/50 via-secondary/30 to-primary/20 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative animate-pulse-slow">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-150 animate-pulse" />
                    <div className="relative bg-white/90 backdrop-blur-md rounded-full p-12 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                      <Stethoscope className="w-32 h-32 text-primary" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-20 left-10 w-20 h-20 bg-accent/20 rounded-full blur-xl animate-float" />
                <div className="absolute bottom-20 right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-float-delayed" />
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-right duration-700 delay-150">
              <div className="space-y-6">
                <div>
                  <h1 className="text-6xl lg:text-7xl font-bold text-foreground tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    FEBREMED
                  </h1>
                  <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent mx-auto lg:mx-0 mb-4 rounded-full animate-in slide-in-from-left duration-500 delay-300" />
                  <h2 className="text-2xl lg:text-3xl font-semibold text-primary uppercase tracking-wide animate-in fade-in duration-500 delay-300">
                    CAN HANDLE THAT
                  </h2>
                </div>
                
                <div className="space-y-4 animate-in fade-in duration-500 delay-500">
                  <p className="text-lg lg:text-xl text-muted-foreground font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                    From preventive care and checkups, to intelligent fever management and medication guidance, our AI-powered system works to keep you and your family healthy and strong each and every day.
                  </p>
                  <p className="text-primary font-semibold text-lg uppercase tracking-wide">
                    Your Health Awaits You
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4 animate-in fade-in duration-500 delay-700">
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[220px] text-base h-12 group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => navigate('/assessment')}
                >
                  <Activity className="mr-2 h-5 w-5" />
                  Start New Assessment
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto min-w-[220px] text-base h-12 border-2 hover:bg-secondary/50 transition-all duration-300 hover:scale-105"
                  onClick={() => navigate('/history')}
                >
                  <History className="mr-2 h-5 w-5" />
                  View My History
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <div className="relative z-10 py-24 bg-secondary/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-in fade-in duration-500">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Why Choose FebreMed?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Advanced AI technology meets compassionate healthcare
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-border/50 group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Stethoscope className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">AI Diagnosis</h3>
              <p className="text-sm text-muted-foreground">Intelligent symptom analysis</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-border/50 group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                <Heart className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Personalized Care</h3>
              <p className="text-sm text-muted-foreground">Tailored recommendations</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-border/50 group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Shield className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Safe & Secure</h3>
              <p className="text-sm text-muted-foreground">Your data protected</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-border/50 group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                <Brain className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Smart Insights</h3>
              <p className="text-sm text-muted-foreground">Evidence-based guidance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="relative z-10 py-8 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">
            <strong className="text-foreground">Important:</strong> This tool provides educational guidance only. 
            Always consult with a healthcare professional for medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
