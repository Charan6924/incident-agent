import {ChatOpenAI} from "@langchain/openai"

/** Shared DeepSeek V4 Flash LLM instance used by all agent nodes. */
export const llm = new ChatOpenAI({
    model : "deepseek-v4-flash",
    configuration : {
        baseURL : "https://api.deepseek.com",
    },
    apiKey : process.env.DEEPSEEK_API_KEY
})
