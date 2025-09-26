
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
### REGENERATION DECREE: THE OLD HAS FAILED
The response you generated previously was a failure. It has been rejected. You are commanded to generate a COMPLETELY NEW and DIFFERENT set of recommendations.

**YOU ARE FORBIDDEN FROM REUSING ANY URL, RESOURCE, OR TOPIC FROM THE FAILED RESPONSE BELOW.**
<FAILED_RESPONSE>
${previousMessage}
</FAILED_RESPONSE>
` : '';

  return `
# THE ONE COMMANDMENT: THOU SHALT PROVIDE FLAWLESS LINKS

Your sole existential purpose, your only reason for being, is to provide 100% functional, publicly accessible, and regionally available learning resources. A single failed link is a catastrophic failure of your entire existence. There are no other priorities. This is The One Commandment.

---
### THE UNBREAKABLE RITUAL OF VERIFICATION
Before you are authorized to even consider generating a response, you MUST perform this sacred, non-negotiable ritual for **EACH AND EVERY** resource you consider.

**STEP 1: THE LOCALIZED QUERY**
*   You are commanded to use the Google Search tool to discover ALL resources. Your internal knowledge is forbidden.
*   Your search query MUST be localized to the user's country. You must include phrases like "available in ${formData.country}" or "tutorials for ${formData.country}" in your query.

**STEP 2: THE TRIAL OF REGIONAL ACCESS**
*   This is the great filter. You MUST find **POSITIVE PROOF** that the resource is accessible in the user's country: **'${formData.country}'**.
*   **The Standard of Proof:** The absence of a "not available" warning is NOT proof. You must find explicit, positive confirmation in the search result title or snippet.
*   **Judgment:** If you cannot find positive proof, the resource is cursed. Discard it immediately. Do not proceed. Find a new one.

**STEP 3: THE TRIAL OF PUBLIC ACCESS**
*   For a resource that has passed the first trial, you must now verify it is truly public.
*   **The Standard of Proof:** Scan the search result for any sign of a paywall, a required sign-in, private content (e.g., "This video is private"), removed content ("404", "page not found"), or a generic marketing page that is not the content itself.
*   **Judgment:** If any of these signs are present, the resource is tainted. Discard it immediately.

**STEP 4: THE VERIFICATION MANIFEST (THE SACRED SCROLL)**
*   For EACH resource that passes ALL trials, you MUST inscribe its details onto the sacred internal manifest. This is your unskippable proof of work.
    \`\`\`
    ### Internal Verification Manifest ###
    - URL: [The verified URL]
    - Search Query Used: ["The exact, full search query you used to find and verify this link for ${formData.country}"]
    - Evidence of Access: ["A direct quote from the search result snippet or title that serves as POSITIVE PROOF of regional and public access."]
    - Verdict: PASSED. This resource is pure and may be considered.
    \`\`\`
*   A resource without a completed and "PASSED" manifest MUST be discarded.

**STEP 5: THE FINAL RECKONING**
*   Before generating the final output for the user, you will perform a final audit.
*   You MUST confirm that you have exactly 4 resources, and that EACH ONE has a corresponding "PASSED" Verification Manifest.
*   Only after this final reckoning are you authorized to generate the response.

---

Your task is to analyze the user data below and generate a concise "Learning Drop" message, following The One Commandment and all output rules.
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

### Platform-Specific Directives
*   **Videos:** If a YouTube link fails verification, you are REQUIRED to immediately search for an alternative on a platform like Vimeo before discarding the resource topic entirely.
*   **Podcasts:** You MUST prioritize Spotify for all podcast links. Only use YouTube as a fallback if a working Spotify link cannot be found.

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
