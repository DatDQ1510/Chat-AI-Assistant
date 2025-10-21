const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in .env");
    return;
  }

  console.log("✅ API Key found:", process.env.GEMINI_API_KEY.substring(0, 20) + "...");
  console.log("\n📋 Listing available Gemini models...\n");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const models = await genAI.listModels();
    
    console.log(`✅ Found ${models.length} models:\n`);
    
    for (const model of models) {
      console.log("─".repeat(50));
      console.log(`📦 ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
      console.log(`   Input Token Limit: ${model.inputTokenLimit || "N/A"}`);
      console.log(`   Output Token Limit: ${model.outputTokenLimit || "N/A"}`);
    }
    
    console.log("\n" + "─".repeat(50));
    console.log("\n💡 Recommended models for chat:");
    const chatModels = models.filter(m => 
      m.supportedGenerationMethods?.includes("generateContent") &&
      (m.name.includes("gemini") || m.name.includes("pro"))
    );
    
    chatModels.forEach(m => {
      console.log(`   • ${m.name}`);
    });
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n🔍 Possible issues:");
    console.error("   1. Invalid API key");
    console.error("   2. API key doesn't have access to Gemini models");
    console.error("   3. Network connection issue");
    console.error("   4. API quota exceeded");
    console.error("\n📝 Get a new API key at: https://makersuite.google.com/app/apikey");
  }
}

listModels();
