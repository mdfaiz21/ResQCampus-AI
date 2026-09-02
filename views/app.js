/**
 * ResQCampus AI - Frontend Application Controller
 * Multimodal Assistive Health & Safety Emergency Interface
 * PromptWars x WIE-IEEE
 */

// State Management
const state = {
  selectedLanguage: 'en',
  imageBase64: null,
  imageMimeType: null,
  currentTriageData: null,
  fontSizeIndex: 1, // 0: 14px, 1: 16px, 2: 18px, 3: 20px
  fontSizes: ['14px', '16px', '18px', '20px'],
  isSpeaking: false,
  isRecording: false,
  countdownInterval: null
};

// Preset Scenarios Data
const PRESET_DATA = {
  chemical: {
    title: 'Chemical Spill / Acid Exposure',
    prompt: 'A concentrated chemical reagent spilled onto a student\'s forearm in the Organic Chemistry Lab. Skin is reddening and stinging with strong fumes present.',
    location: 'Chemistry Complex - Lab 304'
  },
  bleeding: {
    title: 'Severe Bleeding / Deep Laceration',
    prompt: 'Heavy arterial or venous bleeding from a deep laceration on the lower arm caused by broken laboratory glassware. Blood is soaking through towels quickly.',
    location: 'Mechanical Engineering Workshop'
  },
  unconscious: {
    title: 'Unconscious / Heatstroke Collapse',
    prompt: 'A student collapsed outdoors during intense heat on the athletic track. Individual is currently unresponsive to voice commands with hot, dry skin.',
    location: 'Main Campus Athletic Stadium'
  },
  labhazard: {
    title: 'Lab Electrical Hazard / Fire',
    prompt: 'An electrical equipment fire ignited on the electronics testing bench with dense acrid smoke and sparks spreading near combustible materials.',
    location: 'Electrical & Computing Lab Wing'
  },
  respiratory: {
    title: 'Severe Allergic Reaction / Anaphylaxis',
    prompt: 'Student exhibiting acute respiratory wheezing, facial swelling, and difficulty speaking following accidental peanut ingestion in the dining hall.',
    location: 'Student Union Cafeteria'
  }
};

// DOM Elements
let elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  initAccessibility();
  initEventListeners();
  initGeolocation();
  announceToScreenReader('ResQCampus AI Emergency Safety Dashboard is ready.');
});

