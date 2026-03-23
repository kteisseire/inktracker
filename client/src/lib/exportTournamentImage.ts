import type { Tournament, Round, InkColor } from '@lorcana/shared';

const INK_HEX: Record<string, string> = {
  AMBER: '#F5A623',
  AMETHYST: '#9B59B6',
  EMERALD: '#27AE60',
  RUBY: '#E74C3C',
  SAPPHIRE: '#3498DB',
  STEEL: '#7F8C8D',
};

const RESULT_LABEL: Record<string, { text: string; color: string }> = {
  WIN: { text: 'V', color: '#4ade80' },
  LOSS: { text: 'D', color: '#f87171' },
  DRAW: { text: 'N', color: '#9ca3af' },
};

const FORMAT_LABELS: Record<string, string> = { BO1: 'Bo1', BO3: 'Bo3', BO5: 'Bo5' };

export function exportTournamentImage(tournament: Tournament, username: string) {
  const rounds = tournament.rounds || [];
  const wins = rounds.filter(r => r.result === 'WIN').length;
  const losses = rounds.filter(r => r.result === 'LOSS').length;
  const draws = rounds.filter(r => r.result === 'DRAW').length;

  const W = 720;
  const PADDING = 40;
  const ROW_HEIGHT = 44;
  const HEADER_HEIGHT = 200;
  const ROUND_HEADER = 36;
  const roundsToShow = rounds.filter(r => r.result);
  const H = HEADER_HEIGHT + (roundsToShow.length > 0 ? ROUND_HEADER + roundsToShow.length * ROW_HEIGHT : 0) + 70;

  const canvas = document.createElement('canvas');
  const dpr = 2;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0e1a');
  bg.addColorStop(1, '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle border
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // --- Header section ---
  // Tournament name
  ctx.fillStyle = '#f5f0e8';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  const nameText = tournament.name.length > 40 ? tournament.name.slice(0, 38) + '…' : tournament.name;
  ctx.fillText(nameText, PADDING, 50);

  // Date & location
  const dateStr = new Date(tournament.date).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const locationStr = tournament.location ? ` — ${tournament.location}` : '';
  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText(dateStr + locationStr, PADDING, 74);

  // Player name
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(username, PADDING, 100);

  // Deck colors (circles)
  const deckColors = (tournament.myDeckColors || []) as InkColor[];
  let cx = PADDING;
  const cy = 125;
  for (const color of deckColors) {
    const hex = INK_HEX[color] || '#666';
    ctx.beginPath();
    ctx.arc(cx + 12, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    cx += 32;
  }

  // Format badge
  ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
  roundRect(ctx, cx + 8, cy - 11, 50, 22, 6);
  ctx.fill();
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(FORMAT_LABELS[tournament.format] || tournament.format, cx + 33, cy + 4);
  ctx.textAlign = 'left';

  // Win/Loss/Draw record — big
  const recordY = 170;
  ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
  let rx = PADDING;

  ctx.fillStyle = '#4ade80';
  const wText = `${wins}V`;
  ctx.fillText(wText, rx, recordY);
  rx += ctx.measureText(wText).width + 10;

  ctx.fillStyle = '#f87171';
  const lText = `${losses}D`;
  ctx.fillText(lText, rx, recordY);
  rx += ctx.measureText(lText).width + 10;

  if (draws > 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`${draws}N`, rx, recordY);
    rx += ctx.measureText(`${draws}N`).width + 10;
  }

  // Placement
  if (tournament.placement) {
    const placementText = `#${tournament.placement}`;
    const playersText = tournament.playerCount ? ` / ${tournament.playerCount}` : '';
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(placementText, W - PADDING, recordY);
    if (playersText) {
      ctx.fillStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillText(playersText, W - PADDING, recordY + 24);
    }
    ctx.textAlign = 'left';
  } else if (tournament.playerCount) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${tournament.playerCount} joueurs`, W - PADDING, recordY);
    ctx.textAlign = 'left';
  }

  // --- Rounds section ---
  if (roundsToShow.length > 0) {
    const tableY = HEADER_HEIGHT;

    // Section title
    ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.fillRect(0, tableY, W, ROUND_HEADER);
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('RONDE', PADDING, tableY + 22);
    ctx.fillText('ADVERSAIRE', PADDING + 60, tableY + 22);
    ctx.fillText('DECK', W - PADDING - 130, tableY + 22);
    ctx.textAlign = 'right';
    ctx.fillText('RÉSULTAT', W - PADDING, tableY + 22);
    ctx.textAlign = 'left';

    roundsToShow.forEach((round, i) => {
      const rowY = tableY + ROUND_HEADER + i * ROW_HEIGHT;

      // Alternate row bg
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, rowY, W, ROW_HEIGHT);
      }

      // Round number
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const roundLabel = round.isTopCut ? `TC${round.roundNumber}` : `R${round.roundNumber}`;
      ctx.fillText(roundLabel, PADDING + 20, rowY + 27);
      ctx.textAlign = 'left';

      // Opponent name
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      const oppName = round.opponentName || '—';
      const truncOpp = oppName.length > 22 ? oppName.slice(0, 20) + '…' : oppName;
      ctx.fillText(truncOpp, PADDING + 60, rowY + 27);

      // Opponent deck colors
      const oppColors = (round.opponentDeckColors || []) as InkColor[];
      let dotX = W - PADDING - 130;
      for (const color of oppColors) {
        ctx.beginPath();
        ctx.arc(dotX + 7, rowY + 22, 7, 0, Math.PI * 2);
        ctx.fillStyle = INK_HEX[color] || '#666';
        ctx.fill();
        dotX += 20;
      }

      // Result badge
      const r = RESULT_LABEL[round.result] || { text: '?', color: '#6b7280' };
      const badgeW = 36;
      const badgeX = W - PADDING - badgeW;
      ctx.fillStyle = r.color + '20';
      roundRect(ctx, badgeX, rowY + 8, badgeW, 28, 6);
      ctx.fill();
      ctx.fillStyle = r.color;
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(r.text, badgeX + badgeW / 2, rowY + 28);
      ctx.textAlign = 'left';
    });
  }

  // --- Footer / watermark ---
  ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('GlimmerLog', W - PADDING, H - 16);
  ctx.textAlign = 'left';

  // Share or download
  const safeName = tournament.name.replace(/[^a-zA-Z0-9àâéèêëïîôùûç\s-]/g, '').trim().replace(/\s+/g, '_');
  canvas.toBlob(async blob => {
    if (!blob) return;
    const file = new File([blob], `${safeName}_recap.png`, { type: 'image/png' });

    // Try Web Share API (mobile)
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: tournament.name });
        return;
      } catch {
        // User cancelled or share failed — fall through to download
      }
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
