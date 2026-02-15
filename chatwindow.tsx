import { useEffect, useRef, useState } from 'react';
import { ChatService } from '../../services/chatService';
import { useAuthStore } from '../../store/authStore';
import { Message } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Check, CheckCheck } from 'lucide-react';

interface ChatWindowProps {
  chatId: string;
  otherUserName: string;
}

export const ChatWindow = ({ chatId, otherUserName }: ChatWindowProps) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatId) return;
    
    const unsubscribe = ChatService.subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      scrollToBottom();
    });
    
    if (user) {
      ChatService.markAsRead(chatId, user.role);
    }
    
    return () => unsubscribe();
  }, [chatId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await ChatService.sendMessage(chatId, {
      chatId,
      senderId: user.uid,
      senderName: user.displayName,
      senderRole: user.role,
      content: newMessage.trim(),
      type: 'text',
      read: false
    });

    setNewMessage('');
    inputRef.current?.focus();
  };

  const formatMessageTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: es });
  };

  const formatMessageDate = (date: Date) => {
    return format(date, "d 'de' MMMM", { locale: es });
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = format(msg.timestamp, 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
            {otherUserName[0]}
          </div>
          <div className="ml-3">
            <h3 className="font-semibold">{otherUserName}</h3>
            <p className="text-xs text-blue-100">En línea</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex justify-center my-4">
              <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                {formatMessageDate(new Date(date))}
              </span>
            </div>
            
            {msgs.map((msg) => {
              const isMine = msg.senderId === user?.uid;
              return (
                <div
                  key={msg.id}
                  className={flex mb-4 ${isMine ? 'justify-end' : 'justify-start'}}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className={flex items-center justify-end mt-1 space-x-1 ${isMine ? 'text-blue-100' : 'text-gray-400'}}>
                      <span className="text-xs">{formatMessageTime(msg.timestamp)}</span>
                      {isMine && (
                        msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};