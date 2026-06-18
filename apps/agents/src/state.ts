import { Annotation } from "@langchain/langgraph";
import { Incident, IncidentStatus, InvestigationResult, RemediationResult, PostMortem } from "@incident-agent/shared"

/** LangGraph state annotation defining the incident workflow state channels. */
export const IncidentAnnotation = Annotation.Root({
    incident : Annotation<Incident>({
        reducer : (prev, next) => next ?? prev,
    }),
    status : Annotation<IncidentStatus>({
        reducer : (prev, next) => next ?? prev,
        default : () => IncidentStatus.detected,
    }),
    investigationResult: Annotation<InvestigationResult | undefined>({                                                                    
      reducer: (prev, next) => next ?? prev,                                                                                              
      default: () => undefined,                                                                                                           
    }),                                                                                                                                   
    remediationResult: Annotation<RemediationResult | undefined>({                                                                        
      reducer: (prev, next) => next ?? prev,                                                                                              
      default: () => undefined,                                                                                                           
    }),                                                                                                                                   
    postMortem: Annotation<PostMortem | undefined>({                                                                                      
      reducer: (prev, next) => next ?? prev,                                                                                              
      default: () => undefined,                                                                                                           
    }), 
});


/** Inferred state type for node function signatures. */
export type IncidentState = typeof IncidentAnnotation.State;
