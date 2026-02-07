<script lang="ts">
	import { marked } from 'marked';

	let {
		title,
		content,
		onTitleChange,
		onContentChange
	}: {
		title: string;
		content: string;
		onTitleChange: (value: string) => void;
		onContentChange: (value: string) => void;
	} = $props();

	let renderedHtml = $derived(marked.parse(content) as string);
</script>

<div class="editor">
	<input
		type="text"
		class="title-input"
		value={title}
		oninput={(e) => onTitleChange((e.target as HTMLInputElement).value)}
		placeholder="タイトル"
	/>

	<div class="panes">
		<div class="pane edit-pane">
			<div class="pane-header">編集</div>
			<textarea
				class="content-textarea"
				value={content}
				oninput={(e) => onContentChange((e.target as HTMLTextAreaElement).value)}
				placeholder="Markdownで記述..."
			></textarea>
		</div>
		<div class="pane preview-pane">
			<div class="pane-header">プレビュー</div>
			<div class="preview markdown-body">
				{@html renderedHtml}
			</div>
		</div>
	</div>
</div>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 0.75rem;
	}

	.title-input {
		font-size: 1.5rem;
		font-weight: 700;
		border: none;
		outline: none;
		padding: 0.25rem 0;
		background: transparent;
	}

	.panes {
		display: flex;
		flex: 1;
		gap: 1px;
		background: #e9ecef;
		border-radius: 6px;
		overflow: hidden;
		min-height: 400px;
	}

	.pane {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: white;
	}

	.pane-header {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6c757d;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #e9ecef;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.content-textarea {
		flex: 1;
		border: none;
		outline: none;
		resize: none;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.875rem;
		line-height: 1.7;
		padding: 0.75rem;
		background: transparent;
	}

	.preview {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		font-size: 0.9375rem;
		line-height: 1.8;
	}

	.preview :global(h1) { font-size: 1.5rem; margin: 1rem 0 0.5rem; }
	.preview :global(h2) { font-size: 1.25rem; margin: 0.75rem 0 0.5rem; }
	.preview :global(h3) { font-size: 1.125rem; margin: 0.5rem 0 0.5rem; }
	.preview :global(p) { margin: 0.5rem 0; }
	.preview :global(code) { background: #f1f3f5; padding: 0.125rem 0.25rem; border-radius: 3px; font-size: 0.85em; }
	.preview :global(pre) { background: #f8f9fa; padding: 0.75rem; border-radius: 6px; overflow-x: auto; }
	.preview :global(pre code) { background: none; padding: 0; }
	.preview :global(ul), .preview :global(ol) { padding-left: 1.5rem; margin: 0.5rem 0; }
	.preview :global(blockquote) { border-left: 3px solid #dee2e6; padding-left: 0.75rem; color: #6c757d; margin: 0.5rem 0; }
</style>
