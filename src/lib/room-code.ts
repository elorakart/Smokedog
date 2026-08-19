export const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function validateRoomCode(
  raw: string
): { ok: true; code: string } | { ok: false; message: string } {
  const code = normalizeRoomCode(raw);
  if (!code) {
    return { ok: false, message: "Enter a 6-character party code." };
  }
  if (code.length !== 6) {
    return {
      ok: false,
      message: `Party codes are 6 characters. You entered ${code.length}.`,
    };
  }
  const invalid = [...code].filter((c) => !ROOM_CODE_CHARS.includes(c));
  if (invalid.length) {
    return {
      ok: false,
      message:
        "That code isn’t valid. Use letters A–Z and numbers 2–9 (no I, O, 0, or 1).",
    };
  }
  return { ok: true, code };
}

export class RoomError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "RoomError";
    this.code = code;
  }
}
