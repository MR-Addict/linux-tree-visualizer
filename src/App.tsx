import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { TreeGraph } from './components/TreeGraph';
import { TerminalView } from './components/TerminalView';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { ReadmeModal } from './components/ReadmeModal';
import { CommentModal } from './components/CommentModal';
import { EditNodeModal } from './components/EditNodeModal';
import { PRESETS } from './data/presets';
import {
  TreeNode,
  TreeFilterOptions,
  ViewMode,
  NodeType,
} from './types';
import {
  addNodeToTree,
  removeNodeFromTree,
  renameNodeInTree,
  toggleNodeCollapseInTree,
  setAllCollapseInTree,
  parseFileList,
  parseZipArchive,
  setNodeCommentInTree,
  DEFAULT_GITIGNORE_RULES,
} from './utils/treeParser';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Main Tree State (default to Vite+React sample)
  const [treeData, setTreeData] = useState<TreeNode>(PRESETS[0].data);
  const [currentPresetId, setCurrentPresetId] = useState<string | undefined>(PRESETS[0].id);

  // Filter and CLI Tree options
  const [options, setOptions] = useState<TreeFilterOptions>({
    maxLevel: 0,
    showHidden: false,
    dirsOnly: false,
    showIndicators: true,
    ignorePattern: '',
    charset: 'utf-8',
    showSizes: true,
    fullPath: false,
    useGitignore: true,
    gitignoreRules: [...DEFAULT_GITIGNORE_RULES],
  });

  // View state & Search (defaults to Terminal CLI view for text-first editing)
  const [viewMode, setViewMode] = useState<ViewMode>('cli');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [commentModalNode, setCommentModalNode] = useState<TreeNode | null>(null);

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'rename';
    targetNode: TreeNode | null;
    defaultType: NodeType;
  }>({
    isOpen: false,
    mode: 'add',
    targetNode: null,
    defaultType: 'file',
  });

  // Global drag-over indicator
  const [isWindowDragOver, setIsWindowDragOver] = useState(false);

  // SVG ref for export
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Options updater
  const handleOptionsChange = (newOptions: Partial<TreeFilterOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  };

  // Preset switch (导入示例)
  const handleSelectPreset = (presetId: string) => {
    const found = PRESETS.find((p) => p.id === presetId);
    if (found) {
      setTreeData(JSON.parse(JSON.stringify(found.data)));
      setCurrentPresetId(presetId);
      setSelectedNode(null);
      showToast(`已导入示例工程：${found.name}（已覆盖当前工作区）`);
    }
  };

  // Node collapse
  const handleToggleCollapse = (nodeId: string) => {
    setTreeData((prev) => toggleNodeCollapseInTree(prev, nodeId));
  };

  const handleExpandAll = () => {
    setTreeData((prev) => setAllCollapseInTree(prev, false));
  };

  const handleCollapseAll = () => {
    setTreeData((prev) => setAllCollapseInTree(prev, true));
  };

  // Node CRUD operations
  const handleOpenAddNode = (parentId?: string, type: NodeType = 'file') => {
    const target = parentId
      ? findNodeById(treeData, parentId)
      : selectedNode?.type === 'directory'
      ? selectedNode
      : treeData;
    setEditModal({
      isOpen: true,
      mode: 'add',
      targetNode: target || treeData,
      defaultType: type,
    });
  };

  const handleOpenRename = (node: TreeNode) => {
    setEditModal({
      isOpen: true,
      mode: 'rename',
      targetNode: node,
      defaultType: node.type,
    });
  };

  const handleConfirmAdd = (
    parentId: string,
    nodeData: { name: string; type: NodeType; size?: number }
  ) => {
    setTreeData((prev) =>
      addNodeToTree(prev, parentId, {
        name: nodeData.name,
        type: nodeData.type,
        size: nodeData.size,
      })
    );
    showToast(`已添加节点：${nodeData.name}`);
  };

  const handleConfirmRename = (nodeId: string, newName: string) => {
    setTreeData((prev) => renameNodeInTree(prev, nodeId, newName));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode((prev) => (prev ? { ...prev, name: newName } : null));
    }
    showToast(`已重命名为：${newName}`);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === treeData.id) {
      return;
    }
    setTreeData((prev) => removeNodeFromTree(prev, nodeId));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
    showToast(`已删除节点`);
  };

  const handleSaveComment = (nodeId: string, comment: string) => {
    setTreeData((prev) => setNodeCommentInTree(prev, nodeId, comment));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode((prev) => (prev ? { ...prev, comment: comment || undefined } : null));
    }
    showToast(comment ? '已更新说明备注' : '已清除备注');
  };

  // Window drag and drop handlers for effortless file/folder import
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.clientX <= 0 || e.clientY <= 0) {
        setIsWindowDragOver(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragOver(false);

      if (!e.dataTransfer) return;
      const files = e.dataTransfer.files;

      if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
        try {
          const buffer = await files[0].arrayBuffer();
          const { root, gitignoreRules } = await parseZipArchive(buffer, files[0].name);
          setTreeData(root);
          setCurrentPresetId(undefined);
          if (gitignoreRules.length > 0) {
            setOptions((prev) => ({ ...prev, gitignoreRules }));
          }
          setSelectedNode(null);
          showToast(`成功解析压缩包：${files[0].name}`);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      if (files.length > 0) {
        try {
          const { root, gitignoreRules } = await parseFileList(Array.from(files));
          setTreeData(root);
          setCurrentPresetId(undefined);
          if (gitignoreRules.length > 0) {
            setOptions((prev) => ({ ...prev, gitignoreRules }));
          }
          setSelectedNode(null);
          showToast(`成功导入本地工程：${root.name}`);
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 font-sans">
      {/* Streamlined Single-Bar Unified Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        options={options}
        onOptionsChange={handleOptionsChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenReadme={() => setIsReadmeOpen(true)}
        onOpenAddNode={() => handleOpenAddNode()}
        onSelectPreset={handleSelectPreset}
        currentRootName={treeData.name}
        currentPresetId={currentPresetId}
      />

      {/* Main Visual Canvas Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {viewMode === 'graph' ? (
          <TreeGraph
            rootNode={treeData}
            options={options}
            searchQuery={searchQuery}
            selectedNodeId={selectedNode?.id || null}
            onSelectNode={setSelectedNode}
            onToggleCollapse={handleToggleCollapse}
            onAddNode={(parentId, type) => handleOpenAddNode(parentId, type)}
            onRenameNode={handleOpenRename}
            onDeleteNode={handleDeleteNode}
            onEditComment={(node) => setCommentModalNode(node)}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            svgRef={svgRef}
          />
        ) : (
          <TerminalView
            rootNode={treeData}
            onTreeChange={setTreeData}
            options={options}
            onOptionsChange={handleOptionsChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {/* Drag & Drop Full Screen Overlay */}
        {isWindowDragOver && (
          <div className="absolute inset-0 z-50 bg-sky-950/80 backdrop-blur-md border-4 border-dashed border-sky-400 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
            <UploadCloud className="w-16 h-16 text-sky-400 animate-bounce mb-3" />
            <h2 className="text-2xl font-bold text-white mb-1">释放以导入代码工程</h2>
            <p className="text-sm text-sky-200">
              支持直接拖入本地工程文件夹或 .zip 压缩文件，纯本地即时解析
            </p>
          </div>
        )}

        {/* Floating Toast notification */}
        {toastMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/95 border border-sky-500/40 shadow-2xl text-xs font-medium text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>

      {/* Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportTree={(newTree, detectedGitignore) => {
          setTreeData(newTree);
          setCurrentPresetId(undefined);
          if (detectedGitignore && detectedGitignore.length > 0) {
            setOptions((prev) => ({ ...prev, gitignoreRules: detectedGitignore }));
          }
          setSelectedNode(null);
          showToast(`已成功导入目录结构：${newTree.name}`);
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rootNode={treeData}
        options={options}
        svgElement={svgRef.current}
      />

      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
        rootNode={treeData}
        options={options}
      />

      <CommentModal
        isOpen={!!commentModalNode}
        onClose={() => setCommentModalNode(null)}
        node={commentModalNode}
        onSaveComment={handleSaveComment}
      />

      <EditNodeModal
        isOpen={editModal.isOpen}
        onClose={() =>
          setEditModal((prev) => ({ ...prev, isOpen: false }))
        }
        mode={editModal.mode}
        targetNode={editModal.targetNode}
        defaultType={editModal.defaultType}
        onConfirmAdd={handleConfirmAdd}
        onConfirmRename={handleConfirmRename}
      />
    </div>
  );
}

function findNodeById(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}
