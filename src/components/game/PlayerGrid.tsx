"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
      {intel?.poisonTargetId === p.id && (
        <StatusChip tone="afk">Poison mark</StatusChip>
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

function KillStamp({ self }: { self: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-sm bg-crimson/55"
    >
      <motion.div
        initial={{ scale: 1.6, rotate: -18, opacity: 0 }}
        animate={{ scale: 1, rotate: -8, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className={`border-2 border-manila bg-crimson px-2 py-1 font-mono uppercase text-manila shadow-stamp ${
          self
            ? "text-xs tracking-[0.22em]"
            : "text-[10px] tracking-[0.18em]"
        }`}
      >
        Eliminated
      </motion.div>
      <motion.span
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.28 }}
        className="absolute left-[8%] right-[8%] top-1/2 h-0.5 origin-left bg-manila"
      />
    </motion.div>
  );
}

export function PlayerGrid({
  state,
  selectable,
  allowSelf,
  selectedId,
  selectedIds,
  onSelect,
  showVotes,
  onInviteVoice,
}: {
  state: PublicGameState;
  selectable?: boolean;
  allowSelf?: boolean;
  selectedId?: string | null;
  selectedIds?: string[];
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
  const prevAliveRef = useRef<Record<string, boolean>>({});
  const primedRef = useRef(false);
  const [killAnimIds, setKillAnimIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prev = prevAliveRef.current;
    if (!primedRef.current) {
      for (const p of state.players) prev[p.id] = p.alive;
      primedRef.current = true;
      return;
    }
    const newlyDead: string[] = [];
    for (const p of state.players) {
      if (prev[p.id] === true && !p.alive) newlyDead.push(p.id);
      prev[p.id] = p.alive;
    }
    if (newlyDead.length === 0) return;
    setKillAnimIds(new Set(newlyDead));
    const t = setTimeout(() => setKillAnimIds(new Set()), 2800);
    return () => clearTimeout(t);
  }, [state.players]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {state.players.map((p, i) => {
        const disabled =
          !selectable ||
          !p.alive ||
          (p.id === state.you?.id && !allowSelf);
        const selected =
          selectedId === p.id || !!selectedIds?.includes(p.id);
        const canInvite =
          !!onInviteVoice &&
          p.alive &&
          !p.isBot &&
          p.connected &&
          p.id !== state.you?.id;
        const showingKill = killAnimIds.has(p.id);
        const isSelf = p.id === state.you?.id;
        return (
          <div key={p.id} className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={
                showingKill
                  ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                  : { opacity: 1, y: 0, x: 0 }
              }
              transition={
                showingKill
                  ? { duration: 0.45 }
                  : { delay: i * 0.04, duration: 0.35 }
              }
              className="relative h-full"
            >
              <GlassPanel
                className={`relative flex h-full flex-col overflow-hidden p-3 transition ${
                  selected ? "ring-2 ring-crimson shadow-glow" : ""
                } ${!p.alive && !showingKill ? "opacity-50" : ""} ${
                  showingKill ? "ring-2 ring-crimson" : ""
                } ${
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
                <AnimatePresence>
                  {showingKill && <KillStamp self={isSelf} />}
                </AnimatePresence>
                <div className="mx-auto w-full max-w-[6.5rem]">
                  <div
                    className={`relative aspect-square w-full rounded-full bg-transparent ring-2 transition ${
                      selected || showingKill
                        ? "ring-crimson"
                        : "ring-transparent"
                    }`}
                  >
                    <PlayerAvatar
                      id={p.avatarId}
                      size={128}
                      className={`pointer-events-none h-full w-full ${
                        showingKill ? "grayscale" : ""
                      }`}
                    />
                    {showingKill && (
                      <div className="pointer-events-none absolute inset-0">
                        <svg
                          viewBox="0 0 100 100"
                          className="h-full w-full"
                          aria-hidden
                        >
                          <motion.line
                            x1="18"
                            y1="18"
                            x2="82"
                            y2="82"
                            stroke="#E8DCC8"
                            strokeWidth="5"
                            strokeLinecap="square"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.35, delay: 0.08 }}
                          />
                        </svg>
                      </div>
                    )}
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
  const type = you?.role
    ? (nightActionFor(you.role) as NightActionType | null)
    : null;
  const noBullets = you?.role === "vigilante" && (you.bulletsLeft ?? 0) <= 0;
  const target = state.players.find((p) => p.id === state.nightActionTargetId);
  const skipped =
    state.submittedNightAction && state.nightActionTargetId === SKIP_VOTE_ID;
  const dead = !you?.alive;

  if (dead) {
    const deadVillager = you?.role === "villager";
    return (
      <div>
        <h3 className="font-display text-xl font-bold">Night watch</h3>
        <p className="mt-1 text-sm text-ink-steel">
          {deadVillager
            ? "You are eliminated — no night action. You may still vote by day. Use graveyard chat."
            : "You are eliminated — watch the city. Use graveyard chat — you cannot act or vote."}
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
      {you?.role === "vigilante" && (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-crimson">
          Bullets left: {you.bulletsLeft ?? 0}
        </p>
      )}
      <h3 className="font-display text-xl font-bold">
        {NIGHT_ACTION_PROMPTS[type]}
      </h3>
      {skipped ? (
        <p className="mt-1 font-mono text-xs uppercase text-crimson">
          You skipped your shot tonight
        </p>
      ) : state.submittedNightAction && target ? (
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
      {type === "vigilante_shoot" && !state.submittedNightAction && (
        <button
          type="button"
          onClick={() => onAct(type, SKIP_VOTE_ID)}
          className="mt-3 rounded-sm border border-crimson/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-crimson"
        >
          Skip this night — do not kill
        </button>
      )}
      <div className="mt-4">
        <PlayerGrid
          state={state}
          selectable={!state.submittedNightAction}
          selectedId={
            state.nightActionTargetId === SKIP_VOTE_ID
              ? null
              : state.nightActionTargetId
          }
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
  onSkipTimer,
  onInviteVoice,
  onJuggle,
}: {
  state: PublicGameState;
  onVote: (targetId: string) => void;
  onSkipVote?: () => void;
  onSkipDay?: () => void;
  onSkipTimer?: () => void;
  onInviteVoice?: (id: string) => void;
  onJuggle?: (targetIds: string[]) => void;
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
  const livingEligible = state.players.filter(
    (p) => p.alive && !p.blackmailed
  ).length;
  const youIneligibleDead =
    !!state.you && !state.you.alive && !deadVillager;
  let votesNeeded = state.dayVotesNeeded || livingEligible;
  if (youIneligibleDead && votesNeeded >= state.players.length) {
    votesNeeded = Math.max(livingEligible, state.players.length - 1);
  }
  const votesIn = Math.min(state.dayVotesIn, votesNeeded);

  const [jugglePick, setJugglePick] = useState<string[]>([]);
  const juggleReady = !!state.jugglerAvailable && !!onJuggle;

  const toggleJuggle = (id: string) => {
    setJugglePick((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const compactSkip = (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {!isDiscussion && canParticipate && onSkipVote && (
        <button
          type="button"
          onClick={onSkipVote}
          disabled={!!votedId}
          className="rounded-sm border border-crimson/25 bg-crimson/[0.05] px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-ink-steel disabled:opacity-40"
        >
          Skip vote
        </button>
      )}
      {isHost && isDiscussion && onSkipTimer && (
        <button
          type="button"
          disabled={state.paused}
          onClick={onSkipTimer}
          className="rounded-sm border border-crimson/40 bg-crimson/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-crimson-glow disabled:opacity-40"
        >
          Skip day
        </button>
      )}
      {isHost && onSkipDay && !isDiscussion && (
        <button
          type="button"
          disabled={!state.canSkipDay || state.paused}
          onClick={onSkipDay}
          className="rounded-sm border border-crimson/40 bg-crimson/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-crimson-glow disabled:opacity-40"
        >
          {state.canSkipDay ? "Skip day" : "Skip day (waiting)"}
        </button>
      )}
    </div>
  );

  if (isDiscussion) {
    return (
      <div>
        <h3 className="font-display text-xl font-bold">Day discussion</h3>
        <p className="mt-1 text-sm text-ink-steel">
          {dead && !deadVillager
            ? "You are eliminated — watch the debate. Voting opens in the final 15 seconds."
            : "Debate suspects on town voice and chat. Voting opens in the final 15 seconds."}
        </p>
        {compactSkip}
        {juggleReady && (
          <div className="mt-3 rounded-sm border border-crimson/20 bg-crimson/[0.04] p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-crimson">
              Juggle — pick 4 ({jugglePick.length}/4)
            </p>
            <p className="mt-1 text-xs text-ink-steel">
              Town will see whom you juggled. Only you learn how many are evil.
            </p>
            {jugglePick.length === 4 && (
              <button
                type="button"
                onClick={() => {
                  onJuggle?.(jugglePick);
                  setJugglePick([]);
                }}
                className="mt-2 rounded-sm bg-crimson px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-manila"
              >
                Confirm juggle
              </button>
            )}
          </div>
        )}
        <div className="mt-4">
          <PlayerGrid
            state={state}
            selectable={juggleReady}
            selectedIds={jugglePick}
            onSelect={juggleReady ? toggleJuggle : undefined}
            onInviteVoice={onInviteVoice}
          />
        </div>
        {juggleReady && jugglePick.length > 0 && (
          <p className="mt-2 font-mono text-[10px] text-ink-steel">
            Selected:{" "}
            {jugglePick
              .map((id) => state.players.find((p) => p.id === id)?.name)
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-xl font-bold">Day vote</h3>
      <p className="mt-1 text-sm text-ink-steel">
        {dead && !deadVillager
          ? "You cannot vote — watch the tally. Town voice is closed during voting."
          : "Most votes alone eliminates a suspect — a tie spares everyone. Skip counts like any other option. Town voice is closed during voting."}
      </p>
      {compactSkip}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-steel">
        Votes in: {votesIn}/{votesNeeded}
        {skipVoteCount > 0 ? ` · Skip: ${skipVoteCount}` : ""}
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
          You voted to skip
        </p>
      )}
      {votedName && !muted && !votedSkip && (
        <p className="mt-2 font-mono text-xs uppercase text-crimson">
          You voted for {votedName}
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
    </div>
  );
}
