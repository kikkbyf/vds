'use client';

import React from 'react';
import { useStudioStore, TaskItem } from '@/store/useStudioStore';
import { motion, AnimatePresence } from 'framer-motion';

const StatusBadge = ({ status }: { status: string }) => {
    let color = 'bg-gray-500';
    if (status === 'PENDING') color = 'bg-yellow-500';
    if (status === 'PROCESSING') color = 'bg-blue-500/80 animate-pulse';
    if (status === 'COMPLETED') color = 'bg-green-500';
    if (status === 'FAILED') color = 'bg-red-500';
    if (status === 'CANCELLED') color = 'bg-gray-400';

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold text-white ${color}`}>
            {status}
        </span>
    );
};

export const GlobalTaskQueue = () => {
    const { activeTasks, removeActiveTask, cancelTask, setGeneratedImage, viewMode, setViewMode } = useStudioStore();
    const [isExpanded, setIsExpanded] = React.useState(true);

    if (activeTasks.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-80 font-sans">
            <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-2 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs font-semibold text-white/90">
                            Process Queue ({activeTasks.length})
                        </span>
                    </div>
                    <button className="text-white/50 hover:text-white">
                        {isExpanded ? '▼' : '▲'}
                    </button>
                </div>

                {/* List */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="max-h-[300px] overflow-y-auto custom-scrollbar"
                        >
                            <div className="p-2 space-y-2">
                                {activeTasks.map((task) => (
                                    <TaskItemRow
                                        key={task.id}
                                        task={task}
                                        onCancel={() => cancelTask(task.id)}
                                        onDismiss={() => removeActiveTask(task.id)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const TaskItemRow = ({ task, onCancel, onDismiss }: { task: TaskItem, onCancel: () => void, onDismiss: () => void }) => {
    const isTerminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.status);

    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            layout
            className="group relative bg-white/5 rounded p-3 border border-white/5 hover:border-white/20 transition-all"
        >
            <div className="flex justify-between items-start mb-2">
                <StatusBadge status={task.status} />
                <button
                    onClick={isTerminal ? onDismiss : onCancel}
                    className="text-xs text-white/40 hover:text-red-400 transition-colors"
                >
                    {isTerminal ? '✕' : 'Cancel'}
                </button>
            </div>

            <div className="text-xs text-white/80 line-clamp-2 mb-2 font-mono" title={task.prompt}>
                {task.prompt || "Start New Generation"}
            </div>

            {/* Progress Bar or Message */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-white/50">
                    <span>{task.message}</span>
                    <span>{task.progress}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${task.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                    />
                </div>
            </div>

            {/* Context Actions for Completed */}
            {task.status === 'COMPLETED' && (
                <div className="mt-2 pt-2 border-t border-white/10 flex justify-end">
                    <button
                        onClick={onDismiss}
                        className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded"
                    >
                        Clear
                    </button>
                </div>
            )}
        </motion.div>
    );
};
