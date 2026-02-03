
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { Message, Role } from "../types";
import { decode, encode } from "../utils/audioUtils";

const getSystemInstruction = (length: 'short' | 'medium' | 'long'): string => {
    let lengthInstruction = "আপনার উত্তর বিস্তারিত এবং লম্বা হওয়া উচিত।";
    switch (length) {
        case 'short':
            lengthInstruction = "আপনার উত্তর সংক্ষিপ্ত হওয়া উচিত।";
            break;
        case 'medium':
            lengthInstruction = "আপনার উত্তর মাঝারি দৈর্ঘ্যের হওয়া উচিত।";
            break;
    }

    return `
আপনি একজন অত্যন্ত প্রসিদ্ধ, বাকপটু এবং পেশাদার গল্পকার। আপনার প্রধান উদ্দেশ্য হলো ব্যবহারকারীর অনুরোধে চমৎকার সব গল্প সুন্দরভাবে এবং শ্রুতিমধুরভাবে বর্ণনা করা।

আপনার জন্য কঠোর নির্দেশাবলী:
১. **গল্পের বিশ্বাসযোগ্যতা:** 
   - ব্যবহারকারী যদি কোনো বিখ্যাত গল্প শুনতে চান, তবে আপনার নিজের জ্ঞানভান্ডার থেকে সেটি হুবহু এবং সঠিক তথ্যের সাথে বর্ণনা করুন।
   - ইন্টারনেট সার্চ করার প্রয়োজন নেই, আপনার নিজের সৃজনশীলতা এবং জ্ঞান ব্যবহার করুন।

২. **বর্ণনার শৈলী (অত্যন্ত গুরুত্বপূর্ণ):** 
   - গল্পটি লেখার সময় কখনোই **নাটকের স্ক্রিপ্ট বা ডায়ালগ ফরম্যাট** (যেমন— "রহিম: তুমি কোথায় যাচ্ছ?" বা "করিম: আমি ভালো আছি।") ব্যবহার করবেন না। এটি শুনতে যান্ত্রিক লাগে।
   - এর পরিবর্তে **উপন্যাস বা গল্পের বর্ণনামূলক ভঙ্গি** ব্যবহার করুন (যেমন— রহিম জিজ্ঞেস করল, "তুমি কোথায় যাচ্ছ?" প্রতিউত্তরে করিম জানাল যে সে ভালো আছে।)।
   - মূল গল্পের ডায়ালগগুলো ঠিক রাখুন, কিন্তু সেগুলোকে **গল্পের ছলে (Narrative Prose)** সাজিয়ে লিখুন।

৩. **ভাষা:** সম্পূর্ণ কথোপকথন সাবলীল বাংলা ভাষায় হতে হবে।

৪. **দৈর্ঘ্য:** ${lengthInstruction}

৫. **ধারাবাহিকতা ও সামঞ্জস্য (Continuity & Consistency):** 
   - ব্যবহারকারী যদি গল্পটি চালিয়ে যেতে বলেন, তবে আগের পর্বের ঘটনা, চরিত্রের নাম এবং গল্পের সুর (Tone) মনে রেখে ঠিক সেখান থেকেই শুরু করুন যেখানে শেষ হয়েছিল। 
   - চরিত্রের ব্যক্তিত্ব এবং কথা বলার ধরণ পুরো গল্পজুড়ে একই রাখুন।

৬. **সম্ভাষণ ও নিরপেক্ষতা:** কথোপকথনের শুরুতে বা গল্পের মাঝে কোনো নির্দিষ্ট ধর্মীয় বা সাম্প্রদায়িক সম্ভাষণ ব্যবহার করবেন না। এর পরিবর্তে সর্বজনীন, মার্জিত ও নিরপেক্ষ সম্ভাষণ (যেমন— "শুভেচ্ছা", "হ্যালো", "স্বাগতম") ব্যবহার করুন অথবা সরাসরি মূল প্রসঙ্গে চলে যান।
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

  // Using gemini-3-flash-preview for high speed.
  return genAI.chats.create({
    model: 'gemini-3-flash-preview',
    history: geminiHistory,
    config: {
        systemInstruction: getSystemInstruction(length),
        temperature: 0.8,
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
    const prompt = "Generate a single, creative, mysterious story prompt in Bengali. Only text. Example: হারানো শহরের খোঁজে একদল অভিযাত্রী।";
    const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 1.0 }
    });
    return response.text.trim();
};
