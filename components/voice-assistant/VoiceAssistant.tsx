'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, X, Loader2, Volume2, VolumeX, MicOff, Settings2, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/components/ui/use-toast';
import { Badge } from "@/components/ui/badge";

export function VoiceAssistant() {
    const { showToast } = useToast();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'>('IDLE');
    const [transcript, setTranscript] = useState('');
    const [reply, setReply] = useState('');

    // --- NEW STATE: SETTINGS ---
    const [isMuted, setIsMuted] = useState(false);
    const [isListeningEnabled, setIsListeningEnabled] = useState(true);
    const [mode, setMode] = useState<'auto' | 'push_to_talk'>('push_to_talk'); // Default to PTT

    // Refs for safe access in closures
    const transcriptRef = useRef('');
    const activeRef = useRef(false);
    const processingRef = useRef(false);

    // Refs for recognition instances
    const recognitionRef = useRef<any>(null);
    const wakeWordRef = useRef<any>(null);

    // --- PERSISTENCE ---
    useEffect(() => {
        const loadSettings = () => {
            try {
                const savedMute = localStorage.getItem('voice_sound_enabled');
                const savedMic = localStorage.getItem('voice_listening_enabled');
                const savedMode = localStorage.getItem('voice_mode');

                if (savedMute !== null) setIsMuted(savedMute === 'false'); // Saved as "enabled" -> "true"
                if (savedMic !== null) setIsListeningEnabled(savedMic === 'true');
                if (savedMode !== null) setMode(savedMode as 'auto' | 'push_to_talk');
            } catch (e) { console.error("Error loading voice settings", e); }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        localStorage.setItem('voice_sound_enabled', String(!isMuted));
    }, [isMuted]);

    useEffect(() => {
        localStorage.setItem('voice_listening_enabled', String(isListeningEnabled));
    }, [isListeningEnabled]);

    useEffect(() => {
        localStorage.setItem('voice_mode', mode);
    }, [mode]);


    // --- WAKE WORD LOGIC (HYBRID) ---
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        // Clean up old instance
        if (wakeWordRef.current) {
            wakeWordRef.current.stop();
            wakeWordRef.current = null;
        }

        // Only enable wake word if:
        // 1. Mic is globally enabled
        // 2. We are in "auto" mode (not push-to-talk)
        if (!isListeningEnabled || mode !== 'auto') return;

        console.log("Initializing Wake Word Listener...");

        const wakeWordRecognition = new SpeechRecognition();
        wakeWordRecognition.lang = 'en-US';
        wakeWordRecognition.continuous = true;
        wakeWordRecognition.interimResults = true;

        wakeWordRecognition.onresult = (event: any) => {
            if (activeRef.current) return;

            const current = event.resultIndex;
            const text = event.results[current][0].transcript.toLowerCase();
            // console.log("Wake Word Stream:", text);

            const normalizedText = text.replace(/[^a-zA-Z\s]/g, "");

            // Check for wake words
            if (normalizedText.includes('kari') || normalizedText.includes('nex')) {
                wakeWordRecognition.stop();

                // Check for tail command
                const lowerText = text.toLowerCase();
                let commandTail = "";
                // Simple heuristics for demo
                if (lowerText.includes("siri")) commandTail = lowerText.split("siri")[1]?.trim();
                else if (lowerText.includes("kari")) commandTail = lowerText.split("kari")[1]?.trim();

                if (commandTail && commandTail.length > 2) {
                    console.log("Hybrid Command Detected:", commandTail);
                    setIsOpen(true);
                    setTranscript(commandTail);
                    processCommand(commandTail);
                } else {
                    startListening();
                }
            }
        };

        wakeWordRecognition.onend = () => {
            // Auto restart if appropriate
            if (!activeRef.current && isListeningEnabled && mode === 'auto') {
                try { wakeWordRecognition.start(); } catch (e) { /* ignore */ }
            }
        };

        wakeWordRef.current = wakeWordRecognition;
        try { wakeWordRecognition.start(); } catch (e) { /* ignore */ }

        return () => {
            if (wakeWordRef.current) wakeWordRef.current.stop();
        };
    }, [isListeningEnabled, mode]);

    // Handle Mic conflict between Wake Word and Main Recognition
    useEffect(() => {
        if (isOpen) {
            if (wakeWordRef.current) wakeWordRef.current.stop();
        } else {
            // Debounce wake word restart
            setTimeout(() => {
                if (wakeWordRef.current && !activeRef.current && isListeningEnabled && mode === 'auto') {
                    try { wakeWordRef.current.start(); } catch (e) { }
                }
            }, 500);
        }
    }, [isOpen, isListeningEnabled, mode]);


    // Safety: Reset processing if stuck
    useEffect(() => {
        if (status === 'PROCESSING') {
            processingRef.current = true;
            const timeout = setTimeout(() => {
                if (processingRef.current) {
                    console.warn("Safety Reset: Stuck in PROCESSING");
                    setStatus('IDLE');
                    setReply("Zeitüberschreitung.");
                    processingRef.current = false;
                }
            }, 10000);
            return () => clearTimeout(timeout);
        } else {
            processingRef.current = false;
        }
    }, [status]);


    // --- MAIN COMMAND LOGIC ---

    const handleFloatingButtonClick = () => {
        if (!isOpen) {
            // OPEN
            setIsOpen(true);
            if (isListeningEnabled) {
                // Only start listening if enabled AND we want immediate start.
                // For PTT, we might want to wait for a specific "Tap to Talk" inside the panel?
                // User Requirement: "Button tap opens panel but does not start recording" (If mic disabled)
                // "Push-to-talk: Recording starts only when user presses mic"

                // Let's adopt this behavior:
                // 1. Open Panel.
                // 2. If 'auto' mode -> Start Listening.
                // 3. If 'push_to_talk' mode -> Just open, wait for user to tap the inner big mic.

                if (mode === 'auto') {
                    startListening();
                }
            }
        } else {
            // ALREADY OPEN
            // If PTT, maybe toggle?
            if (status === 'LISTENING') {
                stopListening();
            } else if (isListeningEnabled && mode === 'push_to_talk') {
                startListening();
            } else {
                // Maybe close?
                setIsOpen(false);
            }
        }
    };

    const startListening = () => {
        if (!isListeningEnabled) {
            setReply("Mikrofon ist deaktiviert.");
            return;
        }

        setIsOpen(true);
        setStatus('LISTENING');
        setTranscript('');
        setReply('');
        transcriptRef.current = '';
        activeRef.current = true;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setReply('Browser nicht unterstützt / Browser not supported.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = navigator.language || 'de-DE';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcriptText = event.results[current][0].transcript;
            setTranscript(transcriptText);
            transcriptRef.current = transcriptText;
        };

        recognition.onend = () => {
            const finalTranscript = transcriptRef.current;
            if (activeRef.current && finalTranscript.length > 1) {
                processCommand(finalTranscript);
            } else {
                if (status === 'LISTENING') {
                    setStatus('IDLE');
                    activeRef.current = false;
                }
            }
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
        } catch (e) {
            console.error("Failed to start recognition", e);
            setStatus('IDLE');
            activeRef.current = false;
        }
    };

    const stopListening = () => {
        activeRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (status === 'LISTENING') setStatus('IDLE');
    };

    const processCommand = async (text: string) => {
        setStatus('PROCESSING');
        activeRef.current = false;

        console.log("Sending command:", text);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await res.json();

            // Handle Navigation
            if (data.intent === 'NAVIGATE' && data.payload?.route) {
                router.push(data.payload.route);
                setIsOpen(false); // Close on nav
                stopListening();
                return;
            }

            // Reply Handling
            if (data.reply) {
                setReply(data.reply);

                // Only auto-listen again if in AUTO mode AND intent is conversational
                const shouldAutoListen = mode === 'auto' && (data.intent === 'CHAT' || data.intent === 'Q_AND_A');

                speak(data.reply, data.language, shouldAutoListen);
            } else {
                setStatus('IDLE');
            }

            // Handle Actions
            if (data.intent === 'ACTION') {
                if (data.command === 'SEND_INVOICE') showToast(`E-Mail gesendet an ${data.payload.recipient}`, "success");
                // ... other actions ...
            }

        } catch (e) {
            console.error("Voice Assistant Error:", e);
            setReply('Fehler beim Verarbeiten.');
            speak('Es ist ein Fehler aufgetreten.', 'de');
            setStatus('IDLE');
        }
    };

    const speak = (text: string, lang: string = 'de', shouldListenAfter: boolean = false) => {
        // MUTE CHECK
        if (isMuted) {
            setStatus('IDLE');
            // Even if muted, if logic requires auto-listen, we should probably still do it? 
            // Or maybe not? For now, if muted, we stop the chain.
            // But if it's "Conversation", user might want to reply.
            // Let's decide: If muted, we don't speak, but if shouldListenAfter is true, we simply transition to listening?
            // Actually, without audio prompt, it's confusing. Let's just stop.
            return;
        }

        setStatus('SPEAKING');
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Voice selection logic (simplified)
        const voices = window.speechSynthesis.getVoices();
        const targetLang = lang === 'ar' ? 'ar' : 'de';
        const preferredVoice = voices.find(v => v.lang.startsWith(targetLang));
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.lang = lang === 'ar' ? 'ar-SA' : 'de-DE';

        utterance.onend = () => {
            if (shouldListenAfter && isListeningEnabled) {
                startListening();
            } else {
                setStatus('IDLE');
            }
        };
        utterance.onerror = () => setStatus('IDLE');

        window.speechSynthesis.speak(utterance);
    };

    // --- RENDER ---

    return (
        <>
            {/* Floating Button */}
            <Button
                onClick={handleFloatingButtonClick}
                className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 flex items-center justify-center transition-all hover:scale-105 animate-in slide-in-from-bottom-10 fade-in duration-700
                    ${(!isListeningEnabled || isMuted)
                        ? 'bg-gray-200 hover:bg-gray-300 hover:ring-4 hover:ring-black/5'
                        : 'bg-[#0B0D12] hover:bg-black hover:ring-4 hover:ring-black/10'}
                `}
                title={!isListeningEnabled ? "Mikrofon aus" : isMuted ? "Ton aus" : "Assistant"}
            >
                <Mic className={`h-6 w-6 ${(!isListeningEnabled || isMuted) ? 'text-gray-500' : 'text-white'}`} />
            </Button>

            {/* Panel */}
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    stopListening();
                    window.speechSynthesis.cancel(); // Stop talking on close
                }
            }}>
                <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-violet-100 p-6 shadow-2xl rounded-3xl">
                    <div className="flex flex-col items-center gap-6 text-center">

                        {/* Settings Header (Mini) */}
                        <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase text-slate-400">Settings</span>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Mute Toggle */}
                                <div className="flex items-center gap-2" title="Ton Ein/Aus">
                                    {isMuted ? <VolumeX className="h-4 w-4 text-amber-500" /> : <Volume2 className="h-4 w-4 text-slate-400" />}
                                    <Switch
                                        checked={!isMuted}
                                        onCheckedChange={(c) => setIsMuted(!c)}
                                        className="scale-75"
                                    />
                                </div>
                                {/* Mic Toggle */}
                                <div className="flex items-center gap-2" title="Mikrofon Ein/Aus">
                                    {!isListeningEnabled ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4 text-slate-400" />}
                                    <Switch
                                        checked={isListeningEnabled}
                                        onCheckedChange={setIsListeningEnabled}
                                        className="scale-75"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mode Selector */}
                        {isListeningEnabled && (
                            <div className="flex gap-2">
                                <Badge
                                    variant={mode === 'push_to_talk' ? 'default' : 'outline'}
                                    className={`cursor-pointer ${mode === 'push_to_talk' ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200' : 'text-slate-500'}`}
                                    onClick={() => setMode('push_to_talk')}
                                >
                                    Push-to-Talk
                                </Badge>
                                <Badge
                                    variant={mode === 'auto' ? 'default' : 'outline'}
                                    className={`cursor-pointer ${mode === 'auto' ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200' : 'text-slate-500'}`}
                                    onClick={() => setMode('auto')}
                                >
                                    Always-On (Auto)
                                </Badge>
                            </div>
                        )}

                        {/* Dynamic Status Icon (Big Mic) */}
                        <button
                            disabled={!isListeningEnabled}
                            onClick={() => {
                                if (status === 'LISTENING') stopListening();
                                else startListening();
                            }}
                            className={`
                                h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm
                                ${!isListeningEnabled ? 'bg-slate-100 opacity-50 cursor-not-allowed' :
                                    status === 'LISTENING' ? 'bg-red-50 ring-4 ring-red-100 scale-110 cursor-pointer' :
                                        status === 'PROCESSING' ? 'bg-violet-50 animate-pulse cursor-wait' :
                                            status === 'SPEAKING' ? 'bg-blue-50 ring-4 ring-blue-100' :
                                                'bg-slate-50 hover:bg-violet-50 cursor-pointer hover:scale-105 active:scale-95'}
                            `}
                        >
                            {status === 'LISTENING' ? <Mic className="h-10 w-10 text-red-500 animate-pulse" /> :
                                status === 'PROCESSING' ? <Loader2 className="h-10 w-10 text-violet-500 animate-spin" /> :
                                    status === 'SPEAKING' ? <Volume2 className="h-10 w-10 text-blue-500 animate-bounce" /> :
                                        !isListeningEnabled ? <MicOff className="h-10 w-10 text-slate-300" /> :
                                            <Mic className="h-10 w-10 text-slate-400" />}
                        </button>

                        {/* Text Output */}
                        <div className="space-y-4 w-full min-h-[80px] flex flex-col justify-center">
                            {!isListeningEnabled ? (
                                <p className="text-sm text-slate-400 font-medium">Mikrofon ist deaktiviert</p>
                            ) : status === 'LISTENING' ? (
                                <p className="text-xl font-medium text-slate-700 animate-pulse">{transcript || "Ich höre zu..."}</p>
                            ) : (
                                <p className="text-base font-medium text-violet-700 leading-relaxed">{reply || (mode === 'push_to_talk' ? "Tippen zum Sprechen" : "Sag 'Kari' ...")}</p>
                            )}
                        </div>

                        {/* Close Button */}
                        <Button variant="ghost" className="rounded-full h-10 w-10 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100" onClick={() => setIsOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
