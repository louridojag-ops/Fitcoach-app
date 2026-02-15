import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDocs,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Message, Chat } from '../types';

export class ChatService {
  static async getOrCreateChat(clientId: string, coachId: string, clientName: string, coachName: string): Promise<string> {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('clientId', '==', clientId), where('coachId', '==', coachId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    
    const newChat = await addDoc(chatsRef, {
      clientId,
      coachId,
      clientName,
      coachName,
      unreadCount: { client: 0, coach: 0 },
      updatedAt: serverTimestamp()
    });
    
    return newChat.id;
  }

  static async sendMessage(chatId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
    const batch = writeBatch(db);
    
    const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
    batch.set(messageRef, {
      ...message,
      timestamp: serverTimestamp()
    });
    
    const chatRef = doc(db, 'chats', chatId);
    const unreadField = message.senderRole === 'client' ? 'unreadCount.coach' : 'unreadCount.client';
    
    batch.update(chatRef, {
      lastMessage: {
        ...message,
        timestamp: serverTimestamp()
      },
      [unreadField]: increment(1),
      updatedAt: serverTimestamp()
    });
    
    await batch.commit();
  }

  static subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as Message[];
      callback(messages);
    });
  }

  static subscribeToUserChats(userId: string, role: 'client' | 'coach', callback: (chats: Chat[]) => void) {
    const field = role === 'client' ? 'clientId' : 'coachId';
    const q = query(
      collection(db, 'chats'),
      where(field, '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Chat[];
      callback(chats);
    });
  }

  static async markAsRead(chatId: string, role: 'client' | 'coach'): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    const field = role === 'client' ? 'unreadCount.client' : 'unreadCount.coach';
    await updateDoc(chatRef, {
      [field]: 0
    });
  }
}