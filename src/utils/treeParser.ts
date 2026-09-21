import JSZip from 'jszip';
import { TreeNode, TreeStats, TreeFilterOptions } from '../types';

let nextId = 1;
export function generateNodeId(): string {
  return `node-${Date.now()}-${nextId++}`;
}

export function calculateTreeStats(root: TreeNode): TreeStats {
  let directoriesCount = 0;
  let filesCount = 0;
  let totalSize = 0;
  let maxDepth = 0;

  function traverse(node: TreeNode, depth: number) {
    if (depth > maxDepth) maxDepth = depth;
    if (node.type === 'directory') {
      // Don't count the root node itself as a sub-directory in stats if standard tree CLI
      directoriesCount++;
      if (node.children) {
        for (const child of node.children) {
          traverse(child, depth + 1);
        }
      }
    } else {
      filesCount++;
      totalSize += node.size || 0;
    }
  }

  // Traverse root
  if (root.children) {
    for (const child of root.children) {
      traverse(child, 1);
    }
  }

  return {
    directoriesCount,
    filesCount,
    totalSize,
    maxDepth,
  };
}

export function filterTree(
  node: TreeNode,
  options: TreeFilterOptions,
  currentDepth: number = 0
): TreeNode | null {
  // Check depth limit
  if (options.maxLevel > 0 && currentDepth > options.maxLevel) {
    return null;
  }

  // Check hidden files (-a flag)
  if (!options.showHidden && node.name.startsWith('.') && currentDepth > 0) {
    return null;
  }

  // Check gitignore rules (-I or automatic .gitignore)
  if (options.useGitignore && options.gitignoreRules && options.gitignoreRules.length > 0) {
    const isIgnored = matchesGitignore(node.name, options.gitignoreRules);
    if (isIgnored) {
      return null;
    }
  }

  // Check ignore pattern (-I flag)
  if (options.ignorePattern && options.ignorePattern.trim() !== '') {
    try {
      const regex = new RegExp(options.ignorePattern.trim(), 'i');
      if (regex.test(node.name)) {
        return null;
      }
    } catch {
      // Invalid regex, skip check
    }
  }

  // Check directories only (-d flag)
  if (options.dirsOnly && node.type === 'file') {
    return null;
  }

  const newNode: TreeNode = {
    ...node,
    children: [],
  };

  if (node.children && node.children.length > 0) {
    // If not collapsed and depth allows
    const filteredChildren: TreeNode[] = [];
    for (const child of node.children) {
      const filtered = filterTree(child, options, currentDepth + 1);
      if (filtered) {
        filteredChildren.push(filtered);
      }
    }
    newNode.children = filteredChildren;
  }

  return newNode;
}

export interface ParseResult {
  root: TreeNode;
  gitignoreRules: string[];
}

/**
 * Parses browser FileList / File array from folder picker or drop.
 * webkitRelativePath contains the full relative path, e.g. "my-app/src/App.tsx"
 */
export async function parseFileList(files: File[]): Promise<ParseResult> {
  if (files.length === 0) {
    return {
      root: {
        id: generateNodeId(),
        name: 'empty-project',
        type: 'directory',
        children: [],
      },
      gitignoreRules: [...DEFAULT_GITIGNORE_RULES],
    };
  }

  // Look for .gitignore
  let foundGitignoreRules: string[] = [...DEFAULT_GITIGNORE_RULES];
  const gitignoreFile = files.find(
    (f) => f.name === '.gitignore' || f.webkitRelativePath?.endsWith('/.gitignore')
  );
  if (gitignoreFile) {
    try {
      const text = await gitignoreFile.text();
      const parsed = parseGitignoreContent(text);
      foundGitignoreRules = Array.from(new Set([...foundGitignoreRules, ...parsed]));
    } catch {
      // ignore
    }
  }

  // Determine root name
  const firstPath = files[0].webkitRelativePath || files[0].name;
  const rootName = firstPath.includes('/') ? firstPath.split('/')[0] : 'uploaded-project';

  const root: TreeNode = {
    id: generateNodeId(),
    name: rootName,
    type: 'directory',
    children: [],
  };

  for (const file of files) {
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split('/').filter(Boolean);

    // If starts with root name, strip it
    if (parts.length > 0 && parts[0] === rootName) {
      parts.shift();
    }

    if (parts.length === 0) continue;

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current.children) {
        current.children = [];
      }

      let existing = current.children.find((c) => c.name === part);

      if (!existing) {
        existing = {
          id: generateNodeId(),
          name: part,
          type: isLast ? 'file' : 'directory',
          size: isLast ? file.size : undefined,
          children: isLast ? undefined : [],
        };
        current.children.push(existing);
      } else if (isLast && existing.type === 'directory') {
        existing.type = 'file';
        existing.size = file.size;
      }

      current = existing;
    }
  }

  // Sort nodes: directories first, then alphabetical
  sortTreeNode(root);

  return { root, gitignoreRules: foundGitignoreRules };
}

