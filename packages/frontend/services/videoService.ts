// FIX: Import TranscriptSegment, which was previously missing, to resolve type errors.
import { UploadStatus, VideoDetails, TranscriptSegment } from '@/types';

// Mock service to simulate backend operations

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateMockTranscript = (duration: number): TranscriptSegment[] => {
    const transcript: TranscriptSegment[] = [];
    let currentTime = 0;
    let id = 0;
    const sentences = [
        "Hello everyone and welcome back to the channel.",
        "Today, we're going to unbox something truly special.",
        "This is the new gadget everyone has been talking about.",
        "Let's see what's inside the box.",
        "First impressions? The packaging is very premium.",
        "And here it is, the device itself feels incredibly well-built.",
        "The screen is absolutely gorgeous, with vibrant colors.",
        "I can't wait to turn this on and test out the performance.",
        "They say the camera is a huge improvement over the last generation.",
        "We'll be putting that to the test in just a moment.",
        "Make sure you subscribe so you don't miss our full review.",
        "This could be a game-changer for content creators.",
        "The battery life is also supposed to be excellent.",
        "What do you guys think? Let me know in the comments below.",
        "Thanks for watching, and we'll see you in the next one!"
    ];

    while (currentTime < duration && id < sentences.length) {
        const sentence = sentences[id % sentences.length];
        const textDuration = Math.max(3, sentence.length / 10);
        transcript.push({
            id: `seg_${id++}`,
            text: sentence,
            start: currentTime,
            end: currentTime + textDuration,
        });
        currentTime += textDuration + 0.5; // Add a small pause
    }
    return transcript;
}

export const uploadVideoFile = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<VideoDetails> => {
  console.log(`Starting upload for ${file.name}`);
  
  // Simulate upload progress
  let progress = 0;
  while (progress < 100) {
    await simulateDelay(100 + Math.random() * 200);
    progress += Math.floor(Math.random() * 15) + 5;
    onProgress(Math.min(progress, 100));
  }

  // Simulate processing (transcription, etc.)
  await simulateDelay(2000);

  if (file.name.toLowerCase().includes('error')) {
      throw new Error("Upload failed due to a simulated server error.");
  }
  
  const duration = 185;
  // Simulate success
  return {
    id: `vid_${Date.now()}`,
    name: file.name,
    duration: duration,
    thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/400/225`,
    // FIX: Add the 'transcript' property to the returned object to match the updated VideoDetails type. This resolves the error "'transcript' does not exist in type 'VideoDetails'".
    transcript: generateMockTranscript(duration),
  };
};

export const importFromYouTube = async (
  url: string,
  onProgress: (progress: number) => void
): Promise<VideoDetails> => {
    console.log(`Starting import from ${url}`);

    onProgress(10);
    await simulateDelay(1000);
    onProgress(50);
    await simulateDelay(1500);
    onProgress(100);

    // Simulate processing
    await simulateDelay(2500);

    if (url.toLowerCase().includes('error')) {
        throw new Error("Import failed. Invalid YouTube URL or video is private.");
    }
    
    const duration = 320;
    return {
        id: `yt_${Date.now()}`,
        name: "Imported YouTube Video",
        duration: duration,
        thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/400/225`,
        // FIX: Add the 'transcript' property to the returned object to match the updated VideoDetails type. This resolves the error "'transcript' does not exist in type 'VideoDetails'".
        transcript: generateMockTranscript(duration),
    };
};

// FIX: Export the findHighlightsInTranscript function to make it available for other modules.
// This resolves the error "Module '"@/services/videoService"' has no exported member 'findHighlightsInTranscript'".
export const findHighlightsInTranscript = async (transcript: TranscriptSegment[]): Promise<string[]> => {
    console.log("Finding highlights in transcript...");
    await simulateDelay(2500); // Simulate AI processing time

    // Simulate finding a few key segments
    const highlights = new Set<string>();
    const potentialHooks = ["special", "game-changer", "improvement", "gorgeous"];
    
    transcript.forEach(segment => {
        if (potentialHooks.some(hook => segment.text.toLowerCase().includes(hook))) {
            highlights.add(segment.id);
        }
    });

    if (highlights.size === 0 && transcript.length > 2) {
        highlights.add(transcript[1].id); // Fallback to the second segment
    }

    console.log("Found highlights:", Array.from(highlights));
    return Array.from(highlights);
}
