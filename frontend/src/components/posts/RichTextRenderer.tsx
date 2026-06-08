import type { ReactNode } from 'react';
import type { RichTextMark, RichTextNode } from '../../services/postsService';

const isSafeHref = (href?: string) => {
	if (!href) {
		return false;
	}

	try {
		const url = new URL(href, window.location.origin);
		return ['http:', 'https:', 'mailto:'].includes(url.protocol);
	} catch {
		return false;
	}
};

const applyMarks = (content: ReactNode, marks: RichTextMark[] = []) => {
	return marks.reduce((node, mark) => {
		if (mark.type === 'bold') {
			return <strong>{node}</strong>;
		}

		if (mark.type === 'italic') {
			return <em>{node}</em>;
		}

		if (mark.type === 'underline') {
			return <u>{node}</u>;
		}

		if (mark.type === 'strike') {
			return <s>{node}</s>;
		}

		if (mark.type === 'code') {
			return <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] text-slate-900">{node}</code>;
		}

		if (mark.type === 'link' && isSafeHref(mark.attrs?.href)) {
			return (
				<a className="text-cyan-700 underline underline-offset-2" href={mark.attrs?.href} target="_blank" rel="noreferrer">
					{node}
				</a>
			);
		}

		return node;
	}, content);
};

const renderChildren = (node: RichTextNode) => {
	return node.content?.map((child, index) => renderNode(child, index)) ?? null;
};

const renderNode = (node: RichTextNode, key: number): ReactNode => {
	if (node.type === 'text') {
		return <span key={key}>{applyMarks(node.text ?? '', node.marks)}</span>;
	}

	if (node.type === 'paragraph') {
		return (
			<p key={key} className="min-h-5">
				{renderChildren(node)}
			</p>
		);
	}

	if (node.type === 'heading') {
		const level = node.attrs?.level === 1 || node.attrs?.level === 2 || node.attrs?.level === 3 ? node.attrs.level : 2;
		const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
		const className = level === 1 ? 'text-2xl font-semibold' : level === 2 ? 'text-xl font-semibold' : 'text-lg font-semibold';

		return (
			<Tag key={key} className={className}>
				{renderChildren(node)}
			</Tag>
		);
	}

	if (node.type === 'bulletList') {
		return (
			<ul key={key} className="list-disc space-y-1 pl-5">
				{renderChildren(node)}
			</ul>
		);
	}

	if (node.type === 'orderedList') {
		return (
			<ol key={key} className="list-decimal space-y-1 pl-5">
				{renderChildren(node)}
			</ol>
		);
	}

	if (node.type === 'listItem') {
		return <li key={key}>{renderChildren(node)}</li>;
	}

	if (node.type === 'blockquote') {
		return (
			<blockquote key={key} className="border-l-4 border-cyan-700/40 pl-4 text-slate-700">
				{renderChildren(node)}
			</blockquote>
		);
	}

	if (node.type === 'codeBlock') {
		const text = node.content?.map((child) => child.text ?? '').join('\n') ?? '';

		return (
			<pre key={key} className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-sm text-slate-50">
				<code>{text}</code>
			</pre>
		);
	}

	if (node.type === 'hardBreak') {
		return <br key={key} />;
	}

	if (node.type === 'doc') {
		return <>{renderChildren(node)}</>;
	}

	return null;
};

const RichTextRenderer = ({ content }: { content: RichTextNode | null }) => {
	if (!content) {
		return null;
	}

	return <div className="space-y-3 text-sm leading-6 text-slate-800">{renderNode(content, 0)}</div>;
};

export { RichTextRenderer };
