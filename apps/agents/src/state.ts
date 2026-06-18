import { Annotation } from "@langchain/langgraph";
import { Incident, IncidentStatus, InvestigationResult, RemediationResult, PostMortem } from "@incident-agent/shared"

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


export type IncidentState = typeof IncidentAnnotation.State;   
