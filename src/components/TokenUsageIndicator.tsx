'use client';

interface TokenUsageIndicatorProps {
  sources: Array<{ content: string; type: string; name: string }>;
  additionalContent?: string;
  className?: string;
}

export default function TokenUsageIndicator({ 
  sources, 
  additionalContent = '', 
  className = '' 
}: TokenUsageIndicatorProps) {
  // Calculate estimated tokens (4 characters ≈ 1 token)
  const sourcesContent = sources.map(s => s.content).join(' ');
  const totalContent = sourcesContent + additionalContent;
  const estimatedTokens = Math.ceil(totalContent.length / 4);
  
  // Determine model and status
  const getModelInfo = () => {
    if (estimatedTokens > 7000) {
      return {
        model: 'GPT-4 Turbo',
        status: 'optimal',
        color: 'text-green-600 bg-green-100',
        icon: '🚀',
        message: 'Using GPT-4 Turbo for large content'
      };
    } else if (estimatedTokens > 6000) {
      return {
        model: 'GPT-4 (Truncated)',
        status: 'warning',
        color: 'text-yellow-600 bg-yellow-100',
        icon: '⚠️',
        message: 'Content will be truncated to fit'
      };
    } else if (estimatedTokens > 4000) {
      return {
        model: 'GPT-4',
        status: 'good',
        color: 'text-blue-600 bg-blue-100',
        icon: '📊',
        message: 'Good token usage'
      };
    } else {
      return {
        model: 'GPT-4',
        status: 'excellent',
        color: 'text-green-600 bg-green-100',
        icon: '✅',
        message: 'Optimal token usage'
      };
    }
  };

  const modelInfo = getModelInfo();
  
  // Don't show if no sources and minimal content
  if (sources.length === 0 && estimatedTokens < 100) {
    return null;
  }

  return (
    <div className={`text-xs border rounded-lg p-3 ${modelInfo.color} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{modelInfo.icon}</span>
          <span className="font-medium">AI Model: {modelInfo.model}</span>
        </div>
        <span className="font-mono">~{estimatedTokens.toLocaleString()} tokens</span>
      </div>
      
      <div className="text-xs opacity-75 mb-2">{modelInfo.message}</div>
      
      {sources.length > 0 && (
        <div className="space-y-1">
          {sources.map((source, index) => {
            const sourceTokens = Math.ceil(source.content.length / 4);
            return (
              <div key={index} className="flex justify-between items-center">
                <span className="truncate flex-1">
                  📚 {source.name} ({source.type})
                </span>
                <span className="ml-2 font-mono">{sourceTokens} tokens</span>
              </div>
            );
          })}
        </div>
      )}
      
      {estimatedTokens > 6000 && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <div className="text-xs">
            💡 <strong>Tip:</strong> Large sources will be {estimatedTokens > 7000 ? 'handled by GPT-4 Turbo' : 'automatically truncated'}
          </div>
        </div>
      )}
    </div>
  );
}
