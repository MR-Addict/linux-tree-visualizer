export type NodeType = 'file' | 'directory';

export type TreeLayoutMode = 'horizontal' | 'compact';

export interface TreeNode {
  id: string;
  name: string;
  type: NodeType;
  size?: number; // in bytes
  children?: TreeNode[];
  collapsed?: boolean;
  comment?: string; // e.g. "源代码核心目录", "配置文件"
}

export interface TreeStats {
  directoriesCount: number;
  filesCount: number;
  totalSize: number;
  maxDepth: number;
}

export interface TreeFilterOptions {
  maxLevel: number; // 0 = unlimited, 1..N
  showHidden: boolean; // -a flag
  dirsOnly: boolean; // -d flag
  showIndicators: boolean; // -F flag (/ for dir, * for executable)
  ignorePattern: string; // -I pattern (e.g. "node_modules|\.git|dist")
  charset: 'utf-8' | 'ascii'; // "├── " vs "|-- "
  showSizes: boolean; // -s or -h flag
  fullPath: boolean; // -f flag
  useGitignore: boolean; // Automatically filter using .gitignore rules
  gitignoreRules: string[]; // Active .gitignore patterns
}

export type ViewMode = 'graph' | 'cli';

export type GraphTheme = 'dark' | 'light' | 'nord' | 'dracula';

export interface ExportCardOptions {
  filename: string;
  scale?: number; // 1, 2, 3
  backgroundColor?: string;
  windowFrame?: boolean; // Ray.so / Carbon style window frame with macOS buttons
  padding?: number;
  showComments?: boolean;
}