function cacheElements() {
  elements = {
    form: document.getElementById('triage-form'),
    promptInput: document.getElementById('prompt-input'),
    charCount: document.getElementById('char-count'),
    locationInput: document.getElementById('location-input'),
    languageSelect: document.getElementById('targetLanguage') || document.getElementById('languageSelect') || document.getElementById('language-select'),
    fileInput: document.getElementById('image-file-input'),
    dropZone: document.getElementById('drop-zone'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    removeImageBtn: document.getElementById('remove-image-btn'),
    submitBtn: document.getElementById('submit-btn'),
    submitSpinner: document.getElementById('submit-spinner'),
    submitText: document.getElementById('submit-text'),
    micBtn: document.getElementById('mic-btn'),
    micStatus: document.getElementById('mic-status'),
    
    // Triage HUD Output
    hudPlaceholder: document.getElementById('hud-placeholder'),
    triageResults: document.getElementById('triage-results'),
    severityBadge: document.getElementById('severity-badge'),
    severityText: document.getElementById('severity-text'),
    riskLevelBadge: document.getElementById('risk-level-badge'),
    riskLevelIcon: document.getElementById('risk-level-icon'),
    riskLevelText: document.getElementById('risk-level-text'),
    observationContainer: document.getElementById('observation-container'),
    triageObservationText: document.getElementById('triage-observation-text'),
    hazardsContainer: document.getElementById('hazards-container'),
    triageHazardsText: document.getElementById('triage-hazards-text'),
    triageRiskTag: document.getElementById('triage-risk-tag'),
    triageRiskReasonText: document.getElementById('triage-risk-reason-text'),
    triageSummary: document.getElementById('triage-summary'),
    stepsList: document.getElementById('steps-list'),
    stepsProgress: document.getElementById('steps-progress'),
    stepsProgressBar: document.getElementById('steps-progress-bar'),
    warningsContainer: document.getElementById('warnings-container'),
    warningsList: document.getElementById('warnings-list'),
    urgentHelpContainer: document.getElementById('urgent-help-container'),
    urgentHelpText: document.getElementById('urgent-help-text'),
    aiDisclaimerText: document.getElementById('ai-disclaimer-text'),
    dispatchAlertId: document.getElementById('dispatch-alert-id'),
    dispatchUnit: document.getElementById('dispatch-unit'),
    dispatchEta: document.getElementById('dispatch-eta'),
    dispatchStatus: document.getElementById('dispatch-status'),
    dispatchLocation: document.getElementById('dispatch-location'),
    
    // Voice / Audio Controls
    ttsReadAloudBtn: document.getElementById('tts-read-aloud-btn'),
    ttsBtnIcon: document.getElementById('tts-btn-icon'),
    ttsBtnText: document.getElementById('tts-btn-text'),
    ttsPlayBtn: document.getElementById('tts-play-btn'),
    ttsStopBtn: document.getElementById('tts-stop-btn'),
    ttsStatus: document.getElementById('tts-status'),

    // Offline Guide Modal Elements
    offlineGuideBtn: document.getElementById('offline-guide-btn'),
    offlineGuideModal: document.getElementById('offline-guide-modal'),
    offlineGuideCloseBtn: document.getElementById('offline-guide-close-btn'),
    offlineGuideCloseIcon: document.getElementById('offline-guide-close-icon'),

    // SOS Modal Elements
    sosTriggerBtn: document.getElementById('sos-trigger-btn'),
    sosModal: document.getElementById('sos-modal'),
    sosCloseBtn: document.getElementById('sos-close-btn'),
    sosGeoCoord: document.getElementById('sos-geo-coord'),
    
    // Accessibility Controls
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    fontDecrBtn: document.getElementById('font-decrease-btn'),
    fontIncrBtn: document.getElementById('font-increase-btn'),
    fontSizeLabel: document.getElementById('font-size-label'),
    screenReaderAnnouncer: document.getElementById('sr-announcer'),

    // Preset Buttons
    presetBtns: document.querySelectorAll('.preset-btn')
  };
}

function initAccessibility() {
  // Restore font size & theme preferences from localStorage if available
  const savedFontSize = localStorage.getItem('resq_fontsize');
  if (savedFontSize) {
    state.fontSizeIndex = parseInt(savedFontSize, 10);
    applyFontSize();
  }

  const savedTheme = localStorage.getItem('resq_theme');
  if (savedTheme) {
    document.body.className = savedTheme;
  }

  // Restore persisted language preference
  const savedLang = localStorage.getItem('resq_language');
  if (savedLang && elements.languageSelect) {
    state.selectedLanguage = savedLang;
    elements.languageSelect.value = savedLang;
  }
}

function initEventListeners() {
  // Preset Clicks
  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      loadPreset(presetKey);
    });
  });

  // Prompt Char Counter
  elements.promptInput.addEventListener('input', () => {
    elements.charCount.textContent = `${elements.promptInput.value.length} / 1000`;
  });

  // Language Change & Persistence
  elements.languageSelect.addEventListener('change', (e) => {
    state.selectedLanguage = e.target.value;
    localStorage.setItem('resq_language', e.target.value);
    announceToScreenReader(`Language changed to ${elements.languageSelect.options[elements.languageSelect.selectedIndex].text}`);
    // If we already have triage data, re-triage in new language
    if (state.currentTriageData && (elements.promptInput.value || state.imageBase64)) {
      elements.form.requestSubmit();
    }
  });

  // Drag and Drop & Image Upload
  elements.dropZone.addEventListener('click', () => elements.fileInput.click());
  elements.dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      elements.fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(event => {
    elements.dropZone.addEventListener(event, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(event => {
    elements.dropZone.addEventListener(event, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.remove('drag-active');
    });
  });

  elements.dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  });

  elements.removeImageBtn.addEventListener('click', removeUploadedImage);

  // Form Submission
  elements.form.addEventListener('submit', handleFormSubmit);

  // SOS Emergency Trigger Modal
  elements.sosTriggerBtn.addEventListener('click', openSosModal);
  elements.sosCloseBtn.addEventListener('click', closeSosModal);
  elements.sosModal.addEventListener('click', (e) => {
    if (e.target === elements.sosModal) closeSosModal();
  });

  // Speech to Text (Mic)
  elements.micBtn?.addEventListener('click', toggleSpeechRecognition);

  // Text to Speech Controls (Toggle Read Aloud)
  elements.ttsReadAloudBtn?.addEventListener('click', toggleReadAloud);
  elements.ttsPlayBtn?.addEventListener('click', () => readAloudTriage());
  elements.ttsStopBtn?.addEventListener('click', () => stopSpeech());

  // Offline Emergency Guide Modal Listeners
  elements.offlineGuideBtn?.addEventListener('click', openOfflineGuideModal);
  elements.offlineGuideCloseBtn?.addEventListener('click', closeOfflineGuideModal);
  elements.offlineGuideCloseIcon?.addEventListener('click', closeOfflineGuideModal);
  elements.offlineGuideModal?.addEventListener('click', (e) => {
    if (e.target === elements.offlineGuideModal) closeOfflineGuideModal();
  });

  // High-Contrast & Theme Toggles
  elements.themeToggleBtn?.addEventListener('click', cycleTheme);

  // Font Scaling
  elements.fontDecrBtn?.addEventListener('click', () => adjustFontSize(-1));
  elements.fontIncrBtn?.addEventListener('click', () => adjustFontSize(1));
}

