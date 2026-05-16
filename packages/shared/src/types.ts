export type Severity = "P0" | "P1" | "P2" | "P3" | "P4";

export type IncidentStatus =
  | "detected"
  | "triaged"
  | "investigating"
  | "remediating"
  | "resolved";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  service: string;
  errorType: string;
  description: string;
  timestamp: string;
  resolvedAt?: string;
  rootCause?: string;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  step: string;
  agent: string;
  detail: string;
  timestamp: string;
}

export interface AlertEvent {
  source: "prometheus" | "grafana" | "datadog" | "custom";
  service: string;
  errorType: string;
  description: string;
  severity: Severity;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface InvestigationResult {
  incidentId: string;
  rootCause: string;
  evidence: {
    logs?: string[];
    metrics?: Record<string, unknown>;
    commits?: string[];
  };
  confidence: number;
}

export interface RemediationPlan {
  incidentId: string;
  action: string;
  requiresApproval: boolean;
  approved?: boolean;
  appliedAt?: string;
}
