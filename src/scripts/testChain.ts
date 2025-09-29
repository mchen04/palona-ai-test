import * as path from "path"

import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import * as dotenv from "dotenv"


// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function testChain() {
  console.log("=== Testing LangChain Chain ===\n")
  
  const apiKey = process.env.GOOGLE_API_KEY
  
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY not found")
    process.exit(1)
  }
  
  // Test 1: Simple chain without history
  console.log("1. Testing simple chain without history...")
  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey,
      temperature: 0.3,
      maxOutputTokens: 100,
      verbose: true,
    })
    
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful assistant."],
      ["human", "{input}"]
    ])
    
    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser()
    ])
    
    const result = await chain.invoke({
      input: "Say 'Hello from simple chain' and nothing else"
    })
    
    console.log(`✓ Simple chain successful. Response: ${result}`)
  } catch (error) {
    console.error("❌ Simple chain failed:")
    console.error(error)
  }
  
  // Test 2: Chain with MessagesPlaceholder (simulating history)
  console.log("\n2. Testing chain with MessagesPlaceholder...")
  try {
    const { MessagesPlaceholder } = await import("@langchain/core/prompts")
    const { HumanMessage, AIMessage } = await import("@langchain/core/messages")
    
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey,
      temperature: 0.3,
      maxOutputTokens: 100,
      verbose: true,
    })
    
    const promptWithHistory = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful assistant."],
      new MessagesPlaceholder("history"),
      ["human", "{input}"]
    ])
    
    const chain = RunnableSequence.from([
      promptWithHistory,
      model,
      new StringOutputParser()
    ])
    
    // Simulate some history
    const history = [
      new HumanMessage("Hi there"),
      new AIMessage("Hello! How can I help you today?")
    ]
    
    const result = await chain.invoke({
      input: "Say 'History test successful' and nothing else",
      history
    })
    
    console.log(`✓ Chain with history successful. Response: ${result}`)
  } catch (error) {
    console.error("❌ Chain with history failed:")
    console.error(error)
  }
  
  // Test 3: Test with RunnableWithMessageHistory
  console.log("\n3. Testing RunnableWithMessageHistory...")
  try {
    const { RunnableWithMessageHistory } = await import("@langchain/core/runnables")
    const { InMemoryChatMessageHistory } = await import("@langchain/core/chat_history")
    const { MessagesPlaceholder } = await import("@langchain/core/prompts")
    
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey,
      temperature: 0.3,
      maxOutputTokens: 100,
      verbose: true,
    })
    
    const promptWithHistory = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful assistant."],
      new MessagesPlaceholder("history"),
      ["human", "{input}"]
    ])
    
    const chain = RunnableSequence.from([
      promptWithHistory,
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
    
    console.log("Invoking chain with history...")
    
    // Add timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout after 10 seconds")), 10000)
    })
    
    const result = await Promise.race([
      chainWithHistory.invoke(
        { input: "Say 'RunnableWithMessageHistory works!' and nothing else" },
        { configurable: { sessionId: "test123" } }
      ),
      timeoutPromise
    ])
    
    console.log(`✓ RunnableWithMessageHistory successful. Response: ${result}`)
  } catch (error) {
    console.error("❌ RunnableWithMessageHistory failed:")
    console.error(error)
  }
  
  console.log("\n=== Test Complete ===")
}

// Run the test
testChain().catch(console.error)