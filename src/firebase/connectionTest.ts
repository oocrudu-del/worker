import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './config';

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection test succeeded');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline');
    } else {
      // Normal for doc not found or security rules check; connection reached backend
      console.log('Firebase backend verified reachability:', error);
    }
    return false;
  }
}
