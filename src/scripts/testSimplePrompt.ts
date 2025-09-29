import * as dotenv from "dotenv"

import * as path from "path"

// Load environment variables BEFORE importing anything else
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

import { InMemoryChatMessageHistory } from "@langchain/core/chat_history"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

const SIMPLE_PROMPT = `You are a helpful shopping assistant. Help users find products and answer questions.`

async function testSimplePrompt() {
  console.log("=== Testing with Simple Prompt ===\n")
  
  const apiKey = process.env.GOOGLE_API_KEY
  
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY not found")
    process.exit(1)
  }
  
  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey,
      temperature: 0.3,
      maxOutputTokens: 2048,
      verbose: true,
    })
    
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SIMPLE_PROMPT],
      new MessagesPlaceholder("history"),
      ["human", "{input}"]
    ])
    
    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser()
    ])
    
    const messageHistory = new InMemoryChatMessageHistory()
    
    const chainWithHistory = new RunnableWithMessageHistory({
      runnable: chain,
      getMessageHistory: () => messageHistory,
      inputMessagesKey: "input",
      historyMessagesKey: "history"
    })
    
    console.log("Testing with simple prompt...")
    console.time("Response Time")
    
    const result = await chainWithHistory.invoke(
      { input: "hello" },
      { configurable: { sessionId: "test123" } }
    )
    
    console.timeEnd("Response Time")
    console.log("\n✓ Response:", result)
    
  } catch (error) {
    console.error("\n❌ Test failed:")
    console.error(error)
  }
  
  console.log("\n=== Test Complete ===")
}

// Run the test
testSimplePrompt().catch(console.error)