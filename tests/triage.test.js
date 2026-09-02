/**
 * ResQCampus AI - Test Suite
 * Automated tests for input validation, schema compliance, multilingual enforcement, and fallback resilience.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../src/index');
const { validateTriagePayload, TRIAGE_SEVERITY_LEVELS } = require('../src/schema');
const { generateTriage, generateFallbackTriage, LANGUAGE_MAP } = require('../src/triageService');

test('Schema Validator: Validates compliant triage object', () => {
  const validObject = {
    triageSeverity: 'CRITICAL',
    summary: 'Severe chemical spill on lab bench',
    immediateSteps: ['Evacuate immediate area', 'Flush skin with water for 15 minutes'],
    safetyWarnings: ['Do not apply neutralizing acids'],
    campusAlertPayload: {
      alertId: 'RC-TEST-101',
      campusUnit: 'HAZMAT_RESPONSE',
      eta: '2-3 mins',
      status: 'DISPATCHED'
    }
  };

  const result = validateTriagePayload(validObject);
  assert.equal(result.valid, true, 'Compliant object should pass validation');
  assert.equal(result.errors.length, 0);
});

test('Schema Validator: Rejects invalid or incomplete payloads', () => {
  const invalidObject = {
    triageSeverity: 'INVALID_LEVEL',
    summary: '',
    immediateSteps: [],
    // safetyWarnings missing
    campusAlertPayload: {
      alertId: 'RC-101'
      // missing unit, eta, status
    }
  };

  const result = validateTriagePayload(invalidObject);
  assert.equal(result.valid, false, 'Invalid object should fail validation');
  assert.ok(result.errors.length >= 4, 'Should detect multiple schema errors');
});

test('Fallback Engine: Produces fully schema-compliant responses across all presets', () => {
  const presets = ['chemical', 'bleeding', 'unconscious', 'labhazard', 'general'];

  for (const preset of presets) {
    const result = generateFallbackTriage({ prompt: preset, language: 'en', incidentType: preset });
    const validation = validateTriagePayload(result);
    
    assert.equal(validation.valid, true, `Fallback for '${preset}' must be schema valid: ${validation.errors.join(', ')}`);
    assert.ok(TRIAGE_SEVERITY_LEVELS.includes(result.triageSeverity), 'Severity must be a valid enum level');
    assert.ok(result.immediateSteps.length > 0, 'Must have at least one immediate step');
    assert.ok(result.safetyWarnings.length > 0, 'Must have at least one safety warning');
    assert.ok(result.campusAlertPayload.alertId.startsWith('RC-'), 'Alert ID should follow campus format');
  }
});

test('Multilingual Enforcement: Generates Hindi Devanagari text when language is Hindi (hi)', () => {
  const result = generateFallbackTriage({ prompt: 'chemical burn', language: 'hi', incidentType: 'Chemical Spill' });
  const validation = validateTriagePayload(result);

  assert.equal(validation.valid, true, 'Hindi triage result must be schema valid');
  assert.equal(result.triageSeverity, 'CRITICAL');
  
  // Verify that Hindi Devanagari Unicode characters are present in the summary and steps
  const devanagariRegex = /[\u0900-\u097F]/;
  assert.ok(devanagariRegex.test(result.summary), 'Summary must contain Devanagari characters for Hindi');
  assert.ok(devanagariRegex.test(result.immediateSteps[0]), 'Immediate steps must contain Devanagari characters for Hindi');
});

test('Triage Service: Handles missing input with 400 validation error', async () => {
  await assert.rejects(
    async () => {
      await generateTriage({ prompt: '', imageBase64: '', incidentType: '' });
    },
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Invalid input/);
      return true;
    }
  );
});

test('Triage Service: Successfully processes multimodal mock payload with image', async () => {
  const mockBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  const result = await generateTriage({
    prompt: 'Worker burned by hot solvent in chemistry lab',
    imageBase64: mockBase64Image,
    mimeType: 'image/png',
    language: 'en',
    incidentType: 'Chemical Spill',
    location: 'Chemistry Wing 3'
  });

  const validation = validateTriagePayload(result);
  assert.equal(validation.valid, true, 'Multimodal result must be schema valid');
  assert.ok(result.triageSeverity, 'Triage severity must be defined');
  assert.ok(result.immediateSteps.length > 0, 'Immediate steps must be present');
});

test('Express API: GET /health returns 200 OK with health metadata', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'healthy');
    assert.equal(body.service, 'ResQCampus AI Emergency Triage');
  } finally {
    server.close();
  }
});

test('Express API: POST /api/generate rejects empty request with HTTP 400', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Bad Request');
  } finally {
    server.close();
  }
});

test('Express API: POST /api/generate responds with structured triage for valid incident', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Student fainted in the gym after intense workout in heat',
        language: 'en',
        incidentType: 'Unconscious / Heatstroke',
        location: 'Campus Recreation Center'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    const validation = validateTriagePayload(body);
    assert.equal(validation.valid, true, `Response body should be schema valid: ${validation.errors.join(', ')}`);
    assert.ok(body.campusAlertPayload.alertId, 'Should have alertId');
  } finally {
    server.close();
  }
});

test('Express API: POST /api/generate with Hindi language returns Devanagari output', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Chemical acid burn in chemistry laboratory',
        targetLanguage: 'Hindi',
        incidentType: 'Chemical Spill',
        location: 'Lab 201'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    const validation = validateTriagePayload(body);
    assert.equal(validation.valid, true, `Hindi response must be schema valid: ${validation.errors.join(', ')}`);

    const devanagariRegex = /[\u0900-\u097F]/;
    assert.ok(devanagariRegex.test(body.summary), 'Summary must contain Hindi Devanagari text');
    assert.ok(devanagariRegex.test(body.immediateSteps[0]), 'Steps must contain Hindi Devanagari text');
    assert.ok(devanagariRegex.test(body.safetyWarnings[0]), 'Warnings must contain Hindi Devanagari text');
  } finally {
    server.close();
  }
});

test('Multilingual Support: Supports all 8 languages (English, Hindi, Hinglish, Punjabi, Bengali, Tamil, Telugu, Marathi)', () => {
  const languages = ['en', 'hi', 'hinglish', 'pa', 'bn', 'ta', 'te', 'mr'];

  for (const lang of languages) {
    const result = generateFallbackTriage({ prompt: 'Chemical spill', targetLanguage: lang, incidentType: 'chemical' });
    const validation = validateTriagePayload(result);
    assert.equal(validation.valid, true, `Language ${lang} fallback should be valid: ${validation.errors.join(', ')}`);
    assert.ok(result.summary.length > 0, `Language ${lang} must have a summary`);
    assert.ok(result.immediateSteps.length > 0, `Language ${lang} must have immediate steps`);
    assert.ok(result.safetyWarnings.length > 0, `Language ${lang} must have safety warnings`);
  }
});

test('Smart Photo Analysis: Generates observations, hazards, risk level, precautions, and urgent help thresholds', () => {
  const result = generateFallbackTriage({
    prompt: 'Severe laceration on forearm from broken lab glassware',
    language: 'en',
    incidentType: 'bleeding'
  });

  assert.ok(result.imageObservation, 'Must provide imageObservation');
  assert.ok(result.possibleHazards, 'Must provide possibleHazards');
  assert.ok(result.riskLevel, 'Must provide riskLevel');
  assert.ok(result.riskLevelReason, 'Must provide riskLevelReason');
  assert.ok(result.whenToSeekUrgentHelp, 'Must provide whenToSeekUrgentHelp');
  assert.ok(result.disclaimer, 'Must provide disclaimer');
});