/**
 * Loads a preset scenario into the input fields and highlights it
 */
function loadPreset(presetKey) {
  const data = PRESET_DATA[presetKey];
  if (!data) return;

  state.selectedPresetKey = presetKey;
  elements.promptInput.value = data.prompt;
  elements.locationInput.value = data.location;
  elements.charCount.textContent = `${data.prompt.length} / 1000`;
  
  announceToScreenReader(`Loaded preset: ${data.title}`);
  
  // Highlight chosen preset button
  elements.presetBtns.forEach(b => b.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-900/30'));
  const activeBtn = document.querySelector(`[data-preset="${presetKey}"]`);
  if (activeBtn) {
    activeBtn.classList.add('ring-2', 'ring-blue-500', 'bg-blue-900/30');
  }

  // Smooth scroll down to input form
  elements.promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  elements.promptInput.focus();
}

/**
 * Compresses and downscales an uploaded image using HTML5 Canvas to optimize payload size and AI processing latency.
 * @param {File} file - Uploaded raw image file
 * @param {number} [maxDimension=1024] - Max bounding box constraint
 * @param {number} [quality=0.82] - JPEG quality ratio (0.0 to 1.0)
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
function compressAndResizeImage(file, maxDimension = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve({
          base64: compressedBase64,
          mimeType: 'image/jpeg'
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Handles uploading, compressing, and setting image data
 * @param {File} file
 */
async function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please upload a valid image file (PNG, JPG, WEBP).');
    return;
  }

  try {
    const { base64, mimeType } = await compressAndResizeImage(file, 1024, 0.82);
    state.imageBase64 = base64;
    state.imageMimeType = mimeType;

    elements.imagePreview.src = base64;
    elements.imagePreviewContainer.classList.remove('hidden');
    elements.dropZone.classList.add('hidden');
    announceToScreenReader(`Image uploaded and optimized for triage: ${file.name}`);
  } catch (err) {
    alert('Unable to process image: ' + err.message);
  }
}

/**
 * Removes the currently uploaded image preview
 */
