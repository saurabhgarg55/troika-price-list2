import { Product } from '../types';

export type ShareCardResult = 'shared' | 'downloaded' | 'cancelled';

function loadImageElement(src: string, useCrossOrigin = true): Promise<HTMLImageElement> {
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

async function resolveShareableProductImage(imageUrl?: string): Promise<HTMLImageElement | null> {
  if (!imageUrl || !imageUrl.trim()) return null;
  const trimmed = imageUrl.trim();

  // Same-origin local assets load directly without proxy
  if (trimmed.startsWith('/')) {
    try {
      return await loadImageElement(trimmed, false);
    } catch {
      return null;
    }
  }

  // Try lightweight same-origin proxy first so CORS-restricted hosts (troikaworld.com) work on canvas
  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
    return await loadImageElement(proxyUrl, true);
  } catch {
    // Fallback to direct CORS load (works for lh3.googleusercontent.com or CORS-enabled hosts)
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
        // Truncate last line with ellipsis if remaining words don't fit
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
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Load logo & product image in parallel
  const [logoImg, productImg] = await Promise.all([
    loadImageElement('/troika-menu-logo.png', false).catch(() => null),
    resolveShareableProductImage(product.image),
  ]);

  // 1. Clean Porcelain White Canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 2. Branded Deep Navy Header Band (#1A365D gradient)
  const headerHeight = 176;
  const headerGrad = ctx.createLinearGradient(0, 0, width, headerHeight);
  headerGrad.addColorStop(0, '#23497D');
  headerGrad.addColorStop(0.55, '#1A365D');
  headerGrad.addColorStop(1, '#112542');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, width, headerHeight);

  // Cyan bottom hairline accent on header
  ctx.fillStyle = '#00AEEF';
  ctx.fillRect(0, headerHeight - 4, width, 4);

  // Troika horizontal lockup on left
  if (logoImg) {
    const logoH = 82;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, 56, (headerHeight - logoH) / 2 - 2, logoW, logoH);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 44px Inter, system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('TROIKA', 56, headerHeight / 2);
  }

  // Right header descriptor
  ctx.fillStyle = '#BAE6FD';
  ctx.font = '600 21px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRODUCT SPECIFICATION', width - 56, headerHeight / 2);
  ctx.textAlign = 'left';

  // 3. Product Visual Stage
  const padX = 56;
  const cardW = width - padX * 2;
  const stageY = productImg ? 224 : 232;
  const stageH = productImg ? 560 : 300;

  drawRoundedRect(ctx, padX, stageY, cardW, stageH, 32);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#E2E8F0';
  ctx.stroke();

  if (productImg) {
    const innerPad = 48;
    const maxW = cardW - innerPad * 2;
    const maxH = stageH - innerPad * 2;
    const scale = Math.min(maxW / productImg.width, maxH / productImg.height);
    const drawW = productImg.width * scale;
    const drawH = productImg.height * scale;
    const drawX = padX + (cardW - drawW) / 2;
    const drawY = stageY + (stageH - drawH) / 2;
    ctx.drawImage(productImg, drawX, drawY, drawW, drawH);
  } else {
    // Clean architectural SKU crest when no photo is available
    ctx.fillStyle = '#1A365D';
    ctx.font = '800 54px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(product.code || 'TROIKA', width / 2, stageY + stageH / 2 - 16);

    ctx.fillStyle = '#64748B';
    ctx.font = '600 22px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText('TROIKA ARCHITECTURAL BATHWARE', width / 2, stageY + stageH / 2 + 42);
    ctx.textAlign = 'left';
  }

  // 4. Specification & Pricing Block
  let cursorY = stageY + stageH + 64;

  // Code & Size line
  const metaParts = [`CODE: ${product.code}`];
  if (product.size) {
    metaParts.push(`SIZE: ${product.size}`);
  }
  ctx.fillStyle = '#475569';
  ctx.font = '700 26px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(metaParts.join('   ·   '), padX, cursorY);
  cursorY += 54;

  // Product Name (wrapped cleanly)
  ctx.fillStyle = '#0F172A';
  ctx.font = '800 50px Inter, system-ui, -apple-system, sans-serif';
  const nameLines = wrapTextLines(ctx, product.name, cardW, 3);
  for (const line of nameLines) {
    ctx.fillText(line, padX, cursorY);
    cursorY += 64;
  }

  // Hairline divider above MRP
  const mrpSectionY = Math.max(cursorY + 34, height - 290);
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(padX, mrpSectionY, cardW, 2);

  // MRP Label & Value
  const mrpY = mrpSectionY + 42;
  ctx.fillStyle = '#64748B';
  ctx.font = '700 24px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('M.R.P.', padX, mrpY + 14);

  ctx.textAlign = 'right';
  if (hasPrice) {
    ctx.fillStyle = '#00AEEF';
    ctx.font = '900 66px Inter, system-ui, -apple-system, sans-serif';
  } else {
    ctx.fillStyle = '#64748B';
    ctx.font = '700 40px Inter, system-ui, -apple-system, sans-serif';
  }
  ctx.fillText(formattedPrice, width - padX, mrpY);
  ctx.textAlign = 'left';

  // 5. Subtle Footer
  const footerY = height - 88;
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(padX, footerY - 22, cardW, 2);

  ctx.fillStyle = '#64748B';
  ctx.font = '600 22px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('troikaworld.com', padX, footerY);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1A365D';
  ctx.font = '700 22px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('Artful Passion', width - padX, footerY);
  ctx.textAlign = 'left';

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

  // Prefer native OS Share Sheet (WhatsApp / Messages) when file sharing is supported
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const shareData: ShareData = {
      files: [file],
      title: `${product.name} (${product.code})`,
      text: `${product.name}\nCode: ${product.code}\nMRP: ${formattedPrice}`,
    };

    const canShareFiles =
      typeof navigator.canShare === 'function' ? navigator.canShare({ files: [file] }) : true;

    if (canShareFiles) {
      try {
        await navigator.share(shareData);
        return 'shared';
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return 'cancelled';
        }
        // Fall through to PNG download if native share fails in an embedded iframe/webview
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
