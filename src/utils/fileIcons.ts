export interface FileMeta {
  extension: string;
  category: 'code' | 'markup' | 'style' | 'data' | 'document' | 'image' | 'archive' | 'config' | 'binary' | 'dir';
  color: string;
  bgColor: string;
  borderColor: string;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1 && parts[0] !== '') {
    return parts[parts.length - 1].toLowerCase();
  }
  return '';
}

export function getFileMeta(filename: string, isDirectory: boolean): FileMeta {
  if (isDirectory) {
    return {
      extension: '',
      category: 'dir',
      color: '#38bdf8', // sky-400
      bgColor: 'rgba(56, 189, 248, 0.12)',
      borderColor: 'rgba(56, 189, 248, 0.35)',
    };
  }

  const ext = getFileExtension(filename);

  switch (ext) {
    case 'ts':
    case 'tsx':
      return {
        extension: ext,
        category: 'code',
        color: '#60a5fa', // blue-400
        bgColor: 'rgba(96, 165, 250, 0.12)',
        borderColor: 'rgba(96, 165, 250, 0.35)',
      };
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return {
        extension: ext,
        category: 'code',
        color: '#facc15', // yellow-400
        bgColor: 'rgba(250, 204, 21, 0.12)',
        borderColor: 'rgba(250, 204, 21, 0.35)',
      };
    case 'html':
    case 'htm':
    case 'vue':
    case 'svelte':
      return {
        extension: ext,
        category: 'markup',
        color: '#fb923c', // orange-400
        bgColor: 'rgba(251, 146, 60, 0.12)',
        borderColor: 'rgba(251, 146, 60, 0.35)',
      };
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return {
        extension: ext,
        category: 'style',
        color: '#38bdf8', // sky-400
        bgColor: 'rgba(56, 189, 248, 0.12)',
        borderColor: 'rgba(56, 189, 248, 0.35)',
      };
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'xml':
      return {
        extension: ext,
        category: 'data',
        color: '#34d399', // emerald-400
        bgColor: 'rgba(52, 211, 153, 0.12)',
        borderColor: 'rgba(52, 211, 153, 0.35)',
      };
    case 'md':
    case 'markdown':
    case 'txt':
    case 'rst':
      return {
        extension: ext,
        category: 'document',
        color: '#c084fc', // purple-400
        bgColor: 'rgba(192, 132, 252, 0.12)',
        borderColor: 'rgba(192, 132, 252, 0.35)',
      };
    case 'py':
      return {
        extension: ext,
        category: 'code',
        color: '#38bdf8',
        bgColor: 'rgba(56, 189, 248, 0.12)',
        borderColor: 'rgba(56, 189, 248, 0.35)',
      };
    case 'go':
      return {
        extension: ext,
        category: 'code',
        color: '#22d3ee', // cyan-400
        bgColor: 'rgba(34, 211, 238, 0.12)',
        borderColor: 'rgba(34, 211, 238, 0.35)',
      };
    case 'rs':
      return {
        extension: ext,
        category: 'code',
        color: '#f87171', // red-400
        bgColor: 'rgba(248, 113, 113, 0.12)',
        borderColor: 'rgba(248, 113, 113, 0.35)',
      };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'webp':
    case 'ico':
      return {
        extension: ext,
        category: 'image',
        color: '#ec4899', // pink-400
        bgColor: 'rgba(236, 72, 153, 0.12)',
        borderColor: 'rgba(236, 72, 153, 0.35)',
      };
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
    case 'rar':
      return {
        extension: ext,
        category: 'archive',
        color: '#eab308',
        bgColor: 'rgba(234, 179, 8, 0.12)',
        borderColor: 'rgba(234, 179, 8, 0.35)',
      };
    case 'sh':
    case 'bash':
    case 'zsh':
      return {
        extension: ext,
        category: 'code',
        color: '#4ade80', // green-400
        bgColor: 'rgba(74, 222, 128, 0.12)',
        borderColor: 'rgba(74, 222, 128, 0.35)',
      };
    default:
      if (filename.startsWith('.') || filename.includes('config') || filename.includes('lock')) {
        return {
          extension: ext || 'cfg',
          category: 'config',
          color: '#94a3b8', // slate-400
          bgColor: 'rgba(148, 163, 184, 0.12)',
          borderColor: 'rgba(148, 163, 184, 0.35)',
        };
      }
      return {
        extension: ext || 'file',
        category: 'document',
        color: '#cbd5e1', // slate-300
        bgColor: 'rgba(203, 213, 225, 0.1)',
        borderColor: 'rgba(203, 213, 225, 0.25)',
      };
  }
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
