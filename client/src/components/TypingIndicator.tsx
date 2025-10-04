// client/src/components/TypingIndicator.tsx
import { useEffect, useState } from "react";
import { doc, setDoc, onSnapshot, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface TypingIndicatorProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
}

export function TypingIndicator({ roomId, currentUserId, currentUserName }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to typing status
    const typingRef = doc(db, "rooms", roomId, "typing", "status");
    
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const users = Object.entries(data)
          .filter(([userId, userInfo]: [string, any]) => {
            if (userId === currentUserId) return false;
            const lastTyped = userInfo.lastTyped?.toMillis() || 0;
            return Date.now() - lastTyped < 3000; // Show for 3 seconds
          })
          .map(([_, userInfo]: [string, any]) => userInfo.name);
        
        setTypingUsers(users);
      } else {
        setTypingUsers([]);
      }
    });

    return () => unsubscribe();
  }, [roomId, currentUserId]);

  if (typingUsers.length === 0) return null;

  const typingText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
    : `${typingUsers.length} people are typing...`;

  return (
    <div className="px-4 py-2 text-xs text-muted-foreground italic">
      {typingText}
    </div>
  );
}

// Hook to manage typing status
export function useTypingIndicator(roomId: string, userId: string, userName: string) {
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const setTyping = async () => {
    try {
      const typingRef = doc(db, "rooms", roomId, "typing", "status");
      
      await setDoc(typingRef, {
        [userId]: {
          name: userName,
          lastTyped: serverTimestamp()
        }
      }, { merge: true });

      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Set new timeout to clear typing status
      const timeout = setTimeout(async () => {
        try {
          await setDoc(typingRef, {
            [userId]: {
              name: userName,
              lastTyped: serverTimestamp()
            }
          }, { merge: true });
        } catch (error) {
          console.error("Error clearing typing status:", error);
        }
      }, 3000);

      setTypingTimeout(timeout);
    } catch (error) {
      console.error("Error setting typing status:", error);
    }
  };

  const clearTyping = async () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    try {
      const typingRef = doc(db, "rooms", roomId, "typing", "status");
      await setDoc(typingRef, {
        [userId]: {
          name: userName,
          lastTyped: serverTimestamp()
        }
      }, { merge: true });
    } catch (error) {
      console.error("Error clearing typing status:", error);
    }
  };

  return { setTyping, clearTyping };
}