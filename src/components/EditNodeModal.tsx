import React, { useState, useEffect } from 'react';
import { FilePlus, FolderPlus, Edit2, X, AlertCircle } from 'lucide-react';
import { TreeNode, NodeType } from '../types';

interface EditNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'rename';
  targetNode: TreeNode | null;
  defaultType?: NodeType;
  onConfirmAdd: (parentId: string, node: { name: string; type: NodeType; size?: number }) => void;
  onConfirmRename: (nodeId: string, newName: string) => void;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({
  isOpen,
  onClose,
  mode,
  targetNode,
  defaultType = 'file',
  onConfirmAdd,
  onConfirmRename,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<NodeType>(defaultType);
  const [sizeInput, setSizeInput] = useState('1024');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'rename' && targetNode) {
      setName(targetNode.name);
      setType(targetNode.type);
    } else {
      setName(defaultType === 'directory' ? 'new-folder' : 'new-file.ts');
      setType(defaultType);
      setSizeInput('1024');
    }
    setError(null);
  }, [isOpen, mode, targetNode, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('名称不能为空');
      return;
    }

    if (cleanName.includes('/') || cleanName.includes('\\')) {
      setError('名称不能包含斜杠路径字符');
      return;
    }

    if (mode === 'rename' && targetNode) {
      onConfirmRename(targetNode.id, cleanName);
      onClose();
    } else if (mode === 'add' && targetNode) {
      const parsedSize = type === 'file' ? parseInt(sizeInput, 10) || 0 : undefined;
      onConfirmAdd(targetNode.id, {
        name: cleanName,
        type,
        size: parsedSize,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {mode === 'rename' ? (
                <Edit2 className="w-5 h-5" />
              ) : type === 'directory' ? (
                <FolderPlus className="w-5 h-5" />
              ) : (
                <FilePlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {mode === 'rename'
                  ? '重命名节点'
                  : `在 "${targetNode?.name || '根目录'}" 下添加节点`}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'add' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                节点类型：
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('file');
                    if (name === 'new-folder') setName('new-file.ts');
                  }}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    type === 'file'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <FilePlus className="w-4 h-4" />
                  <span>文件 (File)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('directory');
                    if (name.includes('.')) setName('new-folder');
                  }}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    type === 'directory'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>目录 (Directory)</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              节点名称：
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder={type === 'directory' ? 'folder-name' : 'filename.ext'}
            />
          </div>

          {mode === 'add' && type === 'file' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                模拟文件大小 (Bytes，可选)：
              </label>
              <input
                type="number"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                placeholder="1024"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/20 transition-all"
            >
              {mode === 'rename' ? '确认重命名' : '添加节点'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
