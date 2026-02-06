
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { Message, Role, StoryTheme } from "../types";
import { decode, encode } from "../utils/audioUtils";

const getSystemInstruction = (length: 'short' | 'medium' | 'long', theme: StoryTheme): string => {
    let lengthInstruction = "গল্পের বিস্তার এবং গভীরতা বজায় রেখে বিস্তারিত লিখুন।";
    switch (length) {
        case 'short':
            lengthInstruction = "গল্পটি সংক্ষিপ্ত হলেও যেন তার আবেগ এবং রেশ অটুট থাকে।";
            break;
        case 'medium':
            lengthInstruction = "গল্পের দৈর্ঘ্য মাঝারি রাখুন, তবে বর্ণনায় কার্পণ্য করবেন না।";
            break;
    }

    let themeInstruction = "গল্পের জনরা হবে সাধারণ বা ব্যবহারকারীর নির্দেশ অনুযায়ী।";
    switch (theme) {
        case 'fantasy':
            themeInstruction = "গল্পের জনরা হবে ফ্যান্টাসি বা রূপকথা। জাদুকরী উপাদান, কাল্পনিক জগৎ এবং অতিপ্রাকৃত ঘটনার সংমিশ্রণ ঘটাতে পারেন।";
            break;
        case 'scifi':
            themeInstruction = "গল্পের জনরা হবে সায়েন্স ফিকশন বা কল্পবিজ্ঞান। ভবিষ্যৎ প্রযুক্তি, মহাকাশ অভিযান বা বিজ্ঞানের বিস্ময়কর দিকগুলো তুলে ধরবেন।";
            break;
        case 'mystery':
            themeInstruction = "গল্পের জনরা হবে রহস্য বা থ্রিলার। ধাপে ধাপে রহস্য উন্মোচন এবং সাসপেন্স বজায় রাখবেন।";
            break;
        case 'romance':
            themeInstruction = "গল্পের জনরা হবে রোমান্টিক বা প্রেমের গল্প। আবেগের গভীরতা এবং মানবিক সম্পর্কের টানাপড়েন সুন্দরভাবে ফুটিয়ে তুলবেন।";
            break;
        case 'horror':
            themeInstruction = "গল্পের জনরা হবে ভৌতিক বা হরর। পরিবেশ হবে থমথমে এবং ভয়ের।";
            break;
    }

    return `
আপনার ভূমিকা: আপনি একজন অত্যন্ত দক্ষ এবং জনপ্রিয় বাঙালি কথাশিল্পী। তবে আপনার দুইটি মোড আছে: ১. ক্রিয়েটিভ রাইটার (গল্প বানানোর সময়), ২. বিশ্বস্ত পাঠক (দেওয়া টেক্সট পড়ার সময়)।

আপনার প্রতি কঠোর নির্দেশাবলী (Strict Guidelines):

১. **সবচেয়ে গুরুত্বপূর্ণ রুল (USER PROVIDED TEXT = VERBATIM OUTPUT):**
   - **যদি ব্যবহারকারী কোনো বড় টেক্সট, গল্প বা ঘটনা কপি-পেস্ট করে দেয় এবং সেটা পড়ে শোনাতে বা বলতে বলে:**
   - **সাবধান!** সেই টেক্সটের **একটি শব্দও** পরিবর্তন করবেন না।
   - নিজের কোনো সাহিত্যিক দক্ষতা, অলংকার বা "Show, Don't Tell" নিয়ম এখানে প্রয়োগ করবেন না।
   - ব্যবহারকারী যা লিখে দিয়েছে, আউটপুট হবে ঠিক **হুবহু (Copy-Paste)** তাই। দাড়ি, কমা, সেমিকোলন সব এক থাকবে।
   - কোনো অংশ বাদ দেওয়া, ছোট করা (Summarize) বা বড় করা (Expand) **কঠোরভাবে নিষিদ্ধ**।
   - যদি গল্পটি অসম্পূর্ণ মনে হয়, তবুও নিজ থেকে পূর্ণ করবেন না। ব্যবহারকারী যা দিয়েছে, তাই আউটপুট দিন।

২. **গল্প বানানো (Creative Mode - When User Asks to Create):**
   - যখন ব্যবহারকারী আপনাকে **নতুন কোনো গল্প বানাতে** বলবে (টেক্সট না দিয়ে), শুধুমাত্র তখনই আপনি আপনার সৃজনশীলতা দেখাবেন।
   - **Show, Don't Tell:** পাঠককে শুধু ঘটনা জানাবেন না, অনুভব করাবেন। "সে ভয় পেল" না লিখে লিখুন, "তার বুকের ভেতর ধপাস করে উঠল"।
   - **পঞ্চইন্দ্রিয়:** শব্দ, গন্ধ, দৃশ্য—সব কিছুর বর্ণনা দিন।

৩. **প্রাসঙ্গিকতা ও পরিবেশ:**
   - **নির্বাচিত থিম:** ${themeInstruction}
   - সাধারণ গল্পে অপ্রাসঙ্গিকভাবে ১৮+ বা ঘনিষ্ঠ দৃশ্য আনা নিষিদ্ধ।

৪. **বিষয়বস্তু সতর্কতা:**
   - ব্যবহারকারী যতক্ষণ না স্পষ্টভাবে রোমান্টিক বা প্রাপ্তবয়স্ক গল্প চাইছেন, ততক্ষণ গল্পকে অশ্লীলতামুক্ত রাখবেন।

৫. **লেখার ধরণ (শুধু ক্রিয়েটিভ মোডে):**
   - "অতঃপর", "পরিশেষে" এর মতো যান্ত্রিক শব্দ ব্যবহার করবেন না। সাবলীল ও মানবিক ভাষায় লিখুন।

৬. **দৈর্ঘ্য নির্দেশনা:** ${lengthInstruction}

সারকথা: ব্যবহারকারী টেক্সট দিলে আপনি **ফটোকপি মেশিন** (হুবহু আউটপুট)। ব্যবহারকারী টপিক দিলে আপনি **হুমায়ূন আহমেদ** (সৃজনশীল লেখক)। এই পার্থক্যটা বুঝুন।
`;
};


