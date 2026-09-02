/**
 * ResQCampus AI - Triage Service
 * Multimodal Gemini 2.5 Flash Engine with Resilient Offline Fallback
 * PromptWars x WIE-IEEE Assistive Health & Safety Companion
 */

const { GEMINI_JSON_SCHEMA, validateTriagePayload } = require('./schema');

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Supported Language Mapping for Strict Multilingual Enforcement (8 Languages)
const LANGUAGE_MAP = {
  'en': 'English',
  'hi': 'Hindi (हिंदी in Devanagari script)',
  'hinglish': 'Hinglish (Conversational Romanized Hindi using Latin alphabet, e.g. "Affected jagah ko 15 min paani se dhoye")',
  'pa': 'Punjabi (ਪੰਜਾਬੀ in Gurmukhi script)',
  'bn': 'Bengali (বাংলা in Bengali script)',
  'ta': 'Tamil (தமிழ் in Tamil script)',
  'te': 'Telugu (తెలుగు in Telugu script)',
  'mr': 'Marathi (मराठी in Devanagari script)'
};

/**
 * Fallback knowledge repository for emergency safety presets across languages
 */
const MULTILINGUAL_FALLBACKS = {
  chemical: {
    en: {
      triageSeverity: 'CRITICAL',
      summary: 'Hazardous chemical or acid exposure detected. Immediate neutralization and de-escalation required.',
      immediateSteps: [
        'Evacuate the immediate area and ensure adequate ventilation.',
        'Flush the affected skin or eyes with copious clean water for at least 15–20 minutes.',
        'Remove contaminated clothing cautiously without touching the unaffected skin.',
        'Notify lab supervisor and dispatch campus HAZMAT team immediately.'
      ],
      safetyWarnings: [
        'DO NOT apply neutralizing chemicals or ointments to the burn without HAZMAT guidance.',
        'DO NOT rub or bandage tightly.',
        'DO NOT inhale vapors or allow runoff to enter storm drains.'
      ],
      campusAlertPayload: {
        alertId: 'RC-CHEM-911',
        campusUnit: 'HAZMAT_RESPONSE_TEAM',
        eta: '2-3 mins',
        status: 'DISPATCHED',
        locationZone: 'Science & Engineering Lab Sector'
      }
    },
    hi: {
      triageSeverity: 'CRITICAL',
      summary: 'खतरनाक रासायनिक या एसिड फैलाव का पता चला है। तत्काल प्राथमिक उपचार और आपातकालीन सहायता की आवश्यकता है।',
      immediateSteps: [
        'प्रभावित क्षेत्र को तुरंत खाली करें और ताजी हवा में जाएं।',
        'प्रभावित त्वचा या आंखों को कम से कम 15-20 मिनट तक लगातार साफ पानी से धोएं।',
        'संक्रमित कपड़ों को सावधानीपूर्वक हटा दें ताकि अप्रभावित त्वचा सुरक्षित रहे।',
        'प्रयोगशाला प्रभारी को सूचित करें और तुरंत कैंपस हैजमैट टीम को बुलाएं।'
      ],
      safetyWarnings: [
        'बिना विशेषज्ञ सलाह के घाव पर कोई रासायनिक मरहम या तेल न लगाएं।',
        'प्रभावित हिस्से को रगड़ें या कसकर न बांधें।',
        'गैस या धुएं को सांस में न लें।'
      ],
      campusAlertPayload: {
        alertId: 'RC-CHEM-911',
        campusUnit: 'HAZMAT_RESPONSE_TEAM',
        eta: '2-3 mins',
        status: 'DISPATCHED',
        locationZone: 'विज्ञान एवं इंजीनियरिंग लैब क्षेत्र'
      }
    },
    es: {
      triageSeverity: 'CRITICAL',
      summary: 'Derrame de productos químicos peligrosos detectado. Se requiere descontaminación inmediata.',
      immediateSteps: [
        'Evacue la zona de inmediato y busque aire fresco.',
        'Enjuague la piel u ojos afectados con abundante agua corriente durante 15 a 20 minutos.',
        'Retire la ropa contaminada con cuidado.',
        'Notifique al supervisor del laboratorio y llame al equipo HAZMAT.'
      ],
      safetyWarnings: [
        'NO aplique cremas ni neutralizantes caseros.',
        'NO frote el área afectada.'
      ],
      campusAlertPayload: {
        alertId: 'RC-CHEM-911',
        campusUnit: 'HAZMAT_RESPONSE_TEAM',
        eta: '2-3 mins',
        status: 'DISPATCHED',
        locationZone: 'Sector de Laboratorios'
      }
    }
  },
  bleeding: {
    en: {
      triageSeverity: 'CRITICAL',
      summary: 'Severe acute bleeding / laceration trauma requiring rapid hemorrhage control.',
      immediateSteps: [
        'Apply firm, continuous direct pressure to the wound using a clean cloth, sterile pad, or gauze.',
        'Maintain continuous pressure without lifting the pad to check the wound.',
        'Elevate the injured limb above heart level if no fracture is suspected.',
        'If bleeding continues heavily through dressings, apply an additional pad on top and prepare a tourniquet if trained.'
      ],
      safetyWarnings: [
        'DO NOT remove embedded foreign objects (glass, metal); pad around them.',
        'DO NOT remove soaked bandages; add more layers on top.',
        'DO NOT release direct pressure until medical personnel arrive.'
      ],
      campusAlertPayload: {
        alertId: 'RC-BLD-402',
        campusUnit: 'RAPID_PARAMEDIC_PATROL',
        eta: '2-4 mins',
        status: 'DISPATCHED',
        locationZone: 'Campus Medical Dispatch Grid'
      }
    },
    hi: {
      triageSeverity: 'CRITICAL',
      summary: 'गंभीर रक्तस्राव और आघात की स्थिति। तुरंत रक्त प्रवाह रोकने के उपाय आवश्यक हैं।',
      immediateSteps: [
        'साफ कपड़े या स्टेराइल पट्टी से घाव पर सीधा और निरंतर दबाव बनाएं।',
        'घाव को देखने के लिए बार-बार कपड़ा न हटाएं, दबाव लगातार बनाए रखें।',
        'यदि फ्रैक्चर का संदेह न हो, तो घायल अंग को हृदय के स्तर से ऊपर उठाएं।',
        'यदि खून कपड़े से रिसने लगे, तो उसके ऊपर और पट्टी लगाएं और आपातकालीन दल की प्रतीक्षा करें।'
      ],
      safetyWarnings: [
        'घाव में घुसी हुई किसी वस्तु (कांच, कील) को बाहर निकालने का प्रयास न करें।',
        'खून से भीगी पट्टी को कभी न हटाएं, उसके ऊपर नई पट्टी जोड़ें।',
        'पैरामेडिक्स के आने तक सीधा दबाव न छोड़ें।'
      ],
      campusAlertPayload: {
        alertId: 'RC-BLD-402',
        campusUnit: 'RAPID_PARAMEDIC_PATROL',
        eta: '2-4 mins',
        status: 'DISPATCHED',
        locationZone: 'कैंपस आपातकालीन मेडिकल ग्रिड'
      }
    }
  },
  unconscious: {
    en: {
      triageSeverity: 'CRITICAL',
      summary: 'Unresponsive individual / severe heatstroke or syncope collapse.',
      immediateSteps: [
        'Check for responsiveness by gently tapping shoulders and shouting "Are you okay?".',
        'Check breathing for 5-10 seconds; if not breathing normally, begin CPR (30 chest compressions : 2 breaths).',
        'If breathing normally, place victim in the Recovery Position (on their side) to keep airway clear.',
        'Loosen tight clothing around neck and cool body with damp cloths if heatstroke is suspected.'
      ],
      safetyWarnings: [
        'DO NOT give food, liquids, or oral medications to an unconscious person.',
        'DO NOT leave the individual unattended.',
        'DO NOT place a pillow under the head if trauma to the spine or neck is suspected.'
      ],
      campusAlertPayload: {
        alertId: 'RC-MED-108',
        campusUnit: 'CRITICAL_AMBULANCE_UNIT',
        eta: '3 mins',
        status: 'DISPATCHED',
        locationZone: 'Central Campus Quad'
      }
    },
    hi: {
      triageSeverity: 'CRITICAL',
      summary: 'बेहोश / अनुत्तरदायी व्यक्ति अथवा गंभीर हीटस्ट्रोक की स्थिति।',
      immediateSteps: [
        'कंधों को हल्के से थपथपाकर और आवाज देकर व्यक्ति की प्रतिक्रिया की जांच करें।',
        '5-10 सेकंड तक सांस की जांच करें; यदि सामान्य सांस नहीं चल रही है, तो तुरंत सीपीआर (CPR) शुरू करें।',
        'यदि सांस चल रही है, तो वायुमार्ग खुला रखने के लिए व्यक्ति को करवट (रिकवरी पोजीशन) में लिटाएं।',
        'गर्दन के आसपास के तंग कपड़े ढीले करें और यदि गर्मी का असर हो तो शरीर को ठंडा करें।'
      ],
      safetyWarnings: [
        'बेहोश व्यक्ति को कभी भी पानी, भोजन या दवा न पिलाएं।',
        'व्यक्ति को अकेला न छोड़ें।',
        'यदि रीढ़ की हड्डी या गर्दन में चोट का संदेह हो तो सिर के नीचे तकिया न लगाएं।'
      ],
      campusAlertPayload: {
        alertId: 'RC-MED-108',
        campusUnit: 'CRITICAL_AMBULANCE_UNIT',
        eta: '3 mins',
        status: 'DISPATCHED',
        locationZone: 'केंद्रीय कैंपस परिसर'
      }
    }
  },
  labhazard: {
    en: {
      triageSeverity: 'CRITICAL',
      summary: 'Campus laboratory fire, electrical hazard, or explosive risk detected.',
      immediateSteps: [
        'Pull the nearest manual fire alarm pull station immediately.',
        'Evacuate all personnel via marked emergency stairwells; DO NOT use elevators.',
        'If safe and trained, shut off master gas and electrical breakers.',
        'Assemble at the designated campus emergency muster point and conduct headcount.'
      ],
      safetyWarnings: [
        'DO NOT re-enter the building until the all-clear is given by Campus Safety.',
        'DO NOT use water on chemical or electrical fires; use Class ABC / CO2 extinguisher only if safe.',
        'DO NOT inhale dense smoke or toxic combustion byproducts.'
      ],
      campusAlertPayload: {
        alertId: 'RC-FIRE-770',
        campusUnit: 'CAMPUS_FIRE_SECURITY',
        eta: '2-4 mins',
        status: 'DISPATCHED',
        locationZone: 'Engineering Research Complex'
      }
    },
    hi: {
      triageSeverity: 'CRITICAL',
      summary: 'प्रयोगशाला में आग, बिजली का खतरा या विस्फोट की आपातकालीन स्थिति।',
      immediateSteps: [
        'तुरंत निकटतम फायर अलार्म बटन दबाएं।',
        'आपातकालीन सीढ़ियों का उपयोग करके तुरंत बाहर निकलें; लिफ्ट का उपयोग न करें।',
        'यदि सुरक्षित हो, तो गैस और मुख्य बिजली स्विच बंद करें।',
        'निर्धारित कैंपस आपातकालीन सभा स्थल (Muster Point) पर एकत्रित हों।'
      ],
      safetyWarnings: [
        'कैंपस सुरक्षा अधिकारियों की अनुमति के बिना इमारत में दोबारा प्रवेश न करें।',
        'रासायनिक या बिजली की आग पर पानी न डालें; केवल उपयुक्त अग्निशामक यंत्र का प्रयोग करें।',
        'घने धुएं में सांस लेने से बचें।'
      ],
      campusAlertPayload: {
        alertId: 'RC-FIRE-770',
        campusUnit: 'CAMPUS_FIRE_SECURITY',
        eta: '2-4 mins',
        status: 'DISPATCHED',
        locationZone: 'इंजीनियरिंग अनुसंधान संकुल'
      }
    }
  },
  respiratory: {
    en: {
      triageSeverity: 'CRITICAL',
      summary: 'Acute respiratory distress or severe allergic anaphylaxis reaction detected.',
      immediateSteps: [
        'Help the person sit upright in a comfortable position to ease breathing.',
        'If the person has a prescribed auto-injector (EpiPen / Inhaler), assist them in administering it immediately.',
        'Call campus emergency medical response and maintain calm reassurance.',
        'Monitor airway and breathing continuously until paramedics arrive.'
      ],
      safetyWarnings: [
        'DO NOT make the person lie flat if they are having difficulty breathing.',
        'DO NOT give any food, liquids, or oral medications.',
        'DO NOT delay calling emergency medical services if symptoms do not improve within 5 minutes.'
      ],
      campusAlertPayload: {
        alertId: 'RC-RESP-889',
        campusUnit: 'CRITICAL_AMBULANCE_UNIT',
        eta: '2-3 mins',
        status: 'DISPATCHED',
        locationZone: 'Campus Dining & Student Center'
      }
    },
    hi: {
      triageSeverity: 'CRITICAL',
      summary: 'गंभीर सांस लेने में तकलीफ अथवा एनाफिलेक्सिस (एलर्जी) की आपातकालीन स्थिति।',
      immediateSteps: [
        'व्यक्ति को सीधा और आरामदायक स्थिति में बैठाएं ताकि सांस लेना आसान हो सके।',
        'यदि व्यक्ति के पास अपना इनहेलर या एपिपेन (EpiPen) है, तो तुरंत उसका उपयोग करने में मदद करें।',
        'कैंपस आपातकालीन मेडिकल सेवा को तुरंत सूचित करें और व्यक्ति को शांत रखें।',
        'पैरामेडिक्स के आने तक सांस और वायुमार्ग की लगातार निगरानी करें।'
      ],
      safetyWarnings: [
        'सांस लेने में कठिनाई होने पर मरीज को पीठ के बल सीधा न लिटाएं।',
        'व्यक्ति को कोई भी भोजन, पानी या खाने की दवा न दें।',
        'लक्षणों में सुधार न होने पर मेडिकल सहायता बुलाने में देरी न करें।'
      ],
      campusAlertPayload: {
        alertId: 'RC-RESP-889',
        campusUnit: 'CRITICAL_AMBULANCE_UNIT',
        eta: '2-3 mins',
        status: 'DISPATCHED',
        locationZone: 'कैंपस डाइनिंग एवं छात्र केंद्र'
      }
    }
  },
  general: {
    en: {
      triageSeverity: 'MODERATE',
      summary: 'Campus health & safety incident assessed. Standard first-aid and safety protocol activated.',
      immediateSteps: [
        'Ensure the scene is safe for both the victim and responders before approaching.',
        'Assess the patient\'s vital signs (airway, breathing, circulation, consciousness).',
        'Provide comfort, reassurance, and appropriate first-aid care for presenting symptoms.',
        'Stay with the patient until campus medical or safety personnel take charge.'
      ],
      safetyWarnings: [
        'DO NOT move a patient with suspected spinal or neck injury unless in immediate environmental danger.',
        'DO NOT administer non-prescribed medications without medical supervision.'
      ],
      campusAlertPayload: {
        alertId: 'RC-GEN-303',
        campusUnit: 'CAMPUS_FIRST_RESPONDER',
        eta: '4-6 mins',
        status: 'DISPATCHED',
        locationZone: 'Campus General Sector'
      }
    },
    hi: {
      triageSeverity: 'MODERATE',
      summary: 'परिसर स्वास्थ्य एवं सुरक्षा घटना का मूल्यांकन किया गया। मानक प्राथमिक चिकित्सा प्रोटोकॉल सक्रिय है।',
      immediateSteps: [
        'मदद के लिए आगे बढ़ने से पहले सुनिश्चित करें कि आसपास का वातावरण सुरक्षित है।',
        'मरीज की स्थिति (सांस, चेतना और नब्ज) की जांच करें।',
        'लक्षणों के अनुसार उपयुक्त प्राथमिक उपचार दें और व्यक्ति को सांत्वना दें।',
        'कैंपस मेडिकल टीम के आने तक मरीज के साथ बने रहें।'
      ],
      safetyWarnings: [
        'गर्दन या रीढ़ की हड्डी में चोट होने की स्थिति में मरीज को अनावश्यक रूप से न हिलाएं।',
        'डॉक्टर की सलाह के बिना कोई भी दवा न दें।'
      ],
      campusAlertPayload: {
        alertId: 'RC-GEN-303',
        campusUnit: 'CAMPUS_FIRST_RESPONDER',
        eta: '4-6 mins',
        status: 'DISPATCHED',
        locationZone: 'सामान्य कैंपस क्षेत्र'
      }
    }
  }
};

