

import { GoogleGenAI, Chat, Modality, GenerateContentResponse } from "@google/genai";

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


export const initChat = (length: 'short' | 'medium' | 'long' = 'long'): Chat => {
  const genAI = createAiInstance();
  return genAI.chats.create({
    model: 'gemini-2.5-flash',
    config: {
        systemInstruction: getSystemInstruction(length),
        temperature: 0.8,
        tools: [{googleSearch: {}}],
    },
  });
};

export const generateStoryAudio = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const genAI = createAiInstance();
  // A more direct prompt to ensure the model only reads the provided text and doesn't ad-lib.
  const ttsPrompt = `একজন দক্ষ গল্পকারের মতো নিম্নলিখিত বাংলা লেখাটি পড়ুন। আপনার পড়ার ভঙ্গি হবে স্বাভাবিক, স্বচ্ছন্দ এবং আবেগময়। কোনো অতিরিক্ত শব্দ বা বাক্য যোগ না করে, শুধুমাত্র প্রদত্ত লেখাটি পাঠ করুন। লেখা: "${text}"`;
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
          voiceConfig: {
            // Use the selected voice for narration.
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
    
    // 1. Generate a visually descriptive prompt from the story text by analyzing its mood
    const imagePromptInstruction = `Analyze the mood and genre of the following Bengali story segment (e.g., mysterious, adventurous, romantic, horror, sci-fi). Based on your analysis, create a concise, visually descriptive prompt in English for an image generation model. This prompt must capture the main scene, characters, and atmosphere. Append 3-4 specific, comma-separated artistic style keywords that match the story's mood. For example, for a dark mystery, use keywords like 'chiaroscuro lighting, gothic, mysterious, detailed illustration'. For a vibrant fantasy, use 'cinematic lighting, epic, fantasy, digital painting'. The final output should be only the English prompt. Story: ${storyText}`;
    
    const promptResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: imagePromptInstruction,
    });
    
    const imagePrompt = promptResponse.text.trim();

    if (!imagePrompt) {
        throw new Error("Failed to generate an image prompt from the story.");
    }
    
    // 2. Generate the image using the new prompt with Imagen for higher quality and aspect ratio control
    const imageResponse = await genAI.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9', // Use a cinematic aspect ratio for story visuals
        },
    });

    const base64ImageBytes = imageResponse.generatedImages[0]?.image?.imageBytes;

    if (!base64ImageBytes) {
        throw new Error("Image generation failed, no image data returned.");
    }
    
    return base64ImageBytes;
};

export const generateVideoForStory = async (storyText: string): Promise<string> => {
    // A new GoogleGenAI instance is created right before making an API call to ensure
    // it always uses the most up-to-date API key selected by the user.
    const genAI = createAiInstance();

    // 1. Generate a visually descriptive prompt from the story text for video
    const videoPromptInstruction = `Analyze the mood and genre of the following Bengali story segment. Create a concise, visually descriptive prompt in English for a video generation model. The prompt should capture the main scene, characters, atmosphere, and suggest a simple action or camera movement. The final output should be only the English prompt. Story: ${storyText}`;
    
    const promptResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: videoPromptInstruction,
    });
    
    const videoPrompt = promptResponse.text.trim();

    if (!videoPrompt) {
        throw new Error("Failed to generate a video prompt from the story.");
    }

    // 2. Generate the video using the new prompt with Veo
    let operation = await genAI.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // 3. Poll for completion as video generation can take time
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds before polling again
      operation = await genAI.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!downloadLink) {
        throw new Error("Video generation failed, no download link returned.");
    }
    
    return downloadLink;
};

export const generateSlideshowForStory = async (storyText: string): Promise<string[]> => {
    const genAI = createAiInstance();

    // 1. Plan the scenes
    const planningPrompt = `
    Analyze the following Bengali story. Identify 4 distinct, visually striking scenes that summarize the key plot points or progression.
    For each scene, write a detailed English prompt for an image generation model.
    Return ONLY a raw JSON array of strings.
    Example output: ["A dark forest with mist", "A bright castle on a hill", "A hero fighting a dragon", "The hero celebrating"]
    Story: ${storyText}
    `;

    const planResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: planningPrompt,
        config: { responseMimeType: 'application/json' }
    });

    let prompts: string[] = [];
    try {
        prompts = JSON.parse(planResponse.text);
    } catch (e) {
        console.error("Failed to parse slideshow prompts", e);
        throw new Error("Failed to plan slideshow scenes.");
    }
    
    // Limit to 5 prompts to manage resources/time
    prompts = prompts.slice(0, 5);

    // 2. Generate images for each prompt in parallel
    // Using gemini-2.5-flash-image for speed on multiple requests
    const imagePromises = prompts.map(async (prompt) => {
        try {
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: { aspectRatio: "16:9" }
                }
            });
            
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            return null;
        } catch (e) {
            console.error(`Failed to generate image for prompt: ${prompt}`, e);
            return null;
        }
    });

    const images = (await Promise.all(imagePromises)).filter((img): img is string => img !== null);

    if (images.length === 0) {
        throw new Error("Could not generate any images for the slideshow.");
    }

    return images;
};

export const generateRandomStoryPrompt = async (): Promise<string> => {
    const genAI = createAiInstance();
    const prompt = "Generate a single, creative, mysterious, and highly engaging story prompt in Bengali. The prompt should be a short, intriguing sentence. Provide only the prompt text itself and absolutely nothing else. Example: হারানো শহরের খোঁজে একদল অভিযাত্রী।";
    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 1.0, // Higher temperature for more creative/random prompts
        }
    });
    return response.text.trim();
};