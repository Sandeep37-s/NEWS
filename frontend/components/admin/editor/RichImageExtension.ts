import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import RichImageNodeView from "./RichImageNodeView";

export interface RichImageOptions {
  inline?: boolean;
  HTMLAttributes?: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    richImage: {
      setRichImage: (options: {
        src: string;
        imageId?: string;
        alt?: string;
        caption?: string;
        credit?: string;
        source?: string;
        license?: string;
        alignment?: "left" | "center" | "right" | "full";
        size?: "small" | "medium" | "large" | "full";
      }) => ReturnType;
    };
  }
}

export const RichImageExtension = Node.create<RichImageOptions>({
  name: "richImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      imageId: {
        default: null,
      },
      alt: {
        default: "",
      },
      caption: {
        default: "",
      },
      credit: {
        default: "",
      },
      source: {
        default: "",
      },
      license: {
        default: "OWNED",
      },
      alignment: {
        default: "center",
      },
      size: {
        default: "large",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-rich-image]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const img = element.querySelector("img");
          const caption = element.querySelector("figcaption");
          return {
            src: img?.getAttribute("src") || "",
            alt: img?.getAttribute("alt") || "",
            caption: caption?.textContent || element.getAttribute("data-caption") || "",
            credit: element.getAttribute("data-credit") || "",
            alignment: element.getAttribute("data-alignment") || "center",
            size: element.getAttribute("data-size") || "large",
            license: element.getAttribute("data-license") || "OWNED",
            imageId: element.getAttribute("data-image-id") || null,
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            src: element.getAttribute("src"),
            alt: element.getAttribute("alt") || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(this.options.HTMLAttributes || {}, {
        "data-rich-image": "",
        "data-alignment": HTMLAttributes.alignment || "center",
        "data-size": HTMLAttributes.size || "large",
        "data-credit": HTMLAttributes.credit || "",
        "data-caption": HTMLAttributes.caption || "",
        "data-license": HTMLAttributes.license || "OWNED",
        "data-image-id": HTMLAttributes.imageId || "",
      }),
      [
        "img",
        {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt || "",
          loading: "lazy",
        },
      ],
      HTMLAttributes.caption
        ? ["figcaption", {}, HTMLAttributes.caption]
        : ["figcaption", { class: "hidden" }, ""],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RichImageNodeView);
  },

  addCommands() {
    return {
      setRichImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
