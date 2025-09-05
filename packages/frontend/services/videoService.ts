// FIX: Import TranscriptSegment, which was previously missing, to resolve type errors.
import { UploadStatus, VideoDetails, TranscriptSegment } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Mock service to simulate backend operations
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadVideoFile = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<VideoDetails> => {
  console.log(`Starting real upload for ${file.name}`);
  
  // Simulate a quick upload progress for a better UX while the file is being sent.
  let progress = 0;
  while (progress < 100) {
    await simulateDelay(50 + Math.random() * 50);
    progress += Math.floor(Math.random() * 15) + 10;
    onProgress(Math.min(progress, 100));
  }
  
  // The UI will now show "Processing..." while we send the file to the backend.
  const formData = new FormData();
  formData.append('video', file);

  const response = await fetch(`${API_BASE_URL}/api/videos/upload-file`, {
    method: 'POST',
    body: formData,
    // Note: Don't set Content-Type header when using FormData with fetch,
    // the browser will set it automatically with the correct boundary.
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload file.');
  }

  const videoDetails: VideoDetails = await response.json();
  return videoDetails;
};

export const importFromYouTube = async (
  url: string,
  onProgress: (progress: number) => void
): Promise<VideoDetails> => {
    console.log(`Starting real import from ${url}`);
    
    // Simulate initial phase before hitting the backend
    onProgress(10);
    await simulateDelay(200);

    const response = await fetch(`${API_BASE_URL}/api/videos/import-youtube`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
    });

    onProgress(50); // Backend is processing

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import from YouTube.');
    }
    
    const videoDetails: VideoDetails = await response.json();
    
    onProgress(100); // Done
    await simulateDelay(500); // Small delay to let the user see 100%

    return videoDetails;
};

// FIX: Export the findHighlightsInTranscript function to make it available for other modules.
export const findHighlightsInTranscript = async (transcript: TranscriptSegment[]): Promise<string[]> => {
    console.log("Calling backend to find AI-powered highlights...");

    const response = await fetch(`${API_BASE_URL}/api/highlights/find`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to find highlights from backend:", errorData);
        throw new Error(errorData.error || 'Failed to analyze transcript for highlights.');
    }

    const { highlightIds } = await response.json();
    console.log("Received AI-powered highlights:", highlightIds);
    return highlightIds;
}