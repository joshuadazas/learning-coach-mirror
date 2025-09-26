
import React, { useCallback, useState, useEffect } from 'react';
import type { SearchSource } from '../types';

interface LearningDropOutputProps {
  message: string;
  sources: SearchSource[];
  onRegenerate: () => void;
  isGenerating: boolean;
}

const LearningDropOutput: React.FC<LearningDropOutputProps> = ({ message, sources, onRegenerate, isGenerating }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(message).then(() => {
      setIsCopied(true);
    });
  }, [message]);
  
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);
  
  const renderMessage = () => {
    // Regex for standard markdown bold link format: [**Title**](url) — Price — (Type)
    // This regex now accepts em-dash, en-dash, and hyphens as separators for robustness.
    const resourceRegex = /^\[\*\*(?<title>.*?)\*\*\]\((?<url>https?:\/\/\S+)\)[\s-—–]+(?<price>.*?)[\s-—–]+\((?<type>.*?)\)$/;
    
    // Fallback regex to find a standard markdown bold link anywhere in the line.
    const fallbackMarkdownRegex = /\[\*\*(?<title>.*?)\*\*\]\((?<url>https?:\/\/\S+)\)/;

    return message.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') return null;
      
      if (trimmedLine.includes('Your Learning Drop 🚀')) {
        return <h3 key={index} className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C9C] to-[#FF5A70] mb-4">Your Learning Drop 🚀</h3>;
      }
      
      if (trimmedLine === '**Hard Skills**' || trimmedLine === '**Soft Skills**') {
        return <h4 key={index} className="text-lg font-bold text-white mt-6 mb-2">{trimmedLine.replace(/\*\*/g, '')}</h4>;
      }

      // 1. Try to match the full, structured markdown format.
      const match = trimmedLine.match(resourceRegex);
      if (match && match.groups) {
        const { title, price, url, type } = match.groups;
        return (
          <div key={index} className="mb-4">
            <a href={url.trim()} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-white hover:underline">{title.trim()}</a>
            <div className="text-sm text-[#FFBDC6] mt-1">
              ({type.trim()}) — <span className="font-semibold text-[#FF8C9C]">{price.trim()}</span>
            </div>
          </div>
        );
      }
      
      // 2. If structured match fails, fall back to finding just a markdown link.
      const fallbackMatch = trimmedLine.match(fallbackMarkdownRegex);
      if (fallbackMatch && fallbackMatch.groups) {
        const { title, url } = fallbackMatch.groups;
        return (
            <div key={index} className="mb-4">
              <a href={url.trim()} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-white hover:underline">{title.trim()}</a>
              <div className="text-sm text-[#FFBDC6] mt-1">
                (Link)
              </div>
            </div>
        )
      }

      // 3. If no match at all, render as a plain paragraph.
      return <p key={index}>{line}</p>;
    });
  };

  return (
    <div className="mt-8 relative bg-[#6D2F5A] p-6 sm:p-8 rounded-xl border border-[#DE485D] shadow-lg">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <button 
          onClick={onRegenerate}
          disabled={isGenerating}
          title="Regenerate"
          aria-label="Regenerate learning drop"
          className="bg-[#23174B] hover:bg-opacity-75 text-[#FFBDC6] text-xs font-semibold py-1 px-3 rounded-full transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
             <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9" />
            </svg>
          )}
          {isGenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
        <button 
          onClick={copyToClipboard}
          aria-label="Copy learning drop to clipboard"
          className="bg-[#DE485D] hover:bg-[#FF5A70] text-[#FFDEE2] text-xs font-semibold py-1 px-3 rounded-full transition-colors duration-200"
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      <div 
        className="prose prose-invert prose-p:text-[#FFDEE2] prose-p:my-2 prose-strong:text-white max-w-none"
      >
        {renderMessage()}
      </div>

      {sources && sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#DE485D]/50">
          <h4 className="text-sm font-semibold text-[#FFBDC6] mb-2">Sources</h4>
          <ul className="list-disc list-inside space-y-1">
            {sources.map((source, index) => (
              <li key={index} className="text-xs">
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#FFDEE2] hover:text-white hover:underline"
                  title={source.uri}
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LearningDropOutput;
