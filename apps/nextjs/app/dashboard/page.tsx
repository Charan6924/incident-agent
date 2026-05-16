"use client";

import { useEffect, useState } from "react";
import type { Incident } from "@incident-agent/shared";

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    fetch("/api/incidents")
      .then((res) => res.json())
      .then(setIncidents);
  }, []);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem" }}>
      <h1>Incident Dashboard</h1>
      {incidents.length === 0 ? (
        <p>No incidents yet. Waiting for alerts...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
              <th>ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Service</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{inc.id.slice(0, 8)}</td>
                <td>{inc.title}</td>
                <td>{inc.severity}</td>
                <td>{inc.status}</td>
                <td>{inc.service}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
