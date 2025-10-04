import { RoomCard } from '../RoomCard';

export default function RoomCardExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-sm">
        <RoomCard 
          roomName="Friday Night Movie"
          service="Netflix"
          participants={5}
          isPrivate={false}
        />
      </div>
    </div>
  );
}
