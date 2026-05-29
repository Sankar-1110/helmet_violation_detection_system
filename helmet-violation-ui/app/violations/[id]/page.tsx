"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchViolations } from "../../../lib/api";

export default function ViolationDetail() {
  const { id } = useParams();
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViolations()
      .then((list) => {
        setViolations(list); // ✅ guaranteed array
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading violation...</p>;
  }

  const violation = violations.find((v) => String(v.id) === String(id));

  if (!violation) {
    return <p className="text-red-600">Violation not found</p>;
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Violation Details</h2>
         
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IMAGE */}
        <div className="bg-white p-4 rounded shadow">
          <img
              src={violation.image_path}
            alt="Violation"
            className="rounded w-full object-contain"
          />
        </div>

        {/* DETAILS */}
        <div className="bg-white p-4 rounded shadow space-y-2 text-sm">
          <p><b>Plate:</b> {violation.plate}</p>
          <p><b>Helmet:</b> {violation.helmet.replace("_", " ")}</p>
          <p><b>OCR Status:</b> {violation.ocrStatus}</p>
          <p><b>Confidence:</b> {violation.confidence}</p>
          <p><b>Time:</b> {violation.time}</p>

          <div className="flex gap-3 mt-4">
            <button className="bg-green-600 text-white px-4 py-2 rounded">
              Confirm
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded">
              Reject
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
