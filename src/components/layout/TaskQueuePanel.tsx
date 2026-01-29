'use client';

import React from 'react';
import { useStudioStore, TaskItem } from '@/store/useStudioStore';
import { motion, AnimatePresence } from 'framer-motion';

const StatusBadge = ({ status }: { status: string }) => {
    let color = 'bg-zinc-600';
    if (status === 'PENDING') color = 'bg-yellow-600';
    if (status === 'PROCESSING') color = 'bg-blue-600 animate-pulse';
    if (status === 'COMPLETED') color = 'bg-emerald-600';
    if (status === 'FAILED') color = 'bg-red-600';
    if (status === 'CANCELLED') color = 'bg-zinc-500';
    if (status === 'RETRYING') color = 'bg-orange-600 animate-pulse';

    return (
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold text-white tracking-wider ${color}`}>
            {status}
        </span>
    );
};

export const TaskQueuePanel = () => {
    const { activeTasks, removeActiveTask, cancelTask } = useStudioStore();

    if (activeTasks.length === 0) {
        return (
            <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 10, fontStyle: 'italic' }}>
                暂无任务
            </div>
        );
    }

    return (
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-1.5 space-y-1.5 bg-transparent">
            <AnimatePresence initial={false}>
                {activeTasks.map((task) => (
                    <TaskItemRow
                        key={task.id}
                        task={task}
                        onCancel={() => cancelTask(task.id)}
                        onDismiss={() => removeActiveTask(task.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

const TaskItemRow = ({ task, onCancel, onDismiss }: { task: TaskItem, onCancel: () => void, onDismiss: () => void }) => {
    const isTerminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.status);
    const isRetrying = task.message?.toLowerCase().includes('retry') || task.message?.toLowerCase().includes('limit');

    // Determine status for badge
    const visualStatus = isRetrying ? 'RETRYING' : task.status;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{
                background: isRetrying ? 'rgba(154, 52, 18, 0.2)' : 'var(--bg-panel)',
                border: `1px solid ${isRetrying ? 'rgba(249, 115, 22, 0.3)' : 'var(--border-color)'}`,
                borderRadius: 6,
                padding: 8,
                transition: 'all 0.2s'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                <StatusBadge status={visualStatus} />
                <button
                    onClick={isTerminal ? onDismiss : onCancel}
                    style={{
                        fontSize: 9,
                        color: 'var(--text-muted)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'var(--control-bg)',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {isTerminal ? 'Clear' : (isRetrying ? 'Skip' : 'Cancel')}
                </button>
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }} title={task.prompt}>
                {task.type === 'persona' ? 'Persona' : task.type === 'faceswap' ? 'Face Swap' : (task.prompt?.slice(0, 20) || "Task")}
            </div>

            {/* Progress Bar Area */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140, color: isRetrying ? '#f97316' : undefined }}>
                        {isRetrying && "⚠️ "}{task.message || "Initializing..."}
                    </span>
                    <span>{Math.round(task.progress)}%</span>
                </div>

                <div style={{ height: 3, background: 'var(--border-color)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                        style={{
                            height: '100%',
                            background: task.status === 'FAILED' ? '#ef4444' :
                                isRetrying ? '#f97316' :
                                    task.status === 'COMPLETED' ? 'var(--accent-green)' : 'var(--accent-blue)'
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    />
                </div>
            </div>
        </motion.div>
    );
};
