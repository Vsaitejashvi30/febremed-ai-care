import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Download, Share2 } from "lucide-react";
import { format } from "date-fns";

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<any[]>([]);

  useEffect(() => {
    loadReportData();
  }, [id]);

  const loadReportData = async () => {
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
      console.error('Error loading report data:', error);
      toast.error("Failed to load report");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button
            variant="ghost"
            onClick={() => navigate(`/results/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Print/Save PDF
            </Button>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader className="border-b bg-primary/5">
            <div className="text-center space-y-2">
              <CardTitle className="text-3xl">Medical Assessment Report</CardTitle>
              <p className="text-muted-foreground">FebreMed AI Analysis</p>
              <p className="text-sm text-muted-foreground">
                Generated on {format(new Date(), 'MMMM dd, yyyy')}
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Patient Information */}
            <section>
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Patient Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-semibold">{assessment.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{assessment.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assessment Date</p>
                  <p className="font-semibold">{format(new Date(assessment.created_at), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comorbidities</p>
                  <p className="font-semibold">{assessment.comorbidities?.join(', ') || 'None'}</p>
                </div>
              </div>
            </section>

            {/* Fever Timeline */}
            <section>
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Fever Timeline</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Temperature:</span>
                  <span className="font-bold text-lg">{assessment.temperature}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-bold">{assessment.duration_days} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Medication:</span>
                  <span className="font-bold">{assessment.medication_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Days on Medication:</span>
                  <span className="font-bold">{assessment.days_on_medication} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Medication Compliance:</span>
                  <span className="font-bold">{assessment.medication_compliance}%</span>
                </div>
              </div>
            </section>

            {/* Symptoms */}
            <section>
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Reported Symptoms</h2>
              <ul className="grid grid-cols-2 gap-2">
                {symptoms.map((symptom) => (
                  <li key={symptom.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    {symptom.symptom_name}
                  </li>
                ))}
              </ul>
            </section>

            {/* AI Assessment */}
            <section>
              <h2 className="text-xl font-bold border-b pb-2 mb-4">AI Assessment Results</h2>
              <div className="space-y-4">
                <div className="bg-secondary/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Decision</p>
                  <p className="font-bold text-lg">{assessment.decision.replace(/_/g, ' ')}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-secondary/30 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Recovery Probability</p>
                    <p className="font-bold text-2xl text-success">
                      {Math.round(assessment.recovery_probability * 100)}%
                    </p>
                  </div>
                  <div className="bg-secondary/30 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                    <p className="font-bold text-2xl text-primary">
                      {Math.round(assessment.confidence * 100)}%
                    </p>
                  </div>
                  <div className="bg-secondary/30 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
                    <p className="font-bold text-2xl">{assessment.risk_assessment}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Clinical Analysis */}
            <section>
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Clinical Analysis</h2>
              <p className="text-foreground leading-relaxed">{prediction.explanation}</p>
            </section>

            {/* Key Factors */}
            <section>
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Key Contributing Factors</h2>
              <ul className="space-y-2">
                {prediction.key_factors?.map((factor: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Recommendations */}
            <section>
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Recommended Actions</h2>
              <ol className="space-y-3 list-decimal list-inside">
                {prediction.next_steps?.map((step: string, index: number) => (
                  <li key={index} className="text-foreground">{step}</li>
                ))}
              </ol>
            </section>

            {/* Warning Signs */}
            {prediction.warning_signs && prediction.warning_signs.length > 0 && (
              <section>
                <h2 className="text-xl font-bold border-b pb-2 mb-4 text-destructive">Warning Signs</h2>
                <ul className="space-y-2">
                  {prediction.warning_signs.map((sign: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-destructive">⚠</span>
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Doctor Note */}
            <section>
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Clinical Note</h2>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-foreground italic">{prediction.doctor_note}</p>
              </div>
            </section>

            {/* Disclaimer */}
            <section className="border-t pt-6">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Important Disclaimer:</strong> This report is generated by an AI system and is intended for educational purposes only. 
                It should not replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other 
                qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Report;
