export * from "./types"

export enum Severity{
    P0 = "P0",
    P1 = "P1",
    P2 = "P2",
    P3 = "P3",
    P4 = "P4",
}

export enum IncidentStatus{
    detected = "detected",
    triaged = "triaged",
    investigating = "investigating",
    remediating = "remediating",
    resolved = "resolved",
    closed = "closed"
}

export enum EventSource{
    prometheus = "prometheus",
    datadog = "datadog",
    grafana = "grafana",
    custom = "custom"
}

export interface MetaData{
    // TODO
}

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

export interface TimeLineEntry{
    type: string,
    timestamp : string,
    agent : string,
    message : string,
    data? : unknown
}

export interface AgentState{
    incident : Incident,
    status : IncidentStatus,
    investigationResult? : InvestigationResult,
    remediationResult? : RemediationResult,
    postMortem? : PostMortem
}

export interface InvestigationResult{
    rootCause : string,
    evidence : string[],
    confidence : number, //0-1
    summary : string,
}

export interface RemediationResult{
    action : string,
    status : "pending" | "applied" | "failed" | "skipped",
    details? : string,
}

export interface PostMortem{
    timeline : TimeLineEntry[],
    rootCause : string,
    blastRadius : string[],
    remediationSteps : string[],
    lessons : string[],
}

export interface SlackMessage{
    channel : string,
    text : string,
    blocks? : unknown[];
}

export interface KafkaMessage{
    topic : string,
    key? : string,
    value : unknown
}