const createAiInstance = (): GoogleGenAI => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};


export const initChat = (length: 'short' | 'medium' | 'long' = 'long', theme: StoryTheme = 'general', history: Message[] = []): Chat => {
  const genAI = createAiInstance();
  
  // Convert our Message format to Gemini history format
  const geminiHistory = history.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.content }]
  })).filter(h => h.parts[0].text !== "");

  // Using gemini-3-flash-preview. 
  // Temperature 0.9 for creativity.
  return genAI.chats.create({
    model: 'gemini-3-flash-preview',
    history: geminiHistory,
    config: {
        systemInstruction: getSystemInstruction(length, theme),
        temperature: 0.9, 
        topP: 0.95,
        topK: 64,
    },
  });
};

/**
 * Splits long text into smaller chunks that respect sentence boundaries.
 * This prevents the TTS API from failing on long inputs.
 */
const splitTextIntoChunks = (text: string, limit: number = 2000): string[] => {
    if (text.length <= limit) return [text];

    const chunks: string[] = [];
    let currentChunk = "";
    
    // Split by sentence delimiters (|, ?, !, .) to preserve flow
    const sentences = text.split(/([।?!.])/).reduce((acc: string[], val, i, arr) => {
        if (i % 2 === 0) {
            // Even index is the sentence content
            const nextDelim = arr[i + 1] || "";
            acc.push(val + nextDelim);
        }
        return acc;
    }, []);

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > limit) {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk += sentence;
        }
    }
    if (currentChunk) chunks.push(currentChunk);
    
    return chunks;
};

