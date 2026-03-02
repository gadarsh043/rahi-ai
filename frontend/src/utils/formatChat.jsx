export function renderChatMarkdown(text) {
  if (!text) return null;

  const paragraphs = String(text).split(/\n\n+/);

  return paragraphs.map((para, i) => {
    const lines = para.split(/\n/);

    return (
      <div key={i} className={i > 0 ? 'mt-3' : ''}>
        {lines.map((line, j) => (
          <div key={j} className={j > 0 ? 'mt-1' : ''}>
            {renderInline(line)}
          </div>
        ))}
      </div>
    );
  });
}

function renderInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className="font-semibold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

