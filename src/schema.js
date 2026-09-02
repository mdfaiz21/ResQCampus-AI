/**
 * ResQCampus AI - Structured Triage Schema Definition & Validation
 * PromptWars x WIE-IEEE Assistive Health & Safety Companion
 */

const TRIAGE_SEVERITY_LEVELS = ['CRITICAL', 'MODERATE', 'LOW'];

const GEMINI_JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    triageSeverity: {
      type: "STRING",
      enum: ["CRITICAL", "MODERATE", "LOW"],
      description: "Severity level of the emergency condition"
    },
    summary: {
      type: "STRING",
      description: "Concise summary of the situation and immediate hazard in the target language"
    },
    immediateSteps: {
      type: "ARRAY",
      items: {
        type: "STRING"
      },
      description: "List of numbered, actionable, step-by-step first-aid and safety instructions in the target language"
    },
    safetyWarnings: {
      type: "ARRAY",
      items: {
        type: "STRING"
      },
      description: "Crucial do-not-do warnings and safety precautions in the target language"
    },
    imageObservation: {
      type: "STRING",
      description: "Visible observations detected in the uploaded photo (substances, containers, wounds, smoke, electrical wires, postures) without fabricating unseen elements"
    },
    possibleHazards: {
      type: "STRING",
      description: "Identified visible hazards (chemical splash, fire/smoke, electrical risk, physical trauma) without making absolute clinical diagnoses"
    },
    riskLevel: {
      type: "STRING",
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      description: "Risk categorization level"
    },
    riskLevelReason: {
      type: "STRING",
      description: "One-line rationale explaining why this risk level was assigned"
    },
    whenToSeekUrgentHelp: {
      type: "STRING",
      description: "Clear thresholds for immediate campus security, paramedic, or emergency hospital escalation"
    },
    disclaimer: {
      type: "STRING",
      description: "Standard safety disclaimer stating this is triage assistance only, not a definitive diagnosis"
    },
    campusAlertPayload: {
      type: "OBJECT",
      properties: {
        alertId: {
          type: "STRING",
          description: "Unique simulated emergency alert tracking ID, e.g., RC-8921"
        },
        campusUnit: {
          type: "STRING",
          description: "Designated response unit, e.g., CAMPUS_PARAMEDIC_PATROL, HAZMAT_DISPATCH, CAMPUS_SECURITY"
        },
        eta: {
          type: "STRING",
          description: "Estimated response time, e.g., '2-4 mins'"
        },
        status: {
          type: "STRING",
          enum: ["DISPATCHED", "STANDBY", "RESOLVED", "ESCALATED"],
          description: "Dispatch status"
        },
        locationZone: {
          type: "STRING",
          description: "Simulated campus sector or detected zone"
        }
      },
      required: ["alertId", "campusUnit", "eta", "status"]
    }
  },
  required: ["triageSeverity", "summary", "immediateSteps", "safetyWarnings", "campusAlertPayload"]
};

/**
 * Validates whether an object adheres to the strict ResQCampus Triage Schema.
 * @param {object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTriagePayload(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Payload must be a non-null object'] };
  }

  // triageSeverity
  if (!data.triageSeverity || !TRIAGE_SEVERITY_LEVELS.includes(data.triageSeverity.toUpperCase())) {
    errors.push(`triageSeverity must be one of: ${TRIAGE_SEVERITY_LEVELS.join(', ')}`);
  }

  // summary
  if (typeof data.summary !== 'string' || data.summary.trim().length === 0) {
    errors.push('summary must be a non-empty string');
  }

  // immediateSteps
  if (!Array.isArray(data.immediateSteps) || data.immediateSteps.length === 0) {
    errors.push('immediateSteps must be a non-empty array of strings');
  } else {
    for (let i = 0; i < data.immediateSteps.length; i++) {
      if (typeof data.immediateSteps[i] !== 'string') {
        errors.push(`immediateSteps[${i}] must be a string`);
      }
    }
  }

  // safetyWarnings
  if (!Array.isArray(data.safetyWarnings)) {
    errors.push('safetyWarnings must be an array of strings');
  } else {
    for (let i = 0; i < data.safetyWarnings.length; i++) {
      if (typeof data.safetyWarnings[i] !== 'string') {
        errors.push(`safetyWarnings[${i}] must be a string`);
      }
    }
  }

  // campusAlertPayload
  if (!data.campusAlertPayload || typeof data.campusAlertPayload !== 'object') {
    errors.push('campusAlertPayload must be a non-null object');
  } else {
    const alert = data.campusAlertPayload;
    if (typeof alert.alertId !== 'string' || !alert.alertId) {
      errors.push('campusAlertPayload.alertId must be a non-empty string');
    }
    if (typeof alert.campusUnit !== 'string' || !alert.campusUnit) {
      errors.push('campusAlertPayload.campusUnit must be a non-empty string');
    }
    if (typeof alert.eta !== 'string' || !alert.eta) {
      errors.push('campusAlertPayload.eta must be a non-empty string');
    }
    if (typeof alert.status !== 'string' || !alert.status) {
      errors.push('campusAlertPayload.status must be a non-empty string');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  TRIAGE_SEVERITY_LEVELS,
  GEMINI_JSON_SCHEMA,
  validateTriagePayload
};
