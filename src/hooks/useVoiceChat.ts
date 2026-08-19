"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatChannel, VoiceSignalPayload } from "@/lib/types";
import type { GameSocket } from "@/lib/socket/client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useVoiceChat(
  socket: GameSocket | null,
  roomId: string,
  playerId: string | undefined,
  channel: ChatChannel | null,
  enabled: boolean
) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const channelRef = useRef<ChatChannel | null>(null);

  const cleanupPeer = useCallback((peerId: string) => {
    peersRef.current.get(peerId)?.close();
    peersRef.current.delete(peerId);
    const audio = remoteAudioRef.current.get(peerId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      remoteAudioRef.current.delete(peerId);
    }
  }, []);

  const cleanupAll = useCallback(() => {
    for (const id of [...peersRef.current.keys()]) cleanupPeer(id);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setJoined(false);
    setParticipants([]);
  }, [cleanupPeer]);

  const attachRemote = useCallback((peerId: string, stream: MediaStream) => {
    let audio = remoteAudioRef.current.get(peerId);
    if (!audio) {
      audio = document.createElement("audio");
      audio.autoplay = true;
      audio.dataset.peer = peerId;
      document.body.appendChild(audio);
      remoteAudioRef.current.set(peerId, audio);
    }
    audio.srcObject = stream;
  }, []);

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

    const onError = ({ message }: { message: string }) => setError(message);

    socket.on("voice:participants", onParticipants);
    socket.on("voice:signal", onSignal);
    socket.on("voice:error", onError);

    return () => {
      socket.off("voice:participants", onParticipants);
      socket.off("voice:signal", onSignal);
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
      socket.emit("voice:join", { roomId, channel });
      setJoined(true);
    } catch {
      setError("Microphone access denied");
      cleanupAll();
    }
  }, [socket, channel, enabled, joined, leave, roomId, cleanupAll]);

  useEffect(() => {
    if (!enabled && joined) leave();
  }, [enabled, joined, leave]);

  useEffect(() => {
    if (joined && channel && channelRef.current !== channel) leave();
  }, [channel, joined, leave]);

  return {
    joined,
    muted,
    setMuted,
    participants,
    error,
    join,
    leave,
  };
}
