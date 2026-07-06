import { NextRequest, NextResponse } from "next/server";                                                                                                 
import { runWorkflow, IncidentState } from "@incident-agent/agents";                                                                                     
import { Incident, IncidentEvent, Severity, IncidentStatus } from "@incident-agent/shared";    

const store : Record<number, IncidentState> = {};

export async function POST(request : NextRequest){
    const {source, title, message, service} = await request.json();
    const id = Date.now();
    const now = new Date().toISOString();

    const event : IncidentEvent = {
        id,
        source, 
        title, 
        message,
        severity : Severity.P2,
        service,
        timestamp: now,
    };

    const incident : Incident = {
        id,
        title,
        severity : Severity.P2,
        service,
        status : IncidentStatus.detected,
        events : [event],
        timeline : [],
        createdAt : now,
        updatedAt : now
    };

    const initialState: IncidentState = { incident, status: IncidentStatus.detected, investigationResult: undefined, remediationResult: undefined, postMortem: undefined };

    store[id] = initialState;

    runWorkflow(initialState)
    .then(final => {store[id] = final})
    .catch(err => {console.error(err)})

    return NextResponse.json({ incidentId: id }, { status: 201 });
}
