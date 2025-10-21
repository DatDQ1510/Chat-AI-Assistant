require("dotenv").config();

async function listModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in .env");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  console.log("✅ API Key found:", apiKey.substring(0, 20) + "...");
  console.log("\n📋 Fetching available models via REST API...\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.models || data.models.length === 0) {
      console.log("❌ No models found. Check if your API key has access to Gemini.");
      return;
    }

    console.log(`✅ Found ${data.models.length} models:\n`);
    
    for (const model of data.models) {
      console.log("─".repeat(60));
      console.log(`📦 ${model.name}`);
      console.log(`   Display Name: ${model.displayName || "N/A"}`);
      console.log(`   Description: ${model.description || "N/A"}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
      console.log(`   Input Token Limit: ${model.inputTokenLimit || "N/A"}`);
      console.log(`   Output Token Limit: ${model.outputTokenLimit || "N/A"}`);
    }
    
    console.log("\n" + "─".repeat(60));
    console.log("\n💡 Models that support streaming generateContent:");
    const streamingModels = data.models.filter(m => 
      m.supportedGenerationMethods?.includes("generateContent")
    );
    
    streamingModels.forEach(m => {
      console.log(`   • ${m.name.replace("models/", "")}`);
    });
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n🔍 Possible issues:");
    console.error("   1. Invalid API key");
    console.error("   2. API key doesn't have access to Gemini");
    console.error("   3. Network/firewall blocking Google APIs");
    console.error("   4. API quota exceeded or billing not enabled");
    console.error("\n📝 Get/verify your API key at: https://makersuite.google.com/app/apikey");
    console.error("📝 Enable Gemini API at: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com");
  }
}

listModels();
