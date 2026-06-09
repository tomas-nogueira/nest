import { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import {
	Bold,
	Code,
	CodeXml,
	FileText,
	Heading1,
	Heading2,
	Image,
	Italic,
	Link2,
	List,
	ListOrdered,
	Plus,
	Paperclip,
	Quote,
	Send,
	Strikethrough,
	Underline as UnderlineIcon,
	X,
	type LucideIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import type { RichTextNode, Subject } from '../../services/postsService';

const emptyContent: RichTextNode = {
	type: 'doc',
	content: [{ type: 'paragraph' }],
};

type PostEditorProps = {
	subjects: Subject[];
	isSubmitting: boolean;
	allowAttachments?: boolean;
	initialTitle?: string;
	initialSubtitle?: string | null;
	initialContent?: RichTextNode;
	initialSubjectId?: string;
	submitLabel?: string;
	onSubmit(input: { title: string; subtitle?: string; subjectId: string; content: RichTextNode; attachments: File[] }): Promise<void>;
};

const isAllowedAttachment = (file: File) => {
	return ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type);
};

const extractPlainText = (node: RichTextNode): string => {
	if (typeof node.text === 'string') {
		return node.text;
	}

	return node.content?.map((child) => extractPlainText(child)).join(' ') ?? '';
};

type ToolbarButtonProps = {
	icon: LucideIcon;
	label: string;
	isActive?: boolean;
	isDisabled?: boolean;
	onClick(): void;
};

const ToolbarButton = ({ icon: Icon, label, isActive = false, isDisabled = false, onClick }: ToolbarButtonProps) => {
	return (
		<Button
			type="button"
			variant={isActive ? 'secondary' : 'ghost'}
			size="icon-sm"
			title={label}
			aria-label={label}
			aria-pressed={isActive}
			disabled={isDisabled}
			className={isActive ? 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100' : undefined}
			onClick={onClick}
		>
			<Icon />
		</Button>
	);
};

const PostEditor = ({
	subjects,
	isSubmitting,
	allowAttachments = true,
	initialTitle = '',
	initialSubtitle = '',
	initialContent = emptyContent,
	initialSubjectId = '',
	submitLabel = 'Publicar',
	onSubmit,
}: PostEditorProps) => {
	const [title, setTitle] = useState(initialTitle);
	const [subtitle, setSubtitle] = useState(initialSubtitle ?? '');
	const [showSubtitle, setShowSubtitle] = useState(Boolean(initialSubtitle));
	const [subjectId, setSubjectId] = useState(initialSubjectId);
	const [content, setContent] = useState<RichTextNode>(initialContent);
	const [attachments, setAttachments] = useState<File[]>([]);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
			}),
			Underline,
			Link.configure({
				openOnClick: false,
				autolink: true,
				defaultProtocol: 'https',
				protocols: ['http', 'https', 'mailto'],
			}),
		],
		content: initialContent as JSONContent,
		editorProps: {
			attributes: {
				class:
					'min-h-36 w-full px-4 py-3 text-sm leading-6 outline-none',
			},
		},
		onUpdate: ({ editor }) => {
			setContent(editor.getJSON() as RichTextNode);
		},
	});

	useEffect(() => {
		if (!subjectId && subjects[0]) {
			setSubjectId(subjects[0].id);
		}
	}, [subjectId, subjects]);

	useEffect(() => {
		if (initialSubjectId) {
			setSubjectId(initialSubjectId);
		}
	}, [initialSubjectId]);

	useEffect(() => {
		setTitle(initialTitle);
	}, [initialTitle]);

	useEffect(() => {
		setSubtitle(initialSubtitle ?? '');
		setShowSubtitle(Boolean(initialSubtitle));
	}, [initialSubtitle]);

	useEffect(() => {
		if (!editor) {
			return;
		}

		editor.commands.setContent(initialContent as JSONContent);
		setContent(initialContent);
	}, [editor, initialContent]);

	const selectedSummary = useMemo(() => {
		if (attachments.length === 0) {
			return null;
		}

		const images = attachments.filter((file) => file.type.startsWith('image/')).length;
		const pdfs = attachments.filter((file) => file.type === 'application/pdf').length;

		return `${attachments.length} anexo(s) selecionado(s): ${images} imagem(ns), ${pdfs} PDF(s)`;
	}, [attachments]);

	const hasContentOrAttachment = extractPlainText(content).trim().length > 0 || attachments.length > 0 || !allowAttachments;
	const canSubmit = Boolean(subjectId) && title.trim().length >= 3 && hasContentOrAttachment;

	const handleFiles = (files: FileList | null) => {
		if (!files) {
			return;
		}

		const nextFiles = Array.from(files).filter(isAllowedAttachment);
		setAttachments((current) => [...current, ...nextFiles].slice(0, 5));
	};

	const handleSubmit = async () => {
		if (!editor || !canSubmit) {
			return;
		}

		await onSubmit({ title: title.trim(), subtitle: subtitle.trim() || undefined, subjectId, content, attachments: allowAttachments ? attachments : [] });
		editor.commands.setContent(initialContent === emptyContent ? emptyContent as JSONContent : initialContent as JSONContent);
		setContent(initialContent === emptyContent ? emptyContent : initialContent);
		if (initialTitle === '') {
			setTitle('');
		}
		if (!initialSubtitle) {
			setSubtitle('');
			setShowSubtitle(false);
		}
		setAttachments([]);
	};

	const applyLink = () => {
		if (!editor) {
			return;
		}

		const currentHref = editor.getAttributes('link').href as string | undefined;
		const href = window.prompt('URL do link', currentHref ?? 'https://');

		if (href === null) {
			return;
		}

		if (!href.trim()) {
			editor.chain().focus().unsetLink().run();
			return;
		}

		editor.chain().focus().setLink({ href: href.trim() }).run();
	};

	return (
		<div className="rounded-lg border border-slate-200 bg-white">
			<div className="space-y-3 border-b border-slate-200 p-3">
				<div>
					<label className="sr-only" htmlFor="post-title">
						Titulo
					</label>
					<input
						id="post-title"
						className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium text-slate-950 outline-none focus:border-cyan-700"
						value={title}
						maxLength={180}
						placeholder="Titulo do post"
						onChange={(event) => setTitle(event.target.value)}
					/>
				</div>

				{showSubtitle ? (
					<div>
						<label className="sr-only" htmlFor="post-subtitle">
							Subtitulo
						</label>
						<textarea
							id="post-subtitle"
							className="min-h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-cyan-700"
							value={subtitle}
							maxLength={300}
							placeholder="Subtitulo opcional"
							onChange={(event) => setSubtitle(event.target.value)}
						/>
						<div className="mt-1 text-right text-xs text-slate-500">{subtitle.length}/300</div>
					</div>
				) : (
					<button
						type="button"
						className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-900"
						onClick={() => setShowSubtitle(true)}
					>
						<Plus className="size-4" />
						Adicionar subtitulo
					</button>
				)}
			</div>

			<div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center">
				<select
					className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-cyan-700"
					value={subjectId}
					onChange={(event) => setSubjectId(event.target.value)}
					disabled={subjects.length === 0}
				>
					{subjects.length === 0 ? <option>Nenhuma disciplina disponivel</option> : null}
					{subjects.map((subject) => (
						<option key={subject.id} value={subject.id}>
							{subject.name}
						</option>
					))}
				</select>

				<div className="flex flex-wrap items-center gap-1">
					<ToolbarButton icon={Bold} label="Negrito" isDisabled={!editor} isActive={Boolean(editor?.isActive('bold'))} onClick={() => editor?.chain().focus().toggleBold().run()} />
					<ToolbarButton icon={Italic} label="Italico" isDisabled={!editor} isActive={Boolean(editor?.isActive('italic'))} onClick={() => editor?.chain().focus().toggleItalic().run()} />
					<ToolbarButton icon={UnderlineIcon} label="Sublinhado" isDisabled={!editor} isActive={Boolean(editor?.isActive('underline'))} onClick={() => editor?.chain().focus().toggleUnderline().run()} />
					<ToolbarButton icon={Strikethrough} label="Tachado" isDisabled={!editor} isActive={Boolean(editor?.isActive('strike'))} onClick={() => editor?.chain().focus().toggleStrike().run()} />
					<ToolbarButton icon={Code} label="Codigo inline" isDisabled={!editor} isActive={Boolean(editor?.isActive('code'))} onClick={() => editor?.chain().focus().toggleCode().run()} />
					<ToolbarButton icon={Heading1} label="Cabecalho 1" isDisabled={!editor} isActive={Boolean(editor?.isActive('heading', { level: 1 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} />
					<ToolbarButton icon={Heading2} label="Cabecalho 2" isDisabled={!editor} isActive={Boolean(editor?.isActive('heading', { level: 2 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
					<ToolbarButton icon={List} label="Lista com marcadores" isDisabled={!editor} isActive={Boolean(editor?.isActive('bulletList'))} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
					<ToolbarButton icon={ListOrdered} label="Lista numerada" isDisabled={!editor} isActive={Boolean(editor?.isActive('orderedList'))} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
					<ToolbarButton icon={Quote} label="Citacao" isDisabled={!editor} isActive={Boolean(editor?.isActive('blockquote'))} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
					<ToolbarButton icon={CodeXml} label="Bloco de codigo" isDisabled={!editor} isActive={Boolean(editor?.isActive('codeBlock'))} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} />
					<ToolbarButton icon={Link2} label="Link" isDisabled={!editor} isActive={Boolean(editor?.isActive('link'))} onClick={applyLink} />
				</div>
			</div>

			<EditorContent editor={editor} className="rich-editor max-h-80 overflow-y-auto" />

			<div className="flex flex-col gap-3 border-t border-slate-200 p-3">
				{allowAttachments && attachments.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{attachments.map((file, index) => (
							<span key={`${file.name}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">
								{file.type.startsWith('image/') ? <Image className="size-3.5" /> : <FileText className="size-3.5" />}
								<span className="truncate">{file.name}</span>
								<button type="button" className="text-slate-500 hover:text-slate-900" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
									<X className="size-3.5" />
								</button>
							</span>
						))}
					</div>
				) : null}

				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					{allowAttachments ? (
						<label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50">
							<Paperclip className="size-4" />
							<span>Anexar</span>
							<input className="sr-only" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => handleFiles(event.target.files)} />
						</label>
					) : null}
					<span className="min-h-5 flex-1 text-xs text-slate-500">{selectedSummary}</span>
					<Button type="button" className="h-9 bg-cyan-700 text-white hover:bg-cyan-800" onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
						<Send />
						{submitLabel}
					</Button>
				</div>
			</div>
		</div>
	);
};

export { PostEditor };
