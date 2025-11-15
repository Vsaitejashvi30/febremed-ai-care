import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Trash2, FileText, Activity } from "lucide-react";
import { format } from "date-fns";
import Logo from "@/components/Logo";

const History = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('fever_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('fever_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Assessment deleted");
      loadHistory();
    } catch (error: any) {
      console.error('Error deleting assessment:', error);
      toast.error("Failed to delete assessment");
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'CONSULT_DOCTOR':
        return 'bg-warning text-warning-foreground';
      case 'CONTINUE':
        return 'bg-primary text-primary-foreground';
      case 'LIKELY_SAFE_TO_STOP':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-secondary/30 via-secondary/15 to-transparent pointer-events-none" />
      
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="hover:bg-secondary/50 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <Logo size="sm" />
            </div>
            <Button 
              onClick={() => navigate('/assessment')}
              className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Activity className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
          </div>

          <Card className="mb-8 shadow-lg border-2 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b">
              <CardTitle className="text-3xl font-bold">Assessment History</CardTitle>
              <CardDescription className="text-base mt-2">
                View and manage your past fever assessments
              </CardDescription>
            </CardHeader>
          </Card>

        {assessments.length === 0 ? (
          <Card className="shadow-lg border-2 bg-white/95 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/50 mb-6">
                <Activity className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-lg text-muted-foreground mb-6">No assessments yet</p>
              <Button 
                onClick={() => navigate('/assessment')}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Activity className="mr-2 h-5 w-5" />
                Start Your First Assessment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment, index) => (
              <Card
                key={assessment.id}
                className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 bg-white/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/results/${assessment.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={`${getDecisionColor(assessment.decision)} text-sm px-3 py-1 font-semibold`}>
                          {assessment.decision.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {format(new Date(assessment.created_at), 'MMM dd, yyyy • HH:mm')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                        <div className="p-3 rounded-lg bg-secondary/30">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Temperature</p>
                          <p className="text-xl font-bold text-foreground">{assessment.temperature}°C</p>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/30">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
                          <p className="text-xl font-bold text-foreground">{assessment.duration_days} days</p>
                        </div>
                        <div className="p-3 rounded-lg bg-success/10">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Recovery</p>
                          <p className="text-xl font-bold text-success">
                            {Math.round(assessment.recovery_probability * 100)}%
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/30">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Risk</p>
                          <p className="text-xl font-bold text-foreground">
                            {assessment.risk_assessment}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-6">
                      <Button
                        variant="outline"
                        size="icon"
                        className="hover:bg-primary/10 hover:border-primary transition-all hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/report/${assessment.id}`);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all hover:scale-110"
                        onClick={(e) => handleDelete(assessment.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default History;
