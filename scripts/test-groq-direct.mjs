import Groq from "groq-sdk";

const groq = new Groq({
  apiKey:process.env.GROQ_API_KEY,
});

async function testGptOss() {
  for (const model of ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]) {
    try {
      console.log(`Testing model: ${model}...`);
      const res = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: "You are SpendWise AI. Confirm you are operational in 1 short sentence." }],
      });
      console.log(`✓ ${model} works! Output:`, res.choices[0]?.message?.content);
      return model;
    } catch (e) {
      console.error(`✗ ${model} failed:`, e.message);
    }
  }
}

testGptOss();
