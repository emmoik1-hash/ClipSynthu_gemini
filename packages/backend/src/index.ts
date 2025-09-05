// Fix: Changed express import to resolve type errors with middleware.
import express from 'express';
import cors from 'cors';
import ytdl from 'ytdl-core';
import multer from 'multer';
import { TranscriptSegment, VideoDetails } from './types';

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Allow cross-origin requests from the frontend
// Fix: Use express.json() for parsing JSON bodies. This resolves a type error with app.use().
app.use(express.json()); // Parse JSON bodies

// Multer setup for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(), // Use memory storage for simplicity for now
    limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit, matching frontend text
});

// Mock function to generate a transcript (will be replaced by Whisper later)
const generateMockTranscript = (duration: number): TranscriptSegment[] => {
    const transcript: TranscriptSegment[] = [];
    let currentTime = 0;
    let id = 0;
    const sentences = [
        "Hello everyone and welcome back to the channel.", "Today, we're going to unbox something truly special.", "This is the new gadget everyone has been talking about.", "Let's see what's inside the box.", "First impressions? The packaging is very premium.", "And here it is, the device itself feels incredibly well-built.", "The screen is absolutely gorgeous, with vibrant colors.", "I can't wait to turn this on and test out the performance.", "They say the camera is a huge improvement over the last generation.", "We'll be putting that to the test in just a moment.", "Make sure you subscribe so you don't miss our full review.", "This could be a game-changer for content creators.", "The battery life is also supposed to be excellent.", "What do you guys think? Let me know in the comments below.", "Thanks for watching, and we'll see you in the next one!"
    ];

    while (currentTime < duration && id < 50) { // Limit to 50 segments
        const sentence = sentences[id % sentences.length];
        const textDuration = Math.max(3, sentence.length / 10);
        transcript.push({
            id: `seg_${id++}`,
            text: sentence,
            start: currentTime,
            end: currentTime + textDuration,
        });
        currentTime += textDuration + 0.5;
    }
    return transcript;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ClipSynth backend is running!' });
});

// File Upload endpoint
app.post('/api/videos/upload-file', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file provided.' });
    }

    try {
        // In a real scenario, we'd use a library like ffprobe to get the actual duration.
        // For now, we'll mock it.
        const duration = 245; // Mock duration in seconds

        const videoDetails: VideoDetails = {
            id: `vid_${Date.now()}`,
            name: req.file.originalname,
            duration: duration,
            thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/400/225`, // Mock thumbnail
            transcript: generateMockTranscript(duration),
        };
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        res.status(200).json(videoDetails);

    } catch (error) {
        console.error('Failed to process uploaded file:', error);
        res.status(500).json({ error: 'Failed to process the uploaded file.' });
    }
});


// YouTube import endpoint
app.post('/api/videos/import-youtube', async (req, res) => {
    const { url } = req.body;

    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ error: 'Invalid or missing YouTube URL.' });
    }

    try {
        const info = await ytdl.getInfo(url);
        const duration = parseInt(info.videoDetails.lengthSeconds, 10);
        
        const videoDetails: VideoDetails = {
            id: `yt_${info.videoDetails.videoId}`,
            name: info.videoDetails.title,
            duration: duration,
            thumbnailUrl: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url, // Get highest quality thumbnail
            transcript: generateMockTranscript(duration),
        };

        res.status(200).json(videoDetails);

    } catch (error) {
        console.error('Failed to fetch YouTube video info:', error);
        res.status(500).json({ error: 'Failed to process YouTube URL. The video might be private or unavailable.' });
    }
});


app.listen(port, () => {
  console.log(`🚀 Backend server listening at http://localhost:${port}`);
});