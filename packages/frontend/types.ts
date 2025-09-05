export enum UploadStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// FIX: Add TranscriptSegment interface to define the shape of a transcript piece.
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
  transcript: TranscriptSegment[];
  source: 'upload' | 'youtube';
  videoUrl?: string;
}