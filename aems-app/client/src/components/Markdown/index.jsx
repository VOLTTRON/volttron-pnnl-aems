import React from "react";
import { Classes } from "@blueprintjs/core";
import ReactMarkdown, { uriTransformer } from "react-markdown";
import remarkGfm from "remark-gfm";
import typograf from "@mavrin/remark-typograf";
import hint from "remark-hint";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { visit } from "unist-util-visit";
import { kebabCase } from "lodash";
import "./style.scss";

const supSubPattern = /(.*)([\^ˇ][a-z0-9]+[\^ˇ])(.*)/i;

const Markdown = (props) => {
  const { markdown, raw } = props;

  const handleNavigate = (text) => () => {
    const match = document.getElementsByName(text)?.[0];
    match?.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "center",
    });
  };

  const transformLinkUri = (href, children, title) => uriTransformer(href, children, title);

  const transformImageUri = (src, alt, title) => uriTransformer(src, alt, title);

  const buildPositions = (position, match) => {
    return [1, 2, 3].map((i) => {
      let start = 0,
        end = 0;
      switch (i) {
        case 1:
          start += match[1].length;
          end += match[2].length;
        // fall through
        case 2:
          start += match[2].length;
          end += match[3].length;
        // fall through
        case 3:
          start += match[3].length;
        // fall through
        default:
      }
      return {
        start: {
          line: position.start.line,
          column: position.end.column - start,
          offset: position.end.offset - start,
        },
        end: { line: position.end.line, column: position.end.column - end, offset: position.end.offset - end },
      };
    });
  };

  const visitor = (node, _index, parent) => {
    if (supSubPattern.test(node.value)) {
      let match;
      while (
        (match = supSubPattern.exec(parent.children[0].type === "text" ? parent.children[0].value : "")) !== null
      ) {
        const cls = match[2].startsWith("^") ? "super" : "suber";
        const pos = buildPositions(parent.children[0].position, match);
        parent.children.splice(0, 1, { type: "text", value: match[1], position: pos[0] });
        parent.children.splice(1, 0, {
          type: "paragraph",
          data: { class: cls, hProperties: { class: cls } },
          children: [{ type: "text", value: match[2].substring(1, match[2].length - 1) }],
          position: pos[1],
        });
        parent.children.splice(2, 0, { type: "text", value: match[3], position: pos[2] });
      }
    }
  };

  const transform = (_config) => (tree) => {
    visit(tree, "text", visitor);
  };

  // uncomment and add to plugins list to view tree
  // const logger = (config) => (tree) => {
  //   visit(tree, "text", (node, index, parent) => console.log({ node, index }));
  // };

  return (
    <React.Fragment>
      <div className={Classes.DIALOG_BODY}>
        {raw ? (
          <p className="raw">{markdown}</p>
        ) : (
          <ReactMarkdown
            className={"markdown"}
            disallowedElements={["~"]}
            linkTarget="_blank"
            transformLinkUri={transformLinkUri}
            transformImageUri={transformImageUri}
            remarkPlugins={[hint, remarkGfm, typograf, transform]}
            components={{
              code: ({ _node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    children={String(children).replace(/\n$/, "")}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              a: ({ _node, inline, className, children, ...props }) => {
                const { href } = props;
                const match = href?.startsWith("#");
                return !inline && match ? (
                  <button className="anchor-nav-button" children={children} onClick={handleNavigate(href.slice(1))} />
                ) : (
                  <a className={className} {...props} children={children} />
                );
              },
              h1: ({ _node, _inline, className, children, ...props }) => {
                return <h1 name={kebabCase(children?.[0])} className={className} {...props} children={children} />;
              },
              h2: ({ _node, _inline, className, children, ...props }) => {
                return <h2 name={kebabCase(children?.[0])} className={className} {...props} children={children} />;
              },
              h3: ({ _node, _inline, className, children, ...props }) => {
                return <h3 name={kebabCase(children?.[0])} className={className} {...props} children={children} />;
              },
              h4: ({ _node, _inline, className, children, ...props }) => {
                return <h4 name={kebabCase(children?.[0])} className={className} {...props} children={children} />;
              },
              h5: ({ _node, _inline, className, children, ...props }) => {
                return <h5 name={kebabCase(children?.[0])} className={className} {...props} children={children} />;
              },
              h6: ({ _node, _inline, className, children, ...props }) => {
                return <h6 name={kebabCase(children?.[0])} className={className} {...props} children={children} />;
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        )}
      </div>
    </React.Fragment>
  );
};

export default Markdown;
