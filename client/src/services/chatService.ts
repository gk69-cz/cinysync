
import { arrayUnion } from "firebase/firestore";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  limit,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { requireAuth, verifyUserId } from "@/lib/auth";

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Timestamp;
  createdAt: Date;
}

export interface ChatMessageInput {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
}

/**
 * Send a message to a room's chat
 */
export async function sendMessage(messageData: ChatMessageInput): Promise<string> {
  try {
     requireAuth();
  verifyUserId(messageData.userId);
      const messagesRef = collection(db, "rooms", messageData.roomId, "messages");
    const roomRef = doc(db, "rooms", messageData.roomId);

     await updateDoc(roomRef, {
      participants: arrayUnion(messageData.userId)
    });
    const docRef = await addDoc(messagesRef, {
      userId: messageData.userId,
      userName: messageData.userName,
      userAvatar: messageData.userAvatar || null,
      message: messageData.message.trim(),
      timestamp: serverTimestamp(),
    });

    await updateDoc(roomRef, {
      lastMessageAt: serverTimestamp(),
      messageCount: increment(1) // This atomic update requires specific permissions
    });

    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
}

/**
 * Subscribe to real-time chat messages for a room
 */
export function subscribeToMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void,
  messageLimit: number = 100
): () => void {
  try {
    const messagesRef = collection(db, "rooms", roomId, "messages");
    const q = query(
      messagesRef,
      orderBy("timestamp", "asc"),
      limit(messageLimit)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            roomId,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            message: data.message,
            timestamp: data.timestamp,
            createdAt: data.timestamp?.toDate() || new Date(),
          });
        });

        callback(messages);
      },
      (error) => {
        console.error("Error subscribing to messages:", error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up message subscription:", error);
    return () => {};
  }
}

/**
 * Delete a message (optional - for moderation)
 */
export async function deleteMessage(roomId: string, messageId: string): Promise<void> {
  try {
    const messageRef = doc(db, "rooms", roomId, "messages", messageId);
    await updateDoc(messageRef, {
      message: "[Message deleted]",
      deleted: true
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    throw new Error("Failed to delete message");
  }
}