/**
 * Parses a .zip file buffer into TreeNode hierarchy.
 */
export async function parseZipArchive(buffer: ArrayBuffer, fileName: string): Promise<ParseResult> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(buffer);

  let foundGitignoreRules: string[] = [...DEFAULT_GITIGNORE_RULES];

  // Try reading .gitignore inside zip
  for (const [relativePath, entry] of Object.entries(loadedZip.files)) {
    if (relativePath.endsWith('.gitignore') && !entry.dir) {
      try {
        const text = await entry.async('string');
        const parsed = parseGitignoreContent(text);
        foundGitignoreRules = Array.from(new Set([...foundGitignoreRules, ...parsed]));
      } catch {
        // ignore
      }
      break;
    }
  }

  const cleanRootName = fileName.replace(/\.zip$/i, '') || 'zip-project';
  const root: TreeNode = {
    id: generateNodeId(),
    name: cleanRootName,
    type: 'directory',
    children: [],
  };

  loadedZip.forEach((relativePath, zipEntry) => {
    // ignore Mac OS metadata __MACOSX
    if (relativePath.startsWith('__MACOSX/')) return;

    const parts = relativePath.split('/').filter(Boolean);
    if (parts.length === 0) return;

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const isDir = zipEntry.dir || !isLast;

      if (!current.children) {
        current.children = [];
      }

      let existing = current.children.find((c) => c.name === part);

      if (!existing) {
        existing = {
          id: generateNodeId(),
          name: part,
          type: isDir ? 'directory' : 'file',
          size: !isDir ? (zipEntry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize : undefined,
          children: isDir ? [] : undefined,
        };
        current.children.push(existing);
      }

      current = existing;
    }
  });

  sortTreeNode(root);
  return { root, gitignoreRules: foundGitignoreRules };
}

/**
 * Parses raw text: either CLI tree output, list of paths, or indented text.
 */
export function parseTreeText(rawText: string): TreeNode {
  const lines = rawText.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return {
      id: generateNodeId(),
      name: 'my-project',
      type: 'directory',
      children: [],
    };
  }

  // Check if it's JSON
  if (lines[0].trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed.name) {
        return ensureNodeIds(parsed);
      }
    } catch {
      // not JSON, fallback to line parser
    }
  }

  // Check if text has indentation (spaces or tabs at beginning of lines)
  const hasIndentation = lines.some((l) => /^\s+/.test(l));

  // Check if it's a flat paths list without indentation (e.g. "src/components/App.tsx", "package.json")
  const looksLikePaths =
    !hasIndentation &&
    lines.every((l) => !l.includes('├──') && !l.includes('|--') && !l.includes('└──'));
  if (looksLikePaths && lines.some((l) => l.includes('/'))) {
    return parsePathLines(lines);
  }

  // Standard CLI tree or indented text parser
  return parseCliOrIndentedText(lines);
}

function parsePathLines(lines: string[]): TreeNode {
  const root: TreeNode = {
    id: generateNodeId(),
    name: 'project',
    type: 'directory',
    children: [],
  };

  for (const line of lines) {
    const cleanLine = line.trim().replace(/^\.\//, '');
    if (!cleanLine) continue;

    const isExplicitDir = cleanLine.endsWith('/');
    const parts = cleanLine.split('/').filter(Boolean);

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const isDir = !isLast || isExplicitDir;

      if (!current.children) {
        current.children = [];
      }

      let existing = current.children.find((c) => c.name === part);
      if (!existing) {
        existing = {
          id: generateNodeId(),
          name: part,
          type: isDir ? 'directory' : 'file',
          children: isDir ? [] : undefined,
        };
        current.children.push(existing);
      }
      current = existing;
    }
  }

  sortTreeNode(root);
  return root;
}

