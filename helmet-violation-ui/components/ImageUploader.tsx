"use client";

import { useState } from "react";

interface ImageUploaderProps {
  onStart?: () => void;
  onResult?: (data: any) => void;
}

export default function ImageUploader({
  onStart,
  onResult,
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    onStart?.();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://127.0.0.1:8000/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Detection failed");
      }

      const data = await res.json();

      onResult?.(data);
    } catch (err) {
      console.error(err);
      setError("Failed to process image. Please try again.");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h3 className="font-semibold mb-4">
        Upload Image for Detection
      </h3>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border rounded p-2 text-sm w-full md:w-auto"
        />

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`px-4 py-2 rounded text-white text-sm transition ${
            uploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {uploading ? "Detecting..." : "Start Detection"}
        </button>
      </div>

      {/* Selected File */}
      {file && !uploading && (
        <p className="text-sm text-gray-600 mt-3">
          Selected: <span className="font-medium">{file.name}</span>
        </p>
      )}

      {/* Loading Indicator */}
      {uploading && (
        <div className="flex items-center gap-3 mt-4">
          <div className="w-5 h-5 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

          <div>
            <p className="text-sm font-medium text-gray-700">
              Processing image...
            </p>

            <p className="text-xs text-blue-600 animate-pulse">
              Detecting helmet violations and reading number plates
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm mt-3">
          {error}
        </p>
      )}
    </div>
  );
}