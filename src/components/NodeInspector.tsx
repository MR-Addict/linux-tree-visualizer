import React from 'react';
import {
  FileCode,
  Folder,
  FolderOpen,
  X,
  FilePlus,
  FolderPlus,
  Edit2,
  Trash2,
  Eye,
  ChevronRight,
  Info,
} from 'lucide-react';
import { TreeNode } from '../types';
import { getFileMeta, formatFileSize } from '../utils/fileIcons';

interface NodeInspectorProps {
  node: TreeNode | null;
  onClose: () => void;
  onAddChild: (parentId: string, type: 'file' | 'directory') => void;
  onRename: (node: TreeNode) => void;
  onDelete: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  isRoot: boolean;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  onClose,
  onAddChild,
  onRename,
  onDelete,
  onToggleCollapse,
  isRoot,
}) => {
  if (!node) return null;

  const isDir = node.type === 'directory';
  const fileMeta = getFileMeta(node.name, isDir);

  return (
    <div className="absolute bottom-4 right-4 z-20 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl text-xs space-y-3 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="p-1.5 rounded-lg flex-shrink-0"
            style={{ backgroundColor: fileMeta.bgColor }}
          >
            {isDir ? (
              node.collapsed ? (
                <Folder className="w-4 h-4 text-sky-400" />
              ) : (
                <FolderOpen className="w-4 h-4 text-sky-400" />
              )
            ) : (
              <FileCode className="w-4 h-4" style={{ color: fileMeta.color }} />
            )}
          </div>
          <div className="truncate font-semibold text-slate-100 text-sm">
            {node.name}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meta list */}
      <div className="space-y-1.5 text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-500">类型:</span>
          <span className="text-slate-200">{isDir ? '目录 (Directory)' : '文件 (File)'}</span>
        </div>
        {node.size !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-500">文件大小:</span>
            <span className="text-slate-200">
              {formatFileSize(node.size)} ({node.size.toLocaleString()} bytes)
            </span>
          </div>
        )}
        {isDir && (
          <div className="flex justify-between">
            <span className="text-slate-500">子项数量:</span>
            <span className="text-sky-400 font-semibold">
              {node.children ? node.children.length : 0} 项
            </span>
          </div>
        )}
        {isDir && (
          <div className="flex justify-between">
            <span className="text-slate-500">折叠状态:</span>
            <span className={node.collapsed ? 'text-amber-400' : 'text-emerald-400'}>
              {node.collapsed ? '已折叠' : '已展开'}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
        {isDir && (
          <>
            <button
              onClick={() => onAddChild(node.id, 'file')}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>加文件</span>
            </button>
            <button
              onClick={() => onAddChild(node.id, 'directory')}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
              <span>加目录</span>
            </button>
            <button
              onClick={() => onToggleCollapse(node.id)}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
              title="折叠/展开"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </>
        )}

        <button
          onClick={() => onRename(node)}
          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
          <span>重命名</span>
        </button>

        {!isRoot && (
          <button
            onClick={() => onDelete(node.id)}
            className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg flex items-center justify-center gap-1 transition-colors"
            title="删除节点"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
