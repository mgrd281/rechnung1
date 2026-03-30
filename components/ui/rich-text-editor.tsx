'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, List, Link as LinkIcon, Type, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Heading1, Heading2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Initialize and sync content
    useEffect(() => {
        if (contentRef.current) {
            // Ensure consistent paragraph separator
            document.execCommand('defaultParagraphSeparator', false, 'p');

            // Only update if content is different to avoid cursor jumping
            if (contentRef.current.innerHTML !== value) {
                contentRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (contentRef.current) {
            const html = contentRef.current.innerHTML;
            if (html !== value) {
                onChange(html);
            }
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (contentRef.current) {
            contentRef.current.focus();
        }
        handleInput();
    };

    const addLink = () => {
        const url = prompt('URL eingeben:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const html = e.clipboardData.getData('text/html');

        if (html) {
            // Clean HTML to remove styles but keep structure
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Remove all style/class/etc attributes from ALL elements
            doc.querySelectorAll('*').forEach(el => {
                el.removeAttribute('style');
                el.removeAttribute('class');
                el.removeAttribute('face');
                el.removeAttribute('size');
                el.removeAttribute('color');
                el.removeAttribute('align');
                el.removeAttribute('bgcolor');
            });

            // Unwrap <font> and <pre> tags, keep <span> as they might be structural
            ['font', 'pre'].forEach(tagName => {
                doc.querySelectorAll(tagName).forEach(el => {
                    const parent = el.parentNode;
                    if (parent) {
                        while (el.firstChild) parent.insertBefore(el.firstChild, el);
                        parent.removeChild(el);
                    }
                });
            });

            // Get the cleaned HTML
            const cleanHtml = doc.body.innerHTML;
            document.execCommand('insertHTML', false, cleanHtml);
        } else {
            // Fallback to plain text
            document.execCommand('insertText', false, text);
        }
        handleInput();
    };

    return (
        <div className={cn("relative border border-gray-200 rounded-md overflow-hidden bg-white flex flex-col", className, isFocused && "ring-2 ring-blue-500 border-transparent")}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50 flex-wrap">
                {/* Style Selector */}
                <select
                    onChange={(e) => execCommand('formatBlock', e.target.value)}
                    className="h-7 border border-gray-300 rounded text-xs bg-white px-2 mr-2 focus:outline-none focus:border-blue-500"
                    defaultValue="p"
                >
                    <option value="p">Standard</option>
                    <option value="h3">Überschrift groß</option>
                    <option value="h4">Überschrift klein</option>
                </select>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                <ToolbarButton onClick={() => execCommand('bold')} icon={<Bold className="w-4 h-4" />} title="Fett (Ctrl+B)" />
                <ToolbarButton onClick={() => execCommand('italic')} icon={<Italic className="w-4 h-4" />} title="Kursiv (Ctrl+I)" />

                <div className="w-px h-4 bg-gray-300 mx-1" />

                <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={<List className="w-4 h-4" />} title="Liste" />
                <ToolbarButton onClick={addLink} icon={<LinkIcon className="w-4 h-4" />} title="Link einfügen" />

                <div className="w-px h-4 bg-gray-300 mx-1" />

                <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={<AlignLeft className="w-4 h-4" />} title="Links" />
                <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={<AlignCenter className="w-4 h-4" />} title="Zentriert" />
                <ToolbarButton onClick={() => execCommand('justifyRight')} icon={<AlignRight className="w-4 h-4" />} title="Rechts" />
            </div>

            {/* Editor Area */}
            <div
                ref={contentRef}
                className="flex-1 p-4 min-h-[300px] outline-none prose max-w-none text-sm font-sans leading-relaxed text-gray-800 break-words whitespace-pre-wrap [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h4]:text-base [&>h4]:font-semibold [&>h4]:mb-1 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3"
                contentEditable
                onInput={handleInput}
                onPaste={handlePaste}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                suppressContentEditableWarning={true}
            />
            {/* Placeholder overlay */}
            {(!value || value === '<p><br></p>') && !isFocused && (
                <div className="absolute top-[50px] left-4 text-gray-400 pointer-events-none text-sm">
                    {placeholder || 'Nachricht hier schreiben...'}
                </div>
            )}
        </div>
    );
}

function ToolbarButton({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title={title}
        >
            {icon}
        </button>
    );
}
