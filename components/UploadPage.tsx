
import React, { useState, useCallback } from 'react';
import { UploadStatus, VideoDetails } from '../types';
import { uploadVideoFile, importFromYouTube } from '../services/videoService';
import { FileUploadIcon, LinkIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon } from './icons/Icons';

type UploadMode = 'file' | 'url';

const UploadPage: React.FC = () => {
  const [mode, setMode] = useState<UploadMode>('file');
  const [status, setStatus] = useState<UploadStatus>(UploadStatus.IDLE);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleReset = () => {
    setStatus(UploadStatus.IDLE);
    setProgress(0);
    setError(null);
    setVideoDetails(null);
    setYoutubeUrl('');
  };
  
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    handleReset();
    setStatus(UploadStatus.UPLOADING);
    try {
        const result = await uploadVideoFile(file, (p) => {
            setProgress(p);
            if (p >= 100) {
                setStatus(UploadStatus.PROCESSING);
            }
        });
        setVideoDetails(result);
        setStatus(UploadStatus.SUCCESS);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setStatus(UploadStatus.ERROR);
    }
  }, []);

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    handleReset();
    setStatus(UploadStatus.UPLOADING);
    try {
      const result = await importFromYouTube(youtubeUrl, (p) => {
        setProgress(p);
        if (p >= 100) {
          setStatus(UploadStatus.PROCESSING);
        }
      });
      setVideoDetails(result);
      setStatus(UploadStatus.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStatus(UploadStatus.ERROR);
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const renderContent = () => {
    switch (status) {
      case UploadStatus.UPLOADING:
      case UploadStatus.PROCESSING:
        return <ProgressView status={status} progress={progress} />;
      case UploadStatus.SUCCESS:
        return <SuccessView videoDetails={videoDetails!} onReset={handleReset} />;
      case UploadStatus.ERROR:
        return <ErrorView error={error!} onReset={handleReset} />;
      case UploadStatus.IDLE:
      default:
        return (
          <>
            <div className="flex justify-center border-b border-gray-700 mb-6">
              <TabButton title="Upload File" icon={<FileUploadIcon />} active={mode === 'file'} onClick={() => setMode('file')} />
              <TabButton title="YouTube Link" icon={<LinkIcon />} active={mode === 'url'} onClick={() => setMode('url')} />
            </div>
            {mode === 'file' ? (
              <FileUploader onDrag={handleDrag} onDrop={handleDrop} onChange={handleFileChange} dragActive={dragActive} />
            ) : (
              <UrlUploader url={youtubeUrl} setUrl={setYoutubeUrl} onSubmit={handleUrlImport} />
            )}
          </>
        );
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-8 transition-all duration-300">
        {renderContent()}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ title: string; icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ title, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-6 py-3 font-semibold text-sm transition-colors duration-200 focus:outline-none ${
      active ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
    }`}
  >
    {icon}
    <span>{title}</span>
  </button>
);

const FileUploader: React.FC<{ onDrag: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; dragActive: boolean; }> = ({ onDrag, onDrop, onChange, dragActive }) => (
  <form onDragEnter={onDrag} onSubmit={(e) => e.preventDefault()}>
    <label htmlFor="file-upload" className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${dragActive ? 'border-blue-500 bg-gray-700' : 'border-gray-600 hover:border-gray-500 bg-gray-800'}`}>
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <FileUploadIcon className="w-10 h-10 mb-3 text-gray-400" />
        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
        <p className="text-xs text-gray-500">MP4, MOV, or AVI (MAX. 2GB)</p>
      </div>
      <input id="file-upload" type="file" className="hidden" onChange={onChange} accept="video/mp4,video/quicktime,video/x-msvideo" />
    </label>
    {dragActive && <div className="absolute inset-0 w-full h-full" onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}></div>}
  </form>
);

const UrlUploader: React.FC<{ url: string; setUrl: (url: string) => void; onSubmit: (e: React.FormEvent) => void; }> = ({ url, setUrl, onSubmit }) => (
  <form onSubmit={onSubmit}>
    <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-2 border border-gray-700 focus-within:ring-2 focus-within:ring-blue-500">
      <LinkIcon className="text-gray-400 ml-2" />
      <input 
        type="url" 
        placeholder="https://www.youtube.com/watch?v=..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full bg-transparent p-2 text-white placeholder-gray-500 focus:outline-none"
      />
    </div>
    <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!url}>
      Import Video
    </button>
  </form>
);

const ProgressView: React.FC<{ status: UploadStatus; progress: number }> = ({ status, progress }) => {
  const message = status === UploadStatus.UPLOADING ? 'Uploading...' : 'Processing video...';
  const subtext = status === UploadStatus.PROCESSING ? 'This might take a moment. Analyzing audio and generating transcript...' : '';
  return (
    <div className="text-center">
      <div className="flex justify-center items-center mb-4">
        <SpinnerIcon className="w-12 h-12 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{message}</h3>
      {subtext && <p className="text-sm text-gray-400 mb-4">{subtext}</p>}
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

const SuccessView: React.FC<{ videoDetails: VideoDetails; onReset: () => void }> = ({ videoDetails, onReset }) => (
  <div className="text-center">
    <div className="flex justify-center items-center mb-4">
      <CheckCircleIcon className="w-16 h-16 text-green-500" />
    </div>
    <h3 className="text-2xl font-bold mb-2">Upload Complete!</h3>
    <p className="text-gray-300 mb-6">Your video is ready to be synthesized.</p>
    <div className="bg-gray-900 rounded-lg p-4 flex items-center space-x-4">
      <img src={videoDetails.thumbnailUrl} alt="Video thumbnail" className="w-24 h-14 object-cover rounded" />
      <div className="text-left">
        <p className="font-semibold text-white truncate">{videoDetails.name}</p>
        <p className="text-sm text-gray-400">{Math.floor(videoDetails.duration / 60)}m {videoDetails.duration % 60}s</p>
      </div>
    </div>
    <button onClick={() => alert('Proceeding to editor...')} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200">
      Find Highlights
    </button>
     <button onClick={onReset} className="mt-2 w-full text-gray-400 hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
      Upload Another Video
    </button>
  </div>
);

const ErrorView: React.FC<{ error: string; onReset: () => void }> = ({ error, onReset }) => (
  <div className="text-center">
    <div className="flex justify-center items-center mb-4">
      <XCircleIcon className="w-16 h-16 text-red-500" />
    </div>
    <h3 className="text-2xl font-bold mb-2">Upload Failed</h3>
    <p className="text-gray-300 bg-red-900/50 p-3 rounded-lg mb-6">{error}</p>
    <button onClick={onReset} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200">
      Try Again
    </button>
  </div>
);

export default UploadPage;
