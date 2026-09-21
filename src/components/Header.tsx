import React, { useState, useRef, useEffect } from 'react';
import {
  FolderTree,
  Upload,
  Download,
  Plus,
  Terminal,
  Network,
  Search,
  X,
  Sliders,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ViewMode, TreeFilterOptions } from '../types';
import { PRESETS } from '../data/presets';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  options: TreeFilterOptions;
  onOptionsChange: (newOptions: Partial<TreeFilterOptions>) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenReadme: () => void;
  onOpenAddNode: () => void;
  onSelectPreset: (presetId: string) => void;
  currentRootName: string;
  currentPresetId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  options,
  onOptionsChange,
  searchQuery,
  onSearchChange,
  onOpenImport,
  onOpenExport,
  onOpenReadme,
  onOpenAddNode,
  onSelectPreset,
  currentRootName,
  currentPresetId,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const presetDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(target)) {
        setShowPresetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChoosePreset = (presetId: string) => {
    onSelectPreset(presetId);
    setShowPresetDropdown(false);
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 select-none z-30 relative text-xs">
      {/* Left Section: Brand, Import Examples, Upload & Quick Add */}
      <div className="flex items-center gap-2">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm shadow-sky-500/20">
            <FolderTree className="w-4 h-4" />
          </div>
          <span className="font-bold text-white tracking-tight hidden sm:inline">
            Tree Visualizer
          </span>
        </div>

        {/* Import Example (导入示例) Dropdown */}
        <div className="relative" ref={presetDropdownRef}>
          <button
            id="btn-import-preset"
            onClick={() => setShowPresetDropdown(!showPresetDropdown)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showPresetDropdown
                ? 'bg-slate-800 border-sky-500 text-sky-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="选择内置示例工程覆盖当前工作区"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>导入示例</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPresetDropdown && (
            <div className="absolute left-0 top-full mt-2 w-72 p-2.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
              <div className="px-1.5 py-1 border-b border-slate-800">
                <div className="font-semibold text-white text-xs">导入内置示例</div>
                <div className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>选择示例将覆盖当前画布数据</span>
                </div>
              </div>

              <div className="space-y-1">
                {PRESETS.map((preset) => {
                  const isSelected = currentPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleChoosePreset(preset.id)}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-sky-600/15 border border-sky-500/40 text-sky-200'
                          : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs flex items-center gap-1.5">
                          <span>{preset.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {preset.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {preset.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Current Project Name Tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 max-w-[130px] truncate" title={`当前根目录: ${currentRootName}`}>
          <span className="text-slate-500">根:</span>
          <span className="text-slate-200 truncate">{currentRootName}</span>
        </div>

        {/* Upload Project Button */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg border border-slate-700/80 transition-colors"
          title="上传文件夹、.zip 压缩包或粘贴目录树文本"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">导入/上传</span>
        </button>

        {/* Add Node Button */}
        <button
          onClick={onOpenAddNode}
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/80 transition-colors"
          title="手动添加新文件或目录节点"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>

      {/* Middle Section: Universal Search & Depth -L */}
      <div className="flex items-center gap-2">
        {/* Universal Search (Both Graph and Terminal) */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索节点或文本..."
            className="pl-7 pr-6 py-1.5 w-32 sm:w-44 md:w-52 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 text-slate-400 hover:text-white p-0.5"
              title="清除搜索"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Max Level (-L) selector */}
        <div className="hidden sm:flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <span className="text-[10px] font-mono text-slate-500 px-1 select-none" title="层级深度限制 (-L)">
            -L
          </span>
          {[0, 1, 2, 3].map((lvl) => (
            <button
              key={lvl}
              onClick={() => onOptionsChange({ maxLevel: lvl })}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                options.maxLevel === lvl
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {lvl === 0 ? '全' : lvl}
            </button>
          ))}
        </div>

        {/* View Switcher: Terminal (Default) vs Graph */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('cli')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              viewMode === 'cli'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="终端命令行与文本编辑 (默认)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>终端 (文本)</span>
          </button>

          <button
            onClick={() => onViewModeChange('graph')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              viewMode === 'graph'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="图形树状图谱"
          >
            <Network className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">图谱</span>
          </button>
        </div>
      </div>

      {/* Right Section: Gitignore Toggle, README, Advanced Settings & Export */}
      <div className="flex items-center gap-2">
        {/* .gitignore filter toggle */}
        <button
          onClick={() => onOptionsChange({ useGitignore: !options.useGitignore })}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
            options.useGitignore
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
          }`}
          title="自动根据 .gitignore 规则隐藏 node_modules、.git、.gitignore 等非业务与隐藏文件"
        >
          {options.useGitignore ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="hidden md:inline">.gitignore 过滤</span>
        </button>

        {/* README Generator Trigger */}
        <button
          onClick={onOpenReadme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg transition-colors font-medium"
          title="生成符合规范的 GitHub README 项目结构代码块"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">README 结构</span>
        </button>

        {/* Advanced Filter Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showSettings
                ? 'bg-slate-800 border-sky-500 text-sky-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="高级 Linux tree 参数设置"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              <div className="font-semibold text-white text-xs pb-1 border-b border-slate-800 flex items-center justify-between">
                <span>高级过滤选项</span>
                <span className="text-[10px] text-slate-500 font-mono">Linux tree 参数</span>
              </div>

              {/* Linux Tree Flag Toggles */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div>
                    <div className="text-slate-300 text-xs">显示隐藏文件 (-a)</div>
                    <div className="text-[10px] text-slate-500">包含 .gitignore 等点开头文件</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.showHidden}
                    onChange={(e) => onOptionsChange({ showHidden: e.target.checked })}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 bg-slate-950"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div>
                    <div className="text-slate-300 text-xs">仅显示目录 (-d)</div>
                    <div className="text-[10px] text-slate-500">过滤所有普通文件</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.dirsOnly}
                    onChange={(e) => onOptionsChange({ dirsOnly: e.target.checked })}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 bg-slate-950"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div>
                    <div className="text-slate-300 text-xs">显示文件指示符 (-F)</div>
                    <div className="text-[10px] text-slate-500">目录追加 /，可执行文件追加 *</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.showIndicators}
                    onChange={(e) => onOptionsChange({ showIndicators: e.target.checked })}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 bg-slate-950"
                  />
                </label>
              </div>

              {/* Custom Ignore Regex (-I) */}
              <div>
                <div className="text-slate-400 text-[11px] mb-1">自定义忽略正则 (-I)</div>
                <input
                  type="text"
                  value={options.ignorePattern || ''}
                  onChange={(e) => onOptionsChange({ ignorePattern: e.target.value })}
                  placeholder="例如: test|\.spec|temp"
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Primary Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
          title="导出矢量 SVG、高清图片 PNG 或文本"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出</span>
        </button>
      </div>
    </header>
  );
};
