import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Zap, 
  BrainCircuit, 
  School, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  CornerDownLeft, 
  BookOpen, 
  Clock, 
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ChatRole = "advisor" | "cbt-specialist" | "curriculum-analyst" | "school-admin";
export type GeminiModel = "gemini-3.8-flash" | "gemini-3.5-flash" | "gemini-3.1-flash-lite" | "gemini-3.1-pro-preview";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: string;
  fallbackNotice?: string;
}

interface RoleConfig {
  id: ChatRole;
  title: string;
  shortName: string;
  badge: string;
  defaultModel: GeminiModel;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  starterPrompts: string[];
}

const ROLES: RoleConfig[] = [
  {
    id: "advisor",
    title: "Academic Guidance Counselor",
    shortName: "Advisor",
    badge: "General Tasks",
    defaultModel: "gemini-3.5-flash",
    icon: Sparkles,
    description: "Guidance on study habits, exam readiness (JAMB/WAEC), revision schedules, and academic counseling.",
    starterPrompts: [
      "How do I structure a 4-week revision timetable for SS3 examinations?",
      "What are active recall techniques to remember organic chemistry formulas?",
      "Give me study tips to overcome test anxiety before the CBT finals."
    ]
  },
  {
    id: "cbt-specialist",
    title: "CBT & Exam Specialist",
    shortName: "CBT Fast Drill",
    badge: "Fast Tasks",
    defaultModel: "gemini-3.1-flash-lite",
    icon: Zap,
    description: "Rapid practice drills, instant MCQs with answer keys, formula lookups, and test-taking speed tactics.",
    starterPrompts: [
      "Generate 3 practice MCQs on Photosynthesis with answer explanations.",
      "Give me 3 speed tricks for answering 60 JAMB English questions in 45 minutes.",
      "Quick quiz on Newton's Laws of Motion with 4 options per question."
    ]
  },
  {
    id: "curriculum-analyst",
    title: "Curriculum & Pedagogical Analyst",
    shortName: "Curriculum",
    badge: "Complex Tasks",
    defaultModel: "gemini-3.1-pro-preview",
    icon: BrainCircuit,
    description: "Deep cognitive alignment with Bloom's Taxonomy, rubric design, psychometrics, and remedial learning paths.",
    starterPrompts: [
      "Categorize these 5 examination questions according to Bloom's Taxonomy cognitive levels.",
      "Design a continuous assessment grading rubric balancing formative 40% and summative 60%.",
      "Develop a 3-step diagnostic remediation plan for students scoring under 50% in algebra."
    ]
  },
  {
    id: "school-admin",
    title: "School Operations & ERP Assistant",
    shortName: "School Ops",
    badge: "Operations",
    defaultModel: "gemini-3.8-flash",
    icon: School,
    description: "Advice on timetable clash resolution, classroom capacity thresholds, attendance policies, and term setup.",
    starterPrompts: [
      "How can we resolve room conflicts between Senior Secondary science labs?",
      "Best practices for notifying guardians of chronic absenteeism (>10% absences).",
      "Draft a professional notice to parents regarding end-of-term continuous assessment reports."
    ]
  }
];

interface GeminiChatbotProps {
  token?: string;
  initialRole?: ChatRole;
  isWidgetMode?: boolean;
  onCloseWidget?: () => void;
}