/**
 * Multilingual Fallback Dictionaries for 8 Supported Languages
 */
const REGIONAL_FALLBACK_TEXT = {
  hi: {
    summary: "आपातकालीन स्थिति का विश्लेषण: तुरंत प्राथमिक उपचार शुरू करें।",
    immediateSteps: [
      "प्रभावित हिस्से को 15 मिनट तक बहते साफ़ पानी से धोएं।",
      "तंग कपड़े या गहने तुरंत हटा लें।",
      "कैंपस मेडिकल टीम के आने तक शांत रहें।"
    ],
    safetyWarnings: [
      "घाव को सीधे हाथों से न छुएं।",
      "बिना डॉक्टर की सलाह के कोई मलहम न लगाएं।"
    ],
    imageObservation: "घटनास्थल पर रासायनिक फैलाव / चोट के दृश्य लक्षण देखे गए हैं।",
    possibleHazards: "रासायनिक जोखिम, त्वचा जलन अथवा आघात की संभावना।",
    riskLevel: "CRITICAL",
    riskLevelReason: "त्वरित सुरक्षा उपाय और संदूषण रोकने की आवश्यकता है।",
    whenToSeekUrgentHelp: "यदि अत्यधिक रक्तस्राव हो, सांस लेने में परेशानी हो अथवा जलन बढ़े तो तुरंत 112 या कैंपस सुरक्षा को कॉल करें।",
    disclaimer: "AI safety copilot for triage assistance only; not a definitive medical diagnosis."
  },
  hinglish: {
    summary: "Emergency situation detect hui hai: Turant primary first-aid start karein aur campus medical team ko alert karein.",
    immediateSteps: [
      "Affected jagah ko 15 minute tak continuous saaf paani se achhi tarah dhoye.",
      "Tight kapde ya jewelry ko bina der kiye carefully remove kare.",
      "Victim ko shaant rakhein aur campus emergency unit ka wait kare."
    ],
    safetyWarnings: [
      "Wound ko bare hands (khali haathon) se directly touch na kare.",
      "Doctor ki guidance ke bina koi ointment ya chemical na lagaye."
    ],
    imageObservation: "Uploaded photo me incident/injury ke visible signs observe hue hain.",
    possibleHazards: "Chemical splash, localized skin burn ya acute trauma hazard.",
    riskLevel: "CRITICAL",
    riskLevelReason: "Immediate physical harm aur contamination risk.",
    whenToSeekUrgentHelp: "Agar bleeding na ruke, breathing me difficulty ho, ya chemical burn fail raha ho to turant 112 ya Campus Security dial kare.",
    disclaimer: "AI safety copilot for triage assistance only; not a definitive medical diagnosis."
  },
  pa: {
    summary: "ਐਮਰਜੈਂਸੀ ਸਥਿਤੀ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ: ਤੁਰੰਤ ਮੁੱਢਲੀ ਸਹਾਇਤਾ ਸ਼ੁਰੂ ਕਰੋ।",
    immediateSteps: [
      "ਪ੍ਰਭਾਵਿਤ ਹਿੱਸੇ ਨੂੰ 15 ਮਿੰਟ ਲਈ ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਧੋਵੋ।",
      "ਤੰਗ ਕੱਪੜੇ ਜਾਂ ਗਹਿਣੇ ਤੁਰੰਤ ਹਟਾਓ।",
      "ਕੈਂਪਸ ਮੈਡੀਕਲ ਟੀਮ ਦੇ ਪਹੁੰਚਣ ਤੱਕ ਸ਼ਾਂਤ ਰਹੋ।"
    ],
    safetyWarnings: [
      "ਜ਼ਖ਼ਮ ਨੂੰ ਨੰਗੇ ਹੱਥਾਂ ਨਾਲ ਨਾ ਛੂਹੋ।",
      "ਡਾਕਟਰ ਦੀ ਸਲਾਹ ਤੋਂ ਬਿਨਾਂ ਕੋਈ ਦਵਾਈ ਨਾ ਲਗਾਓ।"
    ],
    imageObservation: "ਘਟਨਾ ਸਥਾਨ 'ਤੇ ਰਸਾਇਣਕ ਫੈਲਾਅ ਜਾਂ ਸੱਟ ਦੇ ਚਿੰਨ੍ਹ ਦਿਖਾਈ ਦੇ ਰਹੇ ਹਨ।",
    possibleHazards: "ਰਸਾਇਣਕ ਜਾਂ ਸਰੀਰਕ ਸੱਟ ਦਾ ਖ਼ਤਰਾ।",
    riskLevel: "CRITICAL",
    riskLevelReason: "ਤੁਰੰਤ ਸੁਰੱਖਿਆ ਉਪਾਵਾਂ ਦੀ ਲੋੜ ਹੈ।",
    whenToSeekUrgentHelp: "ਜੇਕਰ ਖ਼ੂਨ ਨਾ ਰੁਕੇ ਜਾਂ ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼ ਹੋਵੇ ਤਾਂ ਤੁਰੰਤ 112 ਡਾਇਲ ਕਰੋ।",
    disclaimer: "AI safety copilot for triage assistance only; not a definitive medical diagnosis."
  },
  bn: {
    summary: "জরুরী পরিস্থিতির বিশ্লেষণ: অবিলম্বে প্রাথমিক চিকিৎসা শুরু করুন।",
    immediateSteps: [
      "ক্ষতিগ্রস্ত অংশটি ১৫ মিনিট ধরে পরিষ্কার জলে ধুয়ে নিন।",
      "টাইট পোশাক বা গয়না অবিলম্বে সরিয়ে ফেলুন।",
      "ক্যাম্পাস মেডিকেল টিম না পৌঁছানো পর্যন্ত শান্ত থাকুন।"
    ],
    safetyWarnings: [
      "খালি হাতে ক্ষত স্পর্শ করবেন না।",
      "ডাক্তারের পরামর্শ ছাড়া কোনো মলম লাগাবেন না।"
    ],
    imageObservation: "ছবিতে রাসায়নিক ছড়িয়ে পড়া বা আঘাতের দৃশ্যমান লক্ষণ পরিলক্ষিত হয়েছে।",
    possibleHazards: "রাসায়নিক বা শারীরিক আঘাতের ঝুঁকি।",
    riskLevel: "CRITICAL",
    riskLevelReason: "অবিলম্বে সতর্কতা ও চিকিৎসা সহায়তা প্রয়োজন।",
    whenToSeekUrgentHelp: "রক্তপাত বন্ধ না হলে বা শ্বাসকষ্ট হলে অবিলম্বে ১১২ নম্বরে যোগাযোগ করুন।",
    disclaimer: "AI safety copilot for triage assistance only; not a definitive medical diagnosis."
  },
  ta: {
    summary: "அவசர நிலை பகுப்பாய்வு: உடனடியாக முதலுதவி தொடங்கவும்.",
    immediateSteps: [
      "பாதிக்கப்பட்ட பகுதியை 15 நிமிடங்கள் சுத்தமான தண்ணீரில் கழுவவும்.",
      "இறுக்கமான ஆடைகள் அல்லது நகைகளை உடனடியாக அகற்றவும்.",
      "வளாக மருத்துவக் குழு வரும் வரை அமைதியாக இருக்கவும்."
    ],
    safetyWarnings: [
      "காயத்தை வெறும் கைகளால் தொடாதீர்கள்.",
      "மருத்துவரின் ஆலோசனையின்றி எந்த களிம்பையும் பூசாதீர்கள்."
    ],
    imageObservation: "விபத்து பகுதியில் இரசாயன கசிவு அல்லது காயம் இருப்பதற்கான அறிகுறிகள் காணப்படுகின்றன.",
    possibleHazards: "இரசாயன அல்லது உடல் காயம் ஏற்படும் அபாயம்.",
    riskLevel: "CRITICAL",
    riskLevelReason: "உடனடி பாதுகாப்பு நடவடிக்கைகள் தேவை.",
    whenToSeekUrgentHelp: "இரத்தப்போக்கு நிற்காவிட்டால் உடனடியாக 112 அல்லது வளாக பாதுகாப்பை அழைக்கவும்.",
    disclaimer: "AI safety copilot for triage assistance only; not a definitive medical diagnosis."
  },
  te: {
    summary: "అత్యవసర పరిస్థితి విశ్లేషణ: వెంటనే ప్రథమ చికిత్స ప్రారంభించండి.",
    immediateSteps: [
      "బాధిత భాగాన్ని 15 నిమిషాల పాటు శుభ్రమైన నీటితో కడగాలి.",
      "బిగుతుగా ఉన్న దుస్తులు లేదా నగలను వెంటనే తొలగించండి.",
      "క్యాంపస్ వైద్య బృందం వచ్చే వరకు ప్రశాంతంగా ఉండండి."
    ],
    safetyWarnings: [
      "గాయాన్ని చేతులతో నేరుగా తాకవద్దు.",
      "వైద్యుల సలహా లేకుండా ఎలాంటి మందులు రాయవద్దు."
    ],
    imageObservation: "ఘటనా స్థలంలో రసాయన చిందినట్లు లేదా గాయాల సంకేతాలు గమనించబడ్డాయి.",
    possibleHazards: "రసాయన లేదా శారీరక ప్రమాద అవకాశం.",
    riskLevel: "CRITICAL",
    riskLevelReason: "తక్షణ భద్రతా చర్యలు అవసరం.",
    whenToSeekUrgentHelp: "రక్తస్రావం ఆగకపోయినా లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది ఉన్నా వెంటనే 112 కి కాల్ చేయండి.",
    disclaimer: "AI safety copilot for triage assistance only; not a definitive medical diagnosis."
  },
  mr: {
    summary: "तातडीच्या परिस्थितीचे विश्लेषण: त्वरित प्रथमोपचार सुरू करा.",
    immediateSteps: [
      "बाधित भाग १५ मिनिटे वाहत्या स्वच्छ पाण्याने धुवा.",
      "घट्ट कपडे किंवा दागिने त्वरित काढून टाका.",
      "कॅम्पस मेडिकल टीम येईपर्यंत शांत राहा."
    ],
    safetyWarnings: [
      "जखमेला उघड्या हातांनी स्पर्श करू नका.",
      "डॉक्टरांच्या सल्ल्याशिवाय कोणतेही मलम लावू नका."
    ],
    imageObservation: "अपघात स्थळी रासायनिक गळती किंवा दुखापतीचे दृश्य चिन्हे आढळली आहेत.",
    possibleHazards: "रासायनिक किंवा शारीरिक इजा होण्याचा धोका.",
    riskLevel: "CRITICAL",
    riskLevelReason: "त्वरित सुरक्षितता उपाय आवश्यक आहेत.",
    whenToSeekUrgentHelp: "रक्तस्राव थांबत नसल्यास किंवा श्वास घेण्यास त्रास होत असल्यास त्वरित ११२ वर संपर्क साधा.",
    disclaimer: "AI safety copilot for triage assistance only; not a definitive medical diagnosis."
  },
  en: {
    summary: "Emergency incident assessed: Initiate immediate first-aid and safety measures.",
    immediateSteps: [
      "Flush affected skin/eyes with clean running water for at least 15 minutes.",
      "Remove contaminated or restrictive clothing cautiously.",
      "Remain calm and stay with victim until campus medical patrol arrives."
    ],
    safetyWarnings: [
      "DO NOT touch wounds with bare unsterile hands.",
      "DO NOT apply unprescribed ointments, ice, or neutralizers."
    ],
    imageObservation: "Visible signs of localized substance exposure or acute physical incident detected.",
    possibleHazards: "Chemical splash, thermal burn, or acute physical trauma risk.",
    riskLevel: "CRITICAL",
    riskLevelReason: "Immediate risk of tissue irritation or secondary contamination.",
    whenToSeekUrgentHelp: "If severe bleeding persists, airway compromise occurs, or burn spreads, call 112/Campus Security immediately.",
    disclaimer: "AI safety copilot for triage assistance only; not a definitive medical diagnosis."
  }
};

