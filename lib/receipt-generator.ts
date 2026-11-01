import type { MerchOrderRow } from '@/lib/supabase';
import { parseBulkItemsFromNotes } from '@/components/FormalMerchReceipt';

/**
 * Loads an image from a URL, resolving with null if it fails or times out.
 */
function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
    setTimeout(() => resolve(null), 800);
  });
}

/**
 * Draws a dashed line on the canvas context.
 */
function drawDashedLine(ctx: CanvasRenderingContext2D, y: number, width: number, dash = [6, 4]) {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(32, y);
  ctx.lineTo(width - 32, y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Generates an ultra-crisp, aesthetic receipt image as a PNG data URL.
 * Minimalist, real-receipt style with authentic PSITS digital verification indicator.
 */
export async function generateReceiptImage(order: MerchOrderRow): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Receipt generation can only run in the browser.');
  }

  const bulkItems = parseBulkItemsFromNotes(order.notes);
  const isBulk = bulkItems.length > 0 || order.quantity > 1;
  const isPaid = order.status === 'ordered' || order.status === 'ready_for_pickup' || order.status === 'completed';

  const refCode = `#POLO-${order.id.slice(0, 8).toUpperCase()}`;
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate dynamic canvas height
  const baseWidth = 640;
  const itemRowHeight = 24;
  const itemCount = isBulk && bulkItems.length > 0 ? bulkItems.length : 1;
  const itemsSectionHeight = itemCount * itemRowHeight + 50;
  const baseHeight = 500;
  const totalHeight = baseHeight + itemsSectionHeight;

  // Setup Retina Canvas (scale: 2)
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = baseWidth * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context.');

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, baseWidth, totalHeight);

  // Subtle border / receipt outline
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, baseWidth - 24, totalHeight - 24);

  // Load PSITS Logo only (UA logo removed as requested)
  const psitsLogo = await loadImageSafe('/assets/logo/PSITS logo.png');

  // Draw Faint Watermark in the background
  if (psitsLogo) {
    ctx.save();
    ctx.globalAlpha = 0.04;
    const wmSize = 280;
    ctx.drawImage(
      psitsLogo,
      (baseWidth - wmSize) / 2,
      (totalHeight - wmSize) / 2,
      wmSize,
      wmSize
    );
    ctx.restore();
  }

  let currentY = 40;

  // Centered Header PSITS Logo
  if (psitsLogo) {
    const logoSize = 52;
    ctx.drawImage(psitsLogo, (baseWidth - logoSize) / 2, currentY - 6, logoSize, logoSize);
    currentY += logoSize + 8;
  } else {
    currentY += 10;
  }

  // Header Typography
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';

  ctx.font = 'bold 14px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillText('PHILIPPINE SOCIETY OF INFORMATION TECHNOLOGY STUDENTS', baseWidth / 2, currentY);

  currentY += 18;
  ctx.font = '12px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('College of Computer Information Sciences · University of Antique', baseWidth / 2, currentY);

  currentY += 16;
  ctx.font = '11px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Sibalom, Antique · Academic Year 2026–2027', baseWidth / 2, currentY);

  currentY += 22;
  ctx.font = 'bold 15px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#0F172A';
  ctx.fillText('OFFICIAL MERCHANDISE RECEIPT', baseWidth / 2, currentY);

  currentY += 16;
  ctx.font = '11px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#64748B';
  ctx.fillText('NexGen TechTorch Department Polo Shirt', baseWidth / 2, currentY);

  currentY += 20;
  drawDashedLine(ctx, currentY, baseWidth);

  // Meta Section (Key - Value grid)
  currentY += 24;
  ctx.textAlign = 'left';
  const leftX = 40;
  const rightX = baseWidth - 40;

  const renderMetaRow = (label: string, value: string) => {
    ctx.font = 'bold 12px "Courier Prime", "SF Mono", "Menlo", monospace';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'left';
    ctx.fillText(label, leftX, currentY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px "Courier Prime", "SF Mono", "Menlo", monospace';
    ctx.fillText(value, rightX, currentY);

    currentY += 20;
  };

  renderMetaRow('RECEIPT NO', refCode);
  renderMetaRow('TRANSACTION DATE', formattedDate);
  renderMetaRow('ORDER STATUS', isPaid ? 'PAID (OFFICE VERIFIED)' : 'ORDER CONFIRMED');
  renderMetaRow('STUDENT / PAYER', (order.student_name || 'N/A').toUpperCase());
  renderMetaRow('CLASS / SECTION', order.course_year || 'N/A');
  renderMetaRow('CAMPUS EMAIL', order.student_email || 'N/A');
  renderMetaRow('PAYMENT METHOD', isPaid ? 'Cash (Office Verified)' : 'Cash on Claim');

  currentY += 6;
  drawDashedLine(ctx, currentY, baseWidth);

  // Items Header Table
  currentY += 22;
  ctx.font = 'bold 12px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#0F172A';

  ctx.textAlign = 'left';
  ctx.fillText('ITEM / STUDENT NAME', leftX, currentY);

  ctx.textAlign = 'center';
  ctx.fillText('SIZE', baseWidth - 170, currentY);
  ctx.fillText('QTY', baseWidth - 115, currentY);

  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', rightX, currentY);

  currentY += 12;
  drawDashedLine(ctx, currentY, baseWidth, [3, 3]);

  currentY += 18;

  // Render Items
  if (isBulk && bulkItems.length > 0) {
    bulkItems.forEach((item, idx) => {
      ctx.font = '11px "Courier Prime", "SF Mono", "Menlo", monospace';
      ctx.fillStyle = '#0F172A';

      ctx.textAlign = 'left';
      const numPrefix = String(idx + 1).padStart(2, '0');
      const maxNameLen = 30;
      const truncatedName = item.studentName.length > maxNameLen ? item.studentName.slice(0, maxNameLen) + '…' : item.studentName;
      ctx.fillText(`${numPrefix}. ${truncatedName}`, leftX, currentY);

      ctx.textAlign = 'center';
      ctx.font = 'bold 11px "Courier Prime", "SF Mono", "Menlo", monospace';
      ctx.fillStyle = '#1E3A8A';
      ctx.fillText(item.size, baseWidth - 170, currentY);

      ctx.fillStyle = '#0F172A';
      ctx.font = '11px "Courier Prime", "SF Mono", "Menlo", monospace';
      ctx.fillText('1', baseWidth - 115, currentY);

      ctx.textAlign = 'right';
      ctx.fillText('₱475.00', rightX, currentY);

      currentY += itemRowHeight;
    });
  } else {
    // Single Item
    ctx.font = 'bold 12px "Courier Prime", "SF Mono", "Menlo", monospace';
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'left';
    ctx.fillText('Official PSITS Polo Shirt (AY 26–27)', leftX, currentY);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1E3A8A';
    ctx.fillText(order.size, baseWidth - 170, currentY);

    ctx.fillStyle = '#0F172A';
    ctx.fillText(String(order.quantity || 1), baseWidth - 115, currentY);

    ctx.textAlign = 'right';
    ctx.fillText(`₱${order.total_amount || 475}.00`, rightX, currentY);

    currentY += 16;
    ctx.font = '10px "Courier Prime", "SF Mono", "Menlo", monospace';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'left';
    ctx.fillText('NexGen TechTorch Edition · Poly Fabric', leftX, currentY);

    currentY += 18;
  }

  currentY += 6;
  drawDashedLine(ctx, currentY, baseWidth);

  // Total Summary Block
  currentY += 24;
  ctx.font = 'bold 12px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'left';
  ctx.fillText(`TOTAL ITEMS: ${order.quantity} pcs`, leftX, currentY);

  ctx.textAlign = 'right';
  ctx.fillText('UNIT PRICE: ₱475.00', rightX, currentY);

  currentY += 14;
  // Double solid line for Total
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftX, currentY);
  ctx.lineTo(rightX, currentY);
  ctx.stroke();

  currentY += 3;
  ctx.beginPath();
  ctx.moveTo(leftX, currentY);
  ctx.lineTo(rightX, currentY);
  ctx.stroke();

  currentY += 24;
  ctx.font = 'bold 15px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'left';
  ctx.fillText(isPaid ? 'TOTAL AMOUNT PAID' : 'TOTAL AMOUNT PAYABLE', leftX, currentY);

  ctx.textAlign = 'right';
  ctx.font = 'bold 18px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillText(`₱${order.total_amount || order.quantity * 475}.00`, rightX, currentY);

  currentY += 16;
  drawDashedLine(ctx, currentY, baseWidth);

  // Instructions & Claim Venue (No emojis)
  currentY += 22;
  ctx.font = 'bold 12px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.fillText('CLAIM VENUE: PSITS Office, 2nd Floor, CCIS Building', baseWidth / 2, currentY);

  currentY += 18;
  ctx.font = '11px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Present this receipt slip on your mobile phone upon claiming.', baseWidth / 2, currentY);

  currentY += 22;
  drawDashedLine(ctx, currentY, baseWidth, [2, 2]);

  // Clean Receipt Footer
  currentY += 24;
  ctx.font = 'bold 11px "Courier Prime", "SF Mono", "Menlo", monospace';
  ctx.fillStyle = '#0F172A';
  ctx.fillText('OFFICIAL DIGITAL RECEIPT · VALID FOR CLAIMING', baseWidth / 2, currentY);

  return canvas.toDataURL('image/png');
}

/**
 * Downloads the receipt image directly to the user's device.
 */
export async function downloadReceiptImage(order: MerchOrderRow): Promise<void> {
  const dataUrl = await generateReceiptImage(order);
  const refCode = order.id.slice(0, 8).toUpperCase();
  const fileName = `PSITS-Receipt-POLO-${refCode}.png`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
