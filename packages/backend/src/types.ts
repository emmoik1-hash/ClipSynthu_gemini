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
  transcript: TranscriptSegment[];
}
