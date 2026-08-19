"use client";

import { MicOff, WifiOff } from "lucide-react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, StatusChip } from "@/components/ui/primitives";
import { ROLE_META } from "@/lib/games/mafia-city/roles";
import type { NightActionType, PublicGameState, PublicPlayer } from "@/lib/types";
import { nightActionFor } from "@/lib/games/mafia-city/roles";

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
      {p.afkCount >= 2 && p.alive && <StatusChip tone="afk">AFK</StatusChip>}
      {!p.connected && <StatusChip tone="neutral"><WifiOff size={10} /></StatusChip>}
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
}: {
  state: PublicGameState;
  selectable?: boolean;
  allowSelf?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showVotes?: boolean;
}) {
  const voteCounts: Record<string, number> = {};
  if (showVotes) {
    for (const t of Object.values(state.votes)) {
      voteCounts[t] = (voteCounts[t] ?? 0) + 1;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {state.players.map((p) => {
        const disabled =
          !selectable ||
          !p.alive ||
          (p.id === state.you?.id && !allowSelf);
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(p.id)}
            className={`text-left ${disabled ? "cursor-default" : ""}`}
          >
            <GlassPanel
              className={`p-3 transition ${
                selectedId === p.id ? "ring-2 ring-crimson shadow-glow" : ""
              } ${!p.alive ? "opacity-50" : ""}`}
            >
              <div className="overflow-hidden rounded-[4px]">
                <PlayerAvatar id={p.avatarId} className="h-auto w-full" size={160} />
              </div>
              <p className="mt-2 truncate font-display text-sm font-semibold">{p.name}</p>
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
            </GlassPanel>
          </button>
        );
      })}
    </div>
  );
}

export function NightActionPanel({
  state,
  onAct,
}: {
  state: PublicGameState;
  onAct: (type: NightActionType, targetId: string) => void;
}) {
  const you = state.you;
  const type = you?.role ? (nightActionFor(you.role) as NightActionType | null) : null;
  const noBullets = you?.role === "vigilante" && (you.bulletsLeft ?? 0) <= 0;

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

  const labels: Record<string, string> = {
    mafia_kill: "Mark a target for the hit",
    doctor_protect: "Choose someone to heal",
    detective_inspect: "Investigate an alignment",
    bodyguard_protect: "Stand in front of someone",
    vigilante_shoot: `Fire a round (${you.bulletsLeft} left)`,
    blackmail: "Silence a civilian",
  };

  return (
    <div>
      <h3 className="font-display text-xl font-bold">{labels[type]}</h3>
      {state.submittedNightAction && (
        <p className="mt-1 font-mono text-xs uppercase text-emerald-300">Action locked in</p>
      )}
      <div className="mt-4">
        <PlayerGrid
          state={state}
          selectable
          allowSelf={type === "doctor_protect" || type === "bodyguard_protect"}
          onSelect={(id) => onAct(type, id)}
        />
      </div>
    </div>
  );
}

export function VotePanel({
  state,
  onVote,
}: {
  state: PublicGameState;
  onVote: (targetId: string) => void;
}) {
  const muted = !!state.you?.blackmailed;
  const dead = !state.you?.alive;
  return (
    <div>
      <h3 className="font-display text-xl font-bold">Lynch vote</h3>
      <p className="mt-1 text-sm text-ink-steel">
        Majority of the living hangs a suspect. Ties spare the city.
      </p>
      {muted && (
        <p className="mt-2 font-mono text-xs uppercase text-amber-200">
          Blackmailed — you cannot vote or speak
        </p>
      )}
      <div className="mt-4">
        <PlayerGrid
          state={state}
          selectable={!muted && !dead}
          selectedId={state.you ? state.votes[state.you.id] : null}
          onSelect={onVote}
          showVotes
        />
      </div>
    </div>
  );
}
