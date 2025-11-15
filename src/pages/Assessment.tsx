import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { PrescriptionUploader, MedicationData } from "@/components/PrescriptionUploader";

const SYMPTOMS = [
  "Body ache",
  "Headache",
  "Cough",
  "Sore throat",
  "Rash",
  "Nausea",
  "Vomiting",
  "Chills",
  "Fatigue"
];

const COMORBIDITIES = ["Diabetes", "Hypertension", "Asthma", "Other"];

const LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Kolkata", "Hyderabad"];

const Assessment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    temperature: "",
    duration: "",
    medicationType: "",
    medicationName: "",
    age: "",
    location: "",
    daysOnMedication: "",
    compliance: 80,
    symptoms: [] as string[],
    comorbidities: [] as string[],
  });
  const [prescriptionData, setPrescriptionData] = useState<MedicationData | null>(null);

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleComorbidityToggle = (comorbidity: string) => {
    setFormData(prev => ({
      ...prev,
      comorbidities: prev.comorbidities.includes(comorbidity)
        ? prev.comorbidities.filter(c => c !== comorbidity)
        : [...prev.comorbidities, comorbidity]
    }));
  };

  const handleMedicationExtracted = (data: MedicationData) => {
    setFormData(prev => ({
      ...prev,
      medicationType: data.medication_type.toLowerCase(),
      medicationName: data.medication_name ?? "",
    }));
    setPrescriptionData(data);
    const medName = data.medication_name || 'Medication';
    const confidenceLabel = data.confidence.charAt(0).toUpperCase() + data.confidence.slice(1);
    toast.success(`${medName} identified (${data.medication_type}) — confidence ${confidenceLabel}`);
  };

  const handleExtractionError = (message: string) => {
    setPrescriptionData(null);
    toast.error(message);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.temperature || !formData.duration || !formData.medicationType || 
        !formData.age || !formData.location || !formData.daysOnMedication) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.symptoms.length === 0) {
      toast.error("Please select at least one symptom");
      return;
    }

    setLoading(true);

    try {
      const medicationTypeLabel = formData.medicationType
        ? formData.medicationType.charAt(0).toUpperCase() + formData.medicationType.slice(1)
        : "";

      // Call the edge function for AI analysis
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('analyze-fever', {
        body: { 
          patientData: {
            temperature: parseFloat(formData.temperature),
            duration: parseInt(formData.duration),
            medicationType: medicationTypeLabel,
            medicationName: formData.medicationName,
            age: parseInt(formData.age),
            location: formData.location,
            daysOnMedication: parseInt(formData.daysOnMedication),
            compliance: formData.compliance,
            symptoms: formData.symptoms,
            comorbidities: formData.comorbidities
          }
        }
      });

      if (aiError) throw aiError;
      if (!aiResponse) throw new Error("No response from AI analysis");

      // Save assessment to database
      const { data: assessment, error: assessmentError } = await supabase
        .from('fever_assessments')
        .insert({
          temperature: parseFloat(formData.temperature),
          duration_days: parseInt(formData.duration),
          medication_type: formData.medicationType,
          age: parseInt(formData.age),
          location: formData.location,
          days_on_medication: parseInt(formData.daysOnMedication),
          medication_compliance: formData.compliance,
          comorbidities: formData.comorbidities,
          decision: aiResponse.decision,
          recovery_probability: aiResponse.recovery_probability,
          confidence: aiResponse.confidence,
          risk_assessment: aiResponse.risk_assessment
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Save symptoms
      const symptomInserts = formData.symptoms.map(symptom => ({
        assessment_id: assessment.id,
        symptom_name: symptom,
        severity: 'moderate'
      }));

      const { error: symptomsError } = await supabase
        .from('symptom_logs')
        .insert(symptomInserts);

      if (symptomsError) throw symptomsError;

      // Save prediction details
      const { error: predictionError } = await supabase
        .from('predictions')
        .insert({
          assessment_id: assessment.id,
          recovery_probability: aiResponse.recovery_probability,
          confidence_score: aiResponse.confidence,
          explanation: aiResponse.explanation,
          key_factors: aiResponse.key_factors,
          next_steps: aiResponse.next_steps,
          warning_signs: aiResponse.warning_signs,
          doctor_note: aiResponse.doctor_note
        });

      if (predictionError) throw predictionError;

      if (prescriptionData) {
        const durationValue = prescriptionData.duration_days;
        const parsedDuration = typeof durationValue === 'number' && Number.isFinite(durationValue)
          ? Math.round(durationValue)
          : null;

        const { error: prescriptionError } = await supabase
          .from('prescription_uploads')
          .insert({
            assessment_id: assessment.id,
            image_url: null,
            extracted_text: prescriptionData.extracted_text,
            medication_name: prescriptionData.medication_name || null,
            medication_type: prescriptionData.medication_type,
            dosage: prescriptionData.dosage,
            frequency: prescriptionData.frequency,
            duration_days: parsedDuration,
            gemini_confidence: prescriptionData.confidence,
          });

        if (prescriptionError) {
          console.error('Prescription save error:', prescriptionError);
          toast.warning('Assessment saved, but prescription details could not be stored.');
        }
      }

      toast.success("Assessment completed successfully!");
      navigate(`/results/${assessment.id}`);
    } catch (error: any) {
      console.error('Assessment error:', error);
      toast.error(error.message || "Failed to complete assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-secondary/30 via-secondary/15 to-transparent pointer-events-none" />
      
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 hover:bg-secondary/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card className="border-2 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b">
              <CardTitle className="text-3xl font-bold text-foreground">Fever Assessment</CardTitle>
              <CardDescription className="text-base mt-2">
                Please provide accurate information for the best analysis
              </CardDescription>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Current Temperature (°C) *</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="38.5"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Fever Duration (days) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="3"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age (years) *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="35"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daysOnMedication">Days on Medication *</Label>
                  <Input
                    id="daysOnMedication"
                    type="number"
                    placeholder="2"
                    value={formData.daysOnMedication}
                    onChange={(e) => setFormData({ ...formData, daysOnMedication: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                  <h2 className="text-lg font-semibold mb-2 text-foreground">Option 1: Upload Prescription</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Have a prescription photo? Upload it and we will try to extract the medication details automatically.
                  </p>
                  <PrescriptionUploader
                    onMedicationExtracted={handleMedicationExtracted}
                    onError={handleExtractionError}
                  />
                </div>

                <div className="relative py-2">
                  <Separator className="my-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-3 bg-background text-sm text-slate-500">OR</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicationType">Medication Type *</Label>
                    <Select value={formData.medicationType} onValueChange={(value) => setFormData({ ...formData, medicationType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select medication" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="antipyretic">Antipyretic (Fever Medicine)</SelectItem>
                        <SelectItem value="antibiotic">Antibiotic</SelectItem>
                        <SelectItem value="antiviral">Antiviral</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicationName">Medication Name</Label>
                    <Input
                      id="medicationName"
                      type="text"
                      placeholder="e.g., Paracetamol 500mg"
                      value={formData.medicationName}
                      onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medication Compliance: {formData.compliance}%</Label>
                <Slider
                  value={[formData.compliance]}
                  onValueChange={(value) => setFormData({ ...formData, compliance: value[0] })}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Symptoms *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SYMPTOMS.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={formData.symptoms.includes(symptom)}
                        onCheckedChange={() => handleSymptomToggle(symptom)}
                      />
                      <Label htmlFor={symptom} className="cursor-pointer text-sm">{symptom}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comorbidities (optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {COMORBIDITIES.map((comorbidity) => (
                    <div key={comorbidity} className="flex items-center space-x-2">
                      <Checkbox
                        id={comorbidity}
                        checked={formData.comorbidities.includes(comorbidity)}
                        onCheckedChange={() => handleComorbidityToggle(comorbidity)}
                      />
                      <Label htmlFor={comorbidity} className="cursor-pointer text-sm">{comorbidity}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {prescriptionData && (
                <div className="rounded-lg border-l-4 border-primary bg-primary/10 p-4 text-foreground shadow-sm">
                  <h3 className="font-semibold mb-2 text-primary">Prescription Analyzed</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Medication:</strong> {prescriptionData.medication_name || 'Not detected'}</p>
                    <p><strong>Type:</strong> {prescriptionData.medication_type}</p>
                    {prescriptionData.dosage && (
                      <p><strong>Dosage:</strong> {prescriptionData.dosage}</p>
                    )}
                    {prescriptionData.frequency && (
                      <p><strong>Frequency:</strong> {prescriptionData.frequency}</p>
                    )}
                    {typeof prescriptionData.duration_days === 'number' && Number.isFinite(prescriptionData.duration_days) && (
                      <p><strong>Duration:</strong> {prescriptionData.duration_days} days</p>
                    )}
                    <p className="text-xs mt-2 text-muted-foreground">Confidence: {prescriptionData.confidence.charAt(0).toUpperCase() + prescriptionData.confidence.slice(1)}</p>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  'Analyze My Symptoms'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Assessment;
