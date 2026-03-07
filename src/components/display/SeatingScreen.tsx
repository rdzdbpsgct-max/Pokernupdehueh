import type { Player, Table } from '../../domain/types';
import type { TranslationKey } from '../../i18n/translations';
import { findChipLeader } from '../../domain/logic';
import { useTranslation } from '../../i18n';

interface Props {
  players: Player[];
  dealerIndex: number;
  tables?: Table[];
}

/** Single poker table SVG — used both for single-table mode and as mini-tables in multi-table mode */
function TableOval({
  players: tablePlayers,
  dealerIndex,
  chipLeaderId,
  cx,
  cy,
  rx,
  ry,
  playerRx,
  playerRy,
  tableName,
  dealerSeat,
  isDissolved,
  fontSize,
  seatRadius,
  t,
}: {
  players: { id: string; name: string; status: string; seatNumber?: number }[];
  dealerIndex: number;
  chipLeaderId: string | null;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  playerRx: number;
  playerRy: number;
  tableName?: string;
  dealerSeat?: number | null;
  isDissolved?: boolean;
  fontSize: number;
  seatRadius: number;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const playerPositions = tablePlayers.map((_, i) => {
    const angle = (2 * Math.PI * i) / tablePlayers.length - Math.PI / 2;
    return {
      x: cx + playerRx * Math.cos(angle),
      y: cy + playerRy * Math.sin(angle),
    };
  });

  return (
    <g opacity={isDissolved ? 0.3 : 1}>
      {/* Table surface */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={isDissolved ? '#374151' : '#1a5c2a'}
        stroke={isDissolved ? '#4b5563' : '#0f3d1a'}
        strokeWidth={isDissolved ? 2 : 4}
        strokeDasharray={isDissolved ? '6 4' : undefined}
      />
      {!isDissolved && (
        <ellipse
          cx={cx}
          cy={cy - 5}
          rx={rx - 15}
          ry={ry - 12}
          fill="none"
          stroke="#2d8a4e"
          strokeWidth="1"
          opacity="0.4"
        />
      )}

      {/* Table name label */}
      {tableName && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          fill={isDissolved ? '#6b7280' : '#4ade80'}
          fontSize={fontSize + 2}
          fontWeight="bold"
          opacity="0.6"
        >
          {tableName}
        </text>
      )}

      {/* Player seats */}
      {tablePlayers.map((player, i) => {
        const pos = playerPositions[i];
        const isActive = player.status === 'active';
        const isDealer = dealerSeat != null
          ? player.seatNumber === dealerSeat
          : i === dealerIndex;
        const isChipLeader = player.id === chipLeaderId;

        const displayName = player.name.length > 8
          ? player.name.slice(0, 7) + '\u2026'
          : player.name;

        return (
          <g key={player.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={seatRadius}
              fill={isActive ? '#1f2937' : '#374151'}
              stroke={isActive ? '#10b981' : '#ef4444'}
              strokeWidth={isActive ? 2 : 1.5}
              opacity={isActive ? 1 : 0.5}
            />
            {player.seatNumber && (
              <text
                x={pos.x}
                y={pos.y - fontSize * 0.3}
                textAnchor="middle"
                fill={isActive ? '#9ca3af' : '#6b7280'}
                fontSize={fontSize - 2}
                fontFamily="monospace"
              >
                {player.seatNumber}
              </text>
            )}
            <text
              x={pos.x}
              y={pos.y + fontSize * 0.7}
              textAnchor="middle"
              fill={isActive ? '#e5e7eb' : '#6b7280'}
              fontSize={fontSize}
              fontWeight={isActive ? 'bold' : 'normal'}
              opacity={isActive ? 1 : 0.6}
            >
              {displayName}
            </text>
            {isActive && (
              <circle cx={pos.x + seatRadius * 0.7} cy={pos.y - seatRadius * 0.7} r={3} fill="#10b981" />
            )}
            {!isActive && (
              <>
                <line x1={pos.x + seatRadius * 0.5} y1={pos.y - seatRadius * 0.9} x2={pos.x + seatRadius * 0.9} y2={pos.y - seatRadius * 0.5} stroke="#ef4444" strokeWidth="2" />
                <line x1={pos.x + seatRadius * 0.9} y1={pos.y - seatRadius * 0.9} x2={pos.x + seatRadius * 0.5} y2={pos.y - seatRadius * 0.5} stroke="#ef4444" strokeWidth="2" />
              </>
            )}
            {isDealer && isActive && (
              <g>
                <circle cx={pos.x - seatRadius * 0.7} cy={pos.y - seatRadius * 0.7} r={8} fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
                <text
                  x={pos.x - seatRadius * 0.7}
                  y={pos.y - seatRadius * 0.7 + 4}
                  textAnchor="middle"
                  fill="#1f2937"
                  fontSize={fontSize - 1}
                  fontWeight="bold"
                >
                  D
                </text>
              </g>
            )}
            {isChipLeader && isActive && (
              <g>
                <circle
                  cx={pos.x + (isDealer ? 0 : -seatRadius * 0.7)}
                  cy={pos.y + seatRadius * 0.8}
                  r={6}
                  fill="#f59e0b"
                  stroke="#d97706"
                  strokeWidth="1"
                />
                <text
                  x={pos.x + (isDealer ? 0 : -seatRadius * 0.7)}
                  y={pos.y + seatRadius * 0.8 + 3}
                  textAnchor="middle"
                  fill="#1f2937"
                  fontSize={fontSize - 3}
                  fontWeight="bold"
                >
                  {t('display.chipLeaderBadge' as TranslationKey)}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

export function SeatingScreen({ players, dealerIndex, tables }: Props) {
  const { t } = useTranslation();
  const chipLeaderId = findChipLeader(players);

  // Multi-table mode: multiple active tables
  const activeTables = tables?.filter(tbl => tbl.status === 'active') ?? [];
  const multiTable = activeTables.length > 1;

  if (multiTable) {
    // Multi-table layout: grid of mini-tables
    const tableCount = activeTables.length;
    const cols = tableCount <= 4 ? 2 : 3;
    const rows = Math.ceil(tableCount / cols);

    const svgWidth = 1000;
    const svgHeight = 600;
    const cellW = svgWidth / cols;
    const cellH = svgHeight / rows;
    const tableRx = cellW * 0.32;
    const tableRy = cellH * 0.28;
    const playerRx = cellW * 0.38;
    const playerRy = cellH * 0.35;

    return (
      <div className="w-full max-w-5xl mx-auto h-full flex flex-col">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
          {t('display.seating')}
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full max-h-[40vh]" preserveAspectRatio="xMidYMid meet">
            {activeTables.map((tbl, idx) => {
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              const cx = cellW * col + cellW / 2;
              const cy = cellH * row + cellH / 2;

              // Build player list from seats
              const seatPlayers = tbl.seats
                .filter(s => s.playerId !== null)
                .map(s => {
                  const player = players.find(p => p.id === s.playerId);
                  return player ? { ...player, seatNumber: s.seatNumber } : null;
                })
                .filter((p): p is Player & { seatNumber: number } => p !== null && p.status === 'active');

              if (seatPlayers.length === 0) return null;

              return (
                <TableOval
                  key={tbl.id}
                  players={seatPlayers}
                  dealerIndex={0}
                  chipLeaderId={chipLeaderId}
                  cx={cx}
                  cy={cy}
                  rx={tableRx}
                  ry={tableRy}
                  playerRx={playerRx}
                  playerRy={playerRy}
                  tableName={tbl.name}
                  dealerSeat={tbl.dealerSeat}
                  fontSize={9}
                  seatRadius={20}
                  t={t}
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  // Single-table mode (original behavior or single active multi-table)
  const singleTable = activeTables.length === 1 ? activeTables[0] : null;

  // If single-table from multi-table config, build players from seats
  const displayPlayers = singleTable
    ? singleTable.seats
        .filter(s => s.playerId !== null)
        .map(s => {
          const player = players.find(p => p.id === s.playerId);
          return player ? { ...player, seatNumber: s.seatNumber } : null;
        })
        .filter((p): p is Player & { seatNumber: number } => p !== null)
    : players.map((p, i) => ({ ...p, seatNumber: i + 1 }));

  // Layout constants
  const cx = 500;
  const cy = 300;
  const rx = 380;
  const ry = 200;
  const playerRx = 440;
  const playerRy = 260;

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
        {t('display.seating')}
        {singleTable && <span className="ml-2 text-emerald-400">{singleTable.name}</span>}
      </h2>
      <div className="flex-1 flex items-center justify-center">
        <svg viewBox="0 0 1000 600" className="w-full h-full max-h-[40vh]" preserveAspectRatio="xMidYMid meet">
          <TableOval
            players={displayPlayers}
            dealerIndex={dealerIndex}
            chipLeaderId={chipLeaderId}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            playerRx={playerRx}
            playerRy={playerRy}
            tableName={singleTable?.name}
            dealerSeat={singleTable?.dealerSeat}
            fontSize={11}
            seatRadius={28}
            t={t}
          />
        </svg>
      </div>
    </div>
  );
}
