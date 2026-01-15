'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, FileText, Image as ImageIcon, ChevronRight } from 'lucide-react';

interface LogSession {
    id: string;
    timestamp: string;
}

interface LogDetails {
    id: string;
    timestamp: string;
    prompt: string;
    inputs: string[];
    output: string | null;
}

export default function DebugLogModal({ onClose }: { onClose: () => void }) {
    const [sessions, setSessions] = useState<LogSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [details, setDetails] = useState<LogDetails | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Fetch list on mount
    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setLoadingList(true);
        try {
            const res = await fetch('/api/admin/debug-logs');
            if (res.ok) {
                const list = await res.json();
                setSessions(list);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingList(false);
        }
    };

    // Fetch details when selection changes
    useEffect(() => {
        if (!selectedSessionId) {
            setDetails(null);
            return;
        }

        const loadDetails = async () => {
            setLoadingDetails(true);
            try {
                const res = await fetch(`/api/admin/debug-logs?sessionId=${selectedSessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    setDetails(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingDetails(false);
            }
        };
        loadDetails();
    }, [selectedSessionId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
            <div className="bg-[#1a1a1a] w-full max-w-6xl h-[85vh] rounded-xl border border-white/10 flex overflow-hidden shadow-2xl relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={20} className="text-white/70" />
                </button>

                {/* Sidebar: Session List */}
                <div className="w-80 border-r border-white/10 flex flex-col bg-[#111]">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-semibold text-white/90">Debug Logs</h2>
                        <button onClick={loadSessions} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/60">
                            <RefreshCw size={14} />
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {loadingList ? (
                            <div className="p-4 text-center text-white/40 text-sm">Loading logs...</div>
                        ) : sessions.length === 0 ? (
                            <div className="p-4 text-center text-white/40 text-sm">No logs found</div>
                        ) : (
                            sessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => setSelectedSessionId(session.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-mono transition-colors flex items-center justify-between ${selectedSessionId === session.id
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                                        }`}
                                >
                                    <span>{session.timestamp}</span>
                                    {selectedSessionId === session.id && <ChevronRight size={14} />}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content: Details */}
                <div className="flex-1 flex flex-col bg-[#141414] overflow-hidden">
                    {loadingDetails ? (
                        <div className="flex-1 flex items-center justify-center text-white/40">
                            Loading details...
                        </div>
                    ) : details ? (
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">

                            {/* Header */}
                            <div className="flex items-baseline gap-2 pb-4 border-b border-white/10">
                                <span className="text-white/40 text-xs font-mono">SESSION ID</span>
                                <span className="text-white/90 font-mono text-sm select-all">{details.id}</span>
                            </div>

                            {/* Prompt Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                                    <FileText size={16} className="text-blue-400" />
                                    Prompt
                                </div>
                                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/5 text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                    {details.prompt}
                                </div>
                            </div>

                            {/* Images Grid */}
                            <div className="grid grid-cols-2 gap-8">
                                {/* Inputs */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                                        <ImageIcon size={16} className="text-purple-400" />
                                        Inputs ({details.inputs.length})
                                    </div>
                                    <div className="space-y-4">
                                        {details.inputs.map((src, i) => (
                                            <div key={i} className="group relative bg-[#0a0a0a] rounded-lg border border-white/5 overflow-hidden aspect-square flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={src} alt={`Input ${i}`} className="max-w-full max-h-full object-contain" />
                                                <span className="absolute bottom-2 left-2 bg-black/60 text-white/70 text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                                                    Input #{i + 1}
                                                </span>
                                            </div>
                                        ))}
                                        {details.inputs.length === 0 && (
                                            <div className="text-white/20 text-xs italic p-4 border border-dashed border-white/10 rounded">
                                                No input images
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Output */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                                        <ImageIcon size={16} className="text-green-400" />
                                        Gemini Output
                                    </div>
                                    <div className="bg-[#0a0a0a] rounded-lg border border-white/5 overflow-hidden aspect-square flex items-center justify-center relative">
                                        {details.output ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={details.output} alt="Output" className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <span className="text-white/20 text-sm">No output generated</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/30 gap-4">
                            <FileText size={48} strokeWidth={1} />
                            <p>Select a log session to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
