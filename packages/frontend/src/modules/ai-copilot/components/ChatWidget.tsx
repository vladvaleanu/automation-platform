/**
 * ChatWidget Component
 * Forge AI chat interface with message stream and input
 */

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ForgeStatus, Incident } from '../types';
import { forgeApi } from '../api';
import {
    PaperAirplaneIcon,
    SparklesIcon,
    ArrowPathIcon,
    Cog6ToothIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

interface ChatWidgetProps {
    contextIncident?: Incident | null;
    onOpenSettings?: () => void;
}

// Mock initial messages
const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: '1',
        role: 'system',
        content: 'Forge initialized. Ready to assist with infrastructure analysis.',
        timestamp: new Date(Date.now() - 60000),
    },
    {
        id: '2',
        role: 'forge',
        content: `**Welcome, Operator.**

I'm Forge, your local infrastructure advisor. I'm currently monitoring your datacenter systems and can help you:

- 🔍 **Analyze incidents** from the Situation Deck
- 📋 **Consult SOPs** for standard procedures
- ⚡ **Correlate alerts** across power, cooling, and network

Type a message or select an incident above to begin. Use \`/help\` for available commands.`,
        timestamp: new Date(Date.now() - 55000),
    },
];

export function ChatWidget({ contextIncident, onOpenSettings }: ChatWidgetProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [status] = useState<ForgeStatus>({
        connected: true,
        model: 'Llama 3.1 (Ollama)',
        contextFocus: contextIncident?.title || null,
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Add context message when incident changes
    useEffect(() => {
        if (contextIncident) {
            const contextMsg: ChatMessage = {
                id: `ctx-${Date.now()}`,
                role: 'system',
                content: `Context switched to: **${contextIncident.title}**`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, contextMsg]);

            // Simulate Forge analyzing the incident
            setIsTyping(true);
            setTimeout(() => {
                const analysisMsg: ChatMessage = {
                    id: `analysis-${Date.now()}`,
                    role: 'forge',
                    content: `I've loaded the context for **${contextIncident.title}**.

**Quick Analysis:**
- Severity: ${contextIncident.severity.toUpperCase()}
- Impact: ${contextIncident.impact}
- ${contextIncident.alertCount} related alerts detected

Would you like me to:
1. Run a root cause analysis
2. Check related SOPs
3. Show correlation with historical incidents`,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, analysisMsg]);
                setIsTyping(false);
            }, 1500);
        }
    }, [contextIncident]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userInput = input;

        // Add user message
        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userInput,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Call real Ollama API
        setIsTyping(true);
        try {
            const response = await forgeApi.chat(userInput, contextIncident?.title);

            const forgeMsg: ChatMessage = {
                id: `forge-${Date.now()}`,
                role: 'forge',
                content: response.response || 'I apologize, I could not generate a response.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, forgeMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'system',
                content: '⚠️ Unable to reach Forge. Please check that Ollama is running.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClear = () => {
        setMessages(INITIAL_MESSAGES);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Forge Avatar */}
                        <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                <SparklesIcon className="h-4 w-4 text-white" />
                            </div>
                            {/* Connection indicator */}
                            <div
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${status.connected ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                            />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Forge Workspace
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {status.connected ? status.model : 'Disconnected'}
                            </p>
                        </div>
                    </div>

                    {/* Context & Actions */}
                    <div className="flex items-center gap-2">
                        {status.contextFocus && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-md">
                                Viewing: {status.contextFocus}
                            </span>
                        )}

                        <button
                            onClick={handleClear}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Clear chat"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>

                        <button
                            onClick={onOpenSettings}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Settings"
                        >
                            <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Forge is thinking...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Forge... (try /help)"
                        className="flex-1 px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                        <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Message bubble component
function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
        return (
            <div className="flex justify-center">
                <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                    {message.content}
                </span>
            </div>
        );
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`
          max-w-[80%] px-4 py-3 rounded-2xl
          ${isUser
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'}
        `}
            >
                {/* Simple markdown-like rendering */}
                <div
                    className={`text-sm prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'
                        }`}
                    dangerouslySetInnerHTML={{
                        __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">$1</code>')
                            .replace(/\n/g, '<br />'),
                    }}
                />
                <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
}
