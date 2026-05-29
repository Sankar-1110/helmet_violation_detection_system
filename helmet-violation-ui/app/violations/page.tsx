"use client";

import { useState, useEffect } from "react";
import { Badge } from "../../components/Badge";
import { fetchViolations } from "../../lib/api";

export default function Violations() {
  const [helmetFilter, setHelmetFilter] = useState("all");
  const [ocrFilter, setOcrFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [violations, setViolations] = useState<any[]>([]);

  useEffect(() => {
    fetchViolations()
      .then(setViolations) // ✅ already normalized to array
      .catch(console.error);
  }, []);

  const filteredViolations = violations.filter((v) => {
    const helmetMatch =
      helmetFilter === "all" || v.helmet === helmetFilter;

    const ocrMatch =
      ocrFilter === "all" || v.ocr_status === ocrFilter;

    const searchMatch =
      v.plate_number.toLowerCase().includes(search.toLowerCase());

    return helmetMatch && ocrMatch && searchMatch;
  });

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Violations</h2>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded shadow mb-4 flex flex-col md:flex-row gap-4">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={helmetFilter}
          onChange={(e) => setHelmetFilter(e.target.value)}
        >
          <option value="all">All Helmets</option>
          <option value="helmet">Helmet</option>
          <option value="no_helmet">No Helmet</option>
        </select>

        <select
          className="border rounded px-3 py-2 text-sm"
          value={ocrFilter}
          onChange={(e) => setOcrFilter(e.target.value)}
        >
          <option value="all">All OCR</option>
          <option value="readable">Readable</option>
          <option value="unreadable">Unreadable</option>
        </select>

        <input
          type="text"
          placeholder="Search plate number..."
          className="border rounded px-3 py-2 text-sm flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">Plate</th>
              <th className="p-3 text-left">Helmet</th>
              <th className="p-3 text-left">OCR</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Notification</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredViolations.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-gray-500"
                >
                  No violations match the selected filters.
                </td>
              </tr>
            ) : (
              filteredViolations.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="p-3">
                    <img
                      src={v.image_path}
                      alt="plate"
                      className="w-20 h-auto rounded border"
                    />
                  </td>

                  <td className="p-3">{v.plate_number}</td>

                  <td className="p-3">
                    <Badge type={v.helmet} />
                  </td>

                  <td className="p-3">
                    {v.ocr_status === "readable" ? (
                      <span className="text-green-600">
                        Readable
                      </span>
                    ) : (
                      <span className="text-yellow-600">
                        Unreadable
                      </span>
                    )}
                  </td>

                  <td className="p-3">{v.time}</td>
                  <td className="p-3">
                    {v.notification === "sent" && (
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                        SMS Sent
                      </span>
                    )}
                    {v.notification === "vehicle_not_found" && (
                      <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                  
                        Vehicle Not Found
                      </span>
                    )}
                  
                    {v.notification === "not_sent" && (
                      <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
                        Not Sent
                      </span>
                    )}
                  </td>

                 

                  <td className="p-3">
                    <a
                      href={`/violations/${v.id}`}
                      className="text-blue-600"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
