'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, User2, ChevronRight, Shield, Users, Edit2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSocket } from '@/lib/hooks/useSocket';

interface Room {
  id: string;
  name: string;
  participantCount: number;
}

// Create default rooms with numbered groups
const createDefaultRooms = () => {
  return Array.from({ length: 1 }, (_, i) => ({
    id: `room-${i}`,
    name: `Chat Group ${i}`,
    participantCount: 0
  }));
};

// Mock server functions
async function fetchRoomsFromServer() {
  // Simulate server fetch with a delay
  await new Promise(res => setTimeout(res, 500));
  return createDefaultRooms();
}

async function createRoomOnServer(name: string) {
  // Simulate server room creation
  await new Promise(res => setTimeout(res, 500));
  return { id: `room-${Date.now()}`, name, participantCount: 0 };
}

async function deleteRoomOnServer(roomId: string) {
  // Simulate server room deletion
  await new Promise(res => setTimeout(res, 500));
}

async function renameRoomOnServer(roomId: string, newName: string) {
  // Simulate server room renaming
  await new Promise(res => setTimeout(res, 500));
}

export function ClassroomChat() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [view, setView] = useState<'student' | 'admin'>('student');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // Add admin password state
  const [adminPw, setAdminPw] = useState('');
  const [adminPwError, setAdminPwError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // Track if user is authenticated as admin
  const [showAdminModal, setShowAdminModal] = useState(false); // Add a new state to control the admin modal visibility

  // Add state for join modal
  const [pendingRoom, setPendingRoom] = useState<Room | null>(null);

  const { messages, sendMessage, participantCount, availableRooms } = useSocket(
    selectedRoom?.id,
    userName || 'Anonymous'
  );

  // Load chat history from localStorage
  useEffect(() => {
    if (selectedRoom) {
      const saved = localStorage.getItem(`chat-history-${selectedRoom.id}`);
      setMessages(saved ? JSON.parse(saved) : []);
    }
  }, [selectedRoom]);

  // SSE connection for receiving messages
  useEffect(() => {
    if (!selectedRoom || !userName) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const url = `/api/socket?room=${selectedRoom.id}&username=${encodeURIComponent(userName)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;
    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'user-joined' || msg.type === 'user-left') {
          setMessages(prev => [...prev, { ...msg.data, sender: 'System', content: `${msg.data.username} ${msg.type === 'user-joined' ? 'joined' : 'left'} the room` }]);
        } else if (msg.type === 'chat-message') {
          setMessages(prev => [...prev, msg.data]);
        }
      } catch {}
    };
    es.onerror = () => {
      toast.error('Connection lost');
    };
    return () => {
      es.close();
    };
  }, [selectedRoom, userName]);

  // Save chat history to localStorage
  useEffect(() => {
    if (selectedRoom) {
      localStorage.setItem(`chat-history-${selectedRoom.id}` , JSON.stringify(messages));
    }
  }, [messages, selectedRoom]);

  // Persist groups in sessionStorage so they survive tab changes
  useEffect(() => {
    // On mount, try to load from sessionStorage first
    const saved = sessionStorage.getItem('chatRooms');
    if (saved) {
      try {
        setRooms(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    // Whenever rooms change, save to sessionStorage
    sessionStorage.setItem('chatRooms', JSON.stringify(rooms));
  }, [rooms]);

  const scrollToBottom = () => {
    eventSourceRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join room by ID or create new room
  const handleJoinRoom = () => {
    if (!userName) {
      toast.error('Please enter your name first');
      return;
    }
    if (!roomIdInput) {
      toast.error('Please enter a room ID');
      return;
    }
    const foundRoom = rooms.find(room => room.id === roomIdInput);
    if (foundRoom) {
      setSelectedRoom(foundRoom);
      setShowNamePrompt(false);
    } else {
      // Create new room if not found
      const newRoom = createRoomOnServer(roomIdInput);
      setRooms(prev => [...prev, newRoom]);
      setSelectedRoom(newRoom);
      setShowNamePrompt(false);
      toast.success('New room created!');
    }
  };

  // Room creation (admin only)
  const handleCreateRoom = async () => {
    if (view === 'admin') {
      const newRoom = await createRoomOnServer(`Chat Group ${rooms.length}`);
      if (newRoom) {
        setRooms(prev => [...prev, newRoom]);
        toast.success('Group created!');
      } else {
        toast.error('Failed to create group');
      }
    } else {
      toast.error('Only admin can create groups');
    }
  };

  // Delete room (admin only)
  const confirmDeleteRoom = async (roomId: string) => {
    if (view === 'admin') {
      await deleteRoomOnServer(roomId);
      setRooms(rooms => rooms.filter(room => room.id !== roomId));
      setSelectedRoom(null);
      setRoomToDelete(null);
      toast.success('Group deleted!');
    } else {
      toast.error('Only admin can delete groups');
      setRoomToDelete(null);
    }
  };

  // Rename room (admin only)
  const handleRenameRoom = async (roomId: string) => {
    if (view === 'admin' && editingName.trim()) {
      await renameRoomOnServer(roomId, editingName);
      setRooms(rooms => rooms.map(room => room.id === roomId ? { ...room, name: editingName } : room));
      setEditingRoomId(null);
      setEditingName('');
      toast.success('Group renamed!');
    } else {
      toast.error('Only admin can rename groups');
    }
  };

  // When switching view, require password for admin
  const handleViewSwitch = (targetView: 'student' | 'admin') => {
    if (targetView === 'admin' && !isAdmin) {
      setView('student'); // Prevent switching
      setShowNamePrompt(true); // Show modal for admin login
    } else {
      setView(targetView);
    }
  };

  if (showNamePrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-[#3e2c1c] p-8 rounded-xl w-[480px] shadow-2xl border border-[#7c5c3e] relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowNamePrompt(false);
                setSelectedRoom(null);
              }}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-[#5c432a] transition-all text-[#7c5c3e] hover:text-[#e6d3b3] transform hover:rotate-90"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[#a67c52] flex items-center justify-center mb-4">
                {view === 'admin' ? (
                  <Shield className="h-6 w-6 text-[#3e2c1c]" />
                ) : (
                  <Users className="h-6 w-6 text-[#3e2c1c]" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#e6d3b3] mb-2">Welcome to Chat</h2>
              <p className="text-[#a67c52] mb-6">Joining as {view === 'admin' ? 'Administrator' : 'Student'}</p>
              
              {/* View Selection */}
              <div className="w-full mb-6">
                <div className="flex mb-4 border border-[#7c5c3e] rounded-lg">
                  <button
                    onClick={() => setView('student')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg ${
                      view === 'student'
                        ? 'bg-[#a67c52] text-[#3c2c1c]'
                        : 'text-[#e6d3b3] hover:bg-[#5c432a]'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => setView('admin')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg ${
                      view === 'admin'
                        ? 'bg-[#a67c52] text-[#3c2c1c]'
                        : 'text-[#e6d3b3] hover:bg-[#5c432a]'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Admin password input */}
              {view === 'admin' && (
                <div className="w-full mb-6">
                  <input
                    type="password"
                    value={adminPw}
                    onChange={e => {
                      setAdminPw(e.target.value);
                      setAdminPwError('');
                    }}
                    className="w-full p-3 rounded-lg bg-[#5c432a] text-[#e6d3b3] outline-none border-2 border-[#7c5c3e] focus:border-[#a67c52] transition-colors placeholder-[#7c5c3e]"
                    placeholder="Enter admin password"
                  />
                  {adminPwError && (
                    <div className="text-red-400 text-sm mt-1">{adminPwError}</div>
                  )}
                </div>
              )}

              {/* Name Input */}
              <div className="w-full mb-6">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#5c432a] text-[#e6d3b3] outline-none border-2 border-[#7c5c3e] focus:border-[#a67c52] transition-colors placeholder-[#7c5c3e]"
                  placeholder={`Enter your name (${view === 'admin' ? 'Admin' : 'Student'})`}
                  autoFocus
                />
              </div>

              {/* Room ID Input */}
              <div className="w-full mb-6">
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#5c432a] text-[#e6d3b3] outline-none border-2 border-[#7c5c3e] focus:border-[#a67c52] transition-colors placeholder-[#7c5c3e]"
                  placeholder="Enter room ID to join or create a new room"
                />
              </div>

              {/* Group Selection */}
              <div className="w-full mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[#e6d3b3] text-left font-medium">Select a Group:</h3>
                  {view === 'admin' && (
                    <Button
                      onClick={handleCreateRoom}
                      className="bg-[#a67c52] text-[#3c2c1c] hover:bg-[#e6d3b3] flex items-center gap-2 px-3 py-1 h-8"
                    >
                      <Plus className="w-4 h-4" />
                      Create Room
                    </Button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-[#7c5c3e] p-2">
                  {rooms.length === 0 && (
                    <div className="text-[#a67c52] text-center py-2">No groups available</div>
                  )}
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full p-3 rounded-lg flex items-center justify-between ${
                        selectedRoom?.id === room.id
                          ? 'bg-[#a67c52] text-[#3c2c1c]'
                          : 'bg-[#5c432a] text-[#e6d3b3] hover:bg-[#6e4b2a]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{room.name}</span>
                        <span className="text-sm opacity-75">
                          ({room.participantCount} {room.participantCount === 1 ? 'member' : 'members'})
                        </span>
                      </div>
                      <span className="text-xs text-[#a67c52]">{room.id}</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={() => {
                  if (view === 'admin' && !isAdmin) {
                    if (adminPw !== 'admin123') {
                      setAdminPwError('Incorrect admin password');
                      return;
                    } else {
                      setIsAdmin(true);
                    }
                  }
                  if (selectedRoom && rooms.find(r => r.id === selectedRoom.id)) {
                    handleJoinRoom();
                  } else {
                    toast.error('Please select a valid group');
                  }
                }}
                disabled={!userName.trim() || !selectedRoom || (view === 'admin' && !adminPw && !isAdmin)}
                className="w-full px-4 py-3 bg-[#a67c52] text-[#3c2c1c] rounded-lg font-medium hover:bg-[#e6d3b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Join {selectedRoom ? selectedRoom.name : 'Chat'} as {view === 'admin' ? 'Admin' : 'Student'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter messages to only show those for the selected room
  const displayedMessages = selectedRoom
    ? messages.filter((msg) => !msg.roomId || msg.roomId === selectedRoom.id)
    : [];
  // Chat UI for selected room
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col h-full w-full max-w-full relative">
        <div className="p-4 border-b border-[#7c5c3e] bg-[#3e2c1c]/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-[#e6d3b3]">Chat</h1>
              <Select
                value={selectedRoom?.id}
                onValueChange={(value) => {
                  const room = rooms.find(r => r.id === value);
                  if (room) setPendingRoom(room);
                }}
              >
                <SelectTrigger className="w-[200px] bg-[#5c432a] border-[#7c5c3e] text-[#e6d3b3]">
                  <SelectValue placeholder="Select a chat group" />
                </SelectTrigger>
                <SelectContent className="bg-[#3e2c1c] border-[#7c5c3e]">
                  {rooms.map((room) => (
                    <SelectItem
                      key={room.id}
                      value={room.id}
                      className="text-[#e6d3b3] focus:bg-[#a67c52] focus:text-[#3c2c1c]"
                    >
                      <span className="flex items-center gap-2">
                        <User2 size={16} />
                        {room.name} ({room.participantCount} {room.participantCount === 1 ? 'member' : 'members'})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              {view === 'admin' && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateRoom}
                    size="sm"
                    className="bg-[#a67c52] text-[#3c2c1c] hover:bg-[#e6d3b3] flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Group
                  </Button>
                  {selectedRoom && (
                    <>
                      <Button
                        onClick={() => {
                          setEditingRoomId(selectedRoom.id);
                          setEditingName(selectedRoom.name);
                        }}
                        variant="outline"
                        size="icon"
                        className="bg-[#5c432a] border-[#7c5c3e] text-[#e6d3b3] hover:bg-[#6e4b2a]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setRoomToDelete(selectedRoom.id)}
                        variant="outline"
                        size="icon"
                        className="bg-[#5c432a] border-[#7c5c3e] text-[#e6d3b3] hover:bg-[#6e4b2a]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
              <div className="flex bg-[#5c432a] rounded-lg p-1">
                <button
                  onClick={() => setView('student')}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    view === 'student'
                      ? 'bg-[#a67c52] text-[#3c2c1c]'
                      : 'text-[#e6d3b3] hover:bg-[#6e4b2a]'
                  }`}
                >
                  S
                </button>
                <button
                  onClick={() => {
                    if (view !== 'admin') {
                      setShowAdminModal(true);
                    }
                  }}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    view === 'admin'
                      ? 'bg-[#a67c52] text-[#3c2c1c]'
                      : 'text-[#e6d3b3] hover:bg-[#6e4b2a]'
                  }`}
                >
                  A
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedRoom ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">
              {displayedMessages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`p-3 rounded-lg ${
                    msg.sender === 'System'
                      ? 'bg-[#5c432a] text-[#a67c52] italic text-center'
                      : msg.sender === userName
                      ? 'bg-[#a67c52] text-[#3c2c1c] ml-auto'
                      : 'bg-[#5c432a] text-[#e6d3b3]'
                  } max-w-[80%]`}
                >
                  {msg.sender !== 'System' && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{msg.sender}</span>
                      <span className="text-xs opacity-50">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  )}
                  <p className={msg.sender === 'System' ? 'text-sm' : ''}>{msg.content}</p>
                </div>
              ))}
            </div>            <div className="p-4 border-t border-[#7c5c3e] bg-[#3e2c1c] w-full absolute bottom-0 z-30">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-[#5c432a] border-[#7c5c3e] text-[#e6d3b3] placeholder:text-[#a67c52] rounded-lg px-3 py-2"
                  placeholder="Type your message..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      sendMessage((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[type="text"]');
                    if (input && input.value.trim()) {
                      sendMessage(input.value);
                      input.value = '';
                    }
                  }}
                  className="bg-[#a67c52] text-[#3c2c1c] hover:bg-[#e6d3b3]"
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[#e6d3b3]">
            Select a chat group to start messaging
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={roomToDelete !== null} onOpenChange={() => setRoomToDelete(null)}>
        <DialogContent className="bg-[#3e2c1c] border-[#7c5c3e]">
          <DialogHeader>
            <DialogTitle className="text-[#e6d3b3]">Delete Chat Room</DialogTitle>
          </DialogHeader>
          <div className="text-[#e6d3b3] py-4">
            Are you sure you want to delete this chat room? This action cannot be undone.
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoomToDelete(null)}
              className="bg-[#5c432a] text-[#e6d3b3] hover:bg-[#6e4b2a] border-[#7c5c3e]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => roomToDelete && confirmDeleteRoom(roomToDelete)}
              className="bg-[#a67c52] text-[#3c2c1c] hover:bg-[#e6d3b3]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-[#3e2c1c] p-8 rounded-xl w-[480px] shadow-2xl border border-[#7c5c3e] relative">
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminPw('');
                  setAdminPwError('');
                }}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-[#5c432a] transition-all text-[#7c5c3e] hover:text-[#e6d3b3] transform hover:rotate-90"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-[#a67c52] flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[#3c2c1c]" />
                </div>
                <h2 className="text-2xl font-bold text-[#e6d3b3] mb-2">Admin Login</h2>
                <p className="text-[#a67c52] mb-6">Enter the admin password to access admin features.</p>
                <div className="w-full mb-6">
                  <input
                    type="password"
                    value={adminPw}
                    onChange={e => {
                      setAdminPw(e.target.value);
                      setAdminPwError('');
                    }}
                    className="w-full p-3 rounded-lg bg-[#5c432a] text-[#e6d3b3] outline-none border-2 border-[#7c5c3e] focus:border-[#a67c52] transition-colors placeholder-[#7c5c3e]"
                    placeholder="Enter admin password"
                    autoFocus
                  />
                  {adminPwError && (
                    <div className="text-red-400 text-sm mt-1">{adminPwError}</div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (adminPw === 'admin123') {
                      setView('admin');
                      setShowAdminModal(false);
                      setAdminPw('');
                      setAdminPwError('');
                    } else {
                      setAdminPwError('Incorrect admin password');
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#a67c52] text-[#3c2c1c] rounded-lg font-medium hover:bg-[#e6d3b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Login as Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Confirmation Modal */}
      <Dialog open={pendingRoom !== null} onOpenChange={() => setPendingRoom(null)}>
        <DialogContent className="bg-[#3e2c1c] border-[#7c5c3e]">
          <DialogHeader>
            <DialogTitle className="text-[#e6d3b3]">Join Chat Group</DialogTitle>
          </DialogHeader>
          <div className="text-[#e6d3b3] py-4">
            Join <span className="font-bold">{pendingRoom?.name}</span> as {view === 'admin' ? 'Admin' : 'Student'}?
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRoom(null)}
              className="bg-[#5c432a] text-[#e6d3b3] hover:bg-[#6e4b2a] border-[#7c5c3e]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => {
                if (pendingRoom) {
                  setSelectedRoom(pendingRoom);
                  setPendingRoom(null);
                }
              }}
              className="bg-[#a67c52] text-[#3c2c1c] hover:bg-[#e6d3b3]"
            >
              Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
