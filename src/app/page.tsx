"use client";

import { useState, FormEvent } from "react";

type Part = {
  id: string;
  name: string;
  severity: string;
  description: string;
  oem_status: string;
  oem: string | null;
};

type Report = {
  status: string;
  detected_make: string | null;
  detected_model: string | null;
  detected_year: number | null;
  cost_low: number | null;
  cost_high: number | null;
  error_message: string | null;
  parts: Part[];
};

export default function Home() {
  const [status, setStatus] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setReport(null);
    setStatus("Uploading...");

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/analyze", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setStatus("Error: " + data.error);
      setBusy(false);
      return;
    }

    setStatus("Analyzing photos, this can take up to a minute...");
    poll(data.id);
  }

  function poll(id: string) {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/analysis/${id}`);
      const data: Report = await res.json();

      if (data.status === "COMPLETED") {
        clearInterval(interval);
        setStatus("");
        setReport(data);
        setBusy(false);
      } else if (data.status === "FAILED") {
        clearInterval(interval);
        setStatus("Analysis failed: " + (data.error_message || "unknown error"));
        setBusy(false);
      }
    }, 3000);
  }

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1>AI Car Damage Assessment</h1>
      <p>Upload up to 10 photos of the damaged vehicle. VIN is optional but improves accuracy.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input type="file" name="images" accept="image/*" multiple required />
        <input type="text" name="vin" placeholder="VIN (optional)" maxLength={17} />
        <textarea name="notes" placeholder="Notes (optional) — scratched in a parking lot? Highway damage?" />
        <button type="submit" disabled={busy}>Start AI Analysis</button>
      </form>

      {status && <p style={{ fontWeight: 600 }}>{status}</p>}

      {report && (
        <div style={{ marginTop: 24 }}>
          <h2>
            {[report.detected_year, report.detected_make, report.detected_model]
              .filter(Boolean)
              .join(" ") || "Vehicle not identified"}
          </h2>
          <p>
            Estimated repair cost: <strong>${report.cost_low} - ${report.cost_high}</strong>
          </p>
          <h3>We found {report.parts.length} part(s) that need attention</h3>
          {report.parts.map((p, i) => (
            <div key={p.id} style={{ borderLeft: "4px solid #f5a623", padding: "10px 16px", marginBottom: 10 }}>
              <strong>{i + 1}. {p.name}</strong> — {p.severity}
              <p style={{ margin: "4px 0" }}>{p.description}</p>
              <p style={{ margin: 0, color: "#888", fontSize: 13 }}>
                OEM: {p.oem_status === "PENDING" ? "Pending" : p.oem}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
