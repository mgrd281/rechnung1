'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Bot, User as UserIcon, Terminal, Play, Pause, AlertTriangle, CheckCircle, Clock, GitBranch, Folder, X, FileCode, CornerLeftUp, Link, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AgentPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Poll for tasks
    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/agent/tasks');
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const sendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() && !textOverride) return;

        const updatedMessages = [...messages, { role: 'user', content: textToSend }];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: textToSend,
                    conversationId
                })
            });
            const data = await res.json();
            if (data.conversationId) setConversationId(data.conversationId);
            if (data.message) {
                // Merge specialized metadata from API if present in 'special' field or in message.metadata
                const msgWithMeta = { 
                    ...data.message, 
                    metadata: data.special || data.message.metadata 
                };
                setMessages([...updatedMessages, msgWithMeta]);
                
                // If it created a task, refresh tasks
                if (data.special?.type === 'TASK_CREATED') {
                    toast.success("Task started! Watch the inspector.");
                    fetchTasks(); 
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // File Manager State
    const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState(".");
    const [files, setFiles] = useState<any[]>([]);
    const [viewingFile, setViewingFile] = useState<{path: string, content: string} | null>(null);

    // Watch for Agent Commands
    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant' && lastMsg.content.includes("[OPEN_FileManager]")) {
                setIsFileManagerOpen(true);
                fetchFiles(".");
            }
            if (lastMsg.role === 'assistant' && lastMsg.content.includes("[OPEN_URL")) {
                const match = lastMsg.content.match(/\[OPEN_URL\s+(.*?)\]/);
                if (match && match[1]) {
                    window.open(match[1], '_blank');
                    toast.success(`Opening ${match[1]}`);
                }
            }
        }
    }, [messages]);

    const fetchFiles = async (pathStr: string) => {
        try {
            const res = await fetch('/api/agent/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'LIST', path: pathStr })
            });
            const data = await res.json();
            if (data.files) {
                setFiles(data.files);
                setCurrentPath(data.cwd);
            }
        } catch (e) {
            toast.error("Failed to load files");
        }
    };

    const loadFileContent = async (pathStr: string) => {
        try {
            const res = await fetch('/api/agent/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'READ', path: pathStr })
            });
            const data = await res.json();
            if (data.content !== undefined) {
                setViewingFile({ path: pathStr, content: data.content });
            }
        } catch (e) {
            toast.error("Failed to read file");
        }
    };

    // Message Parser Component
    const parseMessage = (content: string) => {
        const parts = [];
        const lines = content.split('\n');
        
        let currentText = "";
        
        lines.forEach((line, idx) => {
            if (line.includes('[STEP]')) {
                if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ""; }
                parts.push({ type: 'step', content: line.replace('[STEP]', '').trim() });
            } else if (line.includes('[OPEN_URL')) {
                if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ""; }
                const match = line.match(/\[OPEN_URL\s+(.*?)\]/);
                if (match) parts.push({ type: 'action', action: 'OPEN_URL', value: match[1] });
            } else if (line.includes('[EXEC_CMD]')) {
                 if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ""; }
                 parts.push({ type: 'terminal', content: line.replace('[EXEC_CMD]', '').trim() });
            } else if (line.includes('[OPEN_FileManager]')) {
                 if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ""; }
                 parts.push({ type: 'action', action: 'OPEN_FILE_MANAGER', value: 'File Manager' });
            } else {
                currentText += line + "\n";
            }
        });
        if (currentText) parts.push({ type: 'text', content: currentText });

        return parts.map((part, i) => {
            if (part.type === 'step') {
                return (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 my-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {part.content}
                    </div>
                );
            }
            if (part.type === 'action') {
                return (
                    <div key={i} className="flex items-center gap-3 bg-violet-50 border border-violet-100 p-3 rounded-xl my-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                            {part.action === 'OPEN_URL' ? <Link className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                            <div className="text-xs text-violet-600 font-bold uppercase tracking-wider">{part.action.replace('OPEN_', '')}</div>
                            <div className="text-sm font-medium text-slate-700 truncate">{part.value}</div>
                        </div>
                        {part.action === 'OPEN_URL' && (
                             <a href={part.value} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-violet-100 rounded-lg text-violet-600 transition-colors">
                                 <ExternalLink className="w-4 h-4" />
                             </a>
                        )}
                    </div>
                );
            }
            if (part.type === 'terminal') {
                return (
                    <div key={i} className="my-2 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                        <div className="px-3 py-1 bg-slate-800 flex items-center gap-2">
                            <Terminal className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] text-slate-400 font-mono">EXEC_CMD</span>
                        </div>
                        <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
                            $ {part.content}
                        </pre>
                    </div>
                );
            }
            return <div key={i} className="whitespace-pre-wrap">{part.content}</div>;
        });
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#F7F8FC] relative">
            {/* MODERN AGENT WORKSPACE OVERLAY */}
            {isFileManagerOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-[90vw] h-[85vh] flex flex-col overflow-hidden border border-white/20 ring-1 ring-black/5">
                        
                        {/* Header */}
                        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-slate-800 tracking-tight">Agent Workspace</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-mono text-slate-500">EXECUTION_MODE_ACTIVE</span>
                                        <span className="text-xs text-slate-300">|</span>
                                        <span className="text-xs font-mono text-slate-500">/{currentPath}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" className="hidden md:flex gap-2" onClick={() => fetchFiles(".")}>
                                    <Loader2 className="w-3 h-3" /> Refresh
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100" onClick={() => setIsFileManagerOpen(false)}>
                                    <X className="w-5 h-5 text-slate-400" />
                                </Button>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="flex-1 flex overflow-hidden">
                            
                            {/* LEFT: Context & File Navigation (35%) */}
                            <div className="w-[350px] flex flex-col border-r border-slate-100 bg-slate-50/50">
                                <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Project Files</h3>
                                    {currentPath !== "." && (
                                        <div 
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer text-slate-600 transition-all mb-2"
                                            onClick={() => fetchFiles(currentPath.split('/').slice(0, -1).join('/') || '.')}
                                        >
                                            <CornerLeftUp className="w-4 h-4" />
                                            <span className="text-sm font-medium">Back</span>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                         {files.sort((a,b) => (a.isDirectory === b.isDirectory ? 0 : a.isDirectory ? -1 : 1)).map((file: any) => (
                                            <div 
                                                key={file.path}
                                                className={cn(
                                                    "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all group",
                                                    viewingFile?.path === file.path ? "bg-violet-100 text-violet-700" : "hover:bg-white hover:shadow-sm text-slate-600"
                                                )}
                                                onClick={() => file.isDirectory ? fetchFiles(file.path) : loadFileContent(file.path)}
                                            >
                                                {file.isDirectory ? (
                                                    <Folder className={cn("w-4 h-4", viewingFile?.path === file.path ? "text-violet-500" : "text-amber-400 fill-amber-400")} />
                                                ) : (
                                                    <FileCode className={cn("w-4 h-4", viewingFile?.path === file.path ? "text-violet-500" : "text-slate-400")} />
                                                )}
                                                <span className="text-sm font-medium truncate">{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* CENTER: Work Area / Preview (65%) */}
                            <div className="flex-1 flex flex-col bg-white relative">
                                {viewingFile ? (
                                    <>
                                        <div className="h-10 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/30">
                                            <div className="flex items-center gap-2">
                                                <FileCode className="w-4 h-4 text-violet-500" />
                                                <span className="text-xs font-mono text-slate-600">{viewingFile.path}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400">READ-ONLY MODE</div>
                                        </div>
                                        <ScrollArea className="flex-1 p-0">
                                            <div className="p-4 min-h-full bg-[#1e1e1e] text-slate-300 font-mono text-xs leading-relaxed selection:bg-violet-500/30">
                                                <pre>{viewingFile.content}</pre>
                                            </div>
                                        </ScrollArea>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 bg-slate-50/30">
                                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                            <Bot className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-600">Ready for Instructions</h3>
                                        <p className="max-w-sm text-center mt-2 text-slate-400">Select a file to inspect or use the input below to command the agent to modify this workspace.</p>
                                    </div>
                                )}

                                {/* Quick Command Bar (Floating) */}
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-2 flex items-center gap-2 ring-1 ring-black/5">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <Input 
                                            className="border-0 bg-transparent focus-visible:ring-0 text-sm h-10 shadow-none placeholder:text-slate-400"
                                            placeholder="Ask Agent to edit this file or run a command..."
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                        <Button size="sm" className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md" onClick={sendMessage}>
                                            <Send className="w-4 h-4 mr-2" /> Execute
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT: CHAT AREA (60%) */}
            <div className="flex-1 flex flex-col border-r border-slate-200 bg-white">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Antigravity Agent</h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs text-slate-500 font-medium">Online • 24/7 Runner Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="ghost" size="icon" onClick={() => { setIsFileManagerOpen(true); fetchFiles("."); }} title="Open File Context">
                             <Folder className="w-4 h-4 text-slate-500" />
                         </Button>
                         <Button variant="outline" size="sm" onClick={() => setMessages([])}>
                            Clear Chat
                 </Button>
                    </div>
                </div>
                {/* ... existing chat UI ... */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                            <Bot className="w-16 h-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold text-slate-600">Ready to help</h3>
                            <p className="max-w-md mt-2">I can fix bugs, scaffold features, and run tests. Try commands like:</p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                <Button variant="secondary" size="sm" onClick={() => setInput("/fix existing bug")}>/fix</Button>
                                <Button variant="secondary" size="sm" onClick={() => setInput("/add-feature name")}>/add-feature</Button>
                                <Button variant="secondary" size="sm" onClick={() => setInput("/refactor component")}>/refactor</Button>
                            </div>
                        </div>
                    )}
                    
                    {messages.map((msg, i) => (
                        <div key={i} className={cn("flex gap-3 max-w-3xl", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0", 
                                msg.role === 'user' ? "bg-slate-200" : "bg-violet-600 text-white"
                            )}>
                                {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={cn(
                                "p-4 rounded-2xl text-sm shadow-sm",
                                msg.role === 'user' 
                                    ? "bg-white border border-slate-200 text-slate-800" 
                                    : "bg-white border border-violet-100 text-slate-800 shadow-violet-100"
                            )} dir="auto">
                                {msg.role === 'user' ? msg.content : parseMessage(msg.content)}
                                
                                {/* RENDER CLARIFICATION OPTIONS IF PRESENT */}
                                {msg.role === 'assistant' && msg.metadata?.type === 'CLARIFICATION' && msg.metadata.options && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {msg.metadata.options.map((opt: any, idx: number) => (
                                            <button 
                                                key={idx}
                                                className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg text-xs font-medium transition-colors border border-violet-200"
                                                onClick={() => {
                                                    setInput(opt.value);
                                                    sendMessage(opt.value);
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white border border-violet-100 shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe a task or fix..."
                            className="w-full min-h-[50px] max-h-[150px] p-3 pr-12 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                            dir="auto"
                            rows={1}
                        />
                        <Button 
                            className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg bg-violet-600 hover:bg-violet-700" 
                            onClick={sendMessage}
                            disabled={isLoading || !input.trim()}
                        >
                            <Send className="w-4 h-4 text-white" />
                        </Button>
                    </div>
                    <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <Terminal className="w-3 h-3" />
                             <span>Antigravity Engine v2.0 • PR-Only Mode</span>
                        </div>
                        <button onClick={() => fetch('/api/agent/engine', { method: 'POST' }).then(() => fetchTasks())} className="text-[10px] text-slate-300 hover:text-violet-500 underline">
                            Force Run Queue
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: TASK INSPECTOR (40%) */}
            <div className="w-[400px] border-l border-slate-200 bg-slate-50 flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-violet-600" />
                        Task Inspector
                    </h3>
                    <p className="text-xs text-slate-500">Live execution logs and PR status</p>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {tasks.length === 0 && (
                            <div className="text-center text-slate-400 py-10">
                                <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No active tasks</p>
                            </div>
                        )}

                        {tasks.map(task => (
                            <Card key={task.id} className="overflow-hidden border-slate-200 shadow-none hover:shadow-md transition-shadow">
                                <CardHeader className="p-4 pb-2 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className={cn(
                                            "text-xs font-bold uppercase",
                                            task.status === 'QUEUED' ? "bg-slate-100 text-slate-600 border-slate-200" :
                                            task.status === 'RUNNING' ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse" :
                                            task.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                            "bg-red-50 text-red-700 border-red-200"
                                        )}>
                                            {task.status}
                                        </Badge>
                                        <span className="text-[10px] text-slate-400 font-mono">#{task.id.substring(0,6)}</span>
                                    </div>
                                    <CardTitle className="text-sm font-bold text-slate-800 leading-tight">
                                        {task.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 bg-white">
                                    <div className="space-y-3">
                                        <div className="text-xs text-slate-500 line-clamp-2">
                                            {task.description || "No description provided."}
                                        </div>
                                        
                                        {/* Progress Steps (Mock) */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs">
                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                <span className="text-slate-600 line-through">Draft Plan</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <Clock className="w-3 h-3 text-blue-500" />
                                                <span className="text-slate-800 font-medium">Running Tests...</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs opacity-50">
                                                <GitBranch className="w-3 h-3" />
                                                <span>Create PR</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                            {task.status === 'RUNNING' ? (
                                                <Button variant="destructive" size="sm" className="h-7 text-xs w-full">Cancel</Button>
                                            ) : task.status === 'COMPLETED' ? (
                                                  <Button variant="outline" size="sm" className="h-7 text-xs w-full text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                                                    <GitBranch className="w-3 h-3 mr-1" /> View PR
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" className="h-7 text-xs w-full">Details</Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
