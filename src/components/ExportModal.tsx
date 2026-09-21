import React, { useState } from 'react';
import {
  Download,
  FileCode,
  Image as ImageIcon,
  Copy,
  Check,
  X,
  Sparkles,
  FileText,
  LayoutTemplate,
} from 'lucide-react';
import { TreeNode, TreeFilterOptions } from '../types';
import { exportSvg, exportPng, copyPngToClipboard, downloadText } from '../utils/exportUtils';
import { generateCliTree } from '../utils/treeParser';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootNode: TreeNode;
  options: TreeFilterOptions;
  svgElement: SVGSVGElement | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  rootNode,
  options,
  svgElement,
}) => {
  const [filename, setFilename] = useState(`${rootNode.name || 'tree'}-diagram`);
  const [scale, setScale] = useState<number>(2); // 2x default for crisp retina
  const [background, setBackground] = useState<string>('#0b0f19');
  const [windowFrame, setWindowFrame] = useState<boolean>(true); // Ray.so / Carbon macOS window frame
  const [isExporting, setIsExporting] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const handleExportSvg = () => {
    if (!svgElement) return;
    setIsExporting(true);
    try {
      exportSvg(svgElement, {
        filename,
        backgroundColor: background,
        windowFrame,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPng = async () => {
    if (!svgElement) return;
    setIsExporting(true);
    try {
      await exportPng(svgElement, {
        filename,
        scale,
        backgroundColor: background,
        windowFrame,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyPng = async () => {
    if (!svgElement) return;
    setIsExporting(true);
    try {
      const success = await copyPngToClipboard(svgElement, {
        filename,
        scale,
        backgroundColor: background,
        windowFrame,
      });
      if (success) {
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCli = async () => {
    const text = generateCliTree(rootNode, options);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">导出目录树图表</h3>
              <p className="text-xs text-slate-400">导出高质量矢量图 SVG、高清卡片 PNG 或文本</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Filename Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              导出文件名：
            </label>
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus-within:border-emerald-500">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="bg-transparent flex-1 focus:outline-none"
                placeholder="tree-diagram"
              />
            </div>
          </div>

          {/* Ray.so / Carbon Window Frame Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              卡片外观风格：
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWindowFrame(true)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  windowFrame
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span>macOS 窗口外框 (Ray.so 风格)</span>
              </button>
              <button
                type="button"
                onClick={() => setWindowFrame(false)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  !windowFrame
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <LayoutTemplate className="w-4 h-4" />
                <span>纯净紧凑画布</span>
              </button>
            </div>
          </div>

          {/* Background Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              底色风格：
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBackground('#0b0f19')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  background === '#0b0f19'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#0b0f19] border border-slate-700" />
                <span>深邃暗黑</span>
              </button>
              <button
                type="button"
                onClick={() => setBackground('#ffffff')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  background === '#ffffff'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300" />
                <span>明亮浅白</span>
              </button>
              <button
                type="button"
                onClick={() => setBackground('transparent')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  background === 'transparent'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full border border-dashed border-slate-500" />
                <span>透明背景</span>
              </button>
            </div>
          </div>

          {/* PNG Resolution Scale */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              PNG 分辨率：
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, label: '1x 标准' },
                { val: 2, label: '2x 高清 (推荐)' },
                { val: 3, label: '3x 超清印刷' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setScale(item.val)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    scale === item.val
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Export SVG */}
              <button
                id="btn-export-svg"
                onClick={handleExportSvg}
                disabled={isExporting || !svgElement}
                className="flex items-center justify-center gap-2 p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <FileCode className="w-4 h-4" />
                <span>导出矢量图 (.SVG)</span>
              </button>

              {/* Export PNG */}
              <button
                id="btn-export-png"
                onClick={handleExportPng}
                disabled={isExporting || !svgElement}
                className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
                <span>导出高清图片 (.PNG)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Copy Image to Clipboard */}
              <button
                onClick={handleCopyPng}
                disabled={isExporting || !svgElement}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">图片已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>复制图片到剪贴板</span>
                  </>
                )}
              </button>

              {/* Copy CLI Text */}
              <button
                onClick={handleCopyCli}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Tree 文本已复制</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>复制 Tree 文本</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
