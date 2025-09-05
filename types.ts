
export enum UploadStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface VideoDetails {
  id: string;
  name: string;
  duration: number; // in seconds
  thumbnailUrl: string;
}
