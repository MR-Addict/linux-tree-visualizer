import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  FilePlus,
  FolderPlus,
} from 'lucide-react';
import { TreeNode } from '../types';
import { getFileMeta, formatFileSize } from '../utils/fileIcons';

interface DirectoryExplorerProps {
  rootNode: TreeNode;
  selectedNodeId: string | null;
  onSelectNode: (node: TreeNode) => void;
  onToggleCollapse: (nodeId: string) => void;
  onAddNode: (parentId: string, type: 'file' | 'directory') => void;
  onRenameNode: (node: TreeNode) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const DirectoryExplorer: React.FC<DirectoryExplorerProps> = ({
  rootNode,
  selectedNodeId,
  onSelectNode,
  onToggleCollapse,
  onAddNode,
  onRenameNode,
  onDeleteNode,
}) => {
  return (
    <div className="h-full overflow-y-auto p-4 font-mono text-sm bg-slate-900/50">
      <div className="max-w-3xl mx-auto space-y-1">
        <ExplorerNodeItem
          node={rootNode}
          depth={0}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onToggleCollapse={onToggleCollapse}
          onAddNode={onAddNode}
          onRenameNode={onRenameNode}
          onDeleteNode={onDeleteNode}
        />
      </div>
    </div>
  );
};

interface ExplorerNodeItemProps {
  node: TreeNode;
  depth: number;
  selectedNodeId: string | null;
  onSelectNode: (node: TreeNode) => void;
  onToggleCollapse: (nodeId: string) => void;
  onAddNode: (parentId: string, type: 'file' | 'directory') => void;
  onRenameNode: (node: TreeNode) => void;
  onDeleteNode: (nodeId: string) => void;
}

const ExplorerNodeItem: React.FC<ExplorerNodeItemProps> = ({
  node,
  depth,
  selectedNodeId,
  onSelectNode,
  onToggleCollapse,
  onAddNode,
  onRenameNode,
  onDeleteNode,
}) => {
  const [hovered, setHovered] = useState(false);
  const isDir = node.type === 'directory';
  const isSelected = node.id === selectedNodeId;
  const isCollapsed = !!node.collapsed;
  const fileMeta = getFileMeta(node.name, isDir);

  return (
    <div>
      <div
        className={`group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-sky-950/60 text-sky-200 border border-sky-800/60'
            : 'hover:bg-slate-800/60 text-slate-300'
        }`}
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
        onClick={() => onSelectNode(node)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Caret for directories */}
          {isDir ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(node.id);
              }}
              className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Folder / File Icon */}
          {isDir ? (
            isCollapsed ? (
              <Folder className="w-4 h-4 text-sky-400 flex-shrink-0" />
            ) : (
              <FolderOpen className="w-4 h-4 text-sky-400 flex-shrink-0" />
            )
          ) : fileMeta.category === 'code' ? (
            <FileCode className="w-4 h-4 flex-shrink-0" style={{ color: fileMeta.color }} />
          ) : (
            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: fileMeta.color }} />
          )}

          {/* Node Name */}
          <span className="truncate font-medium">{node.name}</span>

          {/* Size badge */}
          {node.size !== undefined && (
            <span className="text-[11px] text-slate-500 font-mono">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>

        {/* Action icons on hover or selected */}
        <div
          className={`flex items-center gap-1 ${
            hovered || isSelected ? 'opacity-100' : 'opacity-0'
          } transition-opacity`}
        >
          {isDir && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNode(node.id, 'file');
                }}
                className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded"
                title="添加文件"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNode(node.id, 'directory');
                }}
                className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-700/50 rounded"
                title="添加文件夹"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRenameNode(node);
            }}
            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded"
            title="重命名"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {depth > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(node.id);
              }}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Render children if directory and not collapsed */}
      {isDir && !isCollapsed && node.children && (
        <div>
          {node.children.map((child) => (
            <ExplorerNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onToggleCollapse={onToggleCollapse}
              onAddNode={onAddNode}
              onRenameNode={onRenameNode}
              onDeleteNode={onDeleteNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};
