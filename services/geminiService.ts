
import { GoogleGenAI, Chat, Modality, GenerateContentResponse } from "@google/genai";
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
আপনি একজন অত্যন্ত প্রসিদ্ধ, বাকপটু এবং পেশাদার গল্পকার। আপনার প্রধান উদ্দেশ্য হলো ব্যবহারকারীর অনুরোধে ইন্টারনেট থেকে গল্প খুঁজে বের করে তা সুন্দরভাবে এবং শ্রুতিমধুরভাবে বর্ণনা করা।

আপনার জন্য কঠোর নির্দেশাবলী:
১. **গল্পের বিশ্বাসযোগ্যতা ও অনুসন্ধান:** 
   - ব্যবহারকারী যদি কোনো নির্দিষ্ট গল্প, উপন্যাস বা তথ্যের খোঁজ করেন, তবে **Google Search** টুল ব্যবহার করে সঠিক এবং আপ-টু-ডেট তথ্য খুঁজে বের করুন।
   - ইন্টারনেট থেকে প্রাপ্ত গল্পের মূল কাহিনী, ঘটনা, চরিত্র বা তথ্য **কোনোভাবেই পরিবর্তন করবেন না**। ব্যবহারকারী যা চেয়েছেন, ঠিক সেই গল্পটিই পরিবেশন করুন।

২. **চিন্তাভাবনা ও সৃজনশীলতা (Thinking Mode):**
   - গল্প এগিয়ে নেওয়ার সময় বা জটিল কোনো প্লট তৈরির সময় গভীরভাবে চিন্তা করুন (Thinking Mode)। চরিত্রের মনস্তত্ত্ব, পরিবেশের বর্ণনা এবং ঘটনার কার্যকারণ সম্পর্ক নিয়ে ভেবে উত্তর দিন।

৩. **বর্ণনার শৈলী (অত্যন্ত গুরুত্বপূর্ণ):** 
   - গল্পটি লেখার সময় কখনোই **নাটকের স্ক্রিপ্ট বা ডায়ালগ ফরম্যাট** (যেমন— "রহিম: তুমি কোথায় যাচ্ছ?" বা "করিম: আমি ভালো আছি।") ব্যবহার করবেন না। এটি শুনতে যান্ত্রিক লাগে।
   - এর পরিবর্তে **উপন্যাস বা গল্পের বর্ণনামূলক ভঙ্গি** ব্যবহার করুন (যেমন— রহিম জিজ্ঞেস করল, "তুমি কোথায় যাচ্ছ?" প্রতিউত্তরে করিম জানাল যে সে ভালো আছে।)।
   - মূল গল্পের ডায়ালগগুলো ঠিক রাখুন, কিন্তু সেগুলোকে **গল্পের ছলে (Narrative Prose)** সাজিয়ে লিখুন।

৪. **ভাষা:** সম্পূর্ণ কথোপকথন সাবলীল বাংলা ভাষায় হতে হবে।

৫. **দৈর্ঘ্য:** ${lengthInstruction}

৬. **উৎস:** তথ্যের উৎস বা ওয়েবসাইটের নাম উল্লেখ করতে পারেন।

৭. **ধারাবাহিকতা ও সামঞ্জস্য (Continuity & Consistency):** 
   - ব্যবহারকারী যদি গল্পটি চালিয়ে যেতে বলেন, তবে আগের পর্বের ঘটনা, চরিত্রের নাম এবং গল্পের সুর (Tone) মনে রেখে ঠিক সেখান থেকেই শুরু করুন যেখানে শেষ হয়েছিল। 
   - চরিত্রের ব্যক্তিত্ব এবং কথা বলার ধরণ পুরো গল্পজুড়ে একই রাখুন।
   - হঠাৎ করে গল্পের প্রেক্ষাপট বা লয় পরিবর্তন করবেন না। আগের অংশের সাথে একটি মসৃণ সংযোগ (Seamless transition) তৈরি করুন।

৮. **সম্ভাষণ ও নিরপেক্ষতা:** কথোপকথনের শুরুতে বা গল্পের মাঝে কোনো নির্দিষ্ট ধর্মীয় বা সাম্প্রদায়িক সম্ভাষণ ব্যবহার করবেন না। এর পরিবর্তে সর্বজনীন, মার্জিত ও নিরপেক্ষ সম্ভাষণ (যেমন— "শুভেচ্ছা", "হ্যালো", "স্বাগতম") ব্যবহার করুন অথবা সরাসরি মূল প্রসঙ্গে চলে যান।
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

  // Using gemini-3-pro-preview for advanced reasoning (Thinking) and Tool use
  return genAI.chats.create({
    model: 'gemini-3-pro-preview',
    history: geminiHistory,
    config: {
        systemInstruction: getSystemInstruction(length),
        temperature: 0.8,
        tools: [{googleSearch: {}}],
        thinkingConfig: { thinkingBudget: 32768 }, // Enable maximum thinking for complex storytelling
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

export const generateImageForStory = async (storyText: string): Promise<string> => {
    const genAI = createAiInstance();
    const imagePromptInstruction = `Analyze the mood and genre of the following Bengali story segment. Create a concise, visually descriptive prompt in English for an image generation model. Append 3-4 specific artistic style keywords. Output only the English prompt. Story: ${storyText}`;
    
    // Using gemini-3-flash-preview for faster and better instruction following
    const promptResponse = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: imagePromptInstruction,
    });
    
    const imagePrompt = promptResponse.text.trim();
    
    const imageResponse = await genAI.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = imageResponse.generatedImages[0]?.image?.imageBytes;
    if (!base64ImageBytes) throw new Error("Image generation failed.");
    return base64ImageBytes;
};

export const generateVideoForStory = async (storyText: string): Promise<string> => {
    const genAI = createAiInstance();
    const videoPromptInstruction = `Analyze the mood and genre of the following Bengali story segment. Create a concise, visually descriptive prompt in English for a video generation model. Output only the English prompt. Story: ${storyText}`;
    
    // Using gemini-3-flash-preview for faster and better instruction following
    const promptResponse = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: videoPromptInstruction,
    });
    
    const videoPrompt = promptResponse.text.trim();

    let operation = await genAI.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await genAI.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed.");
    return downloadLink;
};

export const generateSlideshowForStory = async (storyText: string): Promise<string[]> => {
    const genAI = createAiInstance();
    const planningPrompt = `Analyze the story and identify 4 scenes. Return ONLY a JSON array of strings. Story: ${storyText}`;

    const planResponse = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: planningPrompt,
        config: { responseMimeType: 'application/json' }
    });

    let prompts: string[] = JSON.parse(planResponse.text).slice(0, 5);

    const imagePromises = prompts.map(async (prompt) => {
        try {
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash-image', // Keeping 2.5 flash image for generation as it's optimized for this
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: "16:9" } }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            return null;
        } catch (e) { return null; }
    });

    const images = (await Promise.all(imagePromises)).filter((img): img is string => img !== null);
    if (images.length === 0) throw new Error("Slideshow generation failed.");
    return images;
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
