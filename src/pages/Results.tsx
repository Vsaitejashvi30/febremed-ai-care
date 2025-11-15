import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, FileText, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<any[]>([]);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('fever_assessments')
        .select('*')
        .eq('id', id)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('*')
        .eq('assessment_id', id)
        .single();

      if (predictionError) throw predictionError;
      setPrediction(predictionData);

      const { data: symptomsData, error: symptomsError } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('assessment_id', id);

      if (symptomsError) throw symptomsError;
      setSymptoms(symptomsData);
    } catch (error: any) {
      console.error('Error loading results:', error);
      toast.error("Failed to load results");
      navigate('/');
    } finally {
      setLoading(false);
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-destructive text-destructive-foreground';
      case 'MEDIUM':
        return 'bg-warning text-warning-foreground';
      case 'LOW':
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

  if (!assessment || !prediction) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-secondary/30 via-secondary/15 to-transparent pointer-events-none" />
      
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="hover:bg-secondary/50 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/report/${id}`)}
              className="shadow-sm hover:shadow-md transition-all hover:scale-105"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Doctor Report
            </Button>
          </div>

        {/* Decision Card */}
        <Card className={`${getDecisionColor(assessment.decision)} shadow-2xl border-2 animate-in fade-in slide-in-from-top duration-500`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold flex items-center gap-3">
              {assessment.decision === 'CONSULT_DOCTOR' && <AlertTriangle className="h-8 w-8 animate-pulse" />}
              {assessment.decision === 'CONTINUE' && <Activity className="h-8 w-8" />}
              {assessment.decision === 'LIKELY_SAFE_TO_STOP' && <CheckCircle2 className="h-8 w-8" />}
              {assessment.decision.replace(/_/g, ' ')}
            </CardTitle>
            <CardDescription className="text-inherit opacity-90 text-base mt-2">
              AI Analysis Result
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg opacity-90 leading-relaxed">
              {prediction.explanation}
            </p>
          </CardContent>
        </Card>

        {/* Recovery & Confidence */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-2 animate-in fade-in slide-in-from-left duration-500 delay-150">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Recovery Probability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-5xl font-bold text-success mb-2">
                {Math.round(assessment.recovery_probability * 100)}%
              </div>
              <Progress value={assessment.recovery_probability * 100} className="h-4 bg-secondary" />
              <p className="text-sm text-muted-foreground">Based on your symptoms and treatment</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-2 animate-in fade-in slide-in-from-right duration-500 delay-150">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Analysis Confidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-5xl font-bold text-primary mb-2">
                {Math.round(assessment.confidence * 100)}%
              </div>
              <Progress value={assessment.confidence * 100} className="h-4 bg-secondary" />
              <p className="text-sm text-muted-foreground">AI model confidence level</p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getRiskColor(assessment.risk_assessment)} variant="default">
              {assessment.risk_assessment} RISK
            </Badge>
          </CardContent>
        </Card>

        {/* Key Factors */}
        <Card className="shadow-lg border-2 animate-in fade-in duration-500 delay-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b">
            <CardTitle className="text-2xl">Key Factors</CardTitle>
            <CardDescription>Important considerations in this assessment</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3">
              {prediction.key_factors?.map((factor: string, index: number) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                  <CheckCircle2 className="h-6 w-6 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-base leading-relaxed">{factor}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Symptoms Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Your Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom) => (
                <Badge key={symptom.id} variant="secondary">
                  {symptom.symptom_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              {prediction.next_steps?.map((step: string, index: number) => (
                <li key={index} className="text-foreground">{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Warning Signs */}
        {prediction.warning_signs && prediction.warning_signs.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Warning Signs to Watch For
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {prediction.warning_signs.map((sign: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button 
            onClick={() => navigate('/assessment')} 
            size="lg" 
            className="flex-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Activity className="mr-2 h-5 w-5" />
            New Assessment
          </Button>
          <Button 
            onClick={() => navigate('/history')} 
            variant="secondary" 
            size="lg" 
            className="flex-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            View History
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Results;
