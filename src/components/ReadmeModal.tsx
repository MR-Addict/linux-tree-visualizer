import React, { useState } from 'react';
import { Copy, Check, Download, X, FileText, Sparkles } from 'lucide-react';
import { TreeNode, TreeFilterOptions } from '../types';
import { generateReadmeMarkdown } from '../utils/treeParser';
import { downloadText } from '../utils/exportUtils';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootNode: TreeNode;
  options: TreeFilterOptions;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({
  isOpen,
  onClose,
  rootNode,
  options,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownContent = generateReadmeMarkdown(rootNode, options);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    downloadText(markdownContent, `${rootNode.name || 'project'}-structure.md`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">GitHub README 结构生成器</h3>
                <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-300 bg-amber-500/15 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> 开箱即用
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                一键生成符合规范的 Markdown 目录树代码块，附带对齐注释说明
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
          <div className="relative group">
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed selection:bg-amber-500/30">
              {markdownContent}
            </pre>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            💡 提示：您可以在图表中选中任一节点点击「加备注」，为目录或核心文件添加说明，这些备注会自动对齐显示在 Markdown 中。
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>下载 .md 文件</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              关闭
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '已复制到剪贴板！' : '复制 Markdown 代码块'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