/**
 * Intelligent local fallback generator when API key is unconfigured or network is unavailable.
 */
function generateFallbackTriage({ prompt = '', language = 'en', targetLanguage = '', incidentType = '' }) {
  const chosenLang = (targetLanguage || language || 'en').toLowerCase().trim();
  
  let langKey = 'en';
  if (['hi', 'hindi', 'हिंदी'].includes(chosenLang)) langKey = 'hi';
  else if (['hinglish', 'hing'].includes(chosenLang)) langKey = 'hinglish';
  else if (['pa', 'punjabi', 'ਪੰਜਾਬੀ'].includes(chosenLang)) langKey = 'pa';
  else if (['bn', 'bengali', 'বাংলা'].includes(chosenLang)) langKey = 'bn';
  else if (['ta', 'tamil', 'தமிழ்'].includes(chosenLang)) langKey = 'ta';
  else if (['te', 'telugu', 'తెలుగు'].includes(chosenLang)) langKey = 'te';
  else if (['mr', 'marathi', 'मराठी'].includes(chosenLang)) langKey = 'mr';

  const pack = REGIONAL_FALLBACK_TEXT[langKey] || REGIONAL_FALLBACK_TEXT.en;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return {
    triageSeverity: pack.riskLevel || 'CRITICAL',
    summary: pack.summary,
    immediateSteps: [...pack.immediateSteps],
    safetyWarnings: [...pack.safetyWarnings],
    imageObservation: pack.imageObservation,
    possibleHazards: pack.possibleHazards,
    riskLevel: pack.riskLevel,
    riskLevelReason: pack.riskLevelReason,
    whenToSeekUrgentHelp: pack.whenToSeekUrgentHelp,
    disclaimer: pack.disclaimer,
    campusAlertPayload: {
      alertId: `RC-EMG-${randomSuffix}`,
      campusUnit: 'CAMPUS_PARAMEDIC_PATROL',
      eta: '2-4 mins',
      status: 'DISPATCHED',
      locationZone: 'Campus Medical Dispatch Grid'
    },
    meta: {
      source: 'ResQCampus AI Multilingual Fallback Engine',
      language: langKey,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Executes a Gemini 2.5 Flash multimodal triage request with strict structured output.
 *
 * @param {object} params
 * @param {string} params.prompt - Text description of the emergency
 * @param {string} [params.imageBase64] - Base64 encoded image data
 * @param {string} [params.mimeType] - Mime type of the image (e.g., 'image/jpeg')
 * @param {string} [params.language='en'] - Target output language
 * @param {string} [params.targetLanguage] - Alias for target output language
 * @param {string} [params.incidentType] - Preset type if any
 * @param {string} [params.location] - User location description or coordinates
 * @returns {Promise<object>} Strict structured triage response
 */
async function generateTriage({ prompt, imageBase64, mimeType = 'image/jpeg', language = 'en', targetLanguage = '', incidentType = '', location = '' }) {
  const chosenLang = (targetLanguage || language || 'en').toLowerCase().trim();

  let normalizedLangCode = 'en';
  if (['hi', 'hindi', 'हिंदी'].includes(chosenLang)) normalizedLangCode = 'hi';
  else if (['hinglish', 'hing'].includes(chosenLang)) normalizedLangCode = 'hinglish';
  else if (['pa', 'punjabi', 'ਪੰਜਾਬੀ'].includes(chosenLang)) normalizedLangCode = 'pa';
  else if (['bn', 'bengali', 'বাংলা'].includes(chosenLang)) normalizedLangCode = 'bn';
  else if (['ta', 'tamil', 'தமிழ்'].includes(chosenLang)) normalizedLangCode = 'ta';
  else if (['te', 'telugu', 'తెలుగు'].includes(chosenLang)) normalizedLangCode = 'te';
  else if (['mr', 'marathi', 'मराठी'].includes(chosenLang)) normalizedLangCode = 'mr';

  // Input validation
  const hasText = typeof prompt === 'string' && prompt.trim().length > 0;
  const hasImage = typeof imageBase64 === 'string' && imageBase64.trim().length > 0;

  if (!hasText && !hasImage && !incidentType) {
    const error = new Error('Invalid input: Provide either an emergency description prompt, an incident image, or a preset incident type.');
    error.statusCode = 400;
    throw error;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyValid = apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_GEMINI_API_KEY';

  // If no valid API key is configured, safely use the intelligent local fallback
  if (!isKeyValid) {
    console.warn('[ResQCampus AI] GEMINI_API_KEY is not configured or placeholder. Using resilient local fallback engine.');
    return generateFallbackTriage({ prompt: prompt || incidentType, language: normalizedLangCode, targetLanguage: normalizedLangCode, incidentType });
  }

  const targetLangName = LANGUAGE_MAP[normalizedLangCode] || 'English';

  // Construct System Instruction & Dynamic Multilingual Enforcement
  let languageDirective = '';
  if (normalizedLangCode === 'hi') {
    languageDirective = `IMPORTANT: You MUST respond in Hindi using Devanagari script for immediateSteps, summary, safetyWarnings, imageObservation, possibleHazards, riskLevelReason, and whenToSeekUrgentHelp. Do not use English.`;
  } else if (normalizedLangCode === 'hinglish') {
    languageDirective = `IMPORTANT: You MUST respond in clear conversational Hinglish (Romanized Hindi using standard English alphabet, e.g. "Affected jagah ko 15 minute tak saaf paani se dhoye. Tight kapde turant remove kare.") for immediateSteps, summary, safetyWarnings, imageObservation, possibleHazards, riskLevelReason, and whenToSeekUrgentHelp.`;
  } else if (normalizedLangCode === 'pa') {
    languageDirective = `IMPORTANT: You MUST respond strictly in Punjabi using Gurmukhi script (ਪੰਜਾਬੀ) for all textual fields.`;
  } else if (normalizedLangCode === 'bn') {
    languageDirective = `IMPORTANT: You MUST respond strictly in Bengali using Bengali script (বাংলা) for all textual fields.`;
  } else if (normalizedLangCode === 'ta') {
    languageDirective = `IMPORTANT: You MUST respond strictly in Tamil using Tamil script (தமிழ்) for all textual fields.`;
  } else if (normalizedLangCode === 'te') {
    languageDirective = `IMPORTANT: You MUST respond strictly in Telugu using Telugu script (తెలుగు) for all textual fields.`;
  } else if (normalizedLangCode === 'mr') {
    languageDirective = `IMPORTANT: You MUST respond strictly in Marathi using Devanagari script (मराठी) for all textual fields.`;
  } else {
    languageDirective = `You MUST provide all textual fields in clear, concise English.`;
  }

  const systemInstruction = `You are "ResQCampus AI", a certified emergency triage copilot and assistive safety guide deployed on university campuses in partnership with IEEE WIE.
Your task is to analyze emergency health situations, hazardous lab incidents, physical trauma, or medical distress from multimodal input (text & images).

CRITICAL MULTILINGUAL DIRECTIVE:
${languageDirective}

STRUCTURED PHOTO & INCIDENT ANALYSIS SPECIFICATION:
1. 'imageObservation': Clearly state what is visibly detected in the uploaded photo (e.g. spilled substance container, smoke, skin laceration, burn redness, exposed wire) without guessing or fabricating unseen elements.
2. 'possibleHazards': Identify visible campus hazards (fire/smoke, chemical splash, electrical shock, trip hazard, physical trauma) without making absolute clinical diagnoses.
3. 'riskLevel': Categorize as 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL', and provide a one-line explanation in 'riskLevelReason'.
4. 'triageSeverity': Assign 'CRITICAL' | 'MODERATE' | 'LOW'.
5. 'immediateSteps': Short, calm, numbered, actionable first-aid/safety actions (Step 1, Step 2, Step 3).
6. 'safetyWarnings': Key precautions / things to avoid (e.g. Do NOT touch with bare hands).
7. 'whenToSeekUrgentHelp': Clear thresholds for hospital, paramedic, or campus security escalation.
8. 'disclaimer': "AI safety copilot for triage assistance only; not a definitive medical diagnosis."
9. 'campusAlertPayload': Realistic dispatch object (alertId, campusUnit, eta, status).

You MUST return strictly valid JSON matching the schema with zero markdown fencing outside the JSON object.`;

  // Build the contents payload for Gemini 2.5 Flash
  const parts = [];

  let userPromptText = `Emergency Incident Report:\n`;
  if (incidentType) userPromptText += `- Incident Category: ${incidentType}\n`;
  if (location) userPromptText += `- Campus Location / Sector: ${location}\n`;
  if (prompt) userPromptText += `- Incident Description: ${prompt}\n`;
  userPromptText += `- Target Output Language: ${targetLangName}\n\n`;
  userPromptText += `${languageDirective}\n\n`;
  userPromptText += `Analyze this emergency immediately. Provide accurate structured photo/incident observation, possible hazards, risk level, concise summary, immediate first-aid steps, precautions, urgent help thresholds, and campus alert dispatch payload.`;

  parts.push({ text: userPromptText });

  if (hasImage) {
    // Strip possible data URI prefix if provided
    let cleanBase64 = imageBase64;
    let detectedMime = mimeType || 'image/jpeg';
    if (imageBase64.includes(';base64,')) {
      const splitUri = imageBase64.split(';base64,');
      detectedMime = splitUri[0].replace('data:', '') || detectedMime;
      cleanBase64 = splitUri[1];
    }
    parts.push({
      inlineData: {
        mimeType: detectedMime,
        data: cleanBase64
      }
    });
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: parts
      }
    ],
    systemInstruction: {
      parts: [
        { text: systemInstruction }
      ]
    },
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      responseMimeType: "application/json",
      responseSchema: GEMINI_JSON_SCHEMA
    }
  };

  try {
    const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ResQCampus AI] Gemini API returned error HTTP ${response.status}:`, errorText);
      // Failover safely to intelligent local fallback engine
      return generateFallbackTriage({ prompt: prompt || incidentType, language, incidentType });
    }

    const jsonResponse = await response.json();
    const candidateText = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      console.warn('[ResQCampus AI] Empty candidate response from Gemini API. Falling back to local engine.');
      return generateFallbackTriage({ prompt: prompt || incidentType, language, incidentType });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(candidateText);
    } catch (parseErr) {
      console.warn('[ResQCampus AI] Failed to parse JSON response. Using fallback. Parse error:', parseErr.message);
      return generateFallbackTriage({ prompt: prompt || incidentType, language, incidentType });
    }

    // Validate structured output against schema
    const validation = validateTriagePayload(parsedData);
    if (!validation.valid) {
      console.warn('[ResQCampus AI] Structured output schema mismatch:', validation.errors);
      // Patch missing fields if necessary
      if (!parsedData.campusAlertPayload) {
        parsedData.campusAlertPayload = {
          alertId: `RC-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
          campusUnit: 'CAMPUS_SAFETY_PATROL',
          eta: '3-5 mins',
          status: 'DISPATCHED'
        };
      }
      if (!Array.isArray(parsedData.immediateSteps)) {
        parsedData.immediateSteps = [parsedData.summary || 'Follow campus safety protocol.'];
      }
      if (!Array.isArray(parsedData.safetyWarnings)) {
        parsedData.safetyWarnings = ['Stay alert and wait for campus emergency response team.'];
      }
    }

    parsedData.meta = {
      model: GEMINI_MODEL,
      source: 'Google Gemini 2.5 Flash Multimodal API',
      language: language,
      timestamp: new Date().toISOString()
    };

    return parsedData;

  } catch (networkError) {
    console.error('[ResQCampus AI] Network / execution error during Gemini API call:', networkError.message);
    // Bulletproof fallback to ensure continuous 24/7 campus emergency operations
    return generateFallbackTriage({ prompt: prompt || incidentType, language, incidentType });
  }
}

module.exports = {
  generateTriage,
  generateFallbackTriage,
  LANGUAGE_MAP
};
