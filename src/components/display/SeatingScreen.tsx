import type { Player } from '../../domain/types';
import { findChipLeader } from '../../domain/logic';
import { useTranslation } from '../../i18n';

interface Props {
  players: Player[];
  dealerIndex: number;
}

export function SeatingScreen({ players, dealerIndex }: Props) {
  const { t } = useTranslation();
  const chipLeaderId = findChipLeader(players);

  // Layout constants
  const cx = 500; // center x
  const cy = 300; // center y
  const rx = 380; // table radius x (oval)
  const ry = 200; // table radius y (oval)
  const playerRx = 440; // player orbit x
  const playerRy = 260; // player orbit y

  // Calculate player positions around the oval
  const playerPositions = players.map((_, i) => {
    // Distribute evenly around the ellipse, starting from the top
    const angle = (2 * Math.PI * i) / players.length - Math.PI / 2;
    return {
      x: cx + playerRx * Math.cos(angle),
      y: cy + playerRy * Math.sin(angle),
    };
  });

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
        {t('display.seating')}
      </h2>
      <div className="flex-1 flex items-center justify-center">
        <svg viewBox="0 0 1000 600" className="w-full h-full max-h-[40vh]" preserveAspectRatio="xMidYMid meet">
          {/* Table surface */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="#1a5c2a"
            stroke="#0f3d1a"
            strokeWidth="6"
          />
          {/* Table felt inner highlight */}
          <ellipse
            cx={cx}
            cy={cy - 10}
            rx={rx - 30}
            ry={ry - 25}
            fill="none"
            stroke="#2d8a4e"
            strokeWidth="1.5"
            opacity="0.4"
          />

          {/* Player seats */}
          {players.map((player, i) => {
            const pos = playerPositions[i];
            const isActive = player.status === 'active';
            const isDealer = i === dealerIndex;
            const isChipLeader = player.id === chipLeaderId;

            // Truncate name for display
            const displayName = player.name.length > 10
              ? player.name.slice(0, 9) + '\u2026'
              : player.name;

            return (
              <g key={player.id}>
                {/* Seat circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={28}
                  fill={isActive ? '#1f2937' : '#374151'}
                  stroke={isActive ? '#10b981' : '#ef4444'}
                  strokeWidth={isActive ? 2.5 : 2}
                  opacity={isActive ? 1 : 0.5}
                />

                {/* Seat number */}
                <text
                  x={pos.x}
                  y={pos.y - 4}
                  textAnchor="middle"
                  fill={isActive ? '#9ca3af' : '#6b7280'}
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {i + 1}
                </text>

                {/* Player name */}
                <text
                  x={pos.x}
                  y={pos.y + 10}
                  textAnchor="middle"
                  fill={isActive ? '#e5e7eb' : '#6b7280'}
                  fontSize="11"
                  fontWeight={isActive ? 'bold' : 'normal'}
                  opacity={isActive ? 1 : 0.6}
                >
                  {displayName}
                </text>

                {/* Status indicator */}
                {isActive ? (
                  <circle cx={pos.x + 20} cy={pos.y - 20} r={4} fill="#10b981" />
                ) : (
                  <>
                    <line x1={pos.x + 16} y1={pos.y - 24} x2={pos.x + 24} y2={pos.y - 16} stroke="#ef4444" strokeWidth="2.5" />
                    <line x1={pos.x + 24} y1={pos.y - 24} x2={pos.x + 16} y2={pos.y - 16} stroke="#ef4444" strokeWidth="2.5" />
                  </>
                )}

                {/* Dealer button */}
                {isDealer && isActive && (
                  <g>
                    <circle cx={pos.x - 22} cy={pos.y - 20} r={11} fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                    <text
                      x={pos.x - 22}
                      y={pos.y - 16}
                      textAnchor="middle"
                      fill="#1f2937"
                      fontSize="11"
                      fontWeight="bold"
                    >
                      D
                    </text>
                  </g>
                )}

                {/* Chip Leader badge */}
                {isChipLeader && isActive && (
                  <g>
                    <circle
                      cx={pos.x + (isDealer ? 0 : -22)}
                      cy={pos.y + 22}
                      r={9}
                      fill="#f59e0b"
                      stroke="#d97706"
                      strokeWidth="1"
                    />
                    <text
                      x={pos.x + (isDealer ? 0 : -22)}
                      y={pos.y + 26}
                      textAnchor="middle"
                      fill="#1f2937"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {t('display.chipLeaderBadge')}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
