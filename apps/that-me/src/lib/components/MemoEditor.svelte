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
	let textareaEl: HTMLTextAreaElement;

	interface SlashCommand {
		label: string;
		description: string;
		insert: string;
		selectFrom?: number;
		selectTo?: number;
	}

	const slashCommands: SlashCommand[] = [
		{ label: '見出し1', description: '# 大見出し', insert: '# ', },
		{ label: '見出し2', description: '## 中見出し', insert: '## ' },
		{ label: '見出し3', description: '### 小見出し', insert: '### ' },
		{ label: '太字', description: '**太字テキスト**', insert: '**テキスト**', selectFrom: 2, selectTo: 5 },
		{ label: '斜体', description: '*斜体テキスト*', insert: '*テキスト*', selectFrom: 1, selectTo: 4 },
		{ label: '取り消し線', description: '~~取り消し~~', insert: '~~テキスト~~', selectFrom: 2, selectTo: 5 },
		{ label: 'リンク', description: '[テキスト](URL)', insert: '[テキスト](url)', selectFrom: 1, selectTo: 4 },
		{ label: '画像', description: '![alt](URL)', insert: '![説明](url)', selectFrom: 2, selectTo: 4 },
		{ label: 'コード', description: '`インラインコード`', insert: '`コード`', selectFrom: 1, selectTo: 3 },
		{ label: 'コードブロック', description: '```言語 ... ```', insert: '```\n\n```', selectFrom: 4, selectTo: 4 },
		{ label: '箇条書き', description: '- リスト項目', insert: '- ' },
		{ label: '番号付きリスト', description: '1. リスト項目', insert: '1. ' },
		{ label: 'チェックリスト', description: '- [ ] タスク', insert: '- [ ] ' },
		{ label: '引用', description: '> 引用テキスト', insert: '> ' },
		{ label: '水平線', description: '---', insert: '---\n' },
		{ label: 'テーブル', description: '| 列1 | 列2 |', insert: '| 列1 | 列2 |\n| --- | --- |\n| | |\n', selectFrom: 2, selectTo: 4 },
	];

	let slashOpen = $state(false);
	let slashFilter = $state('');
	let slashIndex = $state(0);
	let slashPos = $state({ top: 0, left: 0 });
	let slashStartPos = $state(0);

	let filteredCommands = $derived(
		slashFilter === ''
			? slashCommands
			: slashCommands.filter((c) => c.label.includes(slashFilter) || c.description.includes(slashFilter))
	);

	function insertMarkdown(before: string, after: string, placeholder: string) {
		const start = textareaEl.selectionStart;
		const end = textareaEl.selectionEnd;
		const selected = content.slice(start, end);
		const text = selected || placeholder;
		const newContent = content.slice(0, start) + before + text + after + content.slice(end);
		onContentChange(newContent);
		requestAnimationFrame(() => {
			textareaEl.focus();
			const selectStart = start + before.length;
			const selectEnd = selectStart + text.length;
			textareaEl.setSelectionRange(selectStart, selectEnd);
		});
	}

	function applySlashCommand(cmd: SlashCommand) {
		const lineStart = content.lastIndexOf('\n', slashStartPos - 1) + 1;
		const before = content.slice(0, lineStart);
		const after = content.slice(slashStartPos);
		const slashText = content.slice(lineStart, slashStartPos);

		let newContent: string;
		if (slashText.trim() === '') {
			newContent = before + cmd.insert + after;
		} else {
			newContent = content.slice(0, slashStartPos) + cmd.insert + content.slice(slashStartPos);
		}

		onContentChange(newContent);
		slashOpen = false;
		slashFilter = '';

		requestAnimationFrame(() => {
			textareaEl.focus();
			if (cmd.selectFrom !== undefined && cmd.selectTo !== undefined) {
				const base = slashText.trim() === '' ? lineStart : slashStartPos;
				textareaEl.setSelectionRange(base + cmd.selectFrom, base + cmd.selectTo);
			} else {
				const pos = (slashText.trim() === '' ? lineStart : slashStartPos) + cmd.insert.length;
				textareaEl.setSelectionRange(pos, pos);
			}
		});
	}

	function getCaretCoords() {
		const pos = textareaEl.selectionStart;
		const textBefore = content.slice(0, pos);
		const lines = textBefore.split('\n');
		const lineNumber = lines.length - 1;
		const lineHeight = parseFloat(getComputedStyle(textareaEl).lineHeight) || 24;
		const paddingTop = parseFloat(getComputedStyle(textareaEl).paddingTop) || 0;
		const paddingLeft = parseFloat(getComputedStyle(textareaEl).paddingLeft) || 0;

		const top = paddingTop + lineNumber * lineHeight + lineHeight;
		const charWidth = 8;
		const left = paddingLeft + (lines[lineNumber]?.length ?? 0) * charWidth;

		return { top: Math.min(top, textareaEl.clientHeight - 40), left: Math.min(left, textareaEl.clientWidth - 200) };
	}

	function handleInput(e: Event) {
		const textarea = e.target as HTMLTextAreaElement;
		onContentChange(textarea.value);

		const pos = textarea.selectionStart;
		const textBefore = textarea.value.slice(0, pos);
		const lastNewline = textBefore.lastIndexOf('\n');
		const currentLine = textBefore.slice(lastNewline + 1);

		const slashMatch = currentLine.match(/\/([^\s]*)$/);
		if (slashMatch) {
			slashStartPos = pos - slashMatch[0].length;
			slashFilter = slashMatch[1];
			slashIndex = 0;
			slashPos = getCaretCoords();
			slashOpen = true;
		} else {
			slashOpen = false;
			slashFilter = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (slashOpen) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				slashIndex = (slashIndex + 1) % filteredCommands.length;
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				slashIndex = (slashIndex - 1 + filteredCommands.length) % filteredCommands.length;
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (filteredCommands.length > 0) {
					const lineStart = content.lastIndexOf('\n', slashStartPos - 1) + 1;
					const textBeforeSlash = content.slice(lineStart, slashStartPos);
					const pos = textareaEl.selectionStart;
					const newContent = content.slice(0, slashStartPos - (textBeforeSlash.trim() === '' ? slashStartPos - lineStart : 0)) + content.slice(pos);
					onContentChange(newContent);
					slashStartPos = slashStartPos - (textBeforeSlash.trim() === '' ? slashStartPos - lineStart : 0);
					requestAnimationFrame(() => applySlashCommand(filteredCommands[slashIndex]));
				}
			} else if (e.key === 'Escape') {
				e.preventDefault();
				slashOpen = false;
				slashFilter = '';
			}
			return;
		}

		if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
			switch (e.key) {
				case 'b':
					e.preventDefault();
					insertMarkdown('**', '**', 'テキスト');
					break;
				case 'i':
					e.preventDefault();
					insertMarkdown('*', '*', 'テキスト');
					break;
				case 'k':
					e.preventDefault();
					insertMarkdown('[', '](url)', 'テキスト');
					break;
				case 'e':
					e.preventDefault();
					insertMarkdown('`', '`', 'コード');
					break;
			}
		}
	}

	interface ToolbarItem {
		label: string;
		title: string;
		action: () => void;
		bold?: boolean;
		italic?: boolean;
		strike?: boolean;
	}

	const toolbarItems: ToolbarItem[] = [
		{ label: 'H1', title: '見出し1', action: () => insertMarkdown('# ', '', '') },
		{ label: 'H2', title: '見出し2', action: () => insertMarkdown('## ', '', '') },
		{ label: 'H3', title: '見出し3', action: () => insertMarkdown('### ', '', '') },
		{ label: 'B', title: '太字 (Ctrl+B)', action: () => insertMarkdown('**', '**', 'テキスト'), bold: true },
		{ label: 'I', title: '斜体 (Ctrl+I)', action: () => insertMarkdown('*', '*', 'テキスト'), italic: true },
		{ label: 'S', title: '取り消し線', action: () => insertMarkdown('~~', '~~', 'テキスト'), strike: true },
		{ label: '🔗', title: 'リンク (Ctrl+K)', action: () => insertMarkdown('[', '](url)', 'テキスト') },
		{ label: '<>', title: 'コード (Ctrl+E)', action: () => insertMarkdown('`', '`', 'コード') },
		{ label: '```', title: 'コードブロック', action: () => insertMarkdown('```\n', '\n```', 'code') },
		{ label: '•', title: '箇条書き', action: () => insertMarkdown('- ', '', '') },
		{ label: '1.', title: '番号付きリスト', action: () => insertMarkdown('1. ', '', '') },
		{ label: '☐', title: 'チェックリスト', action: () => insertMarkdown('- [ ] ', '', '') },
		{ label: '❝', title: '引用', action: () => insertMarkdown('> ', '', '') },
		{ label: '─', title: '水平線', action: () => insertMarkdown('---\n', '', '') },
	];
