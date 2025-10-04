import { ChatMessage } from '../ChatMessage';

export default function ChatMessageExample() {
  return (
    <div className="p-8 bg-background">
      <div className="space-y-4">
        <ChatMessage 
          name="Alex Rivera"
          message="This scene is amazing! 🎬"
          timestamp="2:45 PM"
          isCurrentUser={false}
        />
        <ChatMessage 
          name="You"
          message="Totally agree! Best part so far"
          timestamp="2:46 PM"
          isCurrentUser={true}
        />
      </div>
    </div>
  );
}
