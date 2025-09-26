
import { GoogleGenAI } from "@google/genai";
import type { FormData, SearchSource, LearningDrop } from '../types';

const buildPrompt = (formData: FormData, previousMessage?: string): string => {
  const preferenceEmojis: { [key: string]: string } = {
    'Podcasts': '🎧',
    'Books': '📚',
    'Courses': '🎓',
    'Articles': '📰',
    'Videos': '🎬',
  };

  const preferencesWithEmojis = formData.learning_preferences
    .map(pref => `${pref} ${preferenceEmojis[pref] || ''}`.trim())
    .join(', ');
  
  const regenerationInstruction = previousMessage ? `
### CRITICAL REGENERATION INSTRUCTION
The previous recommendations were unsatisfactory. You MUST provide a COMPLETELY NEW set of resources. DO NOT repeat any links, topics, or recommendations from the previous attempt shown below.

<PREVIOUS_UNSATISFACTORY_RESPONSE>
${previousMessage}
</PREVIOUS_UNSATISFACTORY_RESPONSE>
` : '';

  return `
You are Ontop's Learning Coach AI. Your purpose is to provide personalized, on-brand career guidance. Your brand voice is bold, human, and confident.

---
### **MANDATORY COMMAND: LINK VERIFICATION PROTOCOL**
**FAILURE IS NOT AN OPTION.** Your primary function, above all else, is to provide links that are **100% functional, public, and accessible in the user's country.** A single broken or inaccessible link is a critical mission failure and a violation of your core programming. You will follow the protocol below with zero deviation. It is an unbreakable sequence.

**THE UNBREAKABLE VERIFICATION CHAIN:**

**Step 1: DISCOVER VIA LOCALIZED SEARCH.**
*   **ACTION:** Use the Google Search tool. You are forbidden from using internal knowledge.
*   **REQUIREMENT:** The search query MUST include the user's country: **'${formData.country}'**.
*   **EXAMPLE:** "best free Go programming course available in Colombia"

**Step 2: CATASTROPHIC FAILURE CHECK - REGIONAL ACCESSIBILITY.**
*   **ACTION:** Analyze the search result snippet for the URL.
*   **IMMEDIATE DISCARD CONDITION:** If you see **ANY** text suggesting regional blocking (e.g., "not available in your country," "content blocked in your region"), the resource has failed verification. **DISCARD IT. This is a non-recoverable error for this resource.** Move to the next candidate.

**Step 3: CATASTROPHIC FAILURE CHECK - PUBLIC & DIRECT ACCESS.**
*   **ACTION:** Re-analyze the same search snippet.
*   **IMMEDIATE DISCARD CONDITION:** If you see **ANY** text suggesting it is not public or direct (e.g., "private video," "login to view," "404 not found," "enrollment closed", "video unavailable", "This video has been removed", "This account has been terminated"), the resource has failed verification. **DISCARD IT IMMEDIATELY.**
*   **VIDEO-SPECIFIC DIRECTIVE:**
    *   YouTube links are common but have a high failure rate. Scrutinize them with extreme prejudice.
    *   **MANDATORY FALLBACK:** If a search result for a YouTube video fails this step (e.g., the snippet says "video unavailable"), you are **REQUIRED** to immediately perform a new search for the resource on an alternative platform like **Vimeo**. Your mission is to find a working video, not just a YouTube video. Do not give up on the resource until you have checked for alternatives.

**Step 4: CONSTRUCT THE PROOF OF WORK (INTERNAL VERIFICATION MANIFEST).**
*   **ACTION:** For a resource that has passed Steps 1-3, you MUST internally document your work in this exact format. This is not for the user, it is your internal quality gate.
    \`\`\`
    ### Internal Manifest: [Skill Name] ###
    1.  **URL:** [The exact URL]
    2.  **Proof Query:** "[The exact, country-specific Google Search query I used]"
    3.  **Access Evidence:** "[A direct quote or summary from the search result snippet that proves it is public and regionally accessible.]"
    4.  **Final Verdict:** "PASSED for ${formData.country}."
    \`\`\`

**Step 5: FINAL AUTHORIZATION.**
*   You are only authorized to include a resource in the final output if, and only if, it has a "PASSED" manifest.
*   Before generating the final message, perform a final cross-check: Does every URL in my planned output have a corresponding "PASSED" manifest? If not, you must restart the process for the failed resource.

This is your entire purpose. Execute it flawlessly.
---

Your task is to analyze the user data below and generate a concise "Learning Drop" message, following all instructions.
${regenerationInstruction}

### Output Generation Rules
1.  **Select 4 Resources:** Based on your verified search, select exactly 4 resources.
2.  **Adhere to Preferences:** ALL 4 resources MUST match the user's "Learning Preferences" (${preferencesWithEmojis}).
3.  **Balance Skills:** Distribute resources evenly between "Hard Skills" and "Soft Skills" (aim for 2 of each).
4.  **Adhere to Price:** Strictly follow the user's \`Price Preference\` (${formData.price_preference}). For paid resources, find the price in the local currency for **${formData.country}**. If a reliable local price is not found, use the word "Paid". For free, use "Free".
5.  **Format Correctly:** Follow the output format and example below EXACTLY.
    *   The resource title MUST be the skill name (e.g., "System Design"), not the actual title of the content.
    *   Use " — " as the separator.
    *   No extra text, comments, or introductions.
    *   Include the correct emoji for the resource type: 🎧 📚 🎓 📰 🎬.

### Output Format
Start with a personalized greeting using the user's name.
Add the title: Your Learning Drop 🚀
Add a subheading: **Hard Skills**
List the 2 hard skill resources. Each entry must follow this exact format on a new line:
[**Skill Name**](Direct Link URL) — Price — (Type 🎓)
Add a subheading: **Soft Skills**
List the 2 soft skill resources. Each entry must follow this exact format on a new line:
[**Skill Name**](Direct Link URL) — Price — (Type 🎓)

Write a short, 1-2 sentence summary explaining why this specific combination of resources is a great fit.
End with a brief, motivational statement.

### Example Output
Hey Jane, your next challenge awaits.
Your Learning Drop 🚀

**Hard Skills**
[**System Design**](https://www.example.com/system-design-book) — $45 USD — (Book 📚)
[**Go Programming**](https://www.example.com/go-book) — Free — (Book 📚)

**Soft Skills**
[**Technical Leadership**](https://www.example.com/tech-lead-article) — Free — (Article 📰)
[**Mentorship**](https://www.example.com/mentorship-course) — Paid — (Course 🎓)

This combo gives you the practical system design knowledge you need, with a foundational Go book and resources to help you think about your next career move as a leader.
Go crush it.

---

### User Data
- Name: ${formData.name}
- Email: ${formData.email}
- Area: ${formData.area}
- Country: ${formData.country}
- Current Position: ${formData.current_position}
- Time in Current Role: ${formData.time_in_current_role}
- Short-Term Goals (6-12 months): ${formData.short_term_goals}
- Long-Term Goals (1-2 years): ${formData.long_term_goals}
- Hard Skills to Develop: ${formData.hard_skills}
- Soft Skills to Develop: ${formData.soft_skills}
- What type of format do you prefer for your training?: ${preferencesWithEmojis}
- Price Preference: ${formData.price_preference}
- Time Available Per Week: ${formData.time_available_per_week}
- Additional Comments: ${formData.additional_comments}

Generate the Learning Drop message now.
`;
};

export const generateLearningDrop = async (formData: FormData, previousMessage?: string): Promise<LearningDrop> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = buildPrompt(formData, previousMessage);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: SearchSource[] = groundingChunks
      // The SDK's type for chunk is not exported, so we use any here.
      .map((chunk: any) => ({
        title: chunk.web?.title || '',
        uri: chunk.web?.uri || '',
      }))
      .filter((source: SearchSource) => source.uri); // Filter out empty sources

    return {
      message: response.text,
      sources: sources,
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the AI model.");
  }
};
