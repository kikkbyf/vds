'use client';

import { useState, useEffect } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { Save, ChevronDown, Check } from 'lucide-react';

interface PromptTemplate {
    id: string;
    name: string;
    content: string;
}

export default function PromptManager() {
    const currentPrompt = useStudioStore((state) => state.currentPrompt);
    const setPrompt = useStudioStore((state) => state.setPrompt);

    const [templates, setTemplates] = useState<PromptTemplate[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveName, setSaveName] = useState('');

    useEffect(() => {
        // Initial fetch
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const res = await fetch('/api/prompts');
            if (res.ok) {
                const list = await res.json();
                setTemplates(list);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!saveName.trim()) return;
        setIsSaving(true);
        try {
            await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: saveName, content: currentPrompt })
            });

            setSaveName('');
            setIsOpen(false);
            await loadTemplates(); // Refresh
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        if (!id) return;

        const tmpl = templates.find(t => t.id === id);
        if (tmpl) {
            setPrompt(tmpl.content); // Only updates text!
        }
    };

    return (
        <div className="prompt-manager">
            <div className="row">
                {/* Load Preset */}
                <select className="preset-select" onChange={handleLoad} defaultValue="">
                    <option value="" disabled>Load Preset...</option>
                    {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>

                {/* Save Button */}
                <button
                    className="icon-btn"
                    onClick={() => setIsOpen(!isOpen)}
                    title="Save current prompt as preset"
                >
                    <Save size={14} />
                </button>
            </div>

            {/* Save Popover */}
            {isOpen && (
                <div className="save-popover">
                    <input
                        type="text"
                        placeholder="Preset Name..."
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        autoFocus
                    />
                    <button onClick={handleSave} disabled={!saveName || isSaving}>
                        <Check size={14} />
                    </button>
                </div>
            )}

            <style jsx>{`
                .prompt-manager {
                    margin-bottom: 8px;
                    position: relative;
                }
                .row {
                    display: flex;
                    gap: 8px;
                }
                .preset-select {
                    flex: 1;
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    font-size: 11px;
                    height: 24px;
                    border-radius: 4px;
                    padding: 0 4px;
                }
                .icon-btn {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    border-radius: 4px;
                    cursor: pointer;
                }
                .icon-btn:hover {
                    color: var(--text-primary);
                    border-color: var(--text-secondary);
                }

                .save-popover {
                    position: absolute;
                    top: 28px;
                    right: 0;
                    background: var(--bg-panel);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    padding: 4px;
                    display: flex;
                    gap: 4px;
                    z-index: 10;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .save-popover input {
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                    font-size: 11px;
                    height: 24px;
                    padding: 0 4px;
                    width: 120px;
                }
                .save-popover button {
                    width: 24px;
                    height: 24px;
                    background: var(--accent-blue);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
}
