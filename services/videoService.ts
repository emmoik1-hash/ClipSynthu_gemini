
import { UploadStatus, VideoDetails } from '../types';

// Mock service to simulate backend operations

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  
  // Simulate success
  return {
    id: `vid_${Date.now()}`,
    name: file.name,
    duration: 185, // mock duration
    thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/400/225`,
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
    
    return {
        id: `yt_${Date.now()}`,
        name: "Imported YouTube Video",
        duration: 320,
        thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/400/225`,
    };
};
