import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1>AI Incident Response Platform</h1>
      <p>
        Multi-agent system that autonomously responds to production incidents.
      </p>
      <nav style={{ marginTop: "2rem" }}>
        <Link href="/dashboard">View Dashboard →</Link>
      </nav>
    </main>
  );
}