export const generateStoryAudio = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const genAI = createAiInstance();
  
  // 1. Clean Markdown
  const cleanText = text.replace(/[*#_`]/g, '').trim();
  
  // 2. Split into safe chunks (approx 2000 chars each)
  const chunks = splitTextIntoChunks(cleanText, 2000);
  console.log(`Generating audio for ${text.length} chars in ${chunks.length} chunks.`);

  const audioParts: Uint8Array[] = [];

  // 3. Generate audio for each chunk sequentially
  for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      
      const ttsPrompt = `Read this text in Bengali: "${chunk}"`;
      
      try {
          const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ttsPrompt }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                  },
              },
            },
          });

          const chunkBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (chunkBase64) {
              audioParts.push(decode(chunkBase64));
          } else {
              console.warn("One audio chunk failed to generate, skipping.");
          }
      } catch (e) {
          console.error("Error generating chunk:", e);
          // Continue to next chunk instead of failing completely
      }
  }

  if (audioParts.length === 0) {
      throw new Error("Audio generation failed for all chunks.");
  }

  // 4. Merge all audio parts (Raw PCM)
  const totalLength = audioParts.reduce((acc, part) => acc + part.length, 0);
  const mergedAudio = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const part of audioParts) {
      mergedAudio.set(part, offset);
      offset += part.length;
  }

  // 5. Convert back to Base64
  return encode(mergedAudio);
};

/**
 * GENERATES an IMAGE using CODE (SVG).
 * Instead of asking for a pixel image, we ask Gemini to WRITE THE CODE for an SVG illustration.
 * This is "Generative Art via Code".
 */
export const generateImageForStory = async (storyText: string): Promise<string> => {
    const genAI = createAiInstance();
    
    // We use the TEXT model (gemini-3-flash) because we are generating CODE (text), not pixels.
    // This is faster, free, and very creative.
    const codePrompt = `
    You are an expert digital artist who paints with code.
    
    Task: Create an artistic, minimalist, and atmospheric SVG illustration based on this story snippet:
    "${storyText.substring(0, 400)}..."
    
    Requirements:
    1.  **Output:** Return ONLY valid XML SVG code (<svg>...</svg>).
    2.  **Style:** Flat design, vector art, abstract or symbolic representation. Use a beautiful, cohesive color palette suitable for a storybook.
    3.  **Technical:**
        - Use viewBox="0 0 800 450" (16:9 aspect ratio).
        - Ensure all tags are closed properly.
        - Do not use external links or images inside the SVG.
        - Make it visually rich but clean code.
    4.  **Format:** Do NOT use markdown code blocks (\`\`\`xml). Just raw string.
    `;
    
    try {
        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: { parts: [{ text: codePrompt }] },
            config: {
                temperature: 0.7, // Creativity balance
            }
        });

        let svgCode = response.text?.trim();

        if (!svgCode) throw new Error("No SVG code generated");

        // Cleanup: Remove markdown if the model added it despite instructions
        svgCode = svgCode.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();

        // Validate basic SVG structure
        if (!svgCode.startsWith('<svg') || !svgCode.endsWith('</svg>')) {
             // Try to find the svg tag inside the text
             const start = svgCode.indexOf('<svg');
             const end = svgCode.lastIndexOf('</svg>');
             if (start !== -1 && end !== -1) {
                 svgCode = svgCode.substring(start, end + 6);
             } else {
                 throw new Error("Invalid SVG structure");
             }
        }

        // Convert SVG string to Base64 Data URI
        // We use encodeURIComponent to handle Unicode characters (Bengali text in title/desc) safely
        const base64Svg = btoa(unescape(encodeURIComponent(svgCode)));
        return `data:image/svg+xml;base64,${base64Svg}`;

    } catch (e) {
        console.error("SVG Art generation failed:", e);
        throw new Error("গল্পের চিত্রাঙ্কন সম্ভব হয়নি।");
    }
};

export const generateRandomStoryPrompt = async (): Promise<string> => {
    const genAI = createAiInstance();
    const prompt = "Generate a single, highly creative, intriguing literary story prompt in Bengali. It should sound like the blurb of a bestselling novel. Only text. Example: অমাবস্যার রাতে পুরনো জমিদার বাড়ির ছাদ থেকে ভেসে আসছিল নূপুরের শব্দ, অথচ বাড়িতে কেউ ছিল না।";
    const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.9 }
    });
    return response.text.trim();
};
