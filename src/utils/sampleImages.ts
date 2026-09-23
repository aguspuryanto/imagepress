import { getImageDimensions } from './clientCompressor';
import { ImageQueueItem } from '../types/compressor';

/**
 * Creates rich procedural sample images with real byte content for testing compression
 */
function createProceduralImage(
  width: number,
  height: number,
  type: 'landscape' | 'product' | 'dashboard' | 'geometric',
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    if (type === 'landscape') {
      // 1. Rich Sky Sunset Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.3, '#312e81');
      skyGrad.addColorStop(0.6, '#9333ea');
      skyGrad.addColorStop(0.85, '#f97316');
      skyGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Glowing Sun
      const sunGrad = ctx.createRadialGradient(width * 0.65, height * 0.6, 10, width * 0.65, height * 0.6, 180);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.4, '#fde047');
      sunGrad.addColorStop(0.8, '#f97316');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width * 0.65, height * 0.6, 180, 0, Math.PI * 2);
      ctx.fill();

      // Distant Mountains
      ctx.fillStyle = '#431407';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.75);
      ctx.lineTo(width * 0.25, height * 0.52);
      ctx.lineTo(width * 0.5, height * 0.68);
      ctx.lineTo(width * 0.8, height * 0.48);
      ctx.lineTo(width, height * 0.7);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Foreground Dark Ridgeline
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.82);
      ctx.lineTo(width * 0.35, height * 0.65);
      ctx.lineTo(width * 0.7, height * 0.78);
      ctx.lineTo(width, height * 0.72);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Pine trees silhouettes
      ctx.fillStyle = '#020617';
      for (let i = 0; i < 45; i++) {
        const x = (width / 45) * i + (Math.sin(i) * 15);
        const y = height * 0.8 + (Math.sin(i * 3) * 30);
        const treeH = 40 + (Math.sin(i * 5) * 25);
        ctx.beginPath();
        ctx.moveTo(x, y - treeH);
        ctx.lineTo(x - 12, y);
        ctx.lineTo(x + 12, y);
        ctx.closePath();
        ctx.fill();
      }

      // Atmospheric Noise / Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let s = 0; s < 120; s++) {
        const sx = (s * 97) % width;
        const sy = (s * 53) % (height * 0.45);
        const sr = (s % 3) * 0.8 + 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (type === 'product') {
      // 2. Transparent Background with High-end Studio Camera Product
      ctx.clearRect(0, 0, width, height);

      // Radial Studio Backdrop glow
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.45);
      bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
      bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Camera Body Outer (Dark Titanium)
      const cx = width / 2;
      const cy = height / 2;
      const bodyW = width * 0.62;
      const bodyH = height * 0.44;

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH, 24);
      ctx.fill();
      ctx.stroke();

      // Grip area
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(cx + bodyW / 2 - 70, cy - bodyH / 2 + 10, 60, bodyH - 20, 12);
      ctx.fill();

      // Textured grip dots
      ctx.fillStyle = '#1e293b';
      for (let gx = 0; gx < 5; gx++) {
        for (let gy = 0; gy < 14; gy++) {
          ctx.beginPath();
          ctx.arc(cx + bodyW / 2 - 58 + gx * 10, cy - bodyH / 2 + 25 + gy * 10, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Lens Outer Rings
      const lensR = bodyH * 0.48;
      const lensGrad = ctx.createRadialGradient(cx - 30, cy, 10, cx - 30, cy, lensR);
      lensGrad.addColorStop(0, '#0284c7');
      lensGrad.addColorStop(0.4, '#0f172a');
      lensGrad.addColorStop(0.7, '#1e293b');
      lensGrad.addColorStop(0.9, '#475569');
      lensGrad.addColorStop(1, '#0f172a');

      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(cx - 30, cy, lensR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Optical Reflection Highlight
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(cx - 50, cy - 25, lensR * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Studio Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('SHARP 50MM F/1.2', cx - 110, cy + lensR + 34);

    } else if (type === 'dashboard') {
      // 3. High Density SaaS Dashboard Screenshot
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Top Header
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, 56);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(24, 18, 20, 20);
      ctx.fillStyle = '#f9fafb';
      ctx.font = '600 15px sans-serif';
      ctx.fillText('Cloud Infrastructure Monitor', 56, 33);

      // Sidebar
      ctx.fillStyle = '#0e1526';
      ctx.fillRect(0, 56, 200, height - 56);

      // Sidebar menu items
      const menus = ['Overview', 'Image Optimization', 'Edge Storage', 'CDN Routing', 'API Keys', 'Settings'];
      menus.forEach((m, idx) => {
        ctx.fillStyle = idx === 1 ? '#1e293b' : 'transparent';
        ctx.fillRect(12, 76 + idx * 40, 176, 32);
        ctx.fillStyle = idx === 1 ? '#38bdf8' : '#94a3b8';
        ctx.font = '13px sans-serif';
        ctx.fillText(m, 32, 97 + idx * 40);
      });

      // Stat Cards
      const cardX = 224;
      const cardW = (width - 248) / 3;
      const stats = [
        { label: 'Bandwidth Saved', val: '1.42 TB', change: '+24.5%' },
        { label: 'Avg Compression Latency', val: '42.8 ms', change: '-18.2%' },
        { label: 'Requests Processed', val: '894,120', change: '+12.1%' },
      ];

      stats.forEach((st, i) => {
        const x = cardX + i * (cardW + 12);
        ctx.fillStyle = '#131b2e';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, 76, cardW, 90, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText(st.label, x + 16, 102);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(st.val, x + 16, 134);

        ctx.fillStyle = '#34d399';
        ctx.font = '11px sans-serif';
        ctx.fillText(st.change, x + cardW - 60, 134);
      });

      // Performance Graph
      const chartY = 186;
      const chartW = width - 248;
      const chartH = height - 210;

      ctx.fillStyle = '#131b2e';
      ctx.beginPath();
      ctx.roundRect(cardX, chartY, chartW, chartH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 14px sans-serif';
      ctx.fillText('Sharp Processing Throughput (Images/sec)', cardX + 20, chartY + 30);

      // Draw Grid Lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let g = 0; g < 5; g++) {
        const gy = chartY + 50 + g * ((chartH - 80) / 4);
        ctx.beginPath();
        ctx.moveTo(cardX + 20, gy);
        ctx.lineTo(cardX + chartW - 20, gy);
        ctx.stroke();
      }

      // Draw Trend Line
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      const points = [45, 60, 55, 80, 75, 110, 95, 130, 125, 160, 150, 185, 175, 210, 230];
      const stepX = (chartW - 60) / (points.length - 1);
      points.forEach((pt, idx) => {
        const px = cardX + 30 + idx * stepX;
        const py = chartY + chartH - 30 - (pt / 250) * (chartH - 90);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

    } else {
      // 4. Abstract High-Frequency Geometric Art (Tests compression artifacting)
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(0.5, '#042f2e');
      grad.addColorStop(1, '#022c22');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Concentric complex polygons
      for (let r = 20; r < Math.min(width, height) * 0.6; r += 16) {
        ctx.strokeStyle = `hsl(${(r * 2) % 360}, 85%, 65%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const sides = 8;
        for (let s = 0; s <= sides; s++) {
          const angle = (s * 2 * Math.PI) / sides;
          const px = width / 2 + Math.cos(angle) * r;
          const py = height / 2 + Math.sin(angle) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIGH-FREQUENCY VECTOR TEST', width / 2, height / 2 + 12);
    }

    canvas.toBlob((blob) => {
      resolve(blob || new Blob([]));
    }, mimeType, 0.95);
  });
}

/**
 * Generates the full initial batch of sample images
 */
export async function generateSampleBatch(): Promise<ImageQueueItem[]> {
  const samples = [
    {
      name: 'mountain-sunset-4k.jpg',
      type: 'landscape' as const,
      width: 2560,
      height: 1440,
      mime: 'image/jpeg' as const,
    },
    {
      name: 'studio-camera-lens.png',
      type: 'product' as const,
      width: 1400,
      height: 1000,
      mime: 'image/png' as const,
    },
    {
      name: 'analytics-dashboard-hd.png',
      type: 'dashboard' as const,
      width: 1920,
      height: 1080,
      mime: 'image/png' as const,
    },
    {
      name: 'geometric-patterns.jpg',
      type: 'geometric' as const,
      width: 1600,
      height: 1200,
      mime: 'image/jpeg' as const,
    },
  ];

  const items: ImageQueueItem[] = [];

  for (const s of samples) {
    const blob = await createProceduralImage(s.width, s.height, s.type, s.mime);
    const meta = await getImageDimensions(blob);
    const url = URL.createObjectURL(blob);

    items.push({
      id: `sample-${Math.random().toString(36).substring(2, 9)}`,
      name: s.name,
      originalFile: blob,
      originalSize: blob.size,
      originalWidth: meta.width,
      originalHeight: meta.height,
      originalFormat: s.mime.replace('image/', ''),
      originalUrl: url,
      status: 'idle',
      progress: 0,
    });
  }

  return items;
}
