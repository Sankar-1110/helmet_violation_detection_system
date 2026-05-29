"use client";

import { useEffect, useState } from "react";
import ImageUploader from "../components/ImageUploader";
import { StatCard } from "../components/StatCard";

export default function Dashboard() {
  const [violations, setViolations] = useState<any[]>([]);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* =========================
     RESTORE AFTER REFRESH
  ========================= */
  useEffect(() => {
    const savedViolations = localStorage.getItem("violations");
    const savedImage = localStorage.getItem("finalImage");

    if (savedViolations) {
      setViolations(JSON.parse(savedViolations));
    }
    if (savedImage) {
      setFinalImage(savedImage);
    }
  }, []);

  /* =========================
     STATS
  ========================= */
  const noHelmet = violations.filter(v => v.helmet === "no_helmet").length;
  const unreadable = violations.filter(v => v.ocrStatus === "unreadable").length;
  const confirmed = violations.filter(
    v => v.helmet === "no_helmet" 
  ).length;

  /* =========================
     NEW DETECTION HANDLER
  ========================= */
  const handleStartDetection = () => {
    // 🧹 CLEAR PREVIOUS DATA
    localStorage.removeItem("violations");
    localStorage.removeItem("finalImage");

    setViolations([]);
    setFinalImage(null);
    setLoading(true);
  };

  const handleDetectionResult = (data: any) => {
  const newViolations = data.violations || [];

  const imageUrl = data.final_image|| null;

  setViolations(newViolations);
  setFinalImage(imageUrl);

  localStorage.setItem("violations", JSON.stringify(newViolations));
  if (imageUrl) {
    localStorage.setItem("finalImage", imageUrl);
  }

  setLoading(false);
};

  return (
    <>
      <h2 className="text-xl font-semibold mb-6">Dashboard</h2>

      {/* IMAGE UPLOADER */}
      <ImageUploader
        onStart={handleStartDetection}
        onResult={handleDetectionResult}
      />

      {loading && (
        <p className="text-blue-600 font-medium mt-4">
          Detecting violations…
        </p>
      )}

    

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
       
        <StatCard title="No Helmet Detected" value={noHelmet.toString()} />
        <StatCard title="Unreadable Plates" value={unreadable.toString()} />
        <StatCard title="Confirmed Violations" value={confirmed.toString()} />
         <StatCard title="Images Processed" value='1' />
      </div>
        {/* FINAL IMAGE */}
      {finalImage && (
        <div className="bg-white p-4 rounded shadow mt-6">
          <h3 className="font-semibold mb-2">Final Detection Result</h3>
          <img
            src={finalImage}
            alt="Detection result"
            className="w-full rounded border"
          />
        </div>
      )}
    </>
  );
}
