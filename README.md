# ResQCampus AI 🚨
### Multimodal Emergency Triage & Assistive Safety Copilot
**PromptWars x WIE-IEEE Assistive Health & Emergency Safety Challenge**

ResQCampus AI is a production-ready, accessible, multimodal emergency health & safety companion designed for university campuses. Powered by **Google Gemini 2.5 Flash** (`gemini-2.5-flash`), Express.js, and strict **WCAG 2.1 AA** compliant frontend design.

---

## 🌟 Key Features

1. **Multilingual Support (8 Languages)**:
   - Dynamic translation and native script enforcement for:
     1. **English** (`en`)
     2. **Hindi (हिंदी)** (`hi` - pure Devanagari script)
     3. **Hinglish** (`hinglish` - Romanized conversational Hindi)
     4. **Punjabi (ਪੰਜਾਬੀ)** (`pa` - Gurmukhi script)
     5. **Bengali (বাংলা)** (`bn` - Bengali script)
     6. **Tamil (தமிழ்)** (`ta` - Tamil script)
     7. **Telugu (తెలుగు)** (`te` - Telugu script)
     8. **Marathi (मराठी)** (`mr` - Devanagari script)
   - Persisted language selection via `localStorage`.

2. **Smart Photo Analysis & 7-Section Triage Result Card**:
   - Accepts uploaded incident photos (chemical labels, burn injuries, lacerations, hazard zones) and processes them with Gemini 2.5 Flash.
   - Structured output with:
     * **1. IMAGE OBSERVATION**: Objective visual detection of substances, wounds, and scene elements without hallucinations.
     * **2. POSSIBLE RISK OR HAZARD**: Identification of chemical, thermal, electrical, or trauma hazards.
     * **3. RISK LEVEL & REASON**: Visual risk badges (🟢 LOW, 🟡 MEDIUM, 🟠 HIGH, 🔴 CRITICAL) + one-line rationale.
     * **4. WHAT TO DO NOW**: Actionable, sequential step-by-step immediate first-aid checklist with individual audio read buttons.
     * **5. PRECAUTIONS**: Critical "Do Not Do" warnings.
     * **6. WHEN TO SEEK URGENT HELP**: Clear escalation thresholds for campus security, paramedics, or emergency department transfer.
     * **7. AI LIMITATION NOTE**: Accessibility disclaimer for first responder guidance.

3. **Multimodal Incident Intake**:
   - **Text & Visual Triage**: Accepts emergency descriptions alongside uploaded incident images.
   - **Speech-to-Text (STT)**: Hands-free voice input via Web Speech Recognition for victims or first responders under stress.
   - **Text-to-Speech (TTS) Read Aloud**: `[ 🔊 Read Aloud ]` button directly adjacent to the Triage Result banner.

4. **1-Tap SOS Emergency Center & Offline Guide**:
   - Immediate audio siren beacon (Web Audio API) + geo-coordinates acquisition + direct 1-tap phone dialers (`112 / 911`, Campus Security, Health Desk).
   - `[ 📖 Offline Guide ]` quick modal with standard first-aid protocols with 0 network dependency.

5. **Quick Incident Presets**:
   - 1-click loading for *Chemical Spill*, *Severe Bleeding / Trauma*, *Heatstroke / Syncope*, *Lab Fire / Electrical Hazard*, and *Anaphylaxis*.

6. **Accessibility & WCAG 2.1 AA Compliance**:
   - Skip to main content keyboard shortcut.
   - Full keyboard `:focus-visible` outlines.
   - `aria-live` screen reader announcements.
   - Dynamic font-size scaling (`A-`, `A`, `A+`).
   - High-contrast mode and Night Vision Emergency Red theme.

7. **Resilient Offline Fallback Engine**:
   - 100% fail-safe operation: If `GEMINI_API_KEY` is not provided or network is throttled, the intelligent rule engine provides medically sound first-aid in all supported languages with zero downtime.

---

## 🛠️ Project Structure

