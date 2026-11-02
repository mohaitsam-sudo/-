/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * High-performance procedural textures for Mohamed Haitham Bus Simulator 3D
 * - Road asphalt with yellow and white markings
 * - Egyptian curb stripes (Black & Yellow or Red & White)
 * - Modern Egyptian building facades (balconies, windows, AC units)
 * - Speedometer instrument cluster texture
 * - Arabic destination boards & bus stop signs
 */

export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#1e232a';
  ctx.fillRect(0, 0, 512, 512);

  // Noise / grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 24;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // White center dashed lines
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 14;
  ctx.setLineDash([50, 40]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  // Yellow outer border lines
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 10;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(30, 512);
  ctx.moveTo(482, 0);
  ctx.lineTo(482, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCurbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Classic Egyptian alternating Yellow and Black street curbs
  const stripeWidth = 32;
  for (let x = 0; x < 256; x += stripeWidth * 2) {
    ctx.fillStyle = '#eab308'; // Yellow
    ctx.fillRect(x, 0, stripeWidth, 64);
    ctx.fillStyle = '#0f172a'; // Black
    ctx.fillRect(x + stripeWidth, 0, stripeWidth, 64);
  }

  // Weathering gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBuildingFacadeTexture(style: 'residential' | 'glass' | 'hospital' | 'police' = 'residential'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (style === 'glass') {
    // Modern blue reflective glass tower
    ctx.fillStyle = '#0f2942';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    const cols = 8;
    const rows = 12;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo((c * 512) / cols, 0);
      ctx.lineTo((c * 512) / cols, 512);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, (r * 512) / rows);
      ctx.lineTo(512, (r * 512) / rows);
      ctx.stroke();
    }
    // Random lit windows
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = Math.random() > 0.5 ? '#fef08a' : '#bae6fd';
          ctx.globalAlpha = 0.7;
          ctx.fillRect((c * 512) / cols + 6, (r * 512) / rows + 6, 512 / cols - 12, 512 / rows - 12);
        }
      }
    }
    ctx.globalAlpha = 1.0;
  } else if (style === 'hospital') {
    // Clean hospital facade with Red Crescent
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 512, 512);

    // Green/blue architectural accents
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 230, 512, 40);

    // Red Crescent
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(256, 120, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(275, 115, 42, 0, Math.PI * 2);
    ctx.fill();

    // Arabic text banner
    ctx.font = 'bold 28px Cairo, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('مستشفى الطوارئ العام', 256, 260);

    // Windows
    ctx.fillStyle = '#38bdf8';
    for (let x = 40; x < 480; x += 80) {
      for (let y = 320; y < 480; y += 60) {
        ctx.fillRect(x, y, 50, 40);
      }
    }
  } else if (style === 'police') {
    // Egyptian Police Station
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    // Blue and Gold banners
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0, 200, 512, 50);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('قسم شرطة النيل - طوارئ', 256, 236);

    // Eagle/Badge emblem
    ctx.beginPath();
    ctx.arc(256, 100, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Cairo, sans-serif';
    ctx.fillText('الشرطة', 256, 107);
  } else {
    // Authentic Cairo residential apartment building
    // Sandstone / warm terracotta brick tone
    ctx.fillStyle = '#d6b896';
    ctx.fillRect(0, 0, 512, 512);

    // Floor lines
    const floors = 5;
    const floorH = 512 / floors;
    for (let f = 0; f < floors; f++) {
      const y = f * floorH;
      ctx.fillStyle = '#c5a37f';
      ctx.fillRect(0, y, 512, 10);

      // Balconies and windows
      for (let w = 30; w < 480; w += 100) {
        // Window opening
        ctx.fillStyle = '#334155';
        ctx.fillRect(w, y + 25, 60, 55);

        // Glass reflection / lit room
        if (Math.random() > 0.3) {
          ctx.fillStyle = '#fef3c7';
          ctx.globalAlpha = 0.5;
          ctx.fillRect(w + 4, y + 29, 52, 47);
          ctx.globalAlpha = 1.0;
        }

        // Balcony railing
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(w - 6, y + 60, 72, 22);
        // Railing bars
        ctx.fillStyle = '#cbd5e1';
        for (let b = w - 4; b < w + 64; b += 10) {
          ctx.fillRect(b, y + 62, 3, 18);
        }

        // Egyptian AC compressor unit under some windows
        if ((f + w) % 3 === 0) {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(w + 70, y + 55, 24, 20);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(w + 74, y + 59, 16, 12);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSpeedometerTexture(speed: number, rpm: number, gear: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dashboard black background
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(0, 0, 512, 256);

  // Speedometer Gauge (Left)
  const cx1 = 140, cy1 = 140, r1 = 95;
  ctx.beginPath();
  ctx.arc(cx1, cy1, r1, 0.75 * Math.PI, 2.25 * Math.PI);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 14;
  ctx.stroke();

  // Ticks
  for (let s = 0; s <= 140; s += 20) {
    const angle = 0.75 * Math.PI + (s / 140) * 1.5 * Math.PI;
    const x1 = cx1 + Math.cos(angle) * (r1 - 10);
    const y1 = cy1 + Math.sin(angle) * (r1 - 10);
    const x2 = cx1 + Math.cos(angle) * (r1 + 5);
    const y2 = cy1 + Math.sin(angle) * (r1 + 5);
    ctx.strokeStyle = s > 100 ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Numbers
    const tx = cx1 + Math.cos(angle) * (r1 - 25);
    const ty = cy1 + Math.sin(angle) * (r1 - 25);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${s}`, tx, ty);
  }

  // Speedometer Needle
  const clampedSpeed = Math.max(0, Math.min(140, speed));
  const needleAngle = 0.75 * Math.PI + (clampedSpeed / 140) * 1.5 * Math.PI;
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx1, cy1);
  ctx.lineTo(cx1 + Math.cos(needleAngle) * (r1 - 12), cy1 + Math.sin(needleAngle) * (r1 - 12));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx1, cy1, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#f43f5e';
  ctx.fill();

  // Digital readout in center
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Chakra Petch", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(clampedSpeed)}`, cx1, cy1 + 35);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('كم/س KM/H', cx1, cy1 + 52);

  // Tachometer / RPM (Right)
  const cx2 = 372, cy2 = 140, r2 = 95;
  ctx.beginPath();
  ctx.arc(cx2, cy2, r2, 0.75 * Math.PI, 2.25 * Math.PI);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 14;
  ctx.stroke();

  // RPM Needle
  const clampedRpm = Math.max(0, Math.min(3000, rpm));
  const rpmAngle = 0.75 * Math.PI + (clampedRpm / 3000) * 1.5 * Math.PI;
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx2, cy2);
  ctx.lineTo(cx2 + Math.cos(rpmAngle) * (r2 - 12), cy2 + Math.sin(rpmAngle) * (r2 - 12));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx2, cy2, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#eab308';
  ctx.fill();

  // RPM text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Chakra Petch", monospace';
  ctx.fillText(`${Math.round(clampedRpm)}`, cx2, cy2 + 35);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#eab308';
  ctx.fillText('RPM x100', cx2, cy2 + 52);

  // Center display (Gear, Bus Status)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(215, 40, 82, 170);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(215, 40, 82, 170);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 36px "Chakra Petch", monospace';
  ctx.fillText(gear, 256, 95);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('GEAR', 256, 120);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px Cairo, sans-serif';
  ctx.fillText('أوتوبيس سياحي', 256, 155);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('BUS 3D', 256, 175);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBusStopSignTexture(stopName: string, lineNumber: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Egyptian Public Transport Authority Signboard
  ctx.fillStyle = '#1e3a8a'; // Deep blue
  ctx.fillRect(0, 0, 256, 384);

  // Gold header
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 256, 60);

  // Header text
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('هيئة النقل العام', 128, 38);

  // Bus icon
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(50, 80, 156, 90, 14);
  ctx.fill();

  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(65, 95, 45, 30);
  ctx.fillRect(120, 95, 70, 30);
  ctx.beginPath();
  ctx.arc(80, 170, 14, 0, Math.PI * 2);
  ctx.arc(175, 170, 14, 0, Math.PI * 2);
  ctx.fill();

  // Stop Name in Arabic
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.fillText(stopName, 128, 235);

  // Line Number badge
  ctx.fillStyle = '#eab308';
  ctx.fillRect(40, 265, 176, 45);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.fillText(`خط: ${lineNumber}`, 128, 296);

  // "MOHAMED HAITHAM" watermark
  ctx.fillStyle = '#93c5fd';
  ctx.font = '12px Cairo, sans-serif';
  ctx.fillText('MOHAMED HAITHAM BUS SIMULATOR', 128, 350);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGasStationCanopyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dc2626'; // Red banner
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 90, 512, 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('محطة مصر للبترول - وطنية', 256, 62);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('DIESEL / SOLAR / SUPER 95', 256, 116);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDestinationBoardTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  // LED Matrix Board (Amber LED)
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 512, 96);

  ctx.fillStyle = '#f59e0b'; // Amber LED color
  ctx.font = '900 42px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 12;
  ctx.fillText(text, 256, 62);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
