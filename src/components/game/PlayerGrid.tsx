"use client";

import { Mic, MicOff, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, StatusChip } from "@/components/ui/primitives";
import { ROLE_META } from "@/lib/games/mafia-city/roles";
import type { NightActionType, PublicGameState, PublicPlayer } from "@/lib/types";
import { nightActionFor } from "@/lib/games/mafia-city/roles";
import { NIGHT_ACTION_LOCKED, NIGHT_ACTION_PROMPTS } from "@/lib/action-prompt";

function tags(p: PublicPlayer) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      <StatusChip tone={p.alive ? "live" : "dead"}>
        {p.alive ? "Alive" : "Spectator"}
      </StatusChip>
      {p.blackmailed && p.alive && (
        <StatusChip tone="mute">
          <MicOff size={10} className="mr-1" /> Muted
        </StatusChip>
      )}
      {p.isBot && <StatusChip tone="bot">Auto</StatusChip>}
      {p.afkCount >= 2 && p.alive && !p.isBot && <StatusChip tone="afk">AFK</StatusChip>}
      {!p.connected && !p.isBot && <StatusChip tone="neutral"><WifiOff size={10} /></StatusChip>}
    </div>
  );
}

export function PlayerGrid({
  state,
  selectable,
  allowSelf,
  selectedId,
  onSelect,
  showVotes,
  onInviteVoice,
  voiceParticipantIds,
}: {
  state: PublicGameState;
  selectable?: boolean;
  allowSelf?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showVotes?: boolean;
  onInviteVoice?: (id: string) => void;
  voiceParticipantIds?: string[];
}) {
  const voteCounts: Record<string, number> = {};
  if (showVotes) {
    for (const t of Object.values(state.votes)) {
      voteCounts[t] = (voteCounts[t] ?? 0) + 1;
    }
  }
  const inVoice = new Set(voiceParticipantIds ?? []);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {state.players.map((p, i) => {
        const disabled =
          !selectable ||
          !p.alive ||
          (p.id === state.you?.id && !allowSelf);
        const selected = selectedId === p.id;
        const canInvite =
          !!onInviteVoice &&
          p.alive &&
          !p.isBot &&
          p.connected &&
          p.id !== state.you?.id &&
          !inVoice.has(p.id);
        return (
          <div key={p.id} className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className="h-full"
            >
              <GlassPanel
                className={`flex h-full flex-col p-3 transition ${
                  selected ? "ring-2 ring-crimson shadow-glow" : ""
                } ${!p.alive ? "opacity-50" : ""} ${
                  !disabled ? "hover:-translate-y-1 hover:shadow-spotlight" : ""
                }`}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect?.(p.id)}
                  className={`mx-auto w-full max-w-[6.5rem] ${
                    disabled ? "cursor-default" : ""
                  }`}
                >
                  <div
                    className={`aspect-square w-full overflow-hidden rounded-full ring-2 transition ${
                      selected ? "ring-crimson" : "ring-transparent"
                    }`}
                  >
                    <PlayerAvatar
                      id={p.avatarId}
                      size={128}
                      className="h-full w-full"
                    />
                  </div>
                </button>
                <p className="mt-2 truncate text-center font-display text-sm font-semibold">
                  {p.name}
                </p>
                {p.role && state.phase === "gameover" && (
                  <p className="font-mono text-[10px] uppercase text-ink-steel">
                    {ROLE_META[p.role].label}
                  </p>
                )}
                {tags(p)}
                {showVotes && voteCounts[p.id] ? (
                  <p className="mt-1 font-mono text-xs text-crimson-glow">
                    {voteCounts[p.id]} vote{voteCounts[p.id] > 1 ? "s" : ""}
                  </p>
                ) : null}
                {canInvite && (
                  <button
                    type="button"
                    onClick={() => onInviteVoice(p.id)}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full border border-emerald-400/30 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300"
                  >
                    <Mic size={10} /> Invite voice
                  </button>
                )}
              </GlassPanel>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export function NightActionPanel({
  state,
  onAct,
  onInviteVoice,
}: {
  state: PublicGameState;
  onAct: (type: NightActionType, targetId: string) => void;
  onInviteVoice?: (id: string) => void;
}) {
  const you = state.you;
  const type = you?.role ? (nightActionFor(you.role) as NightActionType | null) : null;
  const noBullets = you?.role === "vigilante" && (you.bulletsLeft ?? 0) <= 0;
  const target = state.players.find((p) => p.id === state.nightActionTargetId);

  if (!you?.alive) {
    return <p className="text-ink-steel">You are spectating the night from the graveyard.</p>;
  }
  if (!type || noBullets) {
    return (
      <p className="text-ink-steel">
        {noBullets
          ? "You are out of bullets. Stay quiet."
          : "No night action. Wait for dawn."}
      </p>
    );
  }

  return (
    <div>
      <h3 className="font-display text-xl font-bold">{NIGHT_ACTION_PROMPTS[type]}</h3>
      {state.submittedNightAction && target ? (
        <p className="mt-1 font-mono text-xs uppercase text-emerald-300">
          {NIGHT_ACTION_LOCKED[type](target.name)}
        </p>
      ) : state.submittedNightAction ? (
        <p className="mt-1 font-mono text-xs uppercase text-emerald-300">Action locked in</p>
      ) : (
        <p className="mt-1 text-sm text-ink-steel">Tap a portrait to lock your target.</p>
      )}
      <div className="mt-4">
        <PlayerGrid
          state={state}
          selectable
          allowSelf={type === "doctor_protect" || type === "bodyguard_protect"}
          selectedId={state.nightActionTargetId}
          onSelect={(id) => onAct(type, id)}
          onInviteVoice={onInviteVoice}
          voiceParticipantIds={state.voiceParticipants.mafia ?? state.voiceParticipants.town}
        />
      </div>
    </div>
  );
}

export function VotePanel({
  state,
  onVote,
  onSkipDay,
  onInviteVoice,
}: {
  state: PublicGameState;
  onVote: (targetId: string) => void;
  onSkipDay?: () => void;
  onInviteVoice?: (id: string) => void;
}) {
  const muted = !!state.you?.blackmailed;
  const dead = !state.you?.alive;
  const isHost = !!state.you?.isHost;
  const votedId = state.you ? state.votes[state.you.id] : null;
  const votedName = state.players.find((p) => p.id === votedId)?.name;
  return (
    <div>
      <h3 className="font-display text-xl font-bold">Lynch vote</h3>
      <p className="mt-1 text-sm text-ink-steel">
        Majority of the living hangs a suspect. Ties spare the city.
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-steel">
        Votes in: {state.dayVotesIn}/{state.dayVotesNeeded}
      </p>
      {muted && (
        <p className="mt-2 font-mono text-xs uppercase text-amber-200">
          Blackmailed — you cannot vote or speak
        </p>
      )}
      {votedName && !muted && (
        <p className="mt-2 font-mono text-xs uppercase text-emerald-300">
          You voted to lynch {votedName}
        </p>
      )}
      <div className="mt-4">
        <PlayerGrid
          state={state}
          selectable={!muted && !dead}
          selectedId={votedId}
          onSelect={onVote}
          showVotes
          onInviteVoice={onInviteVoice}
          voiceParticipantIds={state.voiceParticipants.town}
        />
      </div>
      {isHost && onSkipDay && (
        <button
          type="button"
          disabled={!state.canSkipDay || state.paused}
          onClick={onSkipDay}
          className="mt-4 w-full rounded-sm border border-crimson/40 bg-crimson/10 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-crimson-glow disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.canSkipDay
            ? "Skip day — resolve outcome"
            : "Skip day — waiting for all votes"}
        </button>
      )}
    </div>
  );
}
