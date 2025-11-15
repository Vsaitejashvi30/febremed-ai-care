-- Create prescription_uploads table
CREATE TABLE public.prescription_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.fever_assessments(id) ON DELETE CASCADE,
  image_url TEXT,
  extracted_text TEXT,
  medication_name VARCHAR(255),
  medication_type VARCHAR(100),
  dosage VARCHAR(255),
  frequency VARCHAR(255),
  duration_days INTEGER,
  gemini_confidence VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.prescription_uploads ENABLE ROW LEVEL SECURITY;

-- Open policies for demo usage
CREATE POLICY "Anyone can view prescription uploads"
  ON public.prescription_uploads FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert prescription uploads"
  ON public.prescription_uploads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update prescription uploads"
  ON public.prescription_uploads FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete prescription uploads"
  ON public.prescription_uploads FOR DELETE
  USING (true);

-- Index for assessment lookups
CREATE INDEX idx_prescription_assessment
  ON public.prescription_uploads(assessment_id);