export default function GeminiChatbot({ 
  token, 
  initialRole = "advisor",
  isWidgetMode = false,
  onCloseWidget
}: GeminiChatbotProps) {
  const [selectedRole, setSelectedRole] = useState<ChatRole>(initialRole);
  const activeRoleConfig = ROLES.find(r => r.id === selectedRole) || ROLES[0];

  const [selectedModel, setSelectedModel] = useState<GeminiModel>(activeRoleConfig.defaultModel);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`eduos_chat_${initialRole}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to default
      }
    }
    return [
      {
        id: "msg-welcome",
        role: "model",
        text: `Hello! I am your **${activeRoleConfig.title}** powered by Google Gemini. ${activeRoleConfig.description}\n\nHow can I support your educational goals today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: activeRoleConfig.defaultModel,
        roleUsed: activeRoleConfig.id
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`eduos_chat_${selectedRole}`, JSON.stringify(messages));
  }, [messages, selectedRole]);

  // When changing role, update default model
  const handleRoleChange = (newRole: ChatRole) => {
    setSelectedRole(newRole);
    const roleCfg = ROLES.find(r => r.id === newRole) || ROLES[0];
    setSelectedModel(roleCfg.defaultModel);

    // Check if conversation exists for that role
    const saved = localStorage.getItem(`eduos_chat_${newRole}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
        return;
      } catch {
        // Fall back
      }
    }

    setMessages([
      {
        id: `msg-welcome-${newRole}`,
        role: "model",
        text: `Switched to **${roleCfg.title}** (powered by ${roleCfg.defaultModel}). ${roleCfg.description}\n\nAsk me anything or select a starter prompt below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: roleCfg.defaultModel,
        roleUsed: roleCfg.id
      }
    ]);
  };

  const handleClearHistory = () => {
    const roleCfg = activeRoleConfig;
    const initialMsg: ChatMessage = {
      id: `msg-welcome-${roleCfg.id}-${Date.now()}`,
      role: "model",
      text: `Conversation cleared. I am your **${roleCfg.title}**. How can I assist you now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: selectedModel,
      roleUsed: roleCfg.id
    };
    setMessages([initialMsg]);
    localStorage.removeItem(`eduos_chat_${selectedRole}`);
    setErrorMsg(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || loading) return;

    setInputMessage("");
    setErrorMsg(null);

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    // Update messages thread optimistically
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      // Map history for multi-turn server payload
      const payloadHistory = updatedHistory
        .filter(m => m.id !== userMsgId)
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: messageText,
          history: payloadHistory,
          role: selectedRole,
          model: selectedModel
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed || selectedModel,
        roleUsed: data.role || selectedRole,
        fallbackNotice: data.fallbackNotice
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMsg(err.message || "Failed to reach Gemini services. Please try again.");
      
      const errorResponseMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        text: `⚠️ **Communication Notice:** We encountered a network hiccup while querying **${selectedModel}**.\n\n*Error details:* ${err.message || "Request timed out"}\n\nPlease try again or switch to **gemini-3.1-flash-lite** for expedited responses.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: selectedModel,
        roleUsed: selectedRole
      };
      setMessages(prev => [...prev, errorResponseMsg]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simple clean markdown formatter helper
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      // Bold handling
      const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={pIdx} className="italic text-slate-700">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      // Heading 3
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      // Heading 2
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-black text-slate-900 text-base mt-3 mb-1 border-b border-slate-100 pb-1">
            {line.replace("## ", "")}
          </h3>
        );
      }
      // Bullet list item
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <div key={idx} className="flex items-start space-x-2 my-0.5 ml-2">
            <span className="text-indigo-500 font-bold shrink-0">•</span>
            <span className="leading-relaxed">{formattedLine}</span>
          </div>
        );
      }
      // Numbered list item
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start space-x-2 my-0.5 ml-2">
            <span className="font-mono font-bold text-indigo-600 text-xs shrink-0">{numMatch[1]}.</span>
            <span className="leading-relaxed">{formattedLine}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="leading-relaxed my-0.5">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div 
      className={`bg-white flex flex-col ${
        isWidgetMode 
          ? "h-full w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" 
          : "min-h-[750px] border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
      }`}
      id="gemini-chatbot-container"
    >
      {/* 1. Header Bar */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-900/50">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-black text-sm sm:text-base tracking-tight text-white">
                EduOS Gemini Chatbot
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                Multi-Turn
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
              <span>Active Role:</span>
              <strong className="text-slate-200 font-semibold">{activeRoleConfig.title}</strong>
            </p>
          </div>
        </div>

        {/* Model and Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Model Selector Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as GeminiModel)}
              className="bg-transparent text-xs font-mono text-indigo-300 font-bold focus:outline-none cursor-pointer"
              title="Select Gemini Model Tier"
            >
              <option value="gemini-3.8-flash" className="bg-slate-900 text-slate-200">gemini-3.8-flash (Default)</option>
              <option value="gemini-3.5-flash" className="bg-slate-900 text-slate-200">gemini-3.5-flash (General)</option>
              <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-slate-200">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-3.1-pro-preview" className="bg-slate-900 text-slate-200">gemini-3.1-pro-preview (Complex)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {isWidgetMode && onCloseWidget && (
            <button
              type="button"
              onClick={onCloseWidget}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* 2. Role Selector Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Specialized Roles:
        </span>
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => handleRoleChange(role.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-indigo-500"}`} />
              <span>{role.shortName}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-100 text-slate-500"
              }`}>
                {role.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Messages Scrollable Thread */}
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40"
        style={{ minHeight: isWidgetMode ? "360px" : "480px" }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                {/* Sender badge & timestamp */}
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 mb-1 px-1">
                  <span className="font-bold uppercase tracking-wider font-mono">
                    {isUser ? "You" : "Gemini AI"}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.modelUsed && !isUser && (
                    <>
                      <span>•</span>
                      <span className="bg-indigo-50 text-indigo-600 font-mono font-bold px-1.5 py-0.2 rounded border border-indigo-100">
                        {msg.modelUsed}
                      </span>
                    </>
                  )}
                </div>

                {/* Bubble Container */}
                <div 
                  className={`group relative max-w-[90%] sm:max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm shadow-xs ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                  }`}
                >
                  {/* Message body */}
                  <div className={isUser ? "whitespace-pre-wrap leading-relaxed" : "space-y-1"}>
                    {isUser ? msg.text : renderFormattedText(msg.text)}
                  </div>

                  {/* Fallback Notice if triggered */}
                  {msg.fallbackNotice && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-amber-600 font-mono">
                      ℹ️ {msg.fallbackNotice}
                    </div>
                  )}

                  {/* Copy Button for Bot Responses */}
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 text-slate-500"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <div className="flex flex-col items-start animate-fade-in">
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mb-1 px-1">
              <span className="font-bold uppercase tracking-wider font-mono">Gemini AI</span>
              <span>•</span>
              <span className="text-indigo-600 font-mono">Reasoning with {selectedModel}...</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs flex items-center space-x-2 shadow-xs">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: "200ms" }} />
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: "400ms" }} />
              </div>
              <span className="text-xs text-slate-500 font-medium ml-1">Drafting multi-turn answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Starter Prompts */}
      <div className="bg-white border-t border-slate-100 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Suggestions:
        </span>
        {activeRoleConfig.starterPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="text-xs text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 px-3 py-1 rounded-full whitespace-nowrap transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 5. Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {errorMsg && (
          <div className="mb-2 flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end space-x-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask ${activeRoleConfig.shortName} (${selectedModel})... (Press Enter to send)`}
              rows={1}
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl p-3 pr-10 focus:outline-indigo-500 focus:border-indigo-500 resize-none max-h-32 transition-all"
              style={{ minHeight: "44px" }}
            />
            <div className="absolute right-2.5 bottom-2.5 text-[10px] text-slate-400 font-mono hidden sm:block">
              ↵ Enter
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <span>Role: <strong className="text-slate-600">{activeRoleConfig.shortName}</strong></span>
            <span>•</span>
            <span>Model: <strong className="text-indigo-600">{selectedModel}</strong></span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Multi-turn memory: {messages.length} messages</span>
          </div>
        </div>
      </div>
    </div>
  );
}