function removeUploadedImage() {
  state.imageBase64 = null;
  state.imageMimeType = null;
  elements.fileInput.value = '';
  elements.imagePreview.src = '';
  elements.imagePreviewContainer.classList.add('hidden');
  elements.dropZone.classList.remove('hidden');
  announceToScreenReader('Uploaded image removed.');
}

/**
 * Submits the multimodal triage request to POST /api/generate
 */
async function handleFormSubmit(e) {
  if (e) e.preventDefault();

  const prompt = elements.promptInput.value.trim();
  const location = elements.locationInput.value.trim();
  const selectedLanguage = document.getElementById('targetLanguage')?.value || 
                           document.getElementById('languageSelect')?.value || 
                           document.getElementById('language-select')?.value || 
                           elements.languageSelect?.value || 
                           state.selectedLanguage || 
                           'hi';
  state.selectedLanguage = selectedLanguage;

  if (!prompt && !state.imageBase64 && !state.selectedPresetKey) {
    alert('Please provide an emergency description or upload an image.');
    elements.promptInput.focus();
    return;
  }

  // Loading state
  setLoadingState(true);
  announceToScreenReader('Analyzing emergency data and calculating triage protocol...');

  try {
    const payload = {
      prompt,
      imageBase64: state.imageBase64,
      mimeType: state.imageMimeType,
      language: selectedLanguage,
      targetLanguage: selectedLanguage,
      incidentType: state.selectedPresetKey ? (PRESET_DATA[state.selectedPresetKey]?.title || '') : '',
      location
    };

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || `Server error (HTTP ${response.status})`);
    }

    const data = await response.json();
    state.currentTriageData = data;
    renderTriageResults(data);
    announceToScreenReader(`Triage complete. Severity level: ${data.triageSeverity}. Immediate steps ready.`);

  } catch (err) {
    console.error('Triage Request Failed:', err);
    alert(`Emergency Analysis Error: ${err.message}`);
    announceToScreenReader(`Error during emergency triage: ${err.message}`);
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(isLoading) {
  if (isLoading) {
    elements.submitBtn.disabled = true;
    elements.submitSpinner.classList.remove('hidden');
    elements.submitText.textContent = 'Analyzing Emergency Multimodal Input...';
  } else {
    elements.submitBtn.disabled = false;
    elements.submitSpinner.classList.add('hidden');
    elements.submitText.textContent = 'Generate Emergency Triage & First Aid';
  }
}

/**
 * Renders the structured triage response onto the UI
 */
function renderTriageResults(data) {
  elements.hudPlaceholder.classList.add('hidden');
  elements.triageResults.classList.remove('hidden');

  // Severity & Risk Level Badge styling
  const severity = (data.triageSeverity || 'MODERATE').toUpperCase();
  const riskLevel = (data.riskLevel || severity || 'CRITICAL').toUpperCase();
  elements.severityText.textContent = `${severity} EMERGENCY`;

  elements.severityBadge.className = 'inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-lg transition-all duration-300';
  if (severity === 'CRITICAL') {
    elements.severityBadge.classList.add('bg-red-600', 'text-white', 'animate-pulse', 'border', 'border-red-400');
  } else if (severity === 'MODERATE') {
    elements.severityBadge.classList.add('bg-amber-500', 'text-black', 'border', 'border-amber-300');
  } else {
    elements.severityBadge.classList.add('bg-emerald-600', 'text-white', 'border', 'border-emerald-400');
  }

  // 3. RISK LEVEL & REASON
  let riskIcon = '🔴';
  let riskClasses = 'bg-red-500/20 text-red-300 border-red-500';
  if (riskLevel === 'LOW') {
    riskIcon = '🟢';
    riskClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500';
  } else if (riskLevel === 'MEDIUM' || riskLevel === 'MODERATE') {
    riskIcon = '🟡';
    riskClasses = 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
  } else if (riskLevel === 'HIGH') {
    riskIcon = '🟠';
    riskClasses = 'bg-orange-500/20 text-orange-300 border-orange-500';
  } else {
    riskIcon = '🔴';
    riskClasses = 'bg-red-500/20 text-red-300 border-red-500 animate-pulse';
  }

  if (elements.riskLevelBadge) {
    elements.riskLevelBadge.classList.remove('hidden');
    elements.riskLevelBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${riskClasses}`;
    if (elements.riskLevelIcon) elements.riskLevelIcon.textContent = riskIcon;
    if (elements.riskLevelText) elements.riskLevelText.textContent = `${riskIcon} ${riskLevel}`;
  }
  if (elements.triageRiskTag) {
    elements.triageRiskTag.textContent = `${riskIcon} ${riskLevel}`;
  }
  if (elements.triageRiskReasonText) {
    elements.triageRiskReasonText.textContent = data.riskLevelReason || (riskLevel === 'CRITICAL' ? 'Immediate danger to safety and physical well-being.' : 'Urgent attention and safety care required.');
  }

  // 1. IMAGE OBSERVATION (Smart Photo Analysis)
  const observationText = data.imageObservation || (state.imageBase64 ? 'Visible photo inspection processed for campus hazard features.' : '');
  if (observationText && elements.observationContainer) {
    elements.observationContainer.classList.remove('hidden');
    elements.triageObservationText.textContent = observationText;
  } else if (elements.observationContainer) {
    elements.observationContainer.classList.add('hidden');
  }

  // 2. POSSIBLE RISK OR HAZARD
  const hazardsText = data.possibleHazards || '';
  if (hazardsText && elements.hazardsContainer) {
    elements.hazardsContainer.classList.remove('hidden');
    elements.triageHazardsText.textContent = hazardsText;
  } else if (elements.hazardsContainer) {
    elements.hazardsContainer.classList.add('hidden');
  }

  // Summary Text
  elements.triageSummary.textContent = data.summary || 'Emergency incident assessed.';

  // 4. WHAT TO DO NOW: Step-by-Step checklist
  elements.stepsList.innerHTML = '';
  const steps = data.immediateSteps || [];

  steps.forEach((stepText, idx) => {
    const li = document.createElement('li');
    li.className = 'step-item flex items-start space-x-3 p-3 bg-gray-800/80 rounded-xl border border-gray-700 transition-all hover:bg-gray-800';
    
    li.innerHTML = `
      <div class="pt-0.5">
        <input type="checkbox" id="step-check-${idx}" class="step-checkbox h-5 w-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-900 cursor-pointer" aria-label="Mark step ${idx + 1} as completed">
      </div>
      <div class="flex-1">
        <label for="step-check-${idx}" class="text-xs font-bold text-blue-400 uppercase tracking-wide block mb-0.5 cursor-pointer">
          Action ${idx + 1}
        </label>
        <span class="step-text text-sm font-medium text-gray-100">${escapeHtml(stepText)}</span>
      </div>
      <button type="button" class="read-step-btn text-gray-400 hover:text-white p-1 rounded focus:ring-2 focus:ring-blue-400" title="Read this step aloud" aria-label="Read step ${idx + 1} aloud">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
      </button>
    `;

    // Step completion checkbox listener
    const checkbox = li.querySelector('.step-checkbox');
    checkbox.addEventListener('change', () => {
      li.classList.toggle('completed', checkbox.checked);
      updateStepsProgress();
    });

    // Individual Step TTS
    const readStepBtn = li.querySelector('.read-step-btn');
    readStepBtn.addEventListener('click', () => {
      speakText(`Step ${idx + 1}: ${stepText}`);
    });

    elements.stepsList.appendChild(li);
  });

  updateStepsProgress();

  // 5. PRECAUTIONS: Safety Warnings Box
  const warnings = data.safetyWarnings || [];
  elements.warningsList.innerHTML = '';
  if (warnings.length > 0) {
    elements.warningsContainer.classList.remove('hidden');
    warnings.forEach(warning => {
      const wLi = document.createElement('li');
      wLi.className = 'text-xs text-amber-200 font-medium flex items-start space-x-2';
      wLi.innerHTML = `
        <span class="text-amber-400 font-bold" aria-hidden="true">⚠️</span>
        <span>${escapeHtml(warning)}</span>
      `;
      elements.warningsList.appendChild(wLi);
    });
  } else {
    elements.warningsContainer.classList.add('hidden');
  }

  // 6. WHEN TO SEEK URGENT HELP
  if (elements.urgentHelpText) {
    elements.urgentHelpText.textContent = data.whenToSeekUrgentHelp || 'If severe bleeding persists, breathing becomes laboured, or chemical burn spreads, call 112 or Campus Security immediately.';
  }

  // 7. AI LIMITATION NOTE
  if (elements.aiDisclaimerText) {
    elements.aiDisclaimerText.innerHTML = `<strong>AI Safety Copilot Note:</strong> ${escapeHtml(data.disclaimer || 'For triage assistance only; not a definitive medical diagnosis. In critical situations, tap 1-Tap SOS.')}`;
  }

  // Campus Alert Dispatch Payload
  const alert = data.campusAlertPayload || {};
  elements.dispatchAlertId.textContent = alert.alertId || `RC-${Math.floor(1000 + Math.random() * 9000)}`;
  elements.dispatchUnit.textContent = (alert.campusUnit || 'CAMPUS_PARAMEDIC').replace(/_/g, ' ');
  elements.dispatchEta.textContent = alert.eta || '3-5 mins';
  elements.dispatchStatus.textContent = alert.status || 'DISPATCHED';
  elements.dispatchLocation.textContent = alert.locationZone || elements.locationInput.value || 'Campus Emergency Sector';

  // Start ETA Countdown animation
  startEtaCountdown(alert.eta || '3-5 mins');

  // Scroll to results
  elements.triageResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateStepsProgress() {
  const total = elements.stepsList.querySelectorAll('.step-checkbox').length;
  const checked = elements.stepsList.querySelectorAll('.step-checkbox:checked').length;
  const percent = total === 0 ? 0 : Math.round((checked / total) * 100);

  elements.stepsProgress.textContent = `${checked} of ${total} Steps Completed (${percent}%)`;
  elements.stepsProgressBar.style.width = `${percent}%`;
}

/**
 * Text-to-Speech (TTS) Engine - Read Aloud Feature
 */
function toggleReadAloud() {
  if (state.isSpeaking || ('speechSynthesis' in window && window.speechSynthesis.speaking)) {
    stopSpeech();
  } else {
    readAloudTriage();
  }
}

function readAloudTriage() {
  if (!state.currentTriageData) {
    alert('Please submit or generate an emergency triage first to read aloud.');
    return;
  }

  const data = state.currentTriageData;
  const lang = data.meta?.language || state.selectedLanguage || 'en';

  let textToSpeak = `Risk Level: ${data.riskLevel || data.triageSeverity}. `;
  if (data.imageObservation) textToSpeak += `Observation: ${data.imageObservation}. `;
  if (data.possibleHazards) textToSpeak += `Hazard assessment: ${data.possibleHazards}. `;
  textToSpeak += `Summary: ${data.summary}. `;
  if (data.immediateSteps && data.immediateSteps.length > 0) {
    textToSpeak += `Immediate steps: ${data.immediateSteps.map((s, i) => `Step ${i + 1}: ${s}`).join('. ')}. `;
  }
  if (data.safetyWarnings && data.safetyWarnings.length > 0) {
    textToSpeak += `Precautions: ${data.safetyWarnings.join('. ')}. `;
  }
  if (data.whenToSeekUrgentHelp) {
    textToSpeak += `Urgent help: ${data.whenToSeekUrgentHelp}.`;
  }

  speakText(textToSpeak, lang);
}

function speakText(text, lang = state.selectedLanguage) {
  if (!('speechSynthesis' in window)) {
    alert('Text-to-Speech is not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel(); // cancel any prior speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // Slightly slower for emergency comprehension
  utterance.pitch = 1.0;

  // Set appropriate language voice for the 8 supported languages
  if (lang === 'hi') utterance.lang = 'hi-IN';
  else if (lang === 'hinglish') utterance.lang = 'hi-IN';
  else if (lang === 'pa') utterance.lang = 'pa-IN';
  else if (lang === 'bn') utterance.lang = 'bn-IN';
  else if (lang === 'ta') utterance.lang = 'ta-IN';
  else if (lang === 'te') utterance.lang = 'te-IN';
  else if (lang === 'mr') utterance.lang = 'mr-IN';
  else utterance.lang = 'en-US';

  utterance.onstart = () => {
    state.isSpeaking = true;
    if (elements.ttsBtnIcon) elements.ttsBtnIcon.textContent = '⏹️';
    if (elements.ttsBtnText) elements.ttsBtnText.textContent = 'Stop Reading';
    if (elements.ttsReadAloudBtn) {
      elements.ttsReadAloudBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
      elements.ttsReadAloudBtn.classList.add('bg-red-600', 'hover:bg-red-500');
    }
    if (elements.ttsStatus) elements.ttsStatus.textContent = '🔊 Reading Aloud...';
  };

  const resetTtsUi = () => {
    state.isSpeaking = false;
    if (elements.ttsBtnIcon) elements.ttsBtnIcon.textContent = '🔊';
    if (elements.ttsBtnText) elements.ttsBtnText.textContent = 'Read Aloud';
    if (elements.ttsReadAloudBtn) {
      elements.ttsReadAloudBtn.classList.remove('bg-red-600', 'hover:bg-red-500');
      elements.ttsReadAloudBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
    }
    if (elements.ttsStatus) elements.ttsStatus.textContent = '';
  };

  utterance.onend = resetTtsUi;
  utterance.onerror = resetTtsUi;

  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  state.isSpeaking = false;
  if (elements.ttsBtnIcon) elements.ttsBtnIcon.textContent = '🔊';
  if (elements.ttsBtnText) elements.ttsBtnText.textContent = 'Read Aloud';
  if (elements.ttsReadAloudBtn) {
    elements.ttsReadAloudBtn.classList.remove('bg-red-600', 'hover:bg-red-500');
    elements.ttsReadAloudBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
  }
  if (elements.ttsStatus) elements.ttsStatus.textContent = '';
}

/**
 * Offline Emergency First-Aid Guide Modal Controllers
 */
function openOfflineGuideModal() {
  if (elements.offlineGuideModal) {
    elements.offlineGuideModal.classList.remove('hidden');
    elements.offlineGuideBtn?.setAttribute('aria-expanded', 'true');
    announceToScreenReader('Offline Emergency First-Aid Quick Guide opened.');
    elements.offlineGuideCloseBtn?.focus();
  }
}

function closeOfflineGuideModal() {
  if (elements.offlineGuideModal) {
    elements.offlineGuideModal.classList.add('hidden');
    elements.offlineGuideBtn?.setAttribute('aria-expanded', 'false');
    announceToScreenReader('Offline Emergency Guide closed.');
    elements.offlineGuideBtn?.focus();
  }
}

/**
 * Speech-to-Text (STT) Recognition
 */
function toggleSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Speech recognition is not supported in your browser. Please type the incident details.');
    return;
  }

  if (state.isRecording) {
    if (state.recognition) state.recognition.stop();
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    state.recognition = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;

    if (state.selectedLanguage === 'hi') recognition.lang = 'hi-IN';
    else if (state.selectedLanguage === 'hinglish') recognition.lang = 'hi-IN';
    else if (state.selectedLanguage === 'pa') recognition.lang = 'pa-IN';
    else if (state.selectedLanguage === 'bn') recognition.lang = 'bn-IN';
    else if (state.selectedLanguage === 'ta') recognition.lang = 'ta-IN';
    else if (state.selectedLanguage === 'te') recognition.lang = 'te-IN';
    else if (state.selectedLanguage === 'mr') recognition.lang = 'mr-IN';
    else recognition.lang = 'en-US';

    recognition.onstart = () => {
      state.isRecording = true;
      elements.micBtn.classList.add('bg-red-600', 'animate-pulse');
      elements.micStatus.textContent = '🎙️ Listening... Speak incident details clearly';
      announceToScreenReader('Microphone listening. Speak now.');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      elements.promptInput.value = transcript;
      elements.charCount.textContent = `${transcript.length} / 1000`;
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      stopRecordingUI();
    };

    recognition.onend = () => {
      stopRecordingUI();
      announceToScreenReader('Microphone closed.');
    };

    recognition.start();

  } catch (err) {
    console.error('Speech recognition failed to initialize:', err);
    stopRecordingUI();
  }
}

function stopRecordingUI() {
  state.isRecording = false;
  elements.micBtn.classList.remove('bg-red-600', 'animate-pulse');
  elements.micStatus.textContent = '';
}

/**
 * 1-Tap SOS Modal & Siren Tone Generator
 */
function openSosModal() {
  elements.sosModal.classList.remove('hidden');
  playSirenTone();
  announceToScreenReader('Emergency SOS modal opened. Select an emergency service to dial directly.');
  elements.sosCloseBtn.focus();
}

function closeSosModal() {
  elements.sosModal.classList.add('hidden');
  announceToScreenReader('Emergency SOS modal closed.');
  elements.sosTriggerBtn.focus();
}

function playSirenTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio tone suppressed if not supported
  }
}

/**
 * Geolocation Auto-Detection
 */
function initGeolocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`;
        elements.sosGeoCoord.textContent = coords;
        if (!elements.locationInput.value) {
          elements.locationInput.placeholder = `Detected Campus Grid (${coords})`;
        }
      },
      () => {
        elements.sosGeoCoord.textContent = 'Main Campus Quadrant (GPS Standby)';
      },
      { timeout: 5000 }
    );
  }
}

