// client/src/types/room.ts
export interface Room {
  id: string;
  roomName: string;
  roomCode: string;
  service: 'netflix' | 'prime' | 'disney';
  url: string;
  isPrivate: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  participants: string[];
  maxParticipants: number;
  isActive: boolean;
}

export interface RoomParticipant {
  userId: string;
  userName: string;
  joinedAt: number;
  isMuted: boolean;
  isVideoOff: boolean;
}