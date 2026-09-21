import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import {
  Copy,
  Check,
  Download,
  Terminal,
  Hash,
  Search,
  ChevronUp,
  ChevronDown,
  Columns2,
  FileCode2,
  RotateCcw,
  Sparkles,
  Indent,
  Outdent,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TreeNode, TreeFilterOptions } from '../types';
import {
  generateCliTree,
  treeToEditableText,
  parseTreeText,
  calculateTreeStats,
} from '../utils/treeParser';
import { downloadText } from '../utils/exportUtils';

interface TerminalViewProps {
  rootNode: TreeNode;
  onTreeChange?: (newTree: TreeNode) => void;
  options: TreeFilterOptions;
  onOptionsChange: (newOptions: Partial<TreeFilterOptions>) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

type ViewPaneMode = 'split' | 'edit' | 'preview';

export const TerminalView: React.FC<TerminalViewProps> = ({
  rootNode,
  onTreeChange,
  options,
  onOptionsChange,
  searchQuery = '',
}) => {
  // Default to split mode on desktop (showing both text editor and live terminal)
  const [paneMode, setPaneMode] = useState<ViewPaneMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 'split';
    }
    return 'edit';
  });

  // Text editor state: initialized from rootNode
  const [editorText, setEditorText] = useState<string>(() => treeToEditableText(rootNode));
  const [autoSync, setAutoSync] = useState(true);
  const [appliedNotice, setAppliedNotice] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Pending selection range to restore after React updates DOM (for Tab/Enter/Indent/Comment)
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    if (pendingSelectionRef.current && textareaRef.current) {
      const { start, end } = pendingSelectionRef.current;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      pendingSelectionRef.current = null;
    }
  }, [editorText]);

  // Track the tree currently in sync to prevent infinite loopback resets
  const lastEmittedTreeRef = useRef<TreeNode>(rootNode);

  // Sync editorText when rootNode changes from external source (e.g. presets import or modal)
  useEffect(() => {
    if (rootNode === lastEmittedTreeRef.current) {
      return;
    }
    lastEmittedTreeRef.current = rootNode;
    setEditorText(treeToEditableText(rootNode));
  }, [rootNode]);

  // Terminal preview state
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const previewLineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Real-time parse check on current editorText
  const parsedStats = useMemo(() => {
    try {
      if (!editorText.trim()) {
        return { valid: false, dirCount: 0, fileCount: 0, error: '文本为空', tree: null };
      }
      const tree = parseTreeText(editorText);
      const stats = calculateTreeStats(tree);
      return {
        valid: true,
        dirCount: stats.directoriesCount,
        fileCount: stats.filesCount,
        tree,
      };
    } catch (err: unknown) {
      return {
        valid: false,
        dirCount: 0,
        fileCount: 0,
        error: err instanceof Error ? err.message : '解析异常',
        tree: null,
      };
    }
  }, [editorText]);

  // Auto-sync debounced effect: sync parsed tree to parent state (e.g. for graph view / export)
  const syncTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (!autoSync || !onTreeChange || !parsedStats.valid || !parsedStats.tree) {
      return;
    }

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      if (parsedStats.tree) {
        lastEmittedTreeRef.current = parsedStats.tree;
        onTreeChange(parsedStats.tree);
      }
    }, 400);

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [editorText, autoSync, onTreeChange, parsedStats.valid, parsedStats.tree]);

  // Explicit Apply Changes
  const handleApplyText = useCallback(() => {
    if (parsedStats.valid && parsedStats.tree && onTreeChange) {
      lastEmittedTreeRef.current = parsedStats.tree;
      onTreeChange(parsedStats.tree);
      setAppliedNotice(true);
      setTimeout(() => setAppliedNotice(false), 2000);
    }
  }, [parsedStats, onTreeChange]);

  // Reset editor text to current rootNode
  const handleResetToCurrent = () => {
    lastEmittedTreeRef.current = rootNode;
    setEditorText(treeToEditableText(rootNode));
  };

  // Format editor text (clean up indentation, normalize trailing slashes)
  const handleFormatText = () => {
    try {
      const parsed = parseTreeText(editorText);
      const formatted = treeToEditableText(parsed);
      setEditorText(formatted);
      if (onTreeChange) {
        lastEmittedTreeRef.current = parsed;
        onTreeChange(parsed);
      }
    } catch {
      // ignore
    }
  };

  // Insert comment at cursor position or end of line
  const handleInsertComment = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const val = textarea.value;

    const lineEnd = val.indexOf('\n', start);
    const targetPos = lineEnd === -1 ? val.length : lineEnd;

    const currentLine = val.substring(
      val.lastIndexOf('\n', start - 1) + 1,
      targetPos
    );

    let insertText = ' # 简要说明';
    const commentWordOffset = 3; // start of '简要说明'
    const commentWordLen = 4;
    if (currentLine.includes('#')) {
      insertText = '';
    }

    const newVal = val.substring(0, targetPos) + insertText + val.substring(targetPos);
    if (insertText) {
      pendingSelectionRef.current = {
        start: targetPos + commentWordOffset,
        end: targetPos + commentWordOffset + commentWordLen,
      };
    }
    setEditorText(newVal);
  };

  // Indent / Dedent helper buttons
  const handleIndent = (dir: 'indent' | 'dedent') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = val.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = val.length;

    const selectedBlock = val.substring(lineStart, lineEnd);
    const lines = selectedBlock.split('\n');

    let modifiedBlock = '';
    if (dir === 'indent') {
      modifiedBlock = lines.map((l) => (l.trim() ? `  ${l}` : l)).join('\n');
    } else {
      modifiedBlock = lines
        .map((l) => (l.startsWith('  ') ? l.slice(2) : l.startsWith(' ') ? l.slice(1) : l))
        .join('\n');
    }

    const newVal = val.substring(0, lineStart) + modifiedBlock + val.substring(lineEnd);
    const lengthDelta = modifiedBlock.length - selectedBlock.length;
    pendingSelectionRef.current = {
      start: lineStart === start ? lineStart : Math.max(lineStart, start + (dir === 'indent' ? 2 : -2)),
      end: Math.max(lineStart, end + lengthDelta),
    };
    setEditorText(newVal);
  };

  // Keyboard shortcut handler for IDE-like editing (Tab, Shift-Tab, Enter auto-indent, Ctrl/Cmd-S)
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Dedent
        handleIndent('dedent');
      } else {
        // If text is selected across lines, indent whole block; otherwise insert 2 spaces
        if (start !== end && val.substring(start, end).includes('\n')) {
          handleIndent('indent');
        } else {
          const newVal = val.substring(0, start) + '  ' + val.substring(end);
          pendingSelectionRef.current = { start: start + 2, end: start + 2 };
          setEditorText(newVal);
        }
      }
    } else if (e.key === 'Enter') {
      // Auto-indent: preserve indentation of current line
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);
      const indentMatch = currentLine.match(/^(\s*)/);
      let indent = indentMatch ? indentMatch[1] : '';

      // If current line ends with a slash (folder), indent 2 more spaces
      if (currentLine.trim().endsWith('/')) {
        indent += '  ';
      }

      e.preventDefault();
      const insert = '\n' + indent;
      const newVal = val.substring(0, start) + insert + val.substring(end);
      pendingSelectionRef.current = {
        start: start + insert.length,
        end: start + insert.length,
      };
      setEditorText(newVal);
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      e.preventDefault();
      handleApplyText();
    }
  };

  // Synchronize line numbers scroll with textarea
  const handleEditorScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // The active tree to display in the CLI preview: prefers the live parsed tree from editorText, fallbacks to rootNode
  const activeTreeForPreview = useMemo(() => {
    if (parsedStats.valid && parsedStats.tree) {
      return parsedStats.tree;
    }
    return rootNode;
  }, [parsedStats.valid, parsedStats.tree, rootNode]);

  // Generate plain CLI tree text in real-time
  const cliText = useMemo(() => {
    return generateCliTree(activeTreeForPreview, options);
  }, [activeTreeForPreview, options]);

  // Construct CLI command string based on current options
  const cliCommand = useMemo(() => {
    const flags: string[] = ['tree'];
    if (options.maxLevel > 0) flags.push(`-L ${options.maxLevel}`);
    if (options.showHidden) flags.push('-a');
    if (options.dirsOnly) flags.push('-d');
    if (options.showIndicators) flags.push('-F');
    if (options.showSizes) flags.push('-s');
    if (options.charset === 'ascii') flags.push('--ascii');
    if (options.ignorePattern && options.ignorePattern.trim()) {
      flags.push(`-I "${options.ignorePattern.trim()}"`);
    }
    return flags.join(' ');
  }, [options]);

  const previewLines = useMemo(() => cliText.split('\n'), [cliText]);

  // Search match indices in preview
  const matchingLineIndices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const indices: number[] = [];
    previewLines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query)) {
        indices.push(idx);
      }
    });
    return indices;
  }, [previewLines, searchQuery]);

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (matchingLineIndices.length > 0 && matchingLineIndices[activeMatchIndex] !== undefined) {
      const lineIdx = matchingLineIndices[activeMatchIndex];
      const el = previewLineRefs.current[lineIdx];
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [activeMatchIndex, matchingLineIndices]);

  const handlePrevMatch = () => {
    if (matchingLineIndices.length === 0) return;
    setActiveMatchIndex((prev) => (prev > 0 ? prev - 1 : matchingLineIndices.length - 1));
  };

  const handleNextMatch = () => {
    if (matchingLineIndices.length === 0) return;
    setActiveMatchIndex((prev) => (prev < matchingLineIndices.length - 1 ? prev + 1 : 0));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cliText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadTxt = () => {
    downloadText(cliText, `${activeTreeForPreview.name || 'tree'}-structure.txt`);
  };

  const handleDownloadMd = () => {
    const markdownContent = `# Directory Structure of ${activeTreeForPreview.name}\n\n\`\`\`bash\n$ ${cliCommand}\n${cliText}\n\`\`\`\n`;
    downloadText(markdownContent, `${activeTreeForPreview.name || 'tree'}-structure.md`);
  };

  const editorLinesCount = editorText.split('\n').length;
  const activeLineIndex = matchingLineIndices.length > 0 ? matchingLineIndices[activeMatchIndex] : -1;

  return (
    <div className="flex flex-col h-full bg-[#090d13] text-slate-200 overflow-hidden select-text">
      {/* Universal Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#121721] border-b border-slate-800 flex-wrap gap-2 select-none">
        {/* Left: Window Dots & Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <div className="w-3 h-3 rounded-full bg-rose-500/90" />
            <div className="w-3 h-3 rounded-full bg-amber-500/90" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/90" />
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setPaneMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                paneMode === 'split'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="双栏分屏联动 (左侧代码编辑，右侧实时终端)"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">双栏分屏</span>
            </button>

            <button
              onClick={() => setPaneMode('edit')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                paneMode === 'edit'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="纯文本编辑视图"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>文本编辑</span>
            </button>

            <button
              onClick={() => setPaneMode('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                paneMode === 'preview'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="纯 Linux Tree 终端仿真预览"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>终端仿真</span>
            </button>
          </div>
        </div>

        {/* Right: Search indicator & Quick Tools */}
        <div className="flex items-center gap-2">
          {/* Search match stats indicator in preview */}
          {(paneMode === 'preview' || paneMode === 'split') && searchQuery.trim() !== '' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded-md text-[11px] font-mono text-amber-300">
              <Search className="w-3 h-3 text-amber-400" />
              <span>
                {matchingLineIndices.length > 0
                  ? `匹配 ${activeMatchIndex + 1}/${matchingLineIndices.length}`
                  : '无匹配'}
              </span>
              {matchingLineIndices.length > 0 && (
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    onClick={handlePrevMatch}
                    className="p-0.5 hover:bg-amber-500/30 rounded transition-colors"
                    title="上一个匹配项"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleNextMatch}
                    className="p-0.5 hover:bg-amber-500/30 rounded transition-colors"
                    title="下一个匹配项"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Copy CLI text button */}
          <button
            id="btn-copy-cli-text"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all border border-slate-700 active:scale-95"
            title="复制生成的 tree 字符代码"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-300">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>复制结果</span>
              </>
            )}
          </button>

          {/* Download Text/Markdown */}
          <button
            onClick={handleDownloadTxt}
            className="p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="下载 .txt 文本文件"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px]">.txt</span>
          </button>
          <button
            onClick={handleDownloadMd}
            className="p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="下载 .md Markdown 代码块"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px]">.md</span>
          </button>
        </div>
      </div>

      {/* Main Content Workspace: Split or Single View */}
      <div className="flex-1 flex overflow-hidden">
        {/* ======================= LEFT: TEXT EDITOR PANE ======================= */}
        {(paneMode === 'split' || paneMode === 'edit') && (
          <div
            className={`flex flex-col h-full bg-[#0d1117] border-r border-slate-800 ${
              paneMode === 'split' ? 'w-full lg:w-1/2' : 'w-full'
            }`}
          >
            {/* Editor Sub-header & Toolstrip */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-slate-800 text-xs gap-2 flex-wrap select-none">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sky-400 font-medium flex items-center gap-1">
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>文本编辑模式</span>
                </span>

                {/* Parsing Status Badge */}
                {parsedStats.valid ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {parsedStats.dirCount} 目录，{parsedStats.fileCount} 文件
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <AlertCircle className="w-3 h-3" />
                    <span>{parsedStats.error}</span>
                  </span>
                )}
              </div>

              {/* Editor Actions Toolbar */}
              <div className="flex items-center gap-1">
                {/* Indent / Dedent */}
                <button
                  onClick={() => handleIndent('indent')}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="缩进 2 空格 (Tab)"
                >
                  <Indent className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleIndent('dedent')}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="反缩进 2 空格 (Shift+Tab)"
                >
                  <Outdent className="w-3.5 h-3.5" />
                </button>

                {/* Insert Comment */}
                <button
                  onClick={handleInsertComment}
                  className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                  title="为当前行插入说明注释 (# 备注)"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>

                {/* Format Tree */}
                <button
                  onClick={handleFormatText}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title="标准化整理层级与空格"
                >
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>整理</span>
                </button>

                {/* Reset to current tree */}
                <button
                  onClick={handleResetToCurrent}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title="放弃文本修改，恢复当前工程结构"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置</span>
                </button>

                <div className="w-[1px] h-3.5 bg-slate-800 mx-1" />

                {/* Auto Sync Checkbox */}
                <label
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer select-none px-1"
                  title="开启后，编辑文本即时自动同步到图谱画布"
                >
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0 bg-slate-900 w-3 h-3"
                  />
                  <span>实时生效</span>
                </label>

                {/* Manual Apply Button */}
                <button
                  onClick={handleApplyText}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                    appliedNotice
                      ? 'bg-emerald-600 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                  }`}
                  title="应用更改 (Ctrl+S / Cmd+S)"
                >
                  {appliedNotice ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>已同步</span>
                    </>
                  ) : (
                    <span>应用</span>
                  )}
                </button>
              </div>
            </div>

            {/* Editor Textarea with Synchronized Gutter Line Numbers */}
            <div className="flex-1 flex overflow-hidden relative font-mono text-[13px] leading-relaxed">
              {/* Line Numbers Gutter */}
              <div
                ref={lineNumbersRef}
                className="w-11 py-3 bg-[#0a0d14] text-slate-600 text-right pr-3 select-none overflow-hidden border-r border-slate-800/60 font-mono text-xs leading-relaxed"
              >
                {Array.from({ length: editorLinesCount }).map((_, i) => (
                  <div key={i} className="h-[21px] leading-[21px]">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={editorText}
                onChange={(e) => {
                  setEditorText(e.target.value);
                }}
                onKeyDown={handleEditorKeyDown}
                onScroll={handleEditorScroll}
                placeholder={`my-project/\n  src/\n    components/\n      Header.tsx # 头部组件\n      App.tsx # 根视图\n    main.tsx\n  package.json\n  README.md # 说明文档`}
                spellCheck={false}
                className="flex-1 h-full p-3 bg-transparent text-slate-100 resize-none outline-none overflow-auto font-mono whitespace-pre leading-[21px] selection:bg-sky-500/30 selection:text-sky-200"
              />
            </div>

            {/* Editor Footer Tips */}
            <div className="px-3 py-1.5 bg-[#121721] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono select-none">
              <div className="flex items-center gap-3">
                <span>
                  快捷键: <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Tab</kbd> /{' '}
                  <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Shift+Tab</kbd> 缩进，
                  <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Enter</kbd> 智能回车，
                  <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Ctrl+S</kbd> 应用
                </span>
              </div>
              <span className="text-slate-500">
                以 <code className="text-sky-300">/</code> 结尾为目录，
                <code className="text-amber-300">#</code> 为备注
              </span>
            </div>
          </div>
        )}

        {/* ======================= RIGHT: TERMINAL PREVIEW PANE ======================= */}
        {(paneMode === 'split' || paneMode === 'preview') && (
          <div
            className={`flex flex-col h-full bg-[#0d1117] ${
              paneMode === 'split' ? 'w-full lg:w-1/2' : 'w-full'
            }`}
          >
            {/* Interactive Command Prompt Line */}
            <div className="px-4 py-2 bg-[#0a0e14] border-b border-slate-800/80 font-mono text-xs flex items-center justify-between gap-2 select-none">
              <div className="flex items-center gap-2 overflow-hidden truncate">
                <span className="text-emerald-400 font-semibold">user@devbox</span>
                <span className="text-slate-600">:</span>
                <span className="text-sky-400">~/{activeTreeForPreview.name}</span>
                <span className="text-slate-500">$</span>
                <span className="text-amber-300 font-medium truncate">{cliCommand}</span>
              </div>

              {/* Terminal Config Toggles */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                  className={`p-1 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
                    showLineNumbers
                      ? 'bg-slate-800 text-sky-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="显示/隐藏终端行号"
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">行号</span>
                </button>

                <button
                  onClick={() =>
                    onOptionsChange({
                      charset: options.charset === 'utf-8' ? 'ascii' : 'utf-8',
                    })
                  }
                  className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="切换 UTF-8 / ASCII 连线字符"
                >
                  {options.charset.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs sm:text-[13px] leading-relaxed select-text">
              <pre className="inline-block min-w-full">
                {previewLines.map((line, idx) => {
                  const isFooter = idx >= previewLines.length - 2;
                  const isRoot = idx === 0;
                  const isMatchingLine = matchingLineIndices.includes(idx);
                  const isActiveMatch = idx === activeLineIndex;

                  return (
                    <div
                      key={idx}
                      ref={(el) => {
                        previewLineRefs.current[idx] = el;
                      }}
                      className={`flex rounded px-1 -mx-1 transition-colors ${
                        isActiveMatch
                          ? 'bg-amber-500/25 ring-1 ring-amber-400/60'
                          : isMatchingLine
                          ? 'bg-amber-500/10'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {showLineNumbers && (
                        <span
                          className={`w-10 text-right pr-4 select-none font-mono text-[11px] ${
                            isActiveMatch
                              ? 'text-amber-300 font-bold'
                              : isMatchingLine
                              ? 'text-amber-500/80'
                              : 'text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      )}
                      <span
                        className={
                          isFooter
                            ? 'text-emerald-400 font-semibold pt-1'
                            : isRoot
                            ? 'text-sky-300 font-bold'
                            : 'text-slate-300'
                        }
                      >
                        {line}
                      </span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
