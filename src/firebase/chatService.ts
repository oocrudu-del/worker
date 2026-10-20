import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { Conversation, Message, MessageType } from '../types';

/**
 * Get or create a 1-on-1 conversation between two users
 */
export async function getOrCreateConversation(
  currentUser: { uid: string; displayName: string; photoURL?: string; role?: 'worker' | 'client' },
  targetUser: { uid: string; displayName: string; photoURL?: string; role?: 'worker' | 'client' },
  relatedJob?: { id: string; title: string }
): Promise<string> {
  // Look for existing conversation with both participant UIDs
  const convsRef = collection(db, 'conversations');
  const q = query(convsRef, where('participantUids', 'array-contains', currentUser.uid));
  const querySnap = await getDocs(q);

  for (const docSnap of querySnap.docs) {
    const data = docSnap.data() as Conversation;
    if (data.participantUids.includes(targetUser.uid)) {
      return docSnap.id;
    }
  }

  // Not found: create new conversation
  const newConvData: Omit<Conversation, 'id'> = {
    participantUids: [currentUser.uid, targetUser.uid],
    participantDetails: {
      [currentUser.uid]: {
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL || '',
        role: currentUser.role || 'client',
      },
      [targetUser.uid]: {
        displayName: targetUser.displayName,
        photoURL: targetUser.photoURL || '',
        role: targetUser.role || 'worker',
      },
    },
    lastMessageText: relatedJob ? `Inquiry regarding job: ${relatedJob.title}` : 'Started conversation',
    lastMessageSenderUid: currentUser.uid,
    lastMessageTimestamp: new Date().toISOString(),
    relatedJobId: relatedJob?.id || '',
    relatedJobTitle: relatedJob?.title || '',
    updatedAt: new Date().toISOString(),
  };

  const newDocRef = await addDoc(convsRef, newConvData);
  return newDocRef.id;
}

/**
 * Send a message inside a conversation
 */
export async function sendMessage(
  conversationId: string,
  sender: { uid: string; displayName: string; photoURL?: string },
  text: string,
  messageType: MessageType = 'text',
  attachment?: { fileUrl: string; fileName: string; fileSize: number }
): Promise<string> {
  const messagesRef = collection(db, `conversations/${conversationId}/messages`);
  const now = new Date().toISOString();

  const msgData: Omit<Message, 'id'> = {
    conversationId,
    senderUid: sender.uid,
    senderName: sender.displayName,
    senderPhoto: sender.photoURL,
    text: text.trim(),
    messageType,
    fileUrl: attachment?.fileUrl,
    fileName: attachment?.fileName,
    fileSize: attachment?.fileSize,
    createdAt: now,
  };

  const msgRef = await addDoc(messagesRef, msgData);

  // Update parent conversation summary
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    lastMessageText: text || (messageType === 'image' ? 'Sent a photo' : `Sent a file: ${attachment?.fileName}`),
    lastMessageSenderUid: sender.uid,
    lastMessageTimestamp: now,
    updatedAt: now,
  });

  return msgRef.id;
}

/**
 * Upload an attachment to Firebase Storage with progress tracking
 */
export async function uploadAttachment(
  file: File,
  conversationId: string,
  onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; fileName: string; fileSize: number; fileType: MessageType }> {
  try {
    const fileExt = file.name.split('.').pop() || '';
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storageRef = ref(storage, `conversations/${conversationId}/${safeFileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.warn('Storage upload error, generating local object URL preview:', error);
          // Fallback to client data URL if storage rules require extra setup
          const fallbackUrl = URL.createObjectURL(file);
          let fileType: MessageType = 'file';
          if (file.type.startsWith('image/')) fileType = 'image';
          else if (file.type.startsWith('video/')) fileType = 'video';
          else if (file.type.startsWith('audio/')) fileType = 'audio';

          resolve({
            fileUrl: fallbackUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType,
          });
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          let fileType: MessageType = 'file';
          if (file.type.startsWith('image/')) fileType = 'image';
          else if (file.type.startsWith('video/')) fileType = 'video';
          else if (file.type.startsWith('audio/')) fileType = 'audio';

          resolve({
            fileUrl: downloadUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType,
          });
        }
      );
    });
  } catch (err) {
    const fallbackUrl = URL.createObjectURL(file);
    let fileType: MessageType = 'file';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.startsWith('video/')) fileType = 'video';
    return {
      fileUrl: fallbackUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType,
    };
  }
}
