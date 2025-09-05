// Fix: Changed express import to a default import to resolve module type errors.
// Fix: Added explicit types for Application, Request, and Response to fix handler overload errors.
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import ytdl from 'ytdl-core';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TranscriptSegment, VideoDetails } from './types';
import { GoogleGenAI, Type } from "@google/genai";

const app: Application = express();
const port = process.env.PORT || 3001;

// --- Setup AI ---
// IMPORTANT: Make sure the API_KEY environment variable is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Setup Uploads Directory ---
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middlewares
app.use(cors()); // Allow cross-origin requests from the frontend
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies, increase limit for large transcripts

// Serve static video files
app.use('/uploads', express.static(uploadsDir));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        // Create a unique filename to avoid conflicts
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit
});


const generateTranscriptWithAI = async (videoName: string, duration: number): Promise<TranscriptSegment[]> => {
    console.log(`Generating AI transcript for: ${videoName}`);
    try {
        const prompt = `
            You are a highly accurate video transcript generator. Your task is to create a plausible, timed transcript for a video based on its title and duration.

            Video Title: "${videoName}"
            Total Duration: ${duration} seconds.

            Please generate a transcript with 30 to 50 segments. Each segment should represent a spoken sentence or a clause.
            The final output MUST be a valid JSON array of objects. Each object must have the following properties: "id", "text", "start", and "end".
            - "id": A unique string identifier, e.g., "seg_0", "seg_1".
            - "text": The plausible transcribed text for the segment.
            - "start": The start time in seconds (float or integer).
            - "end": The end time in seconds (float or integer).

            Ensure the timestamps are sequential and do not exceed the total video duration. The content of the text should be directly relevant to the video title.
        `;
        
        const responseSchema = {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
              },
              required: ["id", "text", "start", "end"],
            },
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const transcript = JSON.parse(jsonText);
        console.log("Successfully generated AI transcript.");
        return transcript;

    } catch (error) {
        console.error("Error generating AI transcript:", error);
        // Fallback to a single-segment transcript on error
        return [{
            id: 'seg_0',
            text: `(AI generation failed. Displaying fallback for: ${videoName})`,
            start: 0,
            end: duration > 5 ? 5 : duration,
        }];
    }
};

const findHighlightsWithAI = async (transcript: TranscriptSegment[]): Promise<string[]> => {
    console.log("Finding hooks in transcript with AI...");
    try {
        const prompt = `
            You are an expert viral video producer for platforms like TikTok, Reels, and YouTube Shorts. Your task is to analyze a video transcript and identify the segments that would make the most compelling "hooks" to capture a viewer's attention.

            A great hook is typically:
            - A surprising statement or question.
            - A controversial opinion.
            - The beginning of a story (e.g., "This is how I...").
            - A statement that promises a valuable outcome or solution.
            - Something emotionally charged or highly energetic.

            Here is the transcript:
            ${JSON.stringify(transcript)}

            Based on this transcript, please identify the top 3-5 most hook-worthy segments. Your response MUST be a valid JSON array containing only the string IDs of the selected segments.
            Example format: ["seg_5", "seg_12", "seg_28"]
        `;

        const responseSchema = {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.5,
            },
        });

        const jsonText = response.text.trim();
        const highlightIds = JSON.parse(jsonText);
        console.log("Successfully found AI highlights:", highlightIds);
        return highlightIds;

    } catch (error) {
        console.error("Error finding highlights with AI:", error);
        // Fallback to returning an empty array on error
        return [];
    }
};

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'ClipSynth backend is running!' });
});

// File Upload endpoint
app.post('/api/videos/upload-file', upload.single('video'), async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file provided.' });
    }

    try {
        // In a real scenario, we'd use a library like ffprobe to get the actual duration.
        // For now, we'll mock it.
        const duration = 245; // Mock duration in seconds

        const videoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const videoDetails: VideoDetails = {
            id: `vid_${Date.now()}`,
            name: req.file.originalname,
            duration: duration,
            thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/400/225`, // Mock thumbnail
            transcript: await generateTranscriptWithAI(req.file.originalname, duration),
            source: 'upload',
            videoUrl: videoUrl,
        };
        
        res.status(200).json(videoDetails);

    } catch (error) {
        console.error('Failed to process uploaded file:', error);
        res.status(500).json({ error: 'Failed to process the uploaded file.' });
    }
});


// YouTube import endpoint
app.post('/api/videos/import-youtube', async (req: Request, res: Response) => {
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
            transcript: await generateTranscriptWithAI(info.videoDetails.title, duration),
            source: 'youtube',
        };

        res.status(200).json(videoDetails);

    } catch (error) {
        console.error('Failed to fetch YouTube video info:', error);
        res.status(500).json({ error: 'Failed to process YouTube URL. The video might be private or unavailable.' });
    }
});

// Find Highlights endpoint
app.post('/api/highlights/find', async (req: Request, res: Response) => {
    const { transcript } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
        return res.status(400).json({ error: 'Valid transcript data is required.' });
    }

    try {
        const highlightIds = await findHighlightsWithAI(transcript);
        res.status(200).json({ highlightIds });
    } catch (error) {
        console.error('Failed to find highlights:', error);
        res.status(500).json({ error: 'An internal error occurred while analyzing for highlights.' });
    }
});


app.listen(port, () => {
  console.log(`🚀 Backend server listening at http://localhost:${port}`);
});