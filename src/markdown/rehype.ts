// Two passes over every article's HTML, at build time.
import type { Element, ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';
import { t } from '../lib/i18n.ts';

/**
 * Site paths in an article (`/articles/x/flow.png`, as Shipcast writes them) get the base in front,
 * so they work when the blog is served under a path, as GitHub Pages serves a project site.
 */
export function rehypeBasePaths(base: string) {
  const prefix = base.replace(/\/+$/, '');
  return () => (tree: Root) => {
    if (!prefix) return;
    visit(tree, 'element', (node: Element) => {
      for (const attribute of ['src', 'href', 'poster', 'srcset']) {
        const value = node.properties[attribute];
        if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith(`${prefix}/`)) {
          node.properties[attribute] = `${prefix}${value}`;
        }
      }
    });
  };
}

/**
 * Every code block gets a bar with its language and a Copy button. The button is plain HTML; one
 * small inline script on the article page copies the block's text. Images get lazy loading and async
 * decoding, and a paragraph holding only an image is marked, so the page can set it wider than the
 * text.
 */
export function rehypeArticle() {
  return (tree: Root, file: { path?: string; history?: string[] }) => {
    const path = file.path ?? file.history?.[0] ?? '';
    const lang = /posts\/([a-z]{2})\//.exec(path)?.[1] ?? 'en';
    const words = t(lang);
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName === 'img') {
        node.properties.loading ??= 'lazy';
        node.properties.decoding ??= 'async';
      }
      if (node.tagName === 'p' && node.children.filter((c) => !(c.type === 'text' && c.value.trim() === '')).every((c) => c.type === 'element' && c.tagName === 'img')) {
        node.properties.className = ['figure'];
      }
      if (node.tagName !== 'pre' || !parent || index === undefined) return;
      const language = typeof node.properties.dataLanguage === 'string' ? node.properties.dataLanguage : '';
      const bar: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-bar'] },
        children: [
          { type: 'element', tagName: 'span', properties: { className: ['code-lang'] }, children: [{ type: 'text', value: language === 'plaintext' ? '' : language }] },
          {
            type: 'element',
            tagName: 'button',
            properties: { type: 'button', className: ['code-copy'], dataCopy: '', dataCopied: words.copied, ariaLabel: words.copyLabel },
            children: [{ type: 'text', value: words.copy }],
          },
        ],
      };
      const wrapper: Element = { type: 'element', tagName: 'div', properties: { className: ['code-block'] }, children: [bar, node] };
      (parent.children as ElementContent[])[index] = wrapper;
      return 'skip';
    });
  };
}
