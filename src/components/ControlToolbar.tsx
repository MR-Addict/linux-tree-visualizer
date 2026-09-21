import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  EyeOff,
  FolderTree,
  FileCode,
  Palette,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { TreeFilterOptions, GraphTheme } from '../types';

interface ControlToolbarProps {
  options: TreeFilterOptions;
  onOptionsChange: (newOptions: Partial<TreeFilterOptions>) => void;
  theme: GraphTheme;
  onThemeChange: (theme: GraphTheme) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stats: {
    directoriesCount: number;
    filesCount: number;
    totalSize: number;
    maxDepth: number;
  };
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  options,
  onOptionsChange,
  theme,
  onThemeChange,
  searchQuery,
  onSearchChange,
  stats,
}) => {
  const [showIgnoreInput, setShowIgnoreInput] = useState(false);

  // Common quick ignore shortcuts
  const toggleIgnorePreset = (tag: string) => {
    const current = options.ignorePattern || '';
    let parts = current ? current.split('|').map((s) => s.trim()).filter(Boolean) : [];

    if (parts.includes(tag)) {
      parts = parts.filter((p) => p !== tag);
    } else {
      parts.push(tag);
    }

    onOptionsChange({ ignorePattern: parts.join('|') });
  };

  const isIgnoring = (tag: string) => {
    return (options.ignorePattern || '').split('|').includes(tag);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left side: Search & Linux Tree Flags */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索文件 / 目录..."
            className="pl-8 pr-7 py-1.5 w-44 md:w-52 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-[1px] h-4 bg-slate-800 mx-1 hidden sm:block" />

        {/* Max Level (-L) selector */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <span className="text-[11px] font-mono text-slate-400 px-1.5 select-none" title="层级深度限制 (-L)">
            -L
          </span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              onClick={() => onOptionsChange({ maxLevel: lvl })}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                options.maxLevel === lvl
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {lvl === 0 ? '全部' : lvl}
            </button>
          ))}
        </div>

        {/* Hidden Files (-a) Toggle */}
        <button
          onClick={() => onOptionsChange({ showHidden: !options.showHidden })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors font-mono ${
            options.showHidden
              ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
          }`}
          title="显示隐藏文件和目录 (-a)"
        >
          {options.showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>-a 隐藏文件</span>
        </button>

        {/* Directories Only (-d) Toggle */}
        <button
          onClick={() => onOptionsChange({ dirsOnly: !options.dirsOnly })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors font-mono ${
            options.dirsOnly
              ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
          }`}
          title="仅显示目录 (-d)"
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>-d 仅目录</span>
        </button>

        {/* File Indicators (-F) Toggle */}
        <button
          onClick={() => onOptionsChange({ showIndicators: !options.showIndicators })}
          className={`px-2 py-1.5 rounded-lg border transition-colors font-mono ${
            options.showIndicators
              ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
          }`}
          title="显示类型标识符 / 和 * (-F)"
        >
          <span>-F 标识符</span>
        </button>

        {/* Quick Ignores Chips */}
        <div className="hidden lg:flex items-center gap-1.5">
          <span className="text-slate-500 text-[11px]">忽略过滤:</span>
          {['node_modules', '.git', 'dist'].map((tag) => (
            <button
              key={tag}
              onClick={() => toggleIgnorePreset(tag)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                isIgnoring(tag)
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 line-through'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Right side: Stats summary & Theme Switcher */}
      <div className="flex items-center gap-3">
        {/* Statistics Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400">
          <span className="text-sky-400 font-semibold">{stats.directoriesCount}</span> 目录
          <span className="text-slate-600">/</span>
          <span className="text-indigo-400 font-semibold">{stats.filesCount}</span> 文件
        </div>

        {/* Theme Picker */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          {[
            { id: 'dark', label: '暗黑' },
            { id: 'light', label: '亮色' },
            { id: 'nord', label: 'Nord' },
            { id: 'dracula', label: '吸血鬼' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onThemeChange(item.id as GraphTheme)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                theme === item.id
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
