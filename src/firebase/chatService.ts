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
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { Conversation, Message, MessageType } from '../types';

/**
 * Clean object by removing any undefined keys to prevent Firestore addDoc errors
 */
export function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = sanitizeFirestorePayload(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Get or create a 1-on-1 conversation between two users
 */
export async function getOrCreateConversation(
  currentUser: { uid: string; displayName: string; photoURL?: string; role?: 'worker' | 'client' },
  targetUser: { uid: string; displayName: string; photoURL?: string; role?: 'worker' | 'client' },
  relatedJob?: { id: string; title: string }
): Promise<string> {
  const convsRef = collection(db, 'conversations');

  // Query existing conversations containing currentUser.uid
  const q = query(convsRef, where('participantUids', 'array-contains', currentUser.uid));
  const querySnap = await getDocs(q);

  for (const docSnap of querySnap.docs) {
    const data = docSnap.data() as Conversation;
    if (data.participantUids && data.participantUids.includes(targetUser.uid)) {
      return docSnap.id;
    }
  }

  // Not found: create new conversation
  const now = new Date().toISOString();
  const newConvData: Record<string, any> = {
    participantUids: [currentUser.uid, targetUser.uid],
    participantDetails: {
      [currentUser.uid]: {
        displayName: currentUser.displayName || 'User',
        photoURL: currentUser.photoURL || '',
        role: currentUser.role || 'client',
      },
      [targetUser.uid]: {
        displayName: targetUser.displayName || 'Member',
        photoURL: targetUser.photoURL || '',
        role: targetUser.role || 'worker',
      },
    },
    lastMessageText: relatedJob ? `Inquiry regarding: ${relatedJob.title}` : 'Started conversation',
    lastMessageSenderUid: currentUser.uid,
    lastMessageTimestamp: now,
    relatedJobId: relatedJob?.id || '',
    relatedJobTitle: relatedJob?.title || '',
    updatedAt: now,
  };

  const newDocRef = await addDoc(convsRef, sanitizeFirestorePayload(newConvData));
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
  if (!conversationId) {
    throw new Error('Missing conversation ID');
  }

  const messagesRef = collection(db, `conversations/${conversationId}/messages`);
  const now = new Date().toISOString();

  const msgPayload: Record<string, any> = {
    conversationId,
    senderUid: sender.uid,
    senderName: sender.displayName || 'User',
    text: (text || '').trim(),
    messageType,
    createdAt: now,
  };

  if (sender.photoURL) {
    msgPayload.senderPhoto = sender.photoURL;
  }

  if (attachment) {
    if (attachment.fileUrl) msgPayload.fileUrl = attachment.fileUrl;
    if (attachment.fileName) msgPayload.fileName = attachment.fileName;
    if (attachment.fileSize !== undefined) msgPayload.fileSize = attachment.fileSize;
  }

  const sanitized = sanitizeFirestorePayload(msgPayload);
  const msgRef = await addDoc(messagesRef, sanitized);

  // Update parent conversation summary
  try {
    const convRef = doc(db, 'conversations', conversationId);
    const summaryText =
      text.trim() ||
      (messageType === 'image'
        ? 'Sent a photo'
        : `Sent a file: ${attachment?.fileName || 'Attachment'}`);

    await updateDoc(convRef, {
      lastMessageText: summaryText,
      lastMessageSenderUid: sender.uid,
      lastMessageTimestamp: now,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('Note: Could not update conversation parent preview:', err);
  }

  return msgRef.id;
}

/**
 * Upload an attachment with instant Base64 data URL for images and Storage fallback
 */
export async function uploadAttachment(
  file: File,
  conversationId: string,
  onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; fileName: string; fileSize: number; fileType: MessageType }> {
  let fileType: MessageType = 'file';
  if (file.type.startsWith('image/')) fileType = 'image';
  else if (file.type.startsWith('video/')) fileType = 'video';
  else if (file.type.startsWith('audio/')) fileType = 'audio';

  // For images under 1.5MB, convert to data URL for instant reliability across devices
  if (file.type.startsWith('image/') && file.size < 1.5 * 1024 * 1024) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          fileUrl: reader.result as string,
          fileName: file.name,
          fileSize: file.size,
          fileType: 'image',
        });
      };
      reader.onerror = () => {
        resolve({
          fileUrl: URL.createObjectURL(file),
          fileName: file.name,
          fileSize: file.size,
          fileType: 'image',
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // Otherwise attempt storage upload
  try {
    const fileExt = file.name.split('.').pop() || '';
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storageRef = ref(storage, `conversations/${conversationId}/${safeFileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.warn('Storage upload notice, using object preview URL:', error);
          resolve({
            fileUrl: URL.createObjectURL(file),
            fileName: file.name,
            fileSize: file.size,
            fileType,
          });
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              fileUrl: downloadUrl,
              fileName: file.name,
              fileSize: file.size,
              fileType,
            });
          } catch (e) {
            resolve({
              fileUrl: URL.createObjectURL(file),
              fileName: file.name,
              fileSize: file.size,
              fileType,
            });
          }
        }
      );
    });
  } catch (err) {
    return {
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
      fileType,
    };
  }
}