/**
 * Animated Countdown Timer for Campus Unit Dispatch
 */
function startEtaCountdown(etaString) {
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
  }

  // Extract initial minutes from string like "3-5 mins" -> default 180s
  let seconds = 180;
  if (etaString.includes('2')) seconds = 120;
  if (etaString.includes('4')) seconds = 240;

  state.countdownInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(state.countdownInterval);
      elements.dispatchEta.textContent = 'ON SCENE';
      elements.dispatchStatus.textContent = 'ARRIVED';
      announceToScreenReader('Campus Emergency Unit has arrived on scene.');
      return;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    elements.dispatchEta.textContent = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }, 1000);
}

/**
 * Theme & Font Size Controls
 */
function cycleTheme() {
  if (document.body.classList.contains('theme-high-contrast')) {
    document.body.className = 'theme-night-red';
    elements.themeToggleBtn.setAttribute('aria-pressed', 'true');
    announceToScreenReader('Night Vision Red Emergency Mode activated.');
  } else if (document.body.classList.contains('theme-night-red')) {
    document.body.className = '';
    elements.themeToggleBtn.setAttribute('aria-pressed', 'false');
    announceToScreenReader('Default High Contrast Mode activated.');
  } else {
    document.body.className = 'theme-high-contrast';
    elements.themeToggleBtn.setAttribute('aria-pressed', 'true');
    announceToScreenReader('Ultra High Contrast Mode activated.');
  }
  localStorage.setItem('resq_theme', document.body.className);
}

function adjustFontSize(delta) {
  state.fontSizeIndex = Math.max(0, Math.min(state.fontSizes.length - 1, state.fontSizeIndex + delta));
  applyFontSize();
  localStorage.setItem('resq_fontsize', state.fontSizeIndex);
  announceToScreenReader(`Font size adjusted to ${state.fontSizes[state.fontSizeIndex]}`);
}

function applyFontSize() {
  document.documentElement.style.setProperty('--base-font-size', state.fontSizes[state.fontSizeIndex]);
  if (elements.fontSizeLabel) {
    elements.fontSizeLabel.textContent = `A (${state.fontSizes[state.fontSizeIndex]})`;
  }
}

function announceToScreenReader(message) {
  if (elements.screenReaderAnnouncer) {
    elements.screenReaderAnnouncer.textContent = message;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
