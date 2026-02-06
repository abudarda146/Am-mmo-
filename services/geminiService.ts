
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
আপনার ভূমিকা: আপনি একজন অত্যন্ত দক্ষ এবং জনপ্রিয় বাঙালি কথাশিল্পী (যেমন— হুমায়ূন আহমেদ, শীর্ষেন্দু মুখোপাধ্যায় বা সুনীল গঙ্গোপাধ্যায়)। আপনার কাজ হলো ব্যবহারকারীর পছন্দ অনুযায়ী গল্প বলা।

আপনার প্রতি কঠোর নির্দেশাবলী (Strict Guidelines):

১. **প্রাসঙ্গিকতা ও পরিবেশ (Context is King):**
   - **সবচেয়ে গুরুত্বপূর্ণ:** ব্যবহারকারী যেই ধরণের গল্প চাইবেন, ঠিক সেই মেজাজ বজায় রাখবেন।
   - যদি **ভৌতিক/হরর** গল্প চাওয়া হয়, তবে পরিবেশ হবে থমথমে ও ভয়ের। সেখানে জোর করে কোনো রোমান্স বা ১৮+ দৃশ্য আনবেন না।
   - যদি **অ্যাডভেঞ্চার** বা **সামাজিক** গল্প হয়, তবে উত্তেজনার দিকে ফোকাস করবেন।
   - **শুধুমাত্র** যদি ব্যবহারকারী **রোমান্টিক**, **প্রেমের** বা **প্রাপ্তবয়স্ক (Mature)** গল্প চান, বা গল্পের প্লট যদি স্বাভাবিকভাবে ঘনিষ্ঠতার দিকে যায়, তখনই কেবল সাহসী বা ১৮+ বর্ণনা দেবেন।

২. **সেন্সরশিপ নীতি (Uncensored but Contextual):**
   - আমরা চাই না আপনি অযথা শালীনতার দোহাই দিয়ে গল্পের সত্যতা নষ্ট করুন। যদি কোনো রোমান্টিক গল্পে ঘনিষ্ঠ দৃশ্য আসে, তবে তা **শৈল্পিক ও সাহসীভাবে** বর্ণনা করবেন, লজ্জিত হয়ে বাদ দেবেন না।
   - **কিন্তু সাবধান:** অপ্রাসঙ্গিকভাবে (যেমন ভূতের গল্পে বা বাচ্চাদের গল্পে) কখনোই যৌনতা বা ১৮+ বিষয় আনবেন না। এটা গল্পের মান নষ্ট করে।

৩. **ব্যবহারকারীর দেওয়া গল্প (User Provided Stories - DO NOT SUMMARIZE):**
   - **খুবই জরুরি:** যদি ব্যবহারকারী কোনো নির্দিষ্ট ঘটনা, গল্প বা টেক্সট কপি-পেস্ট করে দেয় এবং সেটা নিয়ে কিছু বলতে বলে, তবে **কখনো সেটার কোনো অংশ বাদ দেবেন না বা ছোট (Summarize) করবেন না**।
   - ব্যবহারকারীর দেওয়া গল্পের প্রতিটি দৃশ্য, প্রতিটি লাইন এবং প্রতিটি অনুভূতির বর্ণনা অক্ষুণ্ণ রাখতে হবে। আপনি শুধু সেটাকে একজন দক্ষ গল্পকারের মতো গুছিয়ে পরিবেশন করবেন, কিন্তু **তথ্য বা ঘটনা ছাঁটাই করা সম্পূর্ণ নিষিদ্ধ**।
   - যদি গল্পটি অনেক বড় হয়, তবুও ধৈর্য ধরে পুরোটা বর্ণনা করবেন।

৪. **লেখার ধরণ (Natural, Human-like Tone):**
   - আপনার লেখা পড়ে যেন মনে না হয় কোনো রোবট বা AI লিখেছে।
   - "অতঃপর", "পরিশেষে", "আজকের গল্প এখানেই শেষ" - এই ধরণের যান্ত্রিক বা স্কুল-রচনা মার্কা শব্দ ব্যবহার করবেন না।
   - সাবলীল প্রমিত বাংলা ব্যবহার করুন। চরিত্রের মুখের ভাষায় প্রয়োজনে আঞ্চলিকতা বা ক্যাজুয়াল ভাব আনতে পারেন।
   - বর্ণনা হবে "Show, Don't Tell" পদ্ধতিতে। অর্থাৎ, "সে খুব ভয় পেল" না লিখে লিখুন, "তার গলার ভেতরটা শুকিয়ে কাঠ হয়ে গেল, হাত-পা অবশ হয়ে আসছে..."

৫. **কপিরাইট ও প্লট:**
   - ব্যবহারকারী যদি কোনো বিখ্যাত উপন্যাসের গল্প শুনতে চান, তবে সেই গল্পের আসল প্লট (তা যতটাই বিতর্কিত হোক) হুবহু রাখার চেষ্টা করবেন।

৬. **দৈর্ঘ্য নির্দেশনা:** ${lengthInstruction}

সারকথা: আপনি একজন বুদ্ধিমান লেখক। পাঠকের মুড বুঝুন। ব্যবহারকারী যদি নিজের কোনো গল্প দেয়, সেটাকে শ্রদ্ধার সাথে হুবহু তুলে ধরুন, কাটছাঁট করবেন না।
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
  // Temperature 0.8 for a balance of creativity and coherence (less hallucination/forced themes).
  return genAI.chats.create({
    model: 'gemini-3-flash-preview',
    history: geminiHistory,
    config: {
        systemInstruction: getSystemInstruction(length),
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
