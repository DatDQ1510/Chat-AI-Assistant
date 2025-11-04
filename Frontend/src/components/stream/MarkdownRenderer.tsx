/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { message } from 'antd';
import 'highlight.js/styles/github-dark.css';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/** Clean markdown to remove empty <p> or excessive newlines */
const cleanMarkdown = (input: string): string => {
  return input
    .replace(/^\s+/, '') // remove leading whitespace
    .replace(/\s+$/, '') // remove trailing whitespace
    .replace(/\n{3,}/g, '\n\n') // collapse >2 newlines
    .replace(/(<p>\s*<\/p>)+/g, ''); // remove empty paragraphs
};

/**
 * Optimized Markdown Renderer
 * - Handles streaming content
 * - Cleans spacing issues
 * - Supports tables, code blocks, links, etc.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [renderedContent, setRenderedContent] = useState(content);
  const [copiedId, setCopiedId] = useState<string>('');

  // Debounce cleaning when content streams in
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderedContent(cleanMarkdown(content));
    }, 100); // 100ms debounce for smoother streaming
    return () => clearTimeout(timer);
  }, [content]);

  // Copy handler for code blocks and tables
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      message.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(''), 2000); // Reset after 2s
    } catch {
      message.error('Failed to copy');
    }
  };

  // Convert table to text format
  const tableToText = (tableElement: any): string => {
    const rows: string[][] = [];
    
    // Process children to extract table data
    const processChildren = (children: any) => {
      if (!children) return;
      
      React.Children.forEach(children, (child) => {
        if (!child || typeof child !== 'object') return;
        
        if (child.type === 'thead' || child.type === 'tbody') {
          processChildren(child.props.children);
        } else if (child.type === 'tr') {
          const row: string[] = [];
          React.Children.forEach(child.props.children, (cell: any) => {
            if (cell && (cell.type === 'th' || cell.type === 'td')) {
              const cellText = typeof cell.props.children === 'string' 
                ? cell.props.children 
                : String(cell.props.children || '');
              row.push(cellText.trim());
            }
          });
          if (row.length > 0) rows.push(row);
        }
      });
    };
    
    processChildren(tableElement.props.children);
    
    // Format as text table with alignment
    if (rows.length === 0) return '';
    
    const colWidths = rows[0].map((_, colIndex) => 
      Math.max(...rows.map(row => (row[colIndex] || '').length))
    );
    
    return rows.map((row, rowIndex) => {
      const paddedRow = row.map((cell, colIndex) => 
        cell.padEnd(colWidths[colIndex], ' ')
      ).join(' | ');
      
      if (rowIndex === 0) {
        const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');
        return `${paddedRow}\n${separator}`;
      }
      return paddedRow;
    }).join('\n');
  };

  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

            return !inline ? (
              <div className="code-block-wrapper">
                <div className="code-block-header">
                  {language && <span className="code-block-language">{language}</span>}
                  <button
                    className="copy-button"
                    onClick={() => handleCopy(codeString, codeId)}
                    title="Copy code"
                  >
                    {copiedId === codeId ? <CheckOutlined /> : <CopyOutlined />}
                  </button>
                </div>
                <pre className={className}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          },

          a({ children, href, ...props }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="markdown-link"
                {...props}
              >
                {children}
              </a>
            );
          },

          table({ children, ...props }: any) {
            const tableId = `table-${Math.random().toString(36).substr(2, 9)}`;
            const tableText = tableToText({ props: { children } });

            return (
              <div className="table-wrapper">
                <div className="table-header">
                  <button
                    className="copy-button"
                    onClick={() => handleCopy(tableText, tableId)}
                    title="Copy table"
                  >
                    {copiedId === tableId ? <CheckOutlined /> : <CopyOutlined />}
                  </button>
                </div>
                <table className="markdown-table" {...props}>
                  {children}
                </table>
              </div>
            );
          },

          blockquote({ children, ...props }: any) {
            return (
              <blockquote className="markdown-blockquote" {...props}>
                {children}
              </blockquote>
            );
          },

          h1({ children, ...props }: any) {
            return <h1 className="markdown-h1" {...props}>{children}</h1>;
          },
          h2({ children, ...props }: any) {
            return <h2 className="markdown-h2" {...props}>{children}</h2>;
          },
          h3({ children, ...props }: any) {
            return <h3 className="markdown-h3" {...props}>{children}</h3>;
          },

          img({ src, alt, ...props }: any) {
            return (
              <div className="markdown-image-wrapper">
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  className="markdown-image"
                  {...props}
                />
                {alt && <p className="markdown-image-caption">{alt}</p>}
              </div>
            );
          },
        }}
      >
        {renderedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
