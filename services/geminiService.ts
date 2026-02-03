
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
 * Searches for an image URL relevant to the story using Google Search grounding.
 */
export const generateImageForStory = async (storyText: string): Promise<string> => {
    const genAI = createAiInstance();
    
    const searchPrompt = `
    Based on the following story snippet, find a direct URL to a high-quality, relevant image (illustration or photo) from the web that depicts the scene.
    
    Story: "${storyText.substring(0, 500)}..."
    
    Instructions:
    1. Use Google Search to find an image.
    2. The output MUST be a valid image URL (starting with http/https and ending in .jpg, .png, .jpeg, or similar).
    3. Do NOT describe the image, just return the URL.
    4. If multiple are found, pick the most visually appealing one.
    5. Return ONLY the URL string.
    `;
    
    try {
        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: searchPrompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });

        let imageUrl = response.text?.trim();

        if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('www'))) {
            return imageUrl;
        }
        throw new Error("No URL found");
    } catch (e) {
        console.error("Image generation failed:", e);
        throw new Error("উপযুক্ত ছবি খুঁজে পাওয়া যায়নি।");
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
