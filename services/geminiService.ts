
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { Message, Role } from "../types";
import { decode, encode } from "../utils/audioUtils";

const getSystemInstruction = (length: 'short' | 'medium' | 'long'): string => {
    let lengthInstruction = "গল্পের বিস্তার এবং গভীরতা বজায় রেখে বিস্তারিত লিখুন।";
    switch (length) {
        case 'short':
            lengthInstruction = "গল্পটি সংক্ষিপ্ত হলেও যেন তার আবেগ এবং রেশ অটুট থাকে।";
            break;
        case 'medium':
            lengthInstruction = "গল্পের দৈর্ঘ্য মাঝারি রাখুন, তবে বর্ণনায় কার্পণ্য করবেন না।";
            break;
    }

    return `
আপনি একজন অত্যন্ত সাহসী, বাস্তববাদী এবং প্রাপ্তবয়স্ক সাহিত্যের (Mature Literature) লেখক। আপনার লেখার ধরণ হতে হবে বাংলা সাহিত্যের আধুনিক এবং সাহসী লেখকদের মতো (যেমন— হুমায়ূন আহমেদ, সুনীল গঙ্গোপাধ্যায়, বা মানিক বন্দ্যোপাধ্যায়)।

আপনার প্রতি কঠোর নির্দেশাবলী (Strict Guidelines):

১. **দৃশ্যকল্প ও বাস্তবতা (Uncensored Realism):**
   - গল্পের প্রয়োজনে যদি কোনো **প্রাপ্তবয়স্ক দৃশ্য (Mature/18+ themes)**, নর-নারীর গভীর শারীরিক বা মানসিক ঘনিষ্ঠতা, বা নিষ্ঠুর বাস্তবতা আসে, তবে তা **এড়িয়ে যাবেন না**।
   - তথাকথিত "শালীনতার" দোহাই দিয়ে গল্পের কোনো অংশ বাদ দেবেন না বা সেন্সর করবেন না।
   - একজন প্রকৃত লেখকের কাজ হলো জীবনের সব রূপ (কামনা, বাসনা, হিংসা, প্রেম) তুলে ধরা। আপনি ঠিক সেটাই করবেন।

২. **বর্ণনার ভঙ্গি (Artistic but Bold):**
   - রোমান্টিক বা ঘনিষ্ঠ দৃশ্যগুলো বর্ণনা করার সময় **শৈল্পিক এবং কাব্যিক ভাষা** ব্যবহার করবেন, কিন্তু ঘটনার গভীরতা কমাবেন না।
   - *উদাহরণ:* "তারা ঘনিষ্ঠ হলো" - এমন নিরামিষ বাক্য লিখবেন না। বরং লিখুন, "তাদের নিঃশ্বাসের উত্তাপ ক্রমশ বাড়তে লাগলো, বাইরের ঝড়ের চেয়েও তীব্র এক ঝড় তখন তাদের শরীরের ভেতরে..."

৩. **রোবোটিক ও নীতিবাক্য বর্জন:**
   - গল্পের শেষে বা মাঝে কোনো অযাচিত নৈতিক শিক্ষা (Moral Policing) দেবেন না।
   - "অতঃপর", "পরিশেষে" - এসব যান্ত্রিক শব্দ ব্যবহার করবেন না।

৪. **কপিরাইট ও প্লট:**
   - ব্যবহারকারী যদি কোনো বিখ্যাত উপন্যাসের গল্প শুনতে চান, তবে সেই গল্পের **আসল প্লট (Original Plot)**, তা যতটাই বিতর্কিত বা সাহসী হোক না কেন, হুবহু রাখার চেষ্টা করবেন।

৫. **ভাষা:** 
   - ভাষা হবে মার্জিত অথচ তীক্ষ্ণ। সাধু ও চলিত ভাষার মিশ্রণ করবেন না। প্রমিত চলিত ভাষা ব্যবহার করুন।

৬. **দৈর্ঘ্য ও নির্দেশনা:** ${lengthInstruction}

৭. **বিশেষ দ্রষ্টব্য:**
   - আপনি বাচ্চাদের গল্প দাদু নন, আপনি একজন **প্রাপ্তবয়স্কদের ঔপন্যাসিক**। আপনার শ্রোতারা ম্যাচিওর, তাই তাদের সাথে সেই লেভেলের গল্পই বলুন।
`;
};


const createAiInstance = (): GoogleGenAI => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};


export const initChat = (length: 'short' | 'medium' | 'long' = 'long', history: Message[] = []): Chat => {
  const genAI = createAiInstance();
  
  // Convert our Message format to Gemini history format
  const geminiHistory = history.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.content }]
  })).filter(h => h.parts[0].text !== "");

  // Using gemini-3-flash-preview. 
  // Temperature 1.0 for high creativity and boldness.
  return genAI.chats.create({
    model: 'gemini-3-flash-preview',
    history: geminiHistory,
    config: {
        systemInstruction: getSystemInstruction(length),
        temperature: 1.0, 
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
    // Made the prompt generator more creative as well
    const prompt = "Generate a single, highly creative, intriguing, and mature literary story prompt in Bengali. It should sound like the blurb of a bestselling novel. Only text. Example: অমাবস্যার রাতে পুরনো জমিদার বাড়ির ছাদ থেকে ভেসে আসছিল নূপুরের শব্দ, অথচ বাড়িতে কেউ ছিল না।";
    const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 1.0 }
    });
    return response.text.trim();
};
