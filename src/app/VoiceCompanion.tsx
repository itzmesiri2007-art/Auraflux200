import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  ArrowRight,
  Check,
  Globe2,
  Mic,
  MicOff,
  ShieldCheck,
  Square,
  Volume2,
} from "lucide-react"
import { type ScheduledDose, timeLabel } from "./prescription"

type Language = "en-IN" | "te-IN" | "hi-IN"

type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: {
    results: { [index: number]: { [index: number]: { transcript: string } } }
  }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  abort: () => void
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition
  webkitSpeechRecognition?: new () => Recognition
}

function getFoodPhrase(food?: string, lang: Language = "en-IN"): string {
  if (!food || food === "Any time") return ""
  if (lang === "te-IN") {
    if (food === "Before food") return " భోజనానికి ముందు"
    if (food === "After food") return " భోజనం తర్వాత"
    if (food === "With food") return " భోజనంతో పాటు"
    if (food === "On an empty stomach") return " ఖాళీ కడుపుతో"
    return ` ${food}`
  }
  if (lang === "hi-IN") {
    if (food === "Before food") return " खाने से पहले"
    if (food === "After food") return " खाने के बाद"
    if (food === "With food") return " खाने के साथ"
    if (food === "On an empty stomach") return " खाली पेट"
    return ` ${food}`
  }
  return ` ${food.toLowerCase()}`
}

function getInstructionPhrase(inst?: string): string {
  if (!inst || !inst.trim()) return ""
  const trimmed = inst.trim()
  return trimmed.endsWith(".") ? ` ${trimmed}` : ` ${trimmed}.`
}

