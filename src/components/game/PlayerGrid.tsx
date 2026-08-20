"use client";

import { Mic, MicOff, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, StatusChip } from "@/components/ui/primitives";
import { isMafiaRole, ROLE_META } from "@/lib/games/mafia-city/roles";
import type { NightActionType, PublicGameState, PublicPlayer } from "@/lib/types";
import { SKIP_VOTE_ID } from "@/lib/types";
import { nightActionFor } from "@/lib/games/mafia-city/roles";
import { NIGHT_ACTION_LOCKED, NIGHT_ACTION_PROMPTS } from "@/lib/action-prompt";

function tags(p: PublicPlayer, intel?: PublicGameState["mafiaNightIntel"]) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      <StatusChip tone={p.alive ? "live" : "dead"}>
        {p.alive ? "Alive" : "Spectator"}
      </StatusChip>
      {p.role && (
        <StatusChip tone={isMafiaRole(p.role) ? "mafia" : "town"}>
          {ROLE_META[p.role].label}
        </StatusChip>
      )}
      {intel?.bossTargetId === p.id && (
        <StatusChip tone="afk">Boss mark</StatusChip>
      )}
      {intel?.goonTargetId === p.id && (
        <StatusChip tone="afk">Goon mark</StatusChip>
      )}
      {intel?.blackmailTargetId === p.id && (
        <StatusChip tone="mute">Silenced</StatusChip>
      )}
      {p.blackmailed && p.alive && (
        <StatusChip tone="mute">
          <MicOff size={10} className="mr-1" /> Muted
        </StatusChip>
      )}
      {p.isBot && <StatusChip tone="bot">Auto</StatusChip>}
      {p.afkCount >= 2 && p.alive && !p.isBot && (
        <StatusChip tone="afk">AFK</StatusChip>
      )}
      {!p.connected && !p.isBot && (
        <StatusChip tone="neutral">
          <WifiOff size={10} />
        </StatusChip>
      )}
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
}: {
  state: PublicGameState;
  selectable?: boolean;
  allowSelf?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showVotes?: boolean;
  onInviteVoice?: (id: string) => void;
}) {
  const voteCounts: Record<string, number> = {};
  if (showVotes) {
    for (const t of Object.values(state.votes)) {
      if (t === SKIP_VOTE_ID) continue;
      voteCounts[t] = (voteCounts[t] ?? 0) + 1;
    }
  }
  const showMafiaIntel = !!state.mafiaNightIntel;

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
          p.id !== state.you?.id;
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
                  !disabled
                    ? "cursor-pointer hover:-translate-y-1 hover:shadow-spotlight"
                    : ""
                }`}
                onClick={
                  !disabled && onSelect
                    ? () => onSelect(p.id)
                    : undefined
                }
              >
                <div className="mx-auto w-full max-w-[6.5rem]">
                  <div
                    className={`relative aspect-square w-full overflow-hidden rounded-full ring-2 transition ${
                      selected ? "ring-crimson" : "ring-transparent"
                    }`}
                  >
                    <PlayerAvatar
                      id={p.avatarId}
                      size={128}
                      className="pointer-events-none h-full w-full"
                    />
                  </div>
                </div>
                <p className="mt-2 truncate text-center font-display text-sm font-semibold">
                  {p.name}
                </p>
                {tags(p, showMafiaIntel ? state.mafiaNightIntel : undefined)}
                {showVotes && voteCounts[p.id] ? (
                  <p className="mt-1 font-mono text-xs text-crimson-glow">
                    {voteCounts[p.id]} vote{voteCounts[p.id] > 1 ? "s" : ""}
                  </p>
                ) : null}
                {canInvite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInviteVoice(p.id);
                    }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full border border-crimson/30 py-1 font-mono text-[10px] uppercase tracking-widest text-crimson"
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
  const dead = !you?.alive;

  if (dead) {
    return (
      <div>
        <h3 className="font-display text-xl font-bold">Night watch</h3>
        <p className="mt-1 text-sm text-ink-steel">
          You are eliminated — watch the city. Use graveyard chat.
        </p>
        <div className="mt-4">
          <PlayerGrid state={state} onInviteVoice={onInviteVoice} />
        </div>
      </div>
    );
  }

  if (!type || noBullets) {
    return (
      <div>
        <p className="text-ink-steel">
          {noBullets
            ? "You are out of bullets. Stay quiet."
            : "No night action. Wait for dawn."}
        </p>
        <div className="mt-4">
          <PlayerGrid state={state} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-xl font-bold">{NIGHT_ACTION_PROMPTS[type]}</h3>
      {state.submittedNightAction && target ? (
        <p className="mt-1 font-mono text-xs uppercase text-crimson">
          {NIGHT_ACTION_LOCKED[type](target.name)}
        </p>
      ) : state.submittedNightAction ? (
        <p className="mt-1 font-mono text-xs uppercase text-crimson">
          Action locked in
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink-steel">
          Tap a card to lock your target.
        </p>
      )}
      <div className="mt-4">
        <PlayerGrid
          state={state}
          selectable
          selectedId={state.nightActionTargetId}
          onSelect={(id) => onAct(type, id)}
          onInviteVoice={onInviteVoice}
        />
      </div>
    </div>
  );
}

export function VotePanel({
  state,
  onVote,
  onSkipVote,
  onSkipDay,
  onInviteVoice,
}: {
  state: PublicGameState;
  onVote: (targetId: string) => void;
  onSkipVote?: () => void;
  onSkipDay?: () => void;
  onInviteVoice?: (id: string) => void;
}) {
  const muted = !!state.you?.blackmailed;
  const deadVillager = !!state.deadVillagerVote;
  const dead = !state.you?.alive;
  const canParticipate =
    (!!state.you?.alive && !muted) || deadVillager;
  const isHost = !!state.you?.isHost;
  const votedId = state.you ? state.votes[state.you.id] : null;
  const votedSkip = votedId === SKIP_VOTE_ID;
  const votedName = state.players.find((p) => p.id === votedId)?.name;
  const isDiscussion = state.daySubPhase === "discussion";
  const skipVoteCount = Object.values(state.votes).filter(
    (v) => v === SKIP_VOTE_ID
  ).length;
  // Prefer server eligible count (includes dead villagers). Never fall back to full roster.
  const livingEligible = state.players.filter(
    (p) => p.alive && !p.blackmailed
  ).length;
  const youIneligibleDead =
    !!state.you && !state.you.alive && !deadVillager;
  let votesNeeded = state.dayVotesNeeded || livingEligible;
  // If server still reports full roster while you are a dead non-voter, exclude that seat.
  if (youIneligibleDead && votesNeeded >= state.players.length) {
    votesNeeded = Math.max(livingEligible, state.players.length - 1);
  }
  const votesIn = Math.min(state.dayVotesIn, votesNeeded);

  if (isDiscussion) {
    return (
      <div>
        <h3 className="font-display text-xl font-bold">Day discussion</h3>
        <p className="mt-1 text-sm text-ink-steel">
          {dead && !deadVillager
            ? "You are eliminated — watch the debate. Voting opens in the final 15 seconds."
            : "Debate suspects on town voice and chat. Voting opens in the final 15 seconds."}
        </p>
        <PlayerGrid state={state} onInviteVoice={onInviteVoice} />
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-xl font-bold">Lynch vote</h3>
      <p className="mt-1 text-sm text-ink-steel">
        {dead && !deadVillager
          ? "You cannot vote — watch the tally. Town voice is closed during voting."
          : "Most votes alone hangs a suspect — a tie spares everyone. Skip counts like any other option. Town voice is closed during voting."}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-steel">
        Votes in: {votesIn}/{votesNeeded}
      </p>
      {muted && (
        <p className="mt-2 font-mono text-xs uppercase text-crimson/80">
          Blackmailed — you cannot vote or speak
        </p>
      )}
      {deadVillager && (
        <p className="mt-2 font-mono text-xs uppercase text-crimson">
          Dead villager — you may still cast a vote
        </p>
      )}
      {votedSkip && (
        <p className="mt-2 font-mono text-xs uppercase text-crimson">
          You voted to skip the lynch
        </p>
      )}
      {votedName && !muted && !votedSkip && (
        <p className="mt-2 font-mono text-xs uppercase text-crimson">
          You voted to lynch {votedName}
        </p>
      )}
      {skipVoteCount > 0 && (
        <p className="mt-1 font-mono text-[10px] uppercase text-ink-steel">
          Skip votes: {skipVoteCount}
        </p>
      )}
      <div className="mt-4">
        <PlayerGrid
          state={state}
          selectable={canParticipate}
          selectedId={votedSkip ? null : votedId}
          onSelect={onVote}
          showVotes
        />
      </div>
      {canParticipate && onSkipVote && (
        <button
          type="button"
          onClick={onSkipVote}
          disabled={!!votedId}
          className="mt-4 w-full rounded-sm border border-crimson/25 bg-crimson/[0.05] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ink-steel transition hover:border-crimson/40 hover:text-crimson disabled:opacity-40"
        >
          Skip lynch — no one hangs today
        </button>
      )}
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