```
PromptWar26/
├── .env.example              # Environment variable template
├── .env                      # Local environment secrets (process.env)
├── .gitignore                # Git ignore rules
├── package.json              # Express, cors, dotenv, and test scripts
├── Dockerfile                # Production Cloud Run containerfile
├── README.md                 # Project documentation
├── src/
│   ├── index.js              # Express server, /health, /api/generate & static routing
│   ├── schema.js             # JSON Schema definition & payload validator
│   └── triageService.js      # Gemini 2.5 Flash multimodal client & fallback engine
├── views/
│   ├── index.html            # WCAG 2.1 AA accessible emergency UI
│   ├── app.js                # Frontend controller: Audio TTS, Mic STT, SOS, Presets
│   └── styles.css            # Custom accessibility themes & pulsing animations
└── tests/
    └── triage.test.js        # Native Node test suite (validation, schema, multilingual)
```

---

## 🚀 Quickstart & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and supply your Gemini API Key (optional for fallback mode):
```bash
PORT=8080
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Local Development Server
```bash
npm start
```
Visit: **`http://localhost:8080`**

---

## 📡 API Reference

### `POST /api/generate`
Analyzes emergency incident text and/or multimodal base64 image data.

#### Request Body
```json
{
  "prompt": "Student suffered chemical burn on hand from concentrated acid spill in chemistry lab",
  "imageBase64": "data:image/jpeg;base64,...",
  "mimeType": "image/jpeg",
  "language": "hi",
  "incidentType": "Chemical Spill",
  "location": "Science Block 2, Room 301"
}
```

#### Response (HTTP 200)
```json
{
  "triageSeverity": "CRITICAL",
  "summary": "खतरनाक रासायनिक या एसिड फैलाव का पता चला है। तत्काल प्राथमिक उपचार और आपातकालीन सहायता की आवश्यकता है।",
  "immediateSteps": [
    "प्रभावित क्षेत्र को तुरंत खाली करें और ताजी हवा में जाएं।",
    "प्रभावित त्वचा या आंखों को कम से कम 15-20 मिनट तक लगातार साफ पानी से धोएं।",
    "संक्रमित कपड़ों को सावधानीपूर्वक हटा दें ताकि अप्रभावित त्वचा सुरक्षित रहे।",
    "प्रयोगशाला प्रभारी को सूचित करें और तुरंत कैंपस हैजमैट टीम को बुलाएं।"
  ],
  "safetyWarnings": [
    "बिना विशेषज्ञ सलाह के घाव पर कोई रासायनिक मरहम या तेल न लगाएं।",
    "प्रभावित हिस्से को रगड़ें या कसकर न बांधें।",
    "गैस या धुएं को सांस में न लें।"
  ],
  "campusAlertPayload": {
    "alertId": "RC-CHEM-911",
    "campusUnit": "HAZMAT_RESPONSE_TEAM",
    "eta": "2-3 mins",
    "status": "DISPATCHED",
    "locationZone": "Science Block 2, Room 301"
  }
}
```

### `GET /health`
Returns health check status for Google Cloud Run / container monitors:
```json
{
  "status": "healthy",
  "service": "ResQCampus AI Emergency Triage",
  "timestamp": "2026-09-02T11:15:00.000Z",
  "env": "production"
}
```

---

## 🐳 Docker & Cloud Run Deployment

Build and run with Docker:
```bash
docker build -t resqcampus-ai .
docker run -p 8080:8080 -e GEMINI_API_KEY="YOUR_KEY" resqcampus-ai
```

Deploy directly to Google Cloud Run:
```bash
gcloud run deploy resqcampus-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="YOUR_KEY"
```

---

## 🏆 PromptWars x WIE-IEEE Challenge Compliance
- Multimodal Triage: Gemini 2.5 Flash Vision & Text.
- Multilingual First-Aid: Dynamic Devanagari Hindi & multi-dialect support.
- Assistive Health: Speech TTS & Voice STT input.
- WCAG 2.1 AA Accessibility: Contrast scaler, ARIA live regions, skip links.
- Fail-safe Architecture: Zero crash resilient fallback logic.
