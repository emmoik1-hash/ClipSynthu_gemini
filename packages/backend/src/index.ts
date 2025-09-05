import express from 'express';

const app = express();
const port = process.env.PORT || 3001;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ClipSynth backend is running!' });
});

app.listen(port, () => {
  console.log(`🚀 Backend server listening at http://localhost:${port}`);
});
