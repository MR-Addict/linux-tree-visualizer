/**
 * Utilities to export the visual tree as SVG and PNG
 */

export interface ExportOptions {
  filename: string;
  scale?: number; // 1, 2, 3
  backgroundColor?: string; // 'transparent', '#0b0f19', '#ffffff', etc.
  padding?: number;
  windowFrame?: boolean; // Ray.so / Carbon style macOS window frame
}

export function exportSvg(svgElement: SVGSVGElement, options: ExportOptions): void {
  const svgString = getCleanSvgString(svgElement, options);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.filename || 'tree-diagram'}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportPng(svgElement: SVGSVGElement, options: ExportOptions): Promise<void> {
  const blob = await svgToPngBlob(svgElement, options);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.filename || 'tree-diagram'}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyPngToClipboard(svgElement: SVGSVGElement, options: ExportOptions): Promise<boolean> {
  try {
    const blob = await svgToPngBlob(svgElement, options);
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard API not supported in this environment');
    }
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}

export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getCleanSvgString(
  svgElement: SVGSVGElement,
  options: ExportOptions
): string {
  const backgroundColor = options.backgroundColor || '#0b0f19';
  const padding = options.padding || 40;
  const isWindowFrame = !!options.windowFrame;

  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Measure content bounds using getBBox or child elements
  let bbox = { x: 0, y: 0, width: 800, height: 600 };
  try {
    const contentG = svgElement.querySelector('g.tree-content') as SVGGElement;
    if (contentG && typeof contentG.getBBox === 'function') {
      const gBox = contentG.getBBox();
      if (gBox.width > 0 && gBox.height > 0) {
        bbox = gBox;
      }
    }
  } catch {
    // fallback
  }

  // If window frame is active, include title bar height and shadow padding
  const titleBarHeight = isWindowFrame ? 42 : 0;
  const outerPad = isWindowFrame ? padding + 20 : padding;

  const contentX = bbox.x - padding;
  const contentY = bbox.y - padding;
  const contentWidth = bbox.width + padding * 2;
  const contentHeight = bbox.height + padding * 2;

  const exportX = isWindowFrame ? contentX - 30 : contentX;
  const exportY = isWindowFrame ? contentY - titleBarHeight - 30 : contentY;
  const exportWidth = isWindowFrame ? contentWidth + 60 : contentWidth;
  const exportHeight = isWindowFrame ? contentHeight + titleBarHeight + 60 : contentHeight;

  clone.setAttribute('viewBox', `${exportX} ${exportY} ${exportWidth} ${exportHeight}`);
  clone.setAttribute('width', `${exportWidth}`);
  clone.setAttribute('height', `${exportHeight}`);

  // Reset any pan/zoom transform on the clone's root group
  const cloneContentG = clone.querySelector('g.tree-content') as SVGGElement;
  if (cloneContentG) {
    cloneContentG.removeAttribute('transform');
  }

  // Embed font definitions and filter definitions
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
      text { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
      .mono-text { font-family: 'JetBrains Mono', monospace; }
    </style>
    <filter id="window-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  `;
  clone.insertBefore(defs, clone.firstChild);

  // Add background rect if not transparent
  if (backgroundColor && backgroundColor !== 'transparent') {
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', `${exportX}`);
    bgRect.setAttribute('y', `${exportY}`);
    bgRect.setAttribute('width', `${exportWidth}`);
    bgRect.setAttribute('height', `${exportHeight}`);
    bgRect.setAttribute('fill', backgroundColor);
    clone.insertBefore(bgRect, clone.childNodes[1] || clone.firstChild);
  }

  // If Window Frame is enabled (Ray.so / Carbon style)
  if (isWindowFrame) {
    const frameG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    frameG.innerHTML = `
      <!-- Window Box with Shadow -->
      <rect
        x="${contentX}"
        y="${contentY - titleBarHeight}"
        width="${contentWidth}"
        height="${contentHeight + titleBarHeight}"
        rx="14"
        fill="#161b22"
        stroke="#30363d"
        stroke-width="1.5"
        filter="url(#window-shadow)"
      />
      <!-- Window Title Bar -->
      <path
        d="M ${contentX} ${contentY - titleBarHeight + 14} A 14 14 0 0 1 ${contentX + 14} ${contentY - titleBarHeight} L ${contentX + contentWidth - 14} ${contentY - titleBarHeight} A 14 14 0 0 1 ${contentX + contentWidth} ${contentY - titleBarHeight + 14} L ${contentX + contentWidth} ${contentY} L ${contentX} ${contentY} Z"
        fill="#0d1117"
        stroke="#30363d"
        stroke-width="1"
      />
      <!-- Traffic Light Controls -->
      <circle cx="${contentX + 20}" cy="${contentY - titleBarHeight / 2}" r="6" fill="#ff5f56" />
      <circle cx="${contentX + 38}" cy="${contentY - titleBarHeight / 2}" r="6" fill="#ffbd2e" />
      <circle cx="${contentX + 56}" cy="${contentY - titleBarHeight / 2}" r="6" fill="#27c93f" />
      <!-- Window Title -->
      <text
        x="${contentX + contentWidth / 2}"
        y="${contentY - titleBarHeight / 2 + 4}"
        text-anchor="middle"
        font-family="JetBrains Mono, monospace"
        font-size="12"
        fill="#8b949e"
      >${options.filename || 'tree-diagram'}</text>
    `;

    // Insert window background before the tree content
    clone.insertBefore(frameG, cloneContentG);
  }

  return new XMLSerializer().serializeToString(clone);
}

function svgToPngBlob(svgElement: SVGSVGElement, options: ExportOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const scale = options.scale || 2;
    const bg = options.backgroundColor || '#0b0f19';

    const svgString = getCleanSvgString(svgElement, options);

    // Parse viewBox to get target pixel dimensions
    const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
    let width = 800;
    let height = 600;
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].split(/\s+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        width = parts[2];
        height = parts[3];
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context not available'));
      return;
    }

    // Fill background
    if (bg && bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.scale(scale, scale);

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}
