import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ChatService } from '../../services/chatService';
import { Chat } from '../../types';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const ClientMessages = () => {
  const { user } = useAuthStore();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return;
      
      const clientDoc = await getDoc(doc(db, 'clients', user.uid));
      const clientData = clientDoc.data();
      
      if (clientData?.coachId) {
        const coachDoc = await getDoc(doc(db, 'users', clientData.coachId));
        const coachData = coachDoc.data();
        
        const chatId = await ChatService.getOrCreateChat(
          user.uid,
          clientData.coachId,
          user.displayName,
          coachData?.displayName || 'Coach'
        );
        
        const unsubscribe = ChatService.subscribeToUserChats(user.uid, 'client', (chats) => {
          const currentChat = chats.find(c => c.id === chatId);
          if (currentChat) setChat(currentChat);
        });
        
        setLoading(false);
        return () => unsubscribe();
      }
    };

    initializeChat();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando chat...</div>;
  if (!chat) return <div className="p-6">No tienes un coach asignado aún.</div>;

  return (
    <div className="h-[calc(100vh-6rem)]">
      <ChatWindow chatId={chat.id} otherUserName={chat.coachName} />
    </div>
  );
};