export * from "./types"

/** Severity level of an incident (P0 = critical, P4 = low). */
export enum Severity{
    P0 = "P0",
    P1 = "P1",
    P2 = "P2",
    P3 = "P3",
    P4 = "P4",
}

/** Lifecycle status of an incident as it moves through the agent workflow. */
export enum IncidentStatus{
    detected = "detected",
    triaged = "triaged",
    investigating = "investigating",
    remediating = "remediating",
    resolved = "resolved",
    closed = "closed"
}

/** Source systems that can fire incident alerts. */
export enum EventSource{
    prometheus = "prometheus",
    datadog = "datadog",
    grafana = "grafana",
    custom = "custom"
}

/** Flexible metadata attached to an incident event. */
export interface MetaData{
    // TODO
}

/** A raw alert event from a monitoring source (Prometheus, Datadog, etc.). */
export interface IncidentEvent{
    id : number,
    source : string,
    title : string,
    message : string,
    severity : Severity,
    service : string,
    timestamp : string,
    metadata? : MetaData
}

/** Aggregated incident record that accumulates state as it progresses. */
export interface Incident{
    id : number,
    title : string,
    severity : Severity,
    service : string,
    status: IncidentStatus,
    events : IncidentEvent[],
    timeline : TimeLineEntry[],
    createdAt : string,
    updatedAt : string,
    resolvedAt? : string
}

/** A single entry in the incident timeline (agent action, status change, etc.). */
export interface TimeLineEntry{
    type: string,
    timestamp : string,
    agent : string,
    message : string,
    data? : unknown
}

/** The full state object passed through the LangGraph agent workflow. */
export interface AgentState{
    incident : Incident,
    status : IncidentStatus,
    investigationResult? : InvestigationResult,
    remediationResult? : RemediationResult,
    postMortem? : PostMortem
}

/** Result produced by the investigation agent after analyzing an incident. */
export interface InvestigationResult{
    rootCause : string,
    evidence : string[],
    confidence : number, //0-1
    summary : string,
}

/** Result produced by the remediation agent after applying or suggesting a fix. */
export interface RemediationResult{
    action : string,
    status : "pending" | "applied" | "failed" | "skipped",
    details? : string,
}

/** Post-mortem report compiled after an incident is resolved. */
export interface PostMortem{
    timeline : TimeLineEntry[],
    rootCause : string,
    blastRadius : string[],
    remediationSteps : string[],
    lessons : string[],
}

/** Message payload for Slack webhook notifications. */
export interface SlackMessage{
    channel : string,
    text : string,
    blocks? : unknown[];
}

/** Message payload for Upstash Kafka event publishing. */
export interface KafkaMessage{
    topic : string,
    key? : string,
    value : unknown
}
