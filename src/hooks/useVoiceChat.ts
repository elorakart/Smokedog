"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatChannel, VoiceSignalPayload } from "@/lib/types";
import type { GameSocket } from "@/lib/socket/client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const SPEAK_THRESHOLD = 0.02;

export function useVoiceChat(
  socket: GameSocket | null,
  roomId: string,
  playerId: string | undefined,
  channel: ChatChannel | null,
  enabled: boolean,
  playerNames?: Record<string, string>
) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [speakingIds, setSpeakingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const channelRef = useRef<ChatChannel | null>(null);
  const speakingRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);

  const cleanupPeer = useCallback((peerId: string) => {
    peersRef.current.get(peerId)?.close();
    peersRef.current.delete(peerId);
    analysersRef.current.delete(peerId);
    speakingRef.current.delete(peerId);
    const audio = remoteAudioRef.current.get(peerId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      remoteAudioRef.current.delete(peerId);
    }
  }, []);

  const cleanupAll = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    for (const id of [...peersRef.current.keys()]) cleanupPeer(id);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setJoined(false);
    setParticipants([]);
    setSpeakingIds([]);
    speakingRef.current.clear();
  }, [cleanupPeer]);

  const attachAnalyser = useCallback(
    (peerId: string, stream: MediaStream, audioCtx: AudioContext) => {
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysersRef.current.set(peerId, analyser);
    },
    []
  );

  const attachRemote = useCallback(
    (peerId: string, stream: MediaStream) => {
      let audio = remoteAudioRef.current.get(peerId);
      if (!audio) {
        audio = document.createElement("audio");
        audio.autoplay = true;
        audio.dataset.peer = peerId;
        document.body.appendChild(audio);
        remoteAudioRef.current.set(peerId, audio);
      }
      audio.srcObject = stream;
      try {
        const ctx = new AudioContext();
        attachAnalyser(peerId, stream, ctx);
      } catch {
        /* analyser unavailable */
      }
    },
    [attachAnalyser]
  );

  const emitSpeaking = useCallback(
    (speaking: boolean) => {
      if (!socket || !channelRef.current || !playerId) return;
      socket.emit("voice:speaking", {
        roomId,
        channel: channelRef.current,
        speaking,
      });
    },
    [socket, roomId, playerId]
  );

  const monitorLevels = useCallback(() => {
    const nextSpeaking = new Set<string>();
    const data = new Uint8Array(256);

    if (playerId && localStreamRef.current && !muted) {
      const localAnalyser = analysersRef.current.get("__local__");
      if (localAnalyser) {
        localAnalyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        if (avg > SPEAK_THRESHOLD) nextSpeaking.add(playerId);
      }
    }

    for (const [peerId, analyser] of analysersRef.current) {
      if (peerId === "__local__") continue;
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
      if (avg > SPEAK_THRESHOLD) nextSpeaking.add(peerId);
    }

    const prevLocal = speakingRef.current.has(playerId ?? "");
    const nextLocal = playerId ? nextSpeaking.has(playerId) : false;
    if (playerId && prevLocal !== nextLocal) emitSpeaking(nextLocal);

    speakingRef.current = nextSpeaking;
    setSpeakingIds([...nextSpeaking]);
    rafRef.current = requestAnimationFrame(monitorLevels);
  }, [emitSpeaking, muted, playerId]);

  const createPeer = useCallback(
    (peerId: string, initiator: boolean) => {
      if (!localStreamRef.current || peersRef.current.has(peerId)) return;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      for (const track of localStreamRef.current.getTracks()) {
        pc.addTrack(track, localStreamRef.current);
      }
      pc.ontrack = (ev) => {
        const stream = ev.streams[0];
        if (stream) attachRemote(peerId, stream);
      };
      pc.onicecandidate = (ev) => {
        if (!ev.candidate || !socket || !channelRef.current) return;
        socket.emit("voice:signal", {
          roomId,
          channel: channelRef.current,
          targetId: peerId,
          signal: { type: "ice", candidate: ev.candidate.toJSON() },
        });
      };
      peersRef.current.set(peerId, pc);

      if (initiator) {
        void (async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit("voice:signal", {
              roomId,
              channel: channelRef.current!,
              targetId: peerId,
              signal: { type: "offer", sdp: offer },
            });
          } catch {
            cleanupPeer(peerId);
          }
        })();
      }
    },
    [attachRemote, cleanupPeer, roomId, socket]
  );

  const handleSignal = useCallback(
    async (fromId: string, signal: VoiceSignalPayload) => {
      if (!localStreamRef.current) return;
      let pc = peersRef.current.get(fromId);
      if (signal.type === "offer") {
        if (!pc) createPeer(fromId, false);
        pc = peersRef.current.get(fromId);
        if (!pc) return;
        await pc.setRemoteDescription(signal.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket?.emit("voice:signal", {
          roomId,
          channel: channelRef.current!,
          targetId: fromId,
          signal: { type: "answer", sdp: answer },
        });
        return;
      }
      if (!pc) return;
      if (signal.type === "answer") {
        await pc.setRemoteDescription(signal.sdp);
      } else if (signal.type === "ice" && signal.candidate) {
        try {
          await pc.addIceCandidate(signal.candidate);
        } catch {
          /* ignore stale ice */
        }
      }
    },
    [createPeer, roomId, socket]
  );

  useEffect(() => {
    if (!socket || !enabled) {
      cleanupAll();
      channelRef.current = null;
      return;
    }

    const onParticipants = (payload: {
      channel: ChatChannel;
      participantIds: string[];
    }) => {
      if (payload.channel !== channelRef.current || !playerId) return;
      const others = payload.participantIds.filter((id) => id !== playerId);
      setParticipants(others);
      if (!localStreamRef.current) return;
      for (const id of others) {
        if (!peersRef.current.has(id)) createPeer(id, true);
      }
      for (const id of peersRef.current.keys()) {
        if (!others.includes(id)) cleanupPeer(id);
      }
    };

    const onSignal = (payload: {
      channel: ChatChannel;
      fromId: string;
      signal: VoiceSignalPayload;
    }) => {
      if (payload.channel !== channelRef.current) return;
      void handleSignal(payload.fromId, payload.signal);
    };

    const onSpeaking = (payload: {
      channel: ChatChannel;
      playerId: string;
      speaking: boolean;
    }) => {
      if (payload.channel !== channelRef.current) return;
      if (payload.speaking) speakingRef.current.add(payload.playerId);
      else speakingRef.current.delete(payload.playerId);
      setSpeakingIds([...speakingRef.current]);
    };

    const onError = ({ message }: { message: string }) => setError(message);

    socket.on("voice:participants", onParticipants);
    socket.on("voice:signal", onSignal);
    socket.on("voice:speaking", onSpeaking);
    socket.on("voice:error", onError);

    return () => {
      socket.off("voice:participants", onParticipants);
      socket.off("voice:signal", onSignal);
      socket.off("voice:speaking", onSpeaking);
      socket.off("voice:error", onError);
    };
  }, [
    socket,
    enabled,
    playerId,
    createPeer,
    cleanupPeer,
    handleSignal,
    cleanupAll,
  ]);

  useEffect(() => {
    if (!joined || !localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }, [joined, muted]);

  useEffect(() => {
    if (!joined) return;
    rafRef.current = requestAnimationFrame(monitorLevels);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [joined, monitorLevels]);

  useEffect(() => {
    return () => {
      if (socket && channelRef.current && joined) {
        socket.emit("voice:leave", { roomId, channel: channelRef.current });
      }
      cleanupAll();
    };
  }, [socket, roomId, joined, cleanupAll]);

  const leave = useCallback(() => {
    if (socket && channelRef.current) {
      socket.emit("voice:leave", { roomId, channel: channelRef.current });
    }
    cleanupAll();
  }, [socket, roomId, cleanupAll]);

  const join = useCallback(async () => {
    if (!socket || !channel || !enabled) return;
    setError(null);
    if (joined && channelRef.current === channel) return;
    if (joined) leave();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      channelRef.current = channel;
      try {
        const ctx = new AudioContext();
        attachAnalyser("__local__", stream, ctx);
      } catch {
        /* analyser unavailable */
      }
      socket.emit("voice:join", { roomId, channel });
      setJoined(true);
    } catch {
      setError("Microphone access denied");
      cleanupAll();
    }
  }, [socket, channel, enabled, joined, leave, roomId, cleanupAll, attachAnalyser]);

  useEffect(() => {
    if (!enabled && joined) leave();
  }, [enabled, joined, leave]);

  useEffect(() => {
    if (joined && channel && channelRef.current !== channel) leave();
  }, [channel, joined, leave]);

  const participantLabels = participants.map(
    (id) => playerNames?.[id] ?? "Operator"
  );

  return {
    joined,
    muted,
    setMuted,
    participants,
    participantLabels,
    speakingIds,
    error,
    join,
    leave,
  };
}
