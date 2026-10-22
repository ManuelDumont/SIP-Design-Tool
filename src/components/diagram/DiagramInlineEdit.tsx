import React, { useState, useRef, useEffect } from 'react';

export interface DiagramInlineEditProps {
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
  className?: string;
  inputClassName?: string;
  isIp?: boolean;
  title?: string;
}

export function DiagramInlineEdit({
  value,
  placeholder = 'Klik om in te voeren',
  onSave,
  className = '',
  inputClassName = '',
  isIp = false,
  title = 'Klik om direct aan te passen'
}: DiagramInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      onSave(currentVal.trim());
    } else if (e.key === 'Escape') {
      setCurrentVal(value);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onSave(currentVal.trim());
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={currentVal}
        onChange={(e) => setCurrentVal(e.target.value.replace(/[\r\n]+/g, ' '))}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`px-1.5 py-0.5 rounded border border-blue-500 bg-white text-slate-900 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 z-[100] relative pointer-events-auto font-mono text-xs whitespace-nowrap leading-none ${inputClassName}`}
        style={{ minWidth: isIp ? '125px' : '90px' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );
  }

  const cleanVal = (value || '').replace(/[\r\n]+/g, ' ').trim();
  const displayVal = cleanVal || placeholder;
  const isPlaceholder = !cleanVal;

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title={title}
      className={`cursor-pointer transition-all duration-150 rounded px-1 -mx-0.5 hover:bg-blue-50/80 hover:text-blue-900 hover:ring-1 hover:ring-blue-400 relative z-30 group/edit pointer-events-auto whitespace-nowrap inline-flex items-center leading-none ${isPlaceholder ? 'opacity-50 italic' : ''} ${className}`}
    >
      <span className="whitespace-nowrap leading-none">{displayVal}</span>
      <span className="inline-block opacity-0 group-hover/edit:opacity-100 transition-opacity ml-1 text-blue-500 text-[10px] shrink-0 leading-none">
        ✎
      </span>
    </span>
  );
}
