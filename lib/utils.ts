import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get active rooms from the server
export function getServerRooms() {
  try {
    const activeRooms = [];
    const rooms = global.rooms; // Access the rooms Map from server.js
    if (rooms) {
      for (const [roomId, participants] of rooms.entries()) {
        activeRooms.push({
          id: roomId,
          participantCount: participants.size,
        });
      }
    }
    return activeRooms;
  } catch (error) {
    console.error("Error getting server rooms:", error);
    return [];
  }
}