</script>

<div class="editor">
	<input
		type="text"
		class="title-input"
		value={title}
		oninput={(e) => onTitleChange((e.target as HTMLInputElement).value)}
		placeholder="タイトル"
	/>

	<div class="toolbar">
		{#each toolbarItems as item}
			<button
				class="toolbar-btn"
				class:bold={item.bold}
				class:italic={item.italic}
				class:strike={item.strike}
				title={item.title}
				onmousedown={(e) => e.preventDefault()}
				onclick={item.action}
			>{item.label}</button>
		{/each}
		<span class="toolbar-hint">/ でコマンド入力</span>
	</div>

	<div class="panes">
		<div class="pane edit-pane">
			<div class="pane-header">編集</div>
			<div class="textarea-wrapper">
				<textarea
					class="content-textarea"
					bind:this={textareaEl}
					value={content}
					oninput={handleInput}
					onkeydown={handleKeydown}
					onblur={() => setTimeout(() => { slashOpen = false; }, 150)}
					placeholder="Markdownで記述... 「/」でコマンド一覧"
				></textarea>
				{#if slashOpen && filteredCommands.length > 0}
					<div class="slash-menu" style="top: {slashPos.top}px; left: {slashPos.left}px;">
						{#each filteredCommands as cmd, i}
							<button
								class="slash-item"
								class:selected={i === slashIndex}
								onmousedown={(e) => e.preventDefault()}
								onclick={() => {
									const lineStart = content.lastIndexOf('\n', slashStartPos - 1) + 1;
									const textBeforeSlash = content.slice(lineStart, slashStartPos);
									const pos = textareaEl.selectionStart;
									const newContent = content.slice(0, slashStartPos - (textBeforeSlash.trim() === '' ? slashStartPos - lineStart : 0)) + content.slice(pos);
									onContentChange(newContent);
									slashStartPos = slashStartPos - (textBeforeSlash.trim() === '' ? slashStartPos - lineStart : 0);
									requestAnimationFrame(() => applySlashCommand(cmd));
								}}
							>
								<span class="slash-label">{cmd.label}</span>
								<span class="slash-desc">{cmd.description}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
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

	.toolbar {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 0.375rem 0.5rem;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		flex-wrap: wrap;
	}

	.toolbar-btn {
		padding: 0.25rem 0.5rem;
		background: none;
		border: 1px solid transparent;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		color: #495057;
		font-family: 'SF Mono', 'Fira Code', monospace;
		line-height: 1.4;
	}

	.toolbar-btn:hover {
		background: #e9ecef;
		border-color: #dee2e6;
	}

	.toolbar-btn.bold { font-weight: 700; }
	.toolbar-btn.italic { font-style: italic; }
	.toolbar-btn.strike { text-decoration: line-through; }

	.toolbar-hint {
		margin-left: auto;
		font-size: 0.6875rem;
		color: #adb5bd;
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

	.textarea-wrapper {
		flex: 1;
		position: relative;
		display: flex;
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

	.slash-menu {
		position: absolute;
		z-index: 10;
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
		max-height: 260px;
		overflow-y: auto;
		width: 240px;
	}

	.slash-item {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		gap: 1px;
	}

	.slash-item:hover,
	.slash-item.selected {
		background: #f1f3f5;
	}

	.slash-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #212529;
	}

	.slash-desc {
		font-size: 0.6875rem;
		color: #868e96;
		font-family: 'SF Mono', 'Fira Code', monospace;
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