const copy = {
  "en-IN": {
    title: "A friendly voice, here for you.",
    subtitle: "Listen to your routine. Ask in your own language.",
    greeting: (userName = "Jamie") =>
      `Hello ${userName}! I’m your Dosewell voice companion. I can read your prescription schedule and help you record your doses. How can I help today?`,
    talk: "Talk to your companion",
    listening: "Listening… tap to stop",
    read: "Read my next dose",
    schedule: "Read today’s schedule",
    stop: "Stop speaking",
    replay: "Read aloud",
    placeholder: "Or type: What is my next medicine?",
    send: "Ask",
    ready: "Ready when you are",
    speaking: "Speaking to you…",
    heard: "You said",
    confirm: "Yes, I have taken it",
    cancel: "Not yet",
    reminders: "Spoken reminders",
    reminderHelp:
      "Keep this app open and your device awake. Sound must be enabled.",
    enable: "Enable spoken reminders",
    disable: "Turn off spoken reminders",
    noDoses:
      "There are no medicines scheduled for today. Add your medicines using your prescription instructions.",
    allDone: (userName = "Jamie") =>
      `Hello ${userName}. You have recorded all your scheduled doses for today. Well done. Only take medicines as prescribed.`,
    next: (dose: ScheduledDose, time: string, userName = "Jamie") => {
      const food = getFoodPhrase(dose.medicine.foodInstruction, "en-IN")
      const inst = getInstructionPhrase(dose.medicine.instructions)
      return `Hello ${userName}. Your next unrecorded dose is ${dose.medicine.dosage} of ${dose.medicine.name}${food}, scheduled for ${time}.${inst} If this dose is late, ask your pharmacist what to do.`
    },
    reminder: (dose: ScheduledDose, time: string, userName = "Jamie") => {
      const food = getFoodPhrase(dose.medicine.foodInstruction, "en-IN")
      const inst = getInstructionPhrase(dose.medicine.instructions)
      return `Hello ${userName}. It is ${time}. It is time to take ${dose.medicine.dosage} of ${dose.medicine.name}${food}.${inst}`
    },
    heading: "Here is your prescription schedule for today.",
    dose: (dose: ScheduledDose, time: string) => {
      const food = getFoodPhrase(dose.medicine.foodInstruction, "en-IN")
      const statusText =
        dose.status === "taken"
          ? "Recorded as taken."
          : dose.status === "skipped"
            ? "Marked as skipped."
            : "Not yet recorded."
      return `${time}: ${dose.medicine.dosage} of ${dose.medicine.name}${food}. ${statusText}`
    },
    confirmMessage: (dose: ScheduledDose, time: string) =>
      `Have you already taken ${dose.medicine.dosage} of ${dose.medicine.name} scheduled for ${time}? Please use the confirmation button below. I will not change your dose record until you confirm.`,
    recorded: (name: string, time: string) =>
      `${name} for ${time} has been recorded as taken. Thank you for confirming.`,
    alreadyTaken:
      "This dose is already recorded as taken. You can review your records in today’s schedule.",
    identify:
      "Please include the medicine name and time, or say: I took my next medicine. I will ask you to confirm before recording it.",
    advice:
      "I cannot give medical advice or tell you to change a dose. For missed doses, side effects, or medicine questions, contact your pharmacist or doctor. In a medical emergency, call your local emergency service.",
    fallback:
      "I can help with your prescription routine. Try: What is my next medicine? Read my schedule. Or: I took my next medicine. For medical questions, please speak to your doctor or pharmacist.",
    noSpeech:
      "Audio is not supported in this browser. You can still read and type here.",
    noMic:
      "Voice input is not available in this browser. Use the buttons or type your request below.",
    micDenied:
      "Microphone access is unavailable. Allow access in your browser’s settings, or type your request.",
    micError: "I could not hear that. Try again, or type your request below.",
    voiceMissing:
      "A voice for this language is not installed. Install it in your device’s speech settings; you can still read or type in this language.",
    audioError:
      "Audio could not play. Check your device volume and speech settings, then use Read aloud to try again.",
    supported:
      "Routine assistance, not medical advice. Voice input may be processed by your browser’s speech provider.",
    examples: "I took my next medicine",
    unavailable: "Device speech is unavailable",
    engine:
      "Browser-powered voice · Supports routine commands, not open-ended AI conversation",
  },
  "te-IN": {
    title: "మీ కోసం ఒక స్నేహపూర్వక స్వరం.",
    subtitle: "మీ మందుల పట్టికను వినండి. మీ భాషలో అడగండి.",
    greeting: (userName = "Jamie") =>
      `నమస్కారం ${userName}! నేను మీ డోస్‌వెల్ స్వర సహాయకుడిని. మీ ప్రిస్క్రిప్షన్ పట్టికను చదవగలను, మందు తీసుకున్నట్లు నమోదు చేయడంలో సహాయపడగలను. మీకు ఎలా సహాయపడాలి?`,
    talk: "మీ సహాయకుడితో మాట్లాడండి",
    listening: "వింటున్నాను… ఆపడానికి నొక్కండి",
    read: "తదుపరి మందు వినండి",
    schedule: "ఈ రోజు పట్టిక వినండి",
    stop: "మాట్లాడటం ఆపండి",
    replay: "చదివి వినిపించండి",
    placeholder: "లేదా టైప్ చేయండి: నా తదుపరి మందు ఏది?",
    send: "అడగండి",
    ready: "మీ కోసం సిద్ధంగా ఉన్నాను",
    speaking: "మీతో మాట్లాడుతున్నాను…",
    heard: "మీరు చెప్పారు",
    confirm: "అవును, నేను తీసుకున్నాను",
    cancel: "ఇంకా తీసుకోలేదు",
    reminders: "స్వర రిమైండర్లు",
    reminderHelp: "ఈ యాప్ తెరిచి ఉంచండి. పరికరం మేల్కొని ఉండాలి, శబ్దం ఆన్‌లో ఉండాలి.",
    enable: "స్వర రిమైండర్లు ఆన్ చేయండి",
    disable: "స్వర రిమైండర్లు ఆఫ్ చేయండి",
    noDoses:
      "ఈ రోజు మీ పట్టికలో మందులు లేవు. మీ వైద్యుడు ఇచ్చిన ప్రిస్క్రిప్షన్ ప్రకారం మందులను జోడించండి.",
    allDone: (userName = "Jamie") =>
      `నమస్కారం ${userName}. ఈ రోజు అన్ని మందులు తీసుకున్నట్లు నమోదు చేశారు. మంచిది! వైద్య సూచనల ప్రకారం మాత్రమే మందులు తీసుకోండి.`,
    next: (dose: ScheduledDose, time: string, userName = "Jamie") => {
      const food = getFoodPhrase(dose.medicine.foodInstruction, "te-IN")
      return `నమస్కారం ${userName}. మీ తదుపరి మందు ${dose.medicine.name}, మోతాదు ${dose.medicine.dosage}${food}. సమయం ${time}. మీ వైద్య సూచనలను పాటించండి.`
    },
    reminder: (dose: ScheduledDose, time: string, userName = "Jamie") => {
      const food = getFoodPhrase(dose.medicine.foodInstruction, "te-IN")
      return `నమస్కారం ${userName}. సమయం ${time}. మీ ప్రిస్క్రిప్షన్ ప్రకారం ${dose.medicine.name} (${dose.medicine.dosage})${food} తీసుకునే సమయం వచ్చింది.`
    },
    heading: "మీరు నమోదు చేసిన ఈ రోజు మందుల పట్టిక ఇది.",
    dose: (dose: ScheduledDose, time: string) => {
      const food = getFoodPhrase(dose.medicine.foodInstruction, "te-IN")
      const statusText =
        dose.status === "taken"
          ? "తీసుకున్నట్లు నమోదు చేశారు."
          : dose.status === "skipped"
            ? "విడిచిపెట్టినట్లు నమోదు చేశారు."
            : "ఇంకా నమోదు చేయలేదు."
      return `${time}: ${dose.medicine.name}, మోతాదు ${dose.medicine.dosage}${food}. ${statusText}`
    },
    confirmMessage: (dose: ScheduledDose, time: string) =>
      `మీరు ఇప్పటికే ${time} సమయానికి చెందిన ${dose.medicine.name} (${dose.medicine.dosage}) తీసుకున్నారా? క్రింద ఉన్న నిర్ధారణ బటన్ నొక్కండి.`,
    recorded: (name: string, time: string) =>
      `${time} సమయానికి చెందిన ${name} తీసుకున్నట్లు నమోదు చేశాను. నిర్ధారించినందుకు ధన్యవాదాలు.`,
    alreadyTaken:
      "ఈ మందు ఇప్పటికే తీసుకున్నట్లు నమోదు చేశారు. ఈ రోజు పట్టికలో మీ రికార్డును చూడండి.",
    identify:
      "మందు పేరు చెప్పండి, లేదా నా తదుపరి మందు తీసుకున్నాను అని చెప్పండి. నమోదు చేసే ముందు నిర్ధారణ అడుగుతాను.",
    advice:
      "నేను వైద్య సలహా ఇవ్వలేను లేదా మోతాదు మార్చమని చెప్పలేను. మందు మరిచిపోయినా, దుష్ప్రభావాలు వచ్చినా మీ వైద్యుడు లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి. అత్యవసర పరిస్థితిలో స్థానిక అత్యవసర సేవలకు కాల్ చేయండి.",
    fallback:
      "మీ మందుల పట్టికలో సహాయపడగలను. నా తదుపరి మందు ఏది? నా పట్టిక చదవండి. లేదా నా తదుపరి మందు తీసుకున్నాను అని అడగండి.",
    noSpeech: "ఈ బ్రౌజర్‌లో శబ్దం అందుబాటులో లేదు. ఇక్కడ చదవవచ్చు, టైప్ చేయవచ్చు.",
    noMic: "ఈ బ్రౌజర్‌లో స్వర ఇన్‌పుట్ అందుబాటులో లేదు. బటన్‌లు వాడండి లేదా క్రింద టైప్ చేయండి.",
    micDenied: "మైక్రోఫోన్ అనుమతి లేదు. బ్రౌజర్ సెట్టింగ్స్‌లో అనుమతి ఇవ్వండి లేదా టైప్ చేయండి.",
    micError: "మీ మాట వినలేకపోయాను. మళ్లీ ప్రయత్నించండి లేదా టైప్ చేయండి.",
    voiceMissing: "ఈ భాషకు స్వరం ఇన్‌స్టాల్ కాలేదు. పరికరం స్పీచ్ సెట్టింగ్స్‌లో ఇన్‌స్టాల్ చేయండి.",
    audioError: "శబ్దం ప్లే కాలేదు. పరికరం వాల్యూమ్, స్పీచ్ సెట్టింగ్స్ చూడండి.",
    supported: "రోజువారీ పట్టికకు సహాయం మాత్రమే, వైద్య సలహా కాదు.",
    examples: "నా తదుపరి మందు తీసుకున్నాను",
    unavailable: "పరికరంలో స్వరం అందుబాటులో లేదు",
    engine: "బ్రౌజర్ స్వర సహాయం · పట్టిక ఆదేశాలకు మాత్రమే, సాధారణ AI సంభాషణకు కాదు",
  },
  "hi-IN": {
    title: "आपके लिए एक दोस्ताना आवाज़।",
    subtitle: "अपनी दवाओं का समय सुनें। अपनी भाषा में पूछें।",
    greeting: (userName = "Jamie") =>
      `नमस्ते ${userName}! मैं आपका डोसवेल आवाज़ साथी हूँ। मैं आपके प्रिस्क्रिप्शन का समय पढ़ सकता हूँ और ली हुई दवा दर्ज करने में मदद कर सकता हूँ। आज मैं आपकी कैसे मदद करूँ?`,
    talk: "अपने साथी से बात करें",
    listening: "सुन रहा हूँ… रोकने के लिए दबाएँ",
    read: "अगली दवा सुनें",
    schedule: "आज का समय सुनें",
    stop: "बोलना रोकें",
    replay: "पढ़कर सुनाएँ",
    placeholder: "या लिखें: मेरी अगली दवा क्या है?",
    send: "पूछें",
    ready: "आपके लिए तैयार हूँ",
    speaking: "आपसे बात कर रहा हूँ…",
    heard: "आपने कहा",
    confirm: "हाँ, मैंने ले ली है",
    cancel: "अभी नहीं ली",
    reminders: "आवाज़ वाले रिमाइंडर",
    reminderHelp: "ऐप खुला रखें और डिवाइस को चालू रखें। आवाज़ चालू होनी चाहिए।",
    enable: "आवाज़ वाले रिमाइंडर चालू करें",
    disable: "आवाज़ वाले रिमाइंडर बंद करें",
    noDoses:
      "आज के समय में अभी कोई दवा नहीं है। अपने डॉक्टर के प्रिस्क्रिप्शन के अनुसार दवाएँ जोड़ें।",
    allDone: (userName = "Jamie") =>
      `नमस्ते ${userName}। आज की सभी निर्धारित दवाएँ ली हुई दर्ज हैं। बहुत अच्छा! दवाएँ केवल डॉक्टर के निर्देश अनुसार लें।`,
    next: (dose: ScheduledDose, time: string, userName = "Jamie") => {
      const food = getFoodPhrase(dose.medicine.foodInstruction, "hi-IN")
      return `नमस्ते ${userName}। आपकी अगली दवा ${dose.medicine.name}, खुराक ${dose.medicine.dosage}${food} है। समय ${time} है। अपने डॉक्टर के निर्देशों का पालन करें।`
    },
    reminder: (dose: ScheduledDose, time: string, userName = "Jamie") => {
      const food = getFoodPhrase(dose.medicine.foodInstruction, "hi-IN")
      return `नमस्ते ${userName}। समय ${time} है। आपके प्रिस्क्रिप्शन के अनुसार ${dose.medicine.name} (${dose.medicine.dosage})${food} लेने का समय हो गया है।`
    },
    heading: "आज की आपकी प्रिस्क्रिप्शन दवाओं का समय यह है।",
    dose: (dose: ScheduledDose, time: string) => {
      const food = getFoodPhrase(dose.medicine.foodInstruction, "hi-IN")
      const statusText =
        dose.status === "taken"
          ? "ली हुई दर्ज है।"
          : dose.status === "skipped"
            ? "छोड़ दी गई दर्ज है।"
            : "अभी दर्ज नहीं है।"
      return `${time}: ${dose.medicine.name}, खुराक ${dose.medicine.dosage}${food}। ${statusText}`
    },
    confirmMessage: (dose: ScheduledDose, time: string) =>
      `क्या आपने ${time} के लिए ${dose.medicine.name} (${dose.medicine.dosage}) पहले ही ले ली है? नीचे दिए पुष्टि बटन को दबाएँ।`,
    recorded: (name: string, time: string) =>
      `${time} के लिए ${name} ली हुई दर्ज कर दी गई है। पुष्टि करने के लिए धन्यवाद।`,
    alreadyTaken: "यह खुराक पहले से ली हुई दर्ज है। आज के समय में अपना रिकॉर्ड देखें।",
    identify:
      "दवा का नाम और समय बताएं, या कहें: मैंने अपनी अगली दवा ले ली। दर्ज करने से पहले मैं पुष्टि माँगूँगा।",
    advice:
      "मैं चिकित्सा सलाह नहीं दे सकता या दवा की मात्रा बदलने को नहीं कह सकता। छूटी हुई दवा या अन्य सवालों के लिए डॉक्टर या फार्मासिस्ट से संपर्क करें।",
    fallback:
      "मैं आपके प्रिस्क्रिप्शन में मदद कर सकता हूँ। पूछें: मेरी अगली दवा क्या है? मेरा समय पढ़ें। या: मैंने अपनी अगली दवा ले ली।",
    noSpeech: "इस ब्राउज़र में आवाज़ उपलब्ध नहीं है। आप यहाँ पढ़ और लिख सकते हैं।",
    noMic: "इस ब्राउज़र में आवाज़ से पूछना उपलब्ध नहीं है। बटन दबाएँ या अपना सवाल लिखें।",
    micDenied:
      "माइक्रोफोन की अनुमति नहीं है। ब्राउज़र सेटिंग्स में अनुमति दें या अपना सवाल लिखें।",
    micError: "मैं सुन नहीं पाया। दोबारा कोशिश करें या सवाल लिखें।",
    voiceMissing:
      "इस भाषा की आवाज़ इंस्टॉल नहीं है। डिवाइस की स्पीच सेटिंग्स में इसे इंस्टॉल करें।",
    audioError: "आवाज़ नहीं चल सकी। डिवाइस की आवाज़ और स्पीच सेटिंग्स जाँचें।",
    supported: "दैनिक समय में सहायता, चिकित्सा सलाह नहीं।",
    examples: "मैंने अपनी अगली दवा ले ली",
    unavailable: "डिवाइस की आवाज़ उपलब्ध नहीं है",
    engine:
      "ब्राउज़र आवाज़ सहायता · समय के निर्देशों के लिए, सामान्य AI बातचीत के लिए नहीं",
  },
}

