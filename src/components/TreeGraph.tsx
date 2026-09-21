import React, { useRef, useState, useEffect, useMemo } from 'react';
import { hierarchy, tree, HierarchyNode } from 'd3-hierarchy';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Edit2,
  Trash2,
  FilePlus,
  FolderPlus,
  Eye,
} from 'lucide-react';
import { TreeNode, TreeFilterOptions } from '../types';
import { filterTree } from '../utils/treeParser';
import { getFileMeta, formatFileSize } from '../utils/fileIcons';

interface TreeGraphProps {
  rootNode: TreeNode;
  options: TreeFilterOptions;
  searchQuery: string;
  selectedNodeId: string | null;
  onSelectNode: (node: TreeNode | null) => void;
  onToggleCollapse: (nodeId: string) => void;
  onAddNode: (parentId: string, type: 'file' | 'directory') => void;
  onRenameNode: (node: TreeNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onEditComment: (node: TreeNode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

interface LayoutNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  comment?: string;
  collapsed?: boolean;
  rawNode: TreeNode;
  x: number;
  y: number;
  depth: number;
  hasChildren: boolean;
  childrenCount: number;
  visibleChildrenCount: number;
}

interface LayoutLink {
  id: string;
  source: LayoutNode;
  target: LayoutNode;
  pathD: string;
}

const THEME_STYLES = {
  bg: '#0b0f19',
  grid: '#1e293b',
  link: '#334155',
  linkActive: '#38bdf8',
  nodeBg: '#161e2e',
  nodeBorder: '#293548',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  accent: '#38bdf8',
};

export const TreeGraph: React.FC<TreeGraphProps> = ({
  rootNode,
  options,
  searchQuery,
  selectedNodeId,
  onSelectNode,
  onToggleCollapse,
  onAddNode,
  onRenameNode,
  onDeleteNode,
  onEditComment,
  onExpandAll,
  onCollapseAll,
  svgRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Pan and zoom transform
  const [transform, setTransform] = useState({ x: 80, y: 80, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Update container size
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 600),
          height: Math.max(rect.height, 500),
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter root based on tree options & gitignore
  const filteredRoot = useMemo(() => {
    const filtered = filterTree(rootNode, options, 0);
    return filtered || rootNode;
  }, [rootNode, options]);

  // Compute Layout (Horizontal Node-Link Tree with Bezier Curves)
  const { nodes, links, bounds } = useMemo(() => {
    if (!filteredRoot) {
      return { nodes: [], links: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } };
    }

    const d3Hierarchy = hierarchy<TreeNode>(filteredRoot, (d) => {
      if (d.collapsed) return null;
      return d.children;
    });

    const nodeHeight = 52;
    const levelWidth = 240;

    const treeLayout = tree<TreeNode>()
      .nodeSize([nodeHeight, levelWidth])
      .separation((a, b) => (a.parent === b.parent ? 1.15 : 1.35));

    const treeData = treeLayout(d3Hierarchy);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const layoutNodes: LayoutNode[] = treeData.descendants().map((d) => {
      const posX = d.y;
      const posY = d.x;

      if (posX < minX) minX = posX;
      if (posX > maxX) maxX = posX;
      if (posY < minY) minY = posY;
      if (posY > maxY) maxY = posY;

      const totalChildren = d.data.children ? d.data.children.length : 0;
      const visibleChildren = d.children ? d.children.length : 0;

      return {
        id: d.data.id,
        name: d.data.name,
        type: d.data.type,
        size: d.data.size,
        comment: d.data.comment,
        collapsed: !!d.data.collapsed,
        rawNode: d.data,
        x: posX,
        y: posY,
        depth: d.depth,
        hasChildren: totalChildren > 0,
        childrenCount: totalChildren,
        visibleChildrenCount: visibleChildren,
      };
    });

    const nodeMap = new Map<string, LayoutNode>();
    layoutNodes.forEach((n) => nodeMap.set(n.id, n));

    const layoutLinks: LayoutLink[] = treeData.links().map((l) => {
      const source = nodeMap.get(l.source.data.id)!;
      const target = nodeMap.get(l.target.data.id)!;

      const sx = source.x + 145;
      const sy = source.y;
      const tx = target.x;
      const ty = target.y;
      const midX = (sx + tx) / 2;

      return {
        id: `${source.id}-${target.id}`,
        source,
        target,
        pathD: `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`,
      };
    });

    return {
      nodes: layoutNodes,
      links: layoutLinks,
      bounds: {
        minX: isFinite(minX) ? minX : 0,
        maxX: isFinite(maxX) ? maxX + 240 : 500,
        minY: isFinite(minY) ? minY : 0,
        maxY: isFinite(maxY) ? maxY + 60 : 400,
      },
    };
  }, [filteredRoot]);

  // Fit to screen handler
  const handleFitToScreen = () => {
    if (nodes.length === 0) return;
    const padding = 80;
    const contentWidth = bounds.maxX - bounds.minX + 240;
    const contentHeight = bounds.maxY - bounds.minY + 100;

    const scaleX = (dimensions.width - padding * 2) / Math.max(contentWidth, 1);
    const scaleY = (dimensions.height - padding * 2) / Math.max(contentHeight, 1);
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.2);

    const midY = (bounds.minY + bounds.maxY) / 2;
    setTransform({
      k: scale,
      x: 60,
      y: dimensions.height / 2 - midY * scale,
    });
  };

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setTransform((prev) => ({
      ...prev,
      k: Math.min(Math.max(prev.k + delta, 0.2), 3),
    }));
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((prev) => {
      const newK = Math.min(Math.max(prev.k * zoomFactor, 0.2), 3);
      const rect = containerRef.current?.getBoundingClientRect();
      const cursorX = rect ? e.clientX - rect.left : dimensions.width / 2;
      const cursorY = rect ? e.clientY - rect.top : dimensions.height / 2;

      return {
        k: newK,
        x: cursorX - (cursorX - prev.x) * (newK / prev.k),
        y: cursorY - (cursorY - prev.y) * (newK / prev.k),
      };
    });
  };

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  return (
    <div
      ref={containerRef}
      id="tree-graph-container"
      className="relative w-full h-full select-none overflow-hidden"
      style={{ backgroundColor: THEME_STYLES.bg }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background dot grid pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <defs>
          <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill={THEME_STYLES.grid} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* Floating Canvas Controls (Clean & Compact) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 p-1 rounded-xl backdrop-blur-md bg-slate-900/85 border border-slate-800 shadow-xl">
        <button
          onClick={() => handleZoom(0.15)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="放大视野"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="缩小视野"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitToScreen}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="适应当前视野居中"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTransform({ x: 60, y: 100, k: 1 })}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="重置缩放位移"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />
        <button
          onClick={onExpandAll}
          className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
          title="展开全部目录"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>展开</span>
        </button>
        <button
          onClick={onCollapseAll}
          className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
          title="折叠全部目录"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          <span>折叠</span>
        </button>
      </div>

      {/* Floating In-Place Action Bar for Selected Node */}
      {selectedNode && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 p-1.5 px-3 rounded-xl backdrop-blur-md bg-slate-900/90 border border-sky-500/30 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <span className="text-xs font-mono font-semibold text-white truncate max-w-[140px]">
              {selectedNode.name}
            </span>
            <span className="text-[10px] font-mono text-sky-400">
              {selectedNode.type === 'directory' ? '目录' : '文件'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {selectedNode.type === 'directory' && (
              <>
                <button
                  onClick={() => onAddNode(selectedNode.id, 'file')}
                  className="px-2 py-1 text-xs text-slate-300 hover:text-emerald-300 hover:bg-slate-800 rounded-lg flex items-center gap-1"
                  title="添加子文件"
                >
                  <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+文件</span>
                </button>
                <button
                  onClick={() => onAddNode(selectedNode.id, 'directory')}
                  className="px-2 py-1 text-xs text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded-lg flex items-center gap-1"
                  title="添加子目录"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
                  <span>+目录</span>
                </button>
                <button
                  onClick={() => onToggleCollapse(selectedNode.id)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="折叠/展开"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              </>
            )}

            <button
              onClick={() => onEditComment(selectedNode.rawNode)}
              className="px-2 py-1 text-xs text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded-lg flex items-center gap-1"
              title="设置说明备注（用于 README 生成）"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedNode.comment ? '改备注' : '加备注'}</span>
            </button>

            <button
              onClick={() => onRenameNode(selectedNode.rawNode)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg"
              title="重命名"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {selectedNode.id !== rootNode.id && (
              <button
                onClick={() => onDeleteNode(selectedNode.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                title="删除节点"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onSelectNode(null)}
              className="text-[11px] text-slate-500 hover:text-slate-300 ml-1"
              title="关闭操作面板"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main SVG Canvas */}
      <svg
        ref={svgRef}
        id="tree-svg-canvas"
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ width: '100%', height: '100%' }}
        onClick={() => onSelectNode(null)}
      >
        <defs>
          <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
          </linearGradient>
          <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#38bdf8" floodOpacity="0.3" />
          </filter>
        </defs>

        <g
          className="tree-content"
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
        >
          {/* Tree Links */}
          <g className="tree-links">
            {links.map((link) => {
              const isSelected =
                link.source.id === selectedNodeId || link.target.id === selectedNodeId;

              return (
                <path
                  key={link.id}
                  d={link.pathD}
                  fill="none"
                  stroke={isSelected ? THEME_STYLES.linkActive : THEME_STYLES.link}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeOpacity={isSelected ? 0.9 : 0.65}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
              );
            })}
          </g>

          {/* Node Cards */}
          <g className="tree-nodes">
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const isDir = node.type === 'directory';
              const fileMeta = getFileMeta(node.name, isDir);
              const isMatch =
                searchQuery.trim() !== '' &&
                node.name.toLowerCase().includes(searchQuery.toLowerCase());

              const cardWidth = 175;
              const cardHeight = 38;
              const cardX = node.x;
              const cardY = node.y - cardHeight / 2;

              return (
                <g
                  key={node.id}
                  transform={`translate(${cardX}, ${cardY})`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.rawNode);
                  }}
                >
                  {/* Card Container Rect */}
                  <rect
                    width={cardWidth}
                    height={cardHeight}
                    rx="8"
                    fill={isSelected ? fileMeta.bgColor : THEME_STYLES.nodeBg}
                    stroke={
                      isMatch
                        ? '#f59e0b'
                        : isSelected
                        ? fileMeta.color
                        : THEME_STYLES.nodeBorder
                    }
                    strokeWidth={isSelected || isMatch ? 2 : 1}
                    className="transition-all duration-150 group-hover:stroke-sky-400/80"
                    filter={isSelected ? 'url(#node-glow)' : undefined}
                  />

                  {/* Left Color Accent Stripe */}
                  <rect
                    x="0"
                    y="0"
                    width="3.5"
                    height={cardHeight}
                    rx="2"
                    fill={fileMeta.color}
                  />

                  {/* Category / Extension Icon */}
                  <g transform="translate(10, 10)">
                    {isDir ? (
                      node.collapsed ? (
                        <Folder className="w-4 h-4 text-sky-400" />
                      ) : (
                        <FolderOpen className="w-4 h-4 text-sky-400" />
                      )
                    ) : fileMeta.category === 'code' ? (
                      <FileCode className="w-4 h-4" style={{ color: fileMeta.color }} />
                    ) : fileMeta.category === 'document' || fileMeta.category === 'data' ? (
                      <FileText className="w-4 h-4" style={{ color: fileMeta.color }} />
                    ) : (
                      <File className="w-4 h-4" style={{ color: fileMeta.color }} />
                    )}
                  </g>

                  {/* Node Name */}
                  <text
                    x="32"
                    y="23"
                    fontSize="12"
                    fontWeight={isDir ? '600' : '500'}
                    fill={isMatch ? '#fbbf24' : isSelected ? '#ffffff' : THEME_STYLES.textPrimary}
                    className="font-mono select-none"
                    style={{ letterSpacing: '-0.2px' }}
                  >
                    {node.name.length > 15 ? `${node.name.substring(0, 14)}…` : node.name}
                  </text>

                  {/* Directory item count badge or File size */}
                  {isDir ? (
                    <g
                      transform={`translate(${cardWidth - 26}, 8)`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollapse(node.id);
                      }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <rect
                        x="-2"
                        y="0"
                        width="22"
                        height="18"
                        rx="4"
                        fill={node.collapsed ? '#0284c7' : 'rgba(56, 189, 248, 0.15)'}
                        stroke="rgba(56, 189, 248, 0.3)"
                        strokeWidth="1"
                      />
                      <text
                        x="9"
                        y="13"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="600"
                        fill={node.collapsed ? '#ffffff' : '#38bdf8'}
                        className="font-mono select-none"
                      >
                        {node.childrenCount}
                      </text>
                    </g>
                  ) : node.size !== undefined ? (
                    <text
                      x={cardWidth - 8}
                      y="23"
                      textAnchor="end"
                      fontSize="9"
                      fill={THEME_STYLES.textSecondary}
                      className="font-mono select-none opacity-80"
                    >
                      {formatFileSize(node.size)}
                    </text>
                  ) : null}

                  {/* Inline Comment Tag if present */}
                  {node.comment && (
                    <g transform={`translate(${cardWidth + 8}, 8)`}>
                      <rect
                        x="0"
                        y="0"
                        width={Math.min(node.comment.length * 11 + 18, 160)}
                        height="20"
                        rx="4"
                        fill="rgba(245, 158, 11, 0.12)"
                        stroke="rgba(245, 158, 11, 0.3)"
                        strokeWidth="1"
                      />
                      <text
                        x="6"
                        y="14"
                        fontSize="10"
                        fill="#fbbf24"
                        className="font-sans select-none"
                      >
                        # {node.comment.length > 13 ? `${node.comment.slice(0, 12)}…` : node.comment}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
};
