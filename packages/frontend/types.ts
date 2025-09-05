export enum UploadStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// FIX: Add TranscriptSegment interface to define the shape of a transcript piece.
// This resolves the error "Module '"@/types"' has no exported member 'TranscriptSegment'".
export interface TranscriptSegment {
  id: string;
  text: string;
  start: number;
  end: number;
}

export interface VideoDetails {
  id: string;
  name: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  // FIX: Add transcript property to include transcript data with video details.
  // This resolves errors like "Property 'transcript' does not exist on type 'VideoDetails'".
  transcript: TranscriptSegment[];
}
