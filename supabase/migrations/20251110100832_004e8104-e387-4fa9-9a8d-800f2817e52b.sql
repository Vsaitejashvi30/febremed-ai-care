-- Create fever assessments table
CREATE TABLE public.fever_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature DECIMAL(4,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  medication_type TEXT NOT NULL,
  age INTEGER NOT NULL,
  location TEXT NOT NULL,
  days_on_medication INTEGER NOT NULL,
  medication_compliance INTEGER NOT NULL CHECK (medication_compliance >= 0 AND medication_compliance <= 100),
  comorbidities TEXT[],
  decision TEXT,
  recovery_probability DECIMAL(5,4),
  confidence DECIMAL(5,4),
  risk_assessment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create symptom logs table
CREATE TABLE public.symptom_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.fever_assessments(id) ON DELETE CASCADE NOT NULL,
  symptom_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.fever_assessments(id) ON DELETE CASCADE NOT NULL,
  recovery_probability DECIMAL(5,4) NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL,
  explanation TEXT NOT NULL,
  key_factors TEXT[],
  next_steps TEXT[],
  warning_signs TEXT[],
  doctor_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.fever_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fever_assessments (allow public access for demo)
CREATE POLICY "Anyone can view assessments"
  ON public.fever_assessments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create assessments"
  ON public.fever_assessments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their assessments"
  ON public.fever_assessments FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete assessments"
  ON public.fever_assessments FOR DELETE
  USING (true);

-- RLS Policies for symptom_logs
CREATE POLICY "Anyone can view symptom logs"
  ON public.symptom_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create symptom logs"
  ON public.symptom_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for predictions
CREATE POLICY "Anyone can view predictions"
  ON public.predictions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_fever_assessments_user_id ON public.fever_assessments(user_id);
CREATE INDEX idx_fever_assessments_created_at ON public.fever_assessments(created_at DESC);
CREATE INDEX idx_symptom_logs_assessment_id ON public.symptom_logs(assessment_id);
CREATE INDEX idx_predictions_assessment_id ON public.predictions(assessment_id);