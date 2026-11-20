import { Product } from '../types';

export type ShareCardResult = 'shared' | 'downloaded' | 'cancelled';

function loadImageElement(src: string, useCrossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCrossOrigin) {
      img.crossOrigin = 'anonymous';
    }
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function fetchImageAsBlobElement(url: string): Promise<HTMLImageElement> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status}`);
  }
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('Response is not an image');
  }
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await loadImageElement(objectUrl, false);
  } finally {
    // Keep objectUrl alive briefly until canvas draws; revoked after drawImage via returned wrapper or microtask
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  }
}

async function resolveShareableProductImage(imageUrl?: string): Promise<HTMLImageElement | null> {
  if (!imageUrl || !imageUrl.trim()) return null;
  const trimmed = imageUrl.trim();

  // Same-origin local assets load directly
  if (trimmed.startsWith('/')) {
    try {
      return await loadImageElement(trimmed, false);
    } catch {
      return null;
    }
  }

  // Fetch through same-origin CORS proxy as a blob so canvas export works reliably across all hosts
  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
    return await fetchImageAsBlobElement(proxyUrl);
  } catch {
    // Fallback to direct CORS load (e.g. lh3.googleusercontent.com)
    try {
      return await loadImageElement(trimmed, true);
    } catch {
      return null;
    }
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
        currentLine = '';
      }
      if (lines.length === maxLines) {
        const lastIdx = maxLines - 1;
        let truncated = lines[lastIdx];
        while (truncated.length > 1 && ctx.measureText(`${truncated}...`).width > maxWidth) {
          truncated = truncated.slice(0, -1).trimEnd();
        }
        lines[lastIdx] = `${truncated}...`;
        return lines;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.slice(0, maxLines);
}

export async function generateAndShareProductCard(
  product: Product,
  formattedPrice: string,
  hasPrice: boolean
): Promise<ShareCardResult> {
  const width = 1080;
  const padX = 56;
  const contentW = width - padX * 2;
  const bannerHeight = 148;

  // Load logo & product image in parallel
  const [logoImg, productImg] = await Promise.all([
    loadImageElement('/troika-menu-logo.png', false).catch(() => null),
    resolveShareableProductImage(product.image),
  ]);

  // Pre-measure wrapped name lines to size the card tightly with zero wasted space
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const nameFontSize = productImg ? 50 : 54;
  const nameLineHeight = productImg ? 64 : 68;
  measureCtx.font = `800 ${nameFontSize}px Inter, system-ui, -apple-system, sans-serif`;
  const nameLines = wrapTextLines(measureCtx, product.name, contentW, 3);

  const stageY = bannerHeight + 48;
  const stageH = productImg ? 520 : 0;
  const nameStartY = productImg ? stageY + stageH + 48 : bannerHeight + 56;
  const codeY = nameStartY + nameLines.length * nameLineHeight + 22;
  const codeBoxH = 56;
  const priceY = codeY + codeBoxH + 38;
  const priceHeight = hasPrice ? 76 : 48;
  const totalHeight = priceY + priceHeight + 64;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // 1. Clean White Card Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, totalHeight);

  // 2. Simple Troika Navy Banner
  const bannerGrad = ctx.createLinearGradient(0, 0, width, bannerHeight);
  bannerGrad.addColorStop(0, '#204374');
  bannerGrad.addColorStop(0.55, '#1A365D');
  bannerGrad.addColorStop(1, '#122643');
  ctx.fillStyle = bannerGrad;
  ctx.fillRect(0, 0, width, bannerHeight);

  ctx.fillStyle = '#00AEEF';
  ctx.fillRect(0, bannerHeight - 4, width, 4);

  if (logoImg) {
    const logoH = 74;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, (width - logoW) / 2, (bannerHeight - logoH) / 2 - 2, logoW, logoH);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 44px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TROIKA', width / 2, bannerHeight / 2);
    ctx.textAlign = 'left';
  }

  // 3. Product Photo (ONLY rendered if an actual product photo loaded)
  if (productImg) {
    drawRoundedRect(ctx, padX, stageY, contentW, stageH, 28);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    const innerPad = 36;
    const maxW = contentW - innerPad * 2;
    const maxH = stageH - innerPad * 2;
    const scale = Math.min(maxW / productImg.width, maxH / productImg.height);
    const drawW = productImg.width * scale;
    const drawH = productImg.height * scale;
    ctx.drawImage(
      productImg,
      padX + (contentW - drawW) / 2,
      stageY + (stageH - drawH) / 2,
      drawW,
      drawH
    );
  }

  // 4. Product Name
  ctx.fillStyle = '#0F172A';
  ctx.font = `800 ${nameFontSize}px Inter, system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'top';
  let y = nameStartY;
  for (const line of nameLines) {
    ctx.fillText(line, padX, y);
    y += nameLineHeight;
  }

  // 5. Code Number Chip
  const codeText = (product.code || '').trim();
  if (codeText) {
    ctx.font = '700 30px ui-monospace, SFMono-Regular, Menlo, monospace';
    const textW = ctx.measureText(codeText).width;
    const chipW = textW + 40;
    drawRoundedRect(ctx, padX, codeY, chipW, codeBoxH, 14);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.textBaseline = 'middle';
    ctx.fillText(codeText, padX + 20, codeY + codeBoxH / 2 + 1);
  }

  // 6. MRP
  ctx.textBaseline = 'top';
  if (hasPrice) {
    ctx.fillStyle = '#00AEEF';
    ctx.font = '900 72px Inter, system-ui, -apple-system, sans-serif';
  } else {
    ctx.fillStyle = '#64748B';
    ctx.font = '700 42px Inter, system-ui, -apple-system, sans-serif';
  }
  ctx.fillText(formattedPrice, padX, priceY);

  // Export PNG Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Failed to render PNG'))),
      'image/png'
    );
  });

  const safeCode = (product.code || product.name || 'Product').replace(/[^a-zA-Z0-9_-]+/g, '_');
  const fileName = `Troika_${safeCode}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  // Prefer native OS Share Sheet (image file only, clean like a screenshot)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const canShareFiles =
      typeof navigator.canShare === 'function' ? navigator.canShare({ files: [file] }) : true;

    if (canShareFiles) {
      try {
        await navigator.share({ files: [file] });
        return 'shared';
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return 'cancelled';
        }
      }
    }
  }

  // Fallback: automatic clean PNG download
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  return 'downloaded';
}
