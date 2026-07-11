import React from 'react';

interface JSONViewerProps {
  data: Record<string, any> | undefined;
}

export const JSONViewer: React.FC<JSONViewerProps> = ({ data }) => {
  if (!data) {
    return <span className="text-xs text-muted-foreground italic">No data</span>;
  }

  return (
    <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto border border-border shadow-inner max-h-60">
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
};
export default JSONViewer;
