import React, { useState, useRef } from 'react';
import {
  FolderUp,
  FileArchive,
  FileText,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { TreeNode } from '../types';
import { parseFileList, parseZipArchive, parseTreeText } from '../utils/treeParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTree: (tree: TreeNode, gitignoreRules?: string[]) => void;
}

type TabType = 'folder' | 'zip' | 'text';

const SAMPLE_TEXT = `my-app
├── src
│   ├── components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Modal.tsx
│   ├── utils
│   │   └── api.ts
│   ├── App.tsx
│   └── main.tsx
├── public
│   └── favicon.ico
├── package.json
└── README.md`;

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportTree,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('folder');
  const [pasteText, setPasteText] = useState(SAMPLE_TEXT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Folder Upload Handler
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const fileArray = Array.from(files);
      const { root, gitignoreRules } = await parseFileList(fileArray);
      onImportTree(root, gitignoreRules);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析文件夹失败');
    } finally {
      setLoading(false);
    }
  };

  // ZIP Upload Handler
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const { root, gitignoreRules } = await parseZipArchive(buffer, file.name);
      onImportTree(root, gitignoreRules);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析 ZIP 压缩包失败');
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Handler
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);

    const files = e.dataTransfer.files;

    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
      // Zip dropped
      setLoading(true);
      try {
        const buffer = await files[0].arrayBuffer();
        const { root, gitignoreRules } = await parseZipArchive(buffer, files[0].name);
        onImportTree(root, gitignoreRules);
        onClose();
      } catch (err) {
        setError('ZIP 解析失败');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (files.length > 0) {
      setLoading(true);
      try {
        const fileList = Array.from(files);
        const { root, gitignoreRules } = await parseFileList(fileList);
        onImportTree(root, gitignoreRules);
        onClose();
      } catch (err) {
        setError('读取文件失败');
      } finally {
        setLoading(false);
      }
    }
  };

  // Text Import Handler
  const handleTextImport = () => {
    if (!pasteText.trim()) {
      setError('请输入内容');
      return;
    }
    setLoading(true);
    try {
      const tree = parseTreeText(pasteText);
      onImportTree(tree);
      onClose();
    } catch (err) {
      setError('文本解析失败，请检查格式');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">导入项目目录</h3>
              <p className="text-xs text-slate-400">支持上传本地项目目录、ZIP 压缩包或粘贴 tree 命令行文本</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('folder')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'folder'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>上传项目文件夹</span>
          </button>
          <button
            onClick={() => setActiveTab('zip')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'zip'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileArchive className="w-4 h-4" />
            <span>上传 ZIP 压缩包</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'text'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>粘贴 Tree 文本 / 路径</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'folder' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => folderInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-700/80 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is standard in Chromium/Safari/Firefox
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
                onChange={handleFolderUpload}
              />
              <div className="p-4 rounded-2xl bg-sky-500/10 text-sky-400 mb-3">
                <FolderUp className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                点击选择或将项目文件夹拖到此处
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                纯浏览器本地解析，文件内容绝不会上传到服务器，保障代码数据隐私安全
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/20"
              >
                选择本地文件夹
              </button>
            </div>
          )}

          {activeTab === 'zip' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => zipInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-700/80 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleZipUpload}
              />
              <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 mb-3">
                <FileArchive className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                点击选择或将 .zip 压缩包拖入
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                自动解压并保留完整层级结构与文件大小
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20"
              >
                选择 .zip 文件
              </button>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  粘贴 Linux tree 输出 / 路径列表 (如 `src/App.tsx`) / 缩进文本：
                </label>
                <button
                  type="button"
                  onClick={() => setPasteText(SAMPLE_TEXT)}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>填入示例</span>
                </button>
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={11}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="粘贴 tree 命令输出，或者逐行路径..."
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleTextImport}
                  disabled={loading}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/20 transition-all"
                >
                  {loading ? '解析中...' : '生成树状图'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
