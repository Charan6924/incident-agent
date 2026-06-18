import {ChatOpenAI} from "@langchain/openai"

export const llm = new ChatOpenAI({
    model : "deepseek-v4-flash",
    configuration : {
        baseUrl : "https://api.deepseek.com",
    },
    apiKey : process.env.DEEPSEEK_API_KEY
})
