// client/src/services/roomService.ts
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, RoomParticipant } from "@/types/room";

const ROOMS_COLLECTION = "rooms";
const ROOM_PARTICIPANTS_COLLECTION = "roomParticipants";

// Generate unique room code
export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new room
export async function createRoom(
  roomData: Omit<Room, "id" | "createdAt" | "participants" | "isActive">
): Promise<{ roomId: string; roomCode: string }> {
  try {
    const roomCode = generateRoomCode();
    
    const roomDoc = {
      roomName: roomData.roomName,
      service: roomData.service,
      url: roomData.url,
      isPrivate: roomData.isPrivate,
      createdBy: roomData.createdBy,
      createdByName: roomData.createdByName,
      maxParticipants: roomData.maxParticipants,
      roomCode: roomCode,
      participants: [roomData.createdBy],
      isActive: true,
      createdAt: serverTimestamp(),
    };

    console.log("Creating room with data:", roomDoc);
    const docRef = await addDoc(collection(db, ROOMS_COLLECTION), roomDoc);
    console.log("Room created with ID:", docRef.id, "and code:", roomCode);

    return {
      roomId: docRef.id,
      roomCode,
    };
  } catch (error) {
    console.error("Error creating room:", error);
    throw new Error("Failed to create room");
  }
}

// Get room by ID
export async function getRoomById(roomId: string): Promise<Room | null> {
  try {
    const roomDoc = await getDoc(doc(db, ROOMS_COLLECTION, roomId));
    
    if (!roomDoc.exists()) {
      return null;
    }

    return {
      id: roomDoc.id,
      ...roomDoc.data(),
    } as Room;
  } catch (error) {
    console.error("Error getting room:", error);
    throw new Error("Failed to get room");
  }
}

// Get room by room code
export async function getRoomByCode(roomCode: string): Promise<Room | null> {
  try {
    const q = query(
      collection(db, ROOMS_COLLECTION),
      where("roomCode", "==", roomCode),
      where("isActive", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const roomDoc = querySnapshot.docs[0];
    return {
      id: roomDoc.id,
      ...roomDoc.data(),
    } as Room;
  } catch (error) {
    console.error("Error getting room by code:", error);
    throw new Error("Failed to get room");
  }
}

// Get all active rooms
export async function getActiveRooms(): Promise<Room[]> {
  try {
    const q = query(
      collection(db, ROOMS_COLLECTION),
      where("isActive", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Room[];
  } catch (error) {
    console.error("Error getting active rooms:", error);
    throw new Error("Failed to get active rooms");
  }
}

// Get rooms created by user
export async function getUserRooms(userId: string): Promise<Room[]> {
  try {
    const q = query(
      collection(db, ROOMS_COLLECTION),
      where("createdBy", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Room[];
  } catch (error) {
    console.error("Error getting user rooms:", error);
    throw new Error("Failed to get user rooms");
  }
}

// Join a room
export async function joinRoom(
  roomId: string,
  userId: string
): Promise<void> {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
      participants: arrayUnion(userId),
    });
  } catch (error) {
    console.error("Error joining room:", error);
    throw new Error("Failed to join room");
  }
}

// Leave a room
export async function leaveRoom(
  roomId: string,
  userId: string
): Promise<void> {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
      participants: arrayRemove(userId),
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    throw new Error("Failed to leave room");
  }
}

// End a room (set inactive)
export async function endRoom(roomId: string): Promise<void> {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
      isActive: false,
    });
  } catch (error) {
    console.error("Error ending room:", error);
    throw new Error("Failed to end room");
  }
}

// Delete a room
export async function deleteRoom(roomId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
  } catch (error) {
    console.error("Error deleting room:", error);
    throw new Error("Failed to delete room");
  }
}