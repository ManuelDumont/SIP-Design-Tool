import React, { useState, useRef, useEffect } from 'react';

export interface BuilderInlineEditProps {
  value: string;
  placeholder: string;
  onSave: (val: string) => void;
  className?: string;
  inputClassName?: string;
  title?: string;
  isIp?: boolean;
}

/**
 * Lichtgewicht inline-edit component voor diagram labels en IP-adressen.
 * Gescheiden in een eigen bestand voor minimale tokenbelasting bij onderhoud en aanpassingen.
 */
export function BuilderInlineEdit({
  value,
  placeholder,
  onSave,
  className = '',
  inputClassName = '',
  title = '',
  isIp = false
}: BuilderInlineEditProps) {
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
        className={`px-1.5 py-0.5 rounded border border-blue-500 bg-white text-slate-900 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 z-[100] relative pointer-events-auto font-mono text-[10px] whitespace-nowrap leading-none ${inputClassName}`}
        style={{ minWidth: isIp ? '105px' : '65px' }}
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
      className={`cursor-pointer transition-all hover:bg-blue-500/10 px-1 py-0.5 rounded border border-transparent hover:border-blue-300 dark:hover:border-blue-600 inline-block truncate max-w-[130px] ${
        isPlaceholder ? 'italic opacity-60' : ''
      } ${className}`}
    >
      {displayVal}
    </span>
  );
}
