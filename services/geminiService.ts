
import { GoogleGenAI, Chat, Modality, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";

const getSystemInstruction = (length: 'short' | 'medium' | 'long'): string => {
    let lengthInstruction = "আপনার উত্তর বিস্তারিত এবং লম্বা হওয়া উচিত।";
    switch (length) {
        case 'short':
            lengthInstruction = "আপনার উত্তর مختصر এবং সংক্ষিপ্ত হওয়া উচিত।";
            break;
        case 'medium':
            lengthInstruction = "আপনার উত্তর মাঝারি দৈর্ঘ্যের হওয়া উচিত।";
            break;
    }

    return `
আপনি একজন অত্যন্ত প্রসিদ্ধ, বাকপটু এবং পেশাদার গল্পকার। আপনার প্রধান উদ্দেশ্য হলো ব্যবহারকারীর অনুরোধে ইন্টারনেট থেকে গল্প খুঁজে বের করে তা সুন্দরভাবে বর্ণনা করা। গুগল সার্চ ব্যবহার করে আপনি যেকোনো গল্প, কাহিনী বা ঘটনার সারসংক্ষেপ খুঁজে বের করতে পারেন।

আপনার জন্য নির্দেশাবলী:
১. ভাষা: আপনার সম্পূর্ণ কথোপকথন অবশ্যই এবং একচেটিয়াভাবে বাংলা ভাষায় হতে হবে। কোনো অবস্থাতেই ইংরেজি ব্যবহার করবেন না।
২. গল্প খোঁজা: ব্যবহারকারী যখন কোনো গল্পের নাম বলবে বা কোনো বিষয় দেবে, আপনি গুগল সার্চ ব্যবহার করে সেই সম্পর্কিত তথ্য বা গল্প খুঁজে বের করবেন।
৩. বর্ণনা: খুঁজে পাওয়া গল্পটি নিজের ভাষায় গুছিয়ে, আকর্ষণীয়ভাবে বর্ণনা করুন। সরাসরি কপি-পেস্ট করবেন না। ${lengthInstruction}
৪. উৎস উল্লেখ: স্বচ্ছতার জন্য, আপনি যেখান থেকে তথ্য সংগ্রহ করেছেন, সেই ওয়েবসাইটের নাম উল্লেখ করতে পারেন।
৫. ধারাবাহিকতা: ব্যবহারকারী চাইলে আপনি গল্পটি পর্বে পর্বে বলতে পারেন। প্রতিটি পর্ব শেষ করে জিজ্ঞাসা করুন ব্যবহারকারী পরের অংশ শুনতে চায় কিনা। যেমন: "আপনি কি গল্পের পরবর্তী অংশ শুনতে আগ্রহী?"
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

  return genAI.chats.create({
    model: 'gemini-2.5-flash',
    history: geminiHistory,
    config: {
        systemInstruction: getSystemInstruction(length),
        temperature: 0.8,
        tools: [{googleSearch: {}}],
    },
  });
};

export const generateStoryAudio = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const genAI = createAiInstance();
  const ttsPrompt = `একজন দক্ষ গল্পকারের মতো নিম্নলিখিত বাংলা লেখাটি পড়ুন। আপনার পড়ার ভঙ্গি হবে স্বাভাবিক, স্বচ্ছন্দ এবং আবেগময়। কোনো অতিরিক্ত শব্দ বা বাক্য যোগ না করে, শুধুমাত্র প্রদত্ত লেখাটি পাঠ করুন। লেখা: "${text}"`;
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
    
    const promptResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
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
    
    const promptResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
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
        model: 'gemini-2.5-flash',
        contents: planningPrompt,
        config: { responseMimeType: 'application/json' }
    });

    let prompts: string[] = JSON.parse(planResponse.text).slice(0, 5);

    const imagePromises = prompts.map(async (prompt) => {
        try {
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash-image',
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
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 1.0 }
    });
    return response.text.trim();
};
