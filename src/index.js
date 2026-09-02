/**
 * ResQCampus AI - Main Express Server Entry Point
 * PromptWars x WIE-IEEE Assistive Health & Safety Companion
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateTriage } = require('./triageService');
const { validateTriagePayload } = require('./schema');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS and Express JSON payload parsing (supporting multimodal base64 images up to 25MB)
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static frontend assets from 'views' directory
app.use(express.static(path.join(__dirname, '..', 'views')));

/**
 * Health Check Probe Endpoint for Cloud Run / Kubernetes
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ResQCampus AI Emergency Triage',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

/**
 * Multimodal Triage Generation Endpoint
 * POST /api/generate
 * Payload: { prompt, imageBase64, mimeType, language, incidentType, location }
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType, language = 'en', targetLanguage, incidentType, location } = req.body || {};
    const rawLang = (targetLanguage || language || 'en').toString().toLowerCase().trim();
    let effectiveLanguage = 'en';
    if (['hi', 'hindi', 'हिंदी', 'हिन्दी'].includes(rawLang)) effectiveLanguage = 'hi';
    else if (['hinglish', 'hing'].includes(rawLang)) effectiveLanguage = 'hinglish';
    else if (['pa', 'punjabi', 'ਪੰਜਾਬੀ'].includes(rawLang)) effectiveLanguage = 'pa';
    else if (['bn', 'bengali', 'বাংলা'].includes(rawLang)) effectiveLanguage = 'bn';
    else if (['ta', 'tamil', 'தமிழ்'].includes(rawLang)) effectiveLanguage = 'ta';
    else if (['te', 'telugu', 'తెలుగు'].includes(rawLang)) effectiveLanguage = 'te';
    else if (['mr', 'marathi', 'मराठी'].includes(rawLang)) effectiveLanguage = 'mr';
    else effectiveLanguage = rawLang;

    // Validate that at least one form of input exists
    const hasPrompt = typeof prompt === 'string' && prompt.trim().length > 0;
    const hasImage = typeof imageBase64 === 'string' && imageBase64.trim().length > 0;
    const hasPreset = typeof incidentType === 'string' && incidentType.trim().length > 0;

    if (!hasPrompt && !hasImage && !hasPreset) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing input: You must provide a text prompt description, an incident image, or select a preset incident type.'
      });
    }

    const triageResult = await generateTriage({
      prompt,
      imageBase64,
      mimeType,
      language: effectiveLanguage,
      targetLanguage: effectiveLanguage,
      incidentType,
      location
    });

    // Validate output structure
    const validation = validateTriagePayload(triageResult);
    if (!validation.valid) {
      console.warn('[ResQCampus AI] Schema validation warnings:', validation.errors);
    }

    return res.status(200).json(triageResult);

  } catch (error) {
    console.error('[ResQCampus AI] Error processing triage request:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: 'Triage Processing Error',
      message: error.message || 'An unexpected error occurred while generating emergency triage recommendations.'
    });
  }
});

/**
 * Fallback route to serve index.html for single page navigation
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

// Start Express Server if run directly
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 ResQCampus AI Server running on port ${PORT}`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`⚡ Model: gemini-2.5-flash (Multimodal Multilingual)`);
    console.log(`🛡️ WCAG 2.1 AA Compliant UI active in /views`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use by another process.`);
      console.error(`💡 Tip: Close the other instance or terminate the process using port ${PORT}.\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down ResQCampus AI server gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = app;