function storedLanguage(): Language {
  try {
    const value = localStorage.getItem("dosewell-language")
    if (value === "te-IN" || value === "hi-IN") return value
  } catch {}
  return "en-IN"
}

export default function VoiceCompanion({
  userName = "Jamie",
  scheduledDoses = [],
  onRecordDose,
}: {
  userName?: string
  scheduledDoses: ScheduledDose[]
  onRecordDose: (doseId: string) => void
}) {
  const [language, setLanguage] = useState<Language>(storedLanguage)
  const [response, setResponse] = useState(() =>
    copy[storedLanguage()].greeting(userName),
  )
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState("")
  const [transcript, setTranscript] = useState("")
  const [question, setQuestion] = useState("")
  const [pendingDose, setPendingDose] = useState<ScheduledDose | null>(null)
  const [spokenReminders, setSpokenReminders] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const recognition = useRef<Recognition | null>(null)
  const spoken = useRef(new Set<string>())
  const audioQueue = useRef<string[]>([])
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null)
  const ui = copy[language]

  // Find next pending dose for today
  const next = scheduledDoses.find(
    (dose) => dose.status !== "taken" && dose.status !== "skipped",
  )

  const formatDoseTime = (time: string) => {
    return timeLabel(time)
  }

  useEffect(() => {
    const synthesis = window.speechSynthesis
    const update = () => setVoices(synthesis?.getVoices() || [])
    update()
    synthesis?.addEventListener("voiceschanged", update)
    return () => {
      synthesis?.removeEventListener("voiceschanged", update)
      synthesis?.cancel()
      recognition.current?.abort()
    }
  }, [])

  function stopSpeaking() {
    audioQueue.current = []
    activeUtterance.current = null
    if ("speechSynthesis" in window) window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  function speak(text: string, replace = true): boolean {
    if (!("speechSynthesis" in window)) {
      setError(ui.noSpeech)
      return false
    }
    const available = window.speechSynthesis.getVoices()
    const voice =
      available.find(
        (item) => item.lang.toLowerCase() === language.toLowerCase(),
      ) ||
      available.find((item) =>
        item.lang.toLowerCase().startsWith(language.slice(0, 2)),
      )
    if (!voice && language !== "en-IN") {
      setError(ui.voiceMissing)
      return false
    }
    if (replace) stopSpeaking()
    setError("")
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 0.88
    utterance.pitch = 1
    if (voice) utterance.voice = voice
    activeUtterance.current = utterance
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => {
      setSpeaking(false)
      activeUtterance.current = null
      const queued = audioQueue.current.shift()
      if (queued) speak(queued, false)
    }
    utterance.onerror = (event) => {
      setSpeaking(false)
      if (event.error !== "canceled" && event.error !== "interrupted")
        setError(ui.audioError)
    }
    window.speechSynthesis.speak(utterance)
    return true
  }

  function answer(text: string) {
    setResponse(text)
    speak(text)
  }

  function readNext() {
    setPendingDose(null)
    answer(
      next
        ? ui.next(next, formatDoseTime(next.scheduledTime), userName)
        : scheduledDoses.length
          ? ui.allDone(userName)
          : ui.noDoses,
    )
  }

  function readSchedule() {
    setPendingDose(null)
    answer(
      scheduledDoses.length
        ? `${ui.heading} ${scheduledDoses
            .map((dose) => ui.dose(dose, formatDoseTime(dose.scheduledTime)))
            .join(" ")}`
        : ui.noDoses,
    )
  }

  function requestRecord(dose?: ScheduledDose) {
    if (!dose) {
      answer(ui.identify)
      return
    }
    if (dose.status === "taken") {
      answer(ui.alreadyTaken)
      return
    }
    setPendingDose(dose)
    answer(ui.confirmMessage(dose, formatDoseTime(dose.scheduledTime)))
  }

  function handleRequest(text: string) {
    const normalized = text.toLowerCase().trim()
    if (!normalized) return
    setTranscript(text)
    setQuestion("")
    setPendingDose(null)

    if (/stop|quiet|ఆపు|ఆపండి|रुको|बंद करो/.test(normalized)) {
      stopSpeaking()
      return
    }
    if (
      /missed|forgot|side effect|pain|double|extra|change.*dose|మరిచి|మర్చిపో|దుష్ప్రభావ|నొప్పి|అత్యవసర|छूट|भूल|दुष्प्रभाव|दर्द|आपात/.test(
        normalized,
      )
    ) {
      answer(ui.advice)
      return
    }
    if (/took|taken|తీసుకున్న|తీసుకొన్న|లే ली|ली है|खा ली/.test(normalized)) {
      // Find matching scheduled dose by medicine name
      const matchingDoses = scheduledDoses.filter((dose) =>
        normalized.includes(dose.medicine.name.toLowerCase()),
      )
      // Pick first pending one if found
      const pendingMatch =
        matchingDoses.find((d) => d.status !== "taken") || matchingDoses[0]

      requestRecord(
        pendingMatch ||
          (/next|తదుపరి|అగలి|अगली|अगला/.test(normalized) ? next : undefined),
      )
      return
    }
    if (
      /schedule|routine|all.*medicine|పట్టిక|అన్ని.*మందు|समय|सभी.*दवा|दिनचर्या/.test(
        normalized,
      )
    ) {
      readSchedule()
      return
    }
    if (/next|medicine|తదుపరి|మందు|అగలి|अगली|अगला|दवा/.test(normalized)) {
      readNext()
      return
    }
    answer(ui.fallback)
  }

  function startListening() {
    if (listening) {
      recognition.current?.abort()
      setListening(false)
      return
    }
    stopSpeaking()
    setError("")
    const browser = window as SpeechWindow
    const Constructor =
      browser.SpeechRecognition || browser.webkitSpeechRecognition
    if (!Constructor) {
      setError(ui.noMic)
      return
    }
    const instance = new Constructor()
    recognition.current = instance
    instance.lang = language
    instance.continuous = false
    instance.interimResults = false
    instance.onresult = (event) => {
      setListening(false)
      handleRequest(event.results[0][0].transcript)
    }
    instance.onerror = (event) => {
      setListening(false)
      if (event.error !== "aborted")
        setError(
          event.error === "not-allowed" || event.error === "service-not-allowed"
            ? ui.micDenied
            : ui.micError,
        )
    }
    instance.onend = () => setListening(false)
    try {
      instance.start()
      setListening(true)
    } catch {
      setError(ui.micError)
    }
  }

  function changeLanguage(value: Language) {
    recognition.current?.abort()
    stopSpeaking()
    setListening(false)
    setLanguage(value)
    setResponse(copy[value].greeting(userName))
    setError("")
    setTranscript("")
    setPendingDose(null)
    setSpokenReminders(false)
    try {
      localStorage.setItem("dosewell-language", value)
    } catch {}
  }

  // Spoken reminders check
  useEffect(() => {
    if (!spokenReminders) return
    const interval = setInterval(() => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      const dueDoses = scheduledDoses.filter(
        (dose) =>
          dose.scheduledTime === currentTime &&
          dose.status !== "taken" &&
          dose.status !== "skipped" &&
          !spoken.current.has(dose.doseId),
      )
      if (!dueDoses.length) return

      const text = dueDoses
        .map((dose) =>
          ui.reminder(dose, formatDoseTime(dose.scheduledTime), userName),
        )
        .join(" ")
      dueDoses.forEach((dose) => spoken.current.add(dose.doseId))

      setResponse(text)
      if (listening || window.speechSynthesis?.speaking) {
        audioQueue.current.push(text)
        return
      }
      speak(text, false)
    }, 5000)
    return () => clearInterval(interval)
  }, [spokenReminders, scheduledDoses, language, listening, userName])

  useEffect(() => {
    if (
      listening ||
      !audioQueue.current.length ||
      window.speechSynthesis?.speaking
    )
      return
    const text = audioQueue.current.shift()
    if (text) speak(text, false)
  }, [listening])

  const nativeVoice = voices.some((voice) =>
    voice.lang.toLowerCase().startsWith(language.slice(0, 2)),
  )
  const stateText = listening ? ui.listening : speaking ? ui.speaking : ui.ready

  function submit(event: FormEvent) {
    event.preventDefault()
    handleRequest(question)
  }

  return (
    <section
      aria-labelledby="voice-companion-title"
      className="mb-7 overflow-hidden rounded-2xl border border-[#ccddcf] bg-white shadow-[0_6px_24px_#1d554408]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce7dd] bg-[#edf4ee] px-5 py-4 sm:px-7">
        <div className="flex items-center gap-2 text-base font-semibold text-[#254f3b]">
          <Volume2 size={22} />
          Your voice companion (Veena)
        </div>
        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Choose your assistant language</legend>
          <Globe2 size={18} className="mr-1 text-[#55735b]" />
          {([
            { value: "en-IN", label: "English" },
            { value: "te-IN", label: "తెలుగు" },
            { value: "hi-IN", label: "हिन्दी" },
          ] as const).map((item) => (
            <label
              key={item.value}
              className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-base font-semibold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                language === item.value
                  ? "border-primary bg-primary text-white"
                  : "border-[#c5d4c8] bg-white text-[#365741] hover:bg-[#e5eee5]"
              }`}
            >
              <input
                type="radio"
                name="voice-language"
                value={item.value}
                checked={language === item.value}
                onChange={() => changeLanguage(item.value)}
                className="sr-only"
              />
              {language === item.value && <Check size={16} />}
              <span lang={item.value}>{item.label}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <div
        className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[215px_minmax(0,1fr)]"
        lang={language}
      >
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-[#f5f8f3] px-4 py-6">
          <div
            className={`relative flex h-24 w-24 items-center justify-center rounded-full border-[9px] border-[#e0ebde] bg-[#236047] text-white shadow-[0_0_0_10px_#edf3e9] ${
              listening || speaking ? "motion-safe:animate-pulse" : ""
            }`}
          >
            <Volume2 size={40} strokeWidth={1.5} />
          </div>
          <div
            role="status"
            className="mt-2 text-center text-sm font-medium text-[#506549]"
          >
            {stateText}
          </div>
          <button
            onClick={startListening}
            aria-pressed={listening}
            className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-base font-semibold text-white ${
              listening
                ? "bg-[#935739] hover:bg-[#79452c]"
                : "bg-primary hover:bg-[#286b54]"
            }`}
          >
            {listening ? <MicOff size={21} /> : <Mic size={21} />}
            <span>{listening ? ui.listening : ui.talk}</span>
          </button>
          <span className="text-center text-sm text-[#5e7058]">
            English · తెలుగు · हिन्दी
          </span>
        </div>
        <div className="min-w-0">
          <h2
            id="voice-companion-title"
            className="font-display text-[25px] font-bold leading-relaxed text-[#244835] sm:text-[28px]"
          >
            {ui.title}
          </h2>
          <p className="mt-1 text-base leading-7 text-[#627060]">
            {ui.subtitle}
          </p>
          <div className="mt-4 rounded-xl border border-[#dde7dc] bg-[#f8faf6] p-4">
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-lg leading-[1.8] text-[#35533d]"
            >
              {response}
            </p>
            {transcript && (
              <p className="mt-3 border-t border-[#dde7dc] pt-3 text-sm text-[#66745e]">
                {ui.heard}: “{transcript}”
              </p>
            )}
            <button
              onClick={() => (speaking ? stopSpeaking() : speak(response))}
              className="mt-3 flex min-h-11 items-center gap-2 rounded-lg border border-[#c8d7c6] bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary"
            >
              {speaking ? <Square size={15} /> : <Volume2 size={17} />}
              {speaking ? ui.stop : ui.replay}
            </button>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-base leading-7 text-amber-900"
            >
              {error}
            </p>
          )}
          {pendingDose && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-primary bg-secondary p-4">
              <span className="text-sm font-medium text-[#234b37]">
                Confirm dose for {pendingDose.medicine.name} (
                {pendingDose.medicine.dosage}) at{" "}
                {timeLabel(pendingDose.scheduledTime)}:
              </span>
              <button
                onClick={() => {
                  onRecordDose(pendingDose.doseId)
                  const doseName = pendingDose.medicine.name
                  const doseTime = timeLabel(pendingDose.scheduledTime)
                  setPendingDose(null)
                  answer(ui.recorded(doseName, doseTime))
                }}
                className="flex min-h-12 items-center gap-2 rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white hover:bg-[#286b54]"
              >
                <Check size={19} />
                {ui.confirm}
              </button>
              <button
                onClick={() => {
                  setPendingDose(null)
                  stopSpeaking()
                  setResponse(ui.greeting(userName))
                }}
                className="min-h-12 rounded-lg border border-primary bg-white px-4 py-3 text-base font-medium text-primary hover:bg-muted"
              >
                {ui.cancel}
              </button>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={readNext}
              className="flex min-h-12 items-center gap-2 rounded-lg border border-[#c7d6c8] bg-white px-4 py-3 text-base font-semibold text-primary hover:bg-secondary"
            >
              <Volume2 size={18} />
              {ui.read}
            </button>
            <button
              onClick={readSchedule}
              className="flex min-h-12 items-center gap-2 rounded-lg border border-[#c7d6c8] bg-white px-4 py-3 text-base font-semibold text-primary hover:bg-secondary"
            >
              {ui.schedule}
              <ArrowRight size={17} />
            </button>
          </div>
          <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="voice-question">
              {ui.placeholder}
            </label>
            <input
              id="voice-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={300}
              placeholder={ui.placeholder}
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-[#c7d6c8] bg-white px-3 py-3 text-base placeholder:text-[#67776b]"
            />
            <button
              type="submit"
              disabled={!question.trim()}
              className="min-h-12 rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ui.send}
            </button>
          </form>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#dce7dd] bg-[#f5f8f3] px-5 py-4 sm:px-7">
        <div lang={language} className="max-w-xl">
          <p className="text-base font-semibold text-[#34553e]">
            {ui.reminders}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#60715e]">
            {ui.reminderHelp}
          </p>
        </div>
        <button
          lang={language}
          aria-pressed={spokenReminders}
          onClick={() => {
            if (spokenReminders) {
              setSpokenReminders(false)
              stopSpeaking()
            } else {
              if (speak(ui.greeting(userName))) setSpokenReminders(true)
            }
          }}
          className={`flex min-h-12 items-center gap-2 rounded-lg border px-4 py-3 text-base font-semibold ${
            spokenReminders
              ? "border-primary bg-primary text-white"
              : "border-[#b7cbb9] bg-white text-primary hover:bg-secondary"
          }`}
        >
          <Volume2 size={19} />
          {spokenReminders ? ui.disable : ui.enable}
        </button>
      </div>
      <div
        lang={language}
        className="space-y-1 border-t border-[#dce7dd] px-5 py-3 text-sm leading-6 text-[#61705f] sm:px-7"
      >
        <p className="flex items-start gap-2">
          <ShieldCheck size={17} className="mt-1 shrink-0" />
          {ui.supported}
        </p>
        <p className="pl-6">
          {ui.engine}
          {!nativeVoice && language !== "en-IN" ? ` · ${ui.unavailable}` : ""}
        </p>
      </div>
    </section>
  )
}
