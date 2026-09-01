import React from "react";
import { getFullImageUrl } from "@/lib/utils";

interface ArticleContentRendererProps {
  content?: string | null;
  className?: string;
}

interface DocNode {
  type: string;
  attrs?: Record<string, any>;
  content?: DocNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  text?: string;
}

export default function ArticleContentRenderer({
  content,
  className = ""
}: ArticleContentRendererProps) {
  if (!content) return null;

  // 1. Try parsing JSON AST (Tiptap structured format)
  let docAst: DocNode | null = null;
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.includes('"type"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.type === "doc" && Array.isArray(parsed.content)) {
        docAst = parsed;
      }
    } catch {
      docAst = null;
    }
  }

  // If structured JSON AST, render nodes cleanly and safely without innerHTML
  if (docAst && docAst.content) {
    return (
      <div className={`article-body prose prose-lg max-w-none text-gray-900 leading-relaxed font-serif ${className}`}>
        {docAst.content.map((node, index) => (
          <RenderBlockNode key={index} node={node} />
        ))}
      </div>
    );
  }

  // 2. Legacy HTML fallback
  return (
    <div
      className={`article-body prose prose-lg max-w-none text-gray-900 leading-relaxed font-serif ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

function RenderBlockNode({ node }: { node: DocNode }) {
  switch (node.type) {
    case "paragraph":
      if (!node.content || node.content.length === 0) {
        return <p className="my-3">&nbsp;</p>;
      }
      return (
        <p className="my-5 text-gray-800 text-lg leading-relaxed font-serif">
          {node.content.map((child, idx) => (
            <RenderInlineNode key={idx} node={child} />
          ))}
        </p>
      );

    case "heading":
      const level = node.attrs?.level || 2;
      const headingContent = node.content?.map((child, idx) => (
        <RenderInlineNode key={idx} node={child} />
      ));

      if (level === 1) {
        return <h2 className="text-3xl font-bold font-serif text-gray-950 mt-10 mb-4 tracking-tight">{headingContent}</h2>;
      } else if (level === 2) {
        return <h3 className="text-2xl font-bold font-serif text-gray-950 mt-8 mb-3 tracking-tight">{headingContent}</h3>;
      } else {
        return <h4 className="text-xl font-bold font-serif text-gray-900 mt-6 mb-2">{headingContent}</h4>;
      }

    case "bulletList":
      return (
        <ul className="list-disc list-inside space-y-2 my-5 text-gray-800 font-sans text-base pl-2">
          {node.content?.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item.content?.map((pNode, pIdx) =>
                pNode.type === "paragraph" ? (
                  pNode.content?.map((child, cIdx) => <RenderInlineNode key={cIdx} node={child} />)
                ) : (
                  <RenderBlockNode key={pIdx} node={pNode} />
                )
              )}
            </li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="list-decimal list-inside space-y-2 my-5 text-gray-800 font-sans text-base pl-2">
          {node.content?.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item.content?.map((pNode, pIdx) =>
                pNode.type === "paragraph" ? (
                  pNode.content?.map((child, cIdx) => <RenderInlineNode key={cIdx} node={child} />)
                ) : (
                  <RenderBlockNode key={pIdx} node={pNode} />
                )
              )}
            </li>
          ))}
        </ol>
      );

    case "blockquote":
      return (
        <blockquote className="border-l-4 border-blue-600 pl-5 py-2 my-6 bg-blue-50/40 rounded-r-xl italic text-gray-800 font-serif text-xl leading-relaxed">
          {node.content?.map((child, idx) => (
            <RenderBlockNode key={idx} node={child} />
          ))}
        </blockquote>
      );

    case "horizontalRule":
      return <hr className="my-10 border-gray-200" />;

    case "richImage":
      const {
        src,
        alt,
        caption,
        credit,
        alignment = "center",
        size = "large"
      } = node.attrs || {};

      const fullSrc = getFullImageUrl(src);

      // Alignment styling
      const alignmentWrapperClasses = {
        left: "my-6 sm:float-left sm:mr-8 sm:mb-4 max-w-sm w-full clear-left",
        right: "my-6 sm:float-right sm:ml-8 sm:mb-4 max-w-sm w-full clear-right",
        center: "my-8 mx-auto clear-both block",
        full: "my-10 w-full max-w-full clear-both block"
      }[alignment as "left" | "right" | "center" | "full"] || "my-8 mx-auto clear-both block";

      // Sizing
      const sizeClasses = {
        small: "max-w-sm",
        medium: "max-w-md",
        large: "max-w-3xl",
        full: "w-full max-w-full"
      }[size as "small" | "medium" | "large" | "full"] || "max-w-3xl";

      return (
        <figure className={`${alignmentWrapperClasses} ${alignment !== "full" ? sizeClasses : ""}`}>
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-gray-100">
            <img
              src={fullSrc}
              alt={alt || caption || "Article photo"}
              className="w-full h-auto object-cover max-h-[650px] block"
              loading="lazy"
            />
            {credit && (
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white/90 text-[10px] px-2 py-0.5 rounded font-sans tracking-wide">
                Photo: {credit}
              </div>
            )}
          </div>
          {(caption || credit) && (
            <figcaption className="mt-2.5 text-xs text-gray-500 text-center italic font-sans px-3 leading-snug">
              {caption}
              {credit && !caption && <span>Photo credit: {credit}</span>}
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}

function RenderInlineNode({ node }: { node: DocNode }) {
  if (node.type === "text") {
    let element: React.ReactNode = node.text || "";

    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === "bold") {
          element = <strong className="font-bold text-gray-950">{element}</strong>;
        } else if (mark.type === "italic") {
          element = <em>{element}</em>;
        } else if (mark.type === "underline") {
          element = <u>{element}</u>;
        } else if (mark.type === "link") {
          element = (
            <a
              href={mark.attrs?.href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline font-medium hover:text-blue-800 transition decoration-blue-300 hover:decoration-blue-600"
            >
              {element}
            </a>
          );
        }
      }
    }

    return <>{element}</>;
  }

  if (node.type === "hardBreak") {
    return <br />;
  }

  return null;
}
