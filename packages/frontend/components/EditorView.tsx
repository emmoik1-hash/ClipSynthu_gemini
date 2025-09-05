'use client';

import React, { useState } from 'react';
import { VideoDetails, TranscriptSegment } from '@/types';
import { findHighlightsInTranscript } from '@/services/videoService';
import { SparklesIcon, SpinnerIcon } from './icons/Icons';

interface EditorViewProps {
  videoDetails: VideoDetails;
  onReset: () => void;
}

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const EditorView: React.FC<EditorViewProps> = ({ videoDetails, onReset }) => {
    const [isFinding, setIsFinding] = useState(false);
    const [highlights, setHighlights] = useState<Set<string>>(new Set());

    const handleFindHooks = async () => {
        setIsFinding(true);
        try {
            const highlightIds = await findHighlightsInTranscript(videoDetails.transcript);
            setHighlights(new Set(highlightIds));
        } catch (error) {
            console.error("Failed to find highlights", error);
            // Optionally, show an error message to the user
        }
        setIsFinding(false);
    }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-8 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Left Column: Video Info & Actions */}
            <div className="md:w-1/3 flex-shrink-0">
                <div className="sticky top-24">
                    <h2 className="text-2xl font-bold mb-4">Editor</h2>
                    <div className="bg-gray-900 rounded-lg p-4 mb-4">
                        <img src={videoDetails.thumbnailUrl} alt="Video thumbnail" className="w-full h-auto object-cover rounded-md mb-3" />
                        <div className="text-left">
                            <p className="font-semibold text-white truncate" title={videoDetails.name}>{videoDetails.name}</p>
                            <p className="text-sm text-gray-400">{formatTime(videoDetails.duration)}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleFindHooks}
                        disabled={isFinding}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isFinding ? <SpinnerIcon /> : <SparklesIcon />}
                        <span>{isFinding ? 'Analyzing...' : 'Find Hooks with AI'}</span>
                    </button>
                    
                    <button onClick={onReset} className="mt-2 w-full text-gray-400 hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                        Upload Another Video
                    </button>
                </div>
            </div>

            {/* Right Column: Transcript */}
            <div className="md:w-2/3 mt-8 md:mt-0">
                <h3 className="text-xl font-semibold mb-4">Transcript</h3>
                <div className="bg-gray-900/50 rounded-lg p-4 h-[60vh] overflow-y-auto space-y-4">
                    {videoDetails.transcript.map((segment) => (
                        <TranscriptSegmentView 
                            key={segment.id} 
                            segment={segment} 
                            isHighlighted={highlights.has(segment.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

const TranscriptSegmentView: React.FC<{ segment: TranscriptSegment; isHighlighted: boolean }> = ({ segment, isHighlighted }) => (
    <div 
        className={`flex items-start space-x-4 p-3 rounded-lg transition-colors duration-300 ${isHighlighted ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'hover:bg-gray-700/50'}`}
    >
        <div className="text-sm font-mono text-gray-400 mt-1">{formatTime(segment.start)}</div>
        <p className="text-gray-200 flex-1">{segment.text}</p>
    </div>
);
