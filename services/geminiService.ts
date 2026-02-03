
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { Message, Role } from "../types";

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
  // CRITICAL FIX: Removed 'tools: [{googleSearch: {}}]' from here.
  // The search tool often causes generic errors on the free tier if the query doesn't trigger a clear search intent,
  // or if the backend services timeout. Removing it makes the story generation pure text-based and much more stable.
  return genAI.chats.create({
    model: 'gemini-3-flash-preview',
    history: geminiHistory,
    config: {
        systemInstruction: getSystemInstruction(length),
        temperature: 0.8,
        // tools: [], // Explicitly no tools for the main chat to ensure stability
    },
  });
};

export const generateStoryAudio = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const genAI = createAiInstance();
  // Enhanced prompt for professional audiobook quality narration with strict pacing and emotion controls
  const ttsPrompt = `
  একজন বিশ্বমানের পেশাদার অডিওবুক ন্যারেটর হিসেবে এই গল্পটি পাঠ করুন।
  
  নির্দেশনা:
  ১. **কণ্ঠস্বর:** গভীর, আবেগপূর্ণ এবং নাটকীয়।
  ২. **লয়:** খুব দ্রুত নয়, ধীর এবং আকর্ষক লয়ে (Slow and engaging pace) পড়ুন যাতে শ্রোতা প্রতিটি দৃশ্য কল্পনা করতে পারে।
  ৩. **বিরামচিহ্ন:** দাড়ি, কমা এবং প্রশ্নবোধক চিহ্নের সঠিক ব্যবহার করে বিরাম নিন।
  ৪. **বর্জনীয়:** গল্পের বাইরে কোনো ভূমিকা (যেমন "গল্পটি নিচে দেওয়া হলো") বা উপসংহার যোগ করবেন না। শুধুমাত্র মূল টেক্সটটিই পাঠ করুন।
  
  টেক্সট: "${text}"`;
  
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

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Audio generation failed, no data returned.");
  }
  return base64Audio;
};

/**
 * Searches for an image URL relevant to the story using Google Search grounding.
 * This function KEEPS the googleSearch tool because it is specifically for finding images.
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
        // Fail gracefully if image search fails, don't crash the app
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