function parseCliOrIndentedText(lines: string[]): TreeNode {
  // First line is often the root directory name, e.g. "." or "my-app" or "my-app/"
  let rootName = 'project';
  let startIndex = 0;

  // Filter out tree summary footer lines like "3 directories, 15 files"
  const contentLines: string[] = [];
  for (const line of lines) {
    if (/\d+\s+director(y|ies),\s+\d+\s+files?/i.test(line)) {
      continue;
    }
    contentLines.push(line);
  }

  if (contentLines.length === 0) {
    return { id: generateNodeId(), name: 'project', type: 'directory', children: [] };
  }

  // Check if first line is a root without tree branches
  const firstLine = contentLines[0];
  let rootComment: string | undefined = undefined;
  if (!firstLine.includes('├──') && !firstLine.includes('└──') && !firstLine.includes('|--') && !firstLine.includes('\\--')) {
    let rawRoot = firstLine.trim();
    const commentMatch = rawRoot.match(/^(.*?)\s*(?:#|\/\/|--)\s*(.*)$/);
    if (commentMatch) {
      rawRoot = commentMatch[1].trim();
      rootComment = commentMatch[2].trim();
    }
    rootName = rawRoot.replace(/\/$/, '') || 'project';
    startIndex = 1;
  }

  const root: TreeNode = {
    id: generateNodeId(),
    name: rootName,
    type: 'directory',
    comment: rootComment,
    children: [],
  };

  const stack: { node: TreeNode; depth: number }[] = [{ node: root, depth: -1 }];

  for (let idx = startIndex; idx < contentLines.length; idx++) {
    const rawLine = contentLines[idx];
    if (!rawLine.trim()) continue;

    // Detect depth and strip CLI tree characters
    // Characters: ├──, └──, │   , |-- , \-- , |   , or indentation spaces
    let cleanName = rawLine;
    let depth = 0;

    // Match tree branch markers
    const branchMatch = rawLine.match(/^([│\s|]*)(?:├──|└──|\|--|\\--)\s*(.*)$/);
    if (branchMatch) {
      const prefix = branchMatch[1];
      // Roughly 4 chars per level
      depth = Math.floor(prefix.length / 4);
      cleanName = branchMatch[2];
    } else {
      // Space or tab indentation
      const indentMatch = rawLine.match(/^(\s*)(.*)$/);
      if (indentMatch) {
        const spaces = indentMatch[1].replace(/\t/g, '  ').length;
        depth = Math.floor(spaces / 2); // 2 spaces per level
        cleanName = indentMatch[2];
      }
    }

    cleanName = cleanName.trim();
    if (!cleanName) continue;

    // Extract comment if present (e.g. "App.tsx # 根入口组件" or "src/ // 源代码")
    let comment: string | undefined = undefined;
    const commentMatch = cleanName.match(/^(.*?)\s*(?:#|\/\/|--)\s*(.*)$/);
    if (commentMatch) {
      cleanName = commentMatch[1].trim();
      comment = commentMatch[2].trim();
    }

    if (!cleanName) continue;

    // Determine if directory: ends with / or has explicit directory indicators
    let isDir = cleanName.endsWith('/');
    if (isDir) {
      cleanName = cleanName.slice(0, -1).trim();
    } else if (!cleanName.includes('.')) {
      // heuristic: names without dots are treated as directory by default
      isDir = true;
    }

    const newNode: TreeNode = {
      id: generateNodeId(),
      name: cleanName,
      type: isDir ? 'directory' : 'file',
      comment: comment || undefined,
      children: isDir ? [] : undefined,
    };

    // Find parent in stack
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(newNode);

    if (isDir) {
      stack.push({ node: newNode, depth });
    }
  }

  sortTreeNode(root);
  return root;
}

/**
 * Converts a TreeNode structure into clean, human-readable indented text with comments.
 * Ready for text-based editor editing.
 */
export function treeToEditableText(root: TreeNode): string {
  function serialize(node: TreeNode, depth: number): string[] {
    const indent = '  '.repeat(depth);
    const isDir = node.type === 'directory';
    const nameWithSlash = isDir ? `${node.name}/` : node.name;
    const commentStr = node.comment ? ` # ${node.comment}` : '';
    const line = `${indent}${nameWithSlash}${commentStr}`;

    const lines = [line];
    if (isDir && node.children && node.children.length > 0) {
      for (const child of node.children) {
        lines.push(...serialize(child, depth + 1));
      }
    }
    return lines;
  }

  return serialize(root, 0).join('\n');
}

function ensureNodeIds(node: TreeNode): TreeNode {
  return {
    ...node,
    id: node.id || generateNodeId(),
    children: node.children ? node.children.map(ensureNodeIds) : undefined,
  };
}

export function sortTreeNode(node: TreeNode) {
  if (node.children && node.children.length > 0) {
    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
    for (const child of node.children) {
      sortTreeNode(child);
    }
  }
}

/**
 * Generates true Linux `tree` CLI output string
 */
export function generateCliTree(root: TreeNode, options: TreeFilterOptions): string {
  const isAscii = options.charset === 'ascii';
  const branchChar = isAscii ? '|-- ' : '├── ';
  const lastChar = isAscii ? '`-- ' : '└── ';
  const pipeChar = isAscii ? '|   ' : '│   ';
  const spaceChar = '    ';

  const lines: string[] = [];

  // Root name
  let rootDisplay = root.name;
  if (options.showIndicators && root.type === 'directory') {
    rootDisplay += '/';
  }
  lines.push(rootDisplay);

  let dirCount = 0;
  let fileCount = 0;

  function walk(node: TreeNode, prefix: string, depth: number) {
    if (options.maxLevel > 0 && depth >= options.maxLevel) {
      return;
    }

    if (!node.children || node.children.length === 0) return;

    // Filter children based on options
    let children = node.children;

    if (!options.showHidden) {
      children = children.filter((c) => !c.name.startsWith('.'));
    }

    if (options.useGitignore && options.gitignoreRules && options.gitignoreRules.length > 0) {
      children = children.filter((c) => !matchesGitignore(c.name, options.gitignoreRules));
    }

    if (options.dirsOnly) {
      children = children.filter((c) => c.type === 'directory');
    }

    if (options.ignorePattern && options.ignorePattern.trim()) {
      try {
        const re = new RegExp(options.ignorePattern.trim(), 'i');
        children = children.filter((c) => !re.test(c.name));
      } catch {
        // ignore bad regex
      }
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const isLast = i === children.length - 1;
      const connector = isLast ? lastChar : branchChar;

      let nameDisplay = child.name;
      if (options.showIndicators) {
        if (child.type === 'directory') {
          nameDisplay += '/';
        } else if (child.name.endsWith('.sh')) {
          nameDisplay += '*';
        }
      }

      if (options.showSizes && child.size !== undefined) {
        nameDisplay += `  [${child.size} B]`;
      }

      lines.push(`${prefix}${connector}${nameDisplay}`);

      if (child.type === 'directory') {
        dirCount++;
        const nextPrefix = prefix + (isLast ? spaceChar : pipeChar);
        walk(child, nextPrefix, depth + 1);
      } else {
        fileCount++;
      }
    }
  }

  walk(root, '', 0);

  // Footer summary
  lines.push('');
  lines.push(
    `${dirCount} ${dirCount === 1 ? 'directory' : 'directories'}${
      options.dirsOnly ? '' : `, ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`
    }`
  );

  return lines.join('\n');
}

export const DEFAULT_GITIGNORE_RULES = [
  '.gitignore',
  'node_modules',
  '.git',
  'dist',
  'build',
  '.DS_Store',
  '__pycache__',
  'coverage',
  '.next',
  '.turbo',
  '*.log',
  '.env',
  '.env.*',
];

export function parseGitignoreContent(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.replace(/\/$/, ''));
}

export function matchesGitignore(name: string, rules: string[]): boolean {
  for (const rule of rules) {
    if (!rule) continue;
    const cleanRule = rule.trim().replace(/\/$/, '');
    if (cleanRule.startsWith('*.')) {
      const ext = cleanRule.slice(1);
      if (name.endsWith(ext)) return true;
    } else if (name === cleanRule || name.toLowerCase() === cleanRule.toLowerCase()) {
      return true;
    }
  }
  return false;
}

export function generateReadmeMarkdown(root: TreeNode, options: TreeFilterOptions): string {
  const isAscii = options.charset === 'ascii';
  const branchChar = isAscii ? '|-- ' : '├── ';
  const lastChar = isAscii ? '`-- ' : '└── ';
  const pipeChar = isAscii ? '|   ' : '│   ';
  const spaceChar = '    ';

  const rows: { treePart: string; comment?: string }[] = [];

  let rootDisplay = root.name;
  if (root.type === 'directory') rootDisplay += '/';
  rows.push({ treePart: rootDisplay, comment: root.comment });

  function walk(node: TreeNode, prefix: string, depth: number) {
    if (options.maxLevel > 0 && depth >= options.maxLevel) return;
    if (!node.children || node.children.length === 0) return;

    let children = node.children;
    if (!options.showHidden) {
      children = children.filter((c) => !c.name.startsWith('.'));
    }
    if (options.useGitignore && options.gitignoreRules && options.gitignoreRules.length > 0) {
      children = children.filter((c) => !matchesGitignore(c.name, options.gitignoreRules));
    }
    if (options.dirsOnly) {
      children = children.filter((c) => c.type === 'directory');
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const isLast = i === children.length - 1;
      const connector = isLast ? lastChar : branchChar;

      let nameDisplay = child.name;
      if (child.type === 'directory') {
        nameDisplay += '/';
      }

      const line = `${prefix}${connector}${nameDisplay}`;
      rows.push({ treePart: line, comment: child.comment });

      if (child.type === 'directory') {
        const nextPrefix = prefix + (isLast ? spaceChar : pipeChar);
        walk(child, nextPrefix, depth + 1);
      }
    }
  }

  walk(root, '', 0);

  // Align comments nicely
  const maxTreeLen = Math.max(...rows.map((r) => r.treePart.length), 20);
  const formattedLines = rows.map((r) => {
    if (!r.comment || !r.comment.trim()) {
      return r.treePart;
    }
    const pad = ' '.repeat(Math.max(2, maxTreeLen - r.treePart.length + 3));
    return `${r.treePart}${pad}# ${r.comment.trim()}`;
  });

  return [
    `## 📁 目录结构 (Project Structure)`,
    ``,
    `\`\`\`bash`,
    ...formattedLines,
    `\`\`\``,
    ``,
  ].join('\n');
}

export function setNodeCommentInTree(root: TreeNode, targetId: string, comment: string): TreeNode {
  function traverse(node: TreeNode): TreeNode {
    if (node.id === targetId) {
      return { ...node, comment: comment.trim() || undefined };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(traverse),
      };
    }
    return node;
  }
  return traverse(root);
}

/**
 * Immutable tree modifications
 */
export function addNodeToTree(
  root: TreeNode,
  parentId: string,
  newNode: Omit<TreeNode, 'id'>
): TreeNode {
  function traverse(node: TreeNode): TreeNode {
    if (node.id === parentId) {
      const children = node.children ? [...node.children] : [];
      children.push({
        ...newNode,
        id: generateNodeId(),
        children: newNode.type === 'directory' ? [] : undefined,
      });
      const updated = { ...node, children };
      sortTreeNode(updated);
      return updated;
    }

    if (node.children) {
      return {
        ...node,
        children: node.children.map(traverse),
      };
    }

    return node;
  }

  return traverse(root);
}

export function removeNodeFromTree(root: TreeNode, targetId: string): TreeNode {
  if (root.id === targetId) {
    return root; // cannot delete root
  }

  function traverse(node: TreeNode): TreeNode {
    if (!node.children) return node;

    return {
      ...node,
      children: node.children
        .filter((c) => c.id !== targetId)
        .map(traverse),
    };
  }

  return traverse(root);
}

export function renameNodeInTree(root: TreeNode, targetId: string, newName: string): TreeNode {
  function traverse(node: TreeNode): TreeNode {
    if (node.id === targetId) {
      return { ...node, name: newName };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(traverse),
      };
    }
    return node;
  }

  const updated = traverse(root);
  sortTreeNode(updated);
  return updated;
}

export function toggleNodeCollapseInTree(root: TreeNode, targetId: string): TreeNode {
  function traverse(node: TreeNode): TreeNode {
    if (node.id === targetId) {
      return { ...node, collapsed: !node.collapsed };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(traverse),
      };
    }
    return node;
  }
  return traverse(root);
}

export function setAllCollapseInTree(root: TreeNode, collapsed: boolean): TreeNode {
  function traverse(node: TreeNode): TreeNode {
    if (node.type === 'directory') {
      return {
        ...node,
        collapsed: node.id === root.id ? false : collapsed,
        children: node.children ? node.children.map(traverse) : undefined,
      };
    }
    return node;
  }
  return traverse(root);
}
