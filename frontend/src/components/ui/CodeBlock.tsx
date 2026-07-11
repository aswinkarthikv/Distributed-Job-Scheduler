import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './Button';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg bg-zinc-950 border border-border overflow-hidden">
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-zinc-900/60 select-none">
        <span className="text-xs font-semibold text-muted-foreground uppercase">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="!p-1 h-auto text-zinc-400 hover:text-zinc-100"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Code body */}
      <pre className="p-4 overflow-x-auto text-zinc-300 font-mono text-xs leading-relaxed max-h-80">
        <code>{code}</code>
      </pre>
    </div>
  );
};
export default CodeBlock;
