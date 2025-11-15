import { ChangeEvent, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MedicationConfidence = "high" | "medium" | "low";
export type MedicationCategory = "Antipyretic" | "Antibiotic" | "Antiviral" | "Other";

export interface MedicationData {
  medication_name: string;
  medication_type: MedicationCategory;
  dosage: string | null;
  frequency: string | null;
  duration_days: number | null;
  confidence: MedicationConfidence;
  extracted_text: string;
}

interface PrescriptionUploaderProps {
  onMedicationExtracted: (data: MedicationData) => void;
  onError: (error: string) => void;
}

const MEDICATION_TYPE_MAP: Record<string, MedicationCategory> = {
  antipyretic: "Antipyretic",
  antibiotic: "Antibiotic",
  antiviral: "Antiviral",
  other: "Other",
};

export function PrescriptionUploader({
  onMedicationExtracted,
  onError,
}: PrescriptionUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      onError("Please select a valid image file");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onError("Please select an image first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch("/api/extract-medication", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = payload?.error ?? "Failed to extract medication";
        throw new Error(errorMessage);
      }

      if (!payload?.success || !payload.medication_data) {
        throw new Error("Unexpected response from extraction service");
      }

      const rawData = payload.medication_data;
      const durationValue = rawData.duration_days;
      let parsedDuration: number | null = null;

      if (durationValue !== null && durationValue !== undefined && durationValue !== "") {
        const numericDuration = Number(durationValue);
        parsedDuration = Number.isFinite(numericDuration) ? numericDuration : null;
      }

      const confidenceLower = typeof rawData.confidence === "string"
        ? rawData.confidence.toLowerCase()
        : "low";

      const medicationTypeValue = typeof rawData.medication_type === "string"
        ? MEDICATION_TYPE_MAP[rawData.medication_type.trim().toLowerCase()] ?? "Other"
        : "Other";

      const normalizedData: MedicationData = {
        medication_name: typeof rawData.medication_name === "string" ? rawData.medication_name.trim() : "",
        medication_type: medicationTypeValue,
        dosage: rawData.dosage ? String(rawData.dosage).trim() : null,
        frequency: rawData.frequency ? String(rawData.frequency).trim() : null,
        duration_days: parsedDuration,
        confidence: ["high", "medium", "low"].includes(confidenceLower)
          ? (confidenceLower as MedicationConfidence)
          : "low",
        extracted_text: rawData.extracted_text ?? payload?.extracted_text ?? "",
      };

      onMedicationExtracted(normalizedData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-xl font-semibold mb-4 text-slate-900 flex items-center gap-2">
        <span role="img" aria-label="camera">📷</span>
        Upload Prescription
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select prescription image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={loading}
        />
      </div>

      {preview && (
        <div className="mb-4">
          <img
            src={preview}
            alt="Prescription preview"
            className="w-full h-40 object-cover rounded-md border border-slate-200"
          />
          {selectedFile && (
            <p className="mt-2 text-xs text-slate-500 truncate">{selectedFile.name}</p>
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Extract Medication
          </>
        )}
      </Button>

      <p className="text-xs text-slate-500 mt-3 text-center">
        Upload a clear prescription photo. We will extract the medication details automatically.
      </p>
    </div>
  );
}
