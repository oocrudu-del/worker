import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Search,
  ArrowLeft,
  User,
  ExternalLink,
  Clock,
  Check,
  CheckCheck,
  Download,
  Video,
  File,
  X,
  Sparkles,
} from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Conversation, Message, MessageType } from '../types';
import { sendMessage, uploadAttachment } from '../firebase/chatService';

interface MessagesPageProps {
  onSelectWorker: (workerUid: string) => void;
  onOpenAuth: () => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ onSelectWorker, onOpenAuth }) => {
  const { currentUser, userAccount } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to all conversations for current user
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participantUids', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convList: Conversation[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Conversation, 'id'>),
      }));

      // Sort by updatedAt desc
      convList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setConversations(convList);

      if (convList.length > 0 && !activeConvId) {
        setActiveConvId(convList[0].id);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to messages in active conversation
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    const msgsRef = collection(db, `conversations/${activeConvId}/messages`);
    const q = query(msgsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgList: Message[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Message, 'id'>),
        }));
        setMessages(msgList);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (error) => {
        console.warn('Snapshot listener for messages notice:', error);
      }
    );

    return () => unsubscribe();
  }, [activeConvId]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  // Determine the other participant in active conversation
  const otherParticipantUid = activeConversation?.participantUids?.find((uid) => uid !== currentUser?.uid);
  const otherParticipant = otherParticipantUid
    ? activeConversation?.participantDetails?.[otherParticipantUid]
    : null;

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAttachment(file);
      if (file.type.startsWith('image/')) {
        setAttachmentPreview(URL.createObjectURL(file));
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const clearAttachment = () => {
    setSelectedAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeConvId) return;
    if (!inputText.trim() && !selectedAttachment) return;

    try {
      let attachmentMeta: { fileUrl: string; fileName: string; fileSize: number; fileType: MessageType } | undefined;

      if (selectedAttachment) {
        setUploading(true);
        attachmentMeta = await uploadAttachment(selectedAttachment, activeConvId, (p) =>
          setUploadProgress(p)
        );
      }

      await sendMessage(
        activeConvId,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'User',
          photoURL: currentUser.photoURL || undefined,
        },
        inputText.trim(),
        attachmentMeta ? attachmentMeta.fileType : 'text',
        attachmentMeta
          ? {
              fileUrl: attachmentMeta.fileUrl,
              fileName: attachmentMeta.fileName,
              fileSize: attachmentMeta.fileSize,
            }
          : undefined
      );

      setInputText('');
      clearAttachment();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchConv.trim()) return true;
    const otherUid = c.participantUids?.find((u) => u !== currentUser?.uid);
    const other = otherUid ? c.participantDetails?.[otherUid] : null;
    return (
      other?.displayName?.toLowerCase().includes(searchConv.toLowerCase()) ||
      c.lastMessageText?.toLowerCase().includes(searchConv.toLowerCase())
    );
  });

  // Extract shared media from current conversation
  const sharedMedia = messages.filter((m) => m.fileUrl);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto">
          <Paperclip className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign in to Access Your Messages</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Communicate with clients and freelancers in real-time with verified contracts and instant file sharing.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-140px)] min-h-[580px] flex">
        {/* LEFT COLUMN: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-lg font-bold text-slate-900">Messages</h2>
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchConv}
                onChange={(e) => setSearchConv(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {conversations.length === 0
                  ? 'No conversations yet. Open a job or freelancer profile to start messaging!'
                  : 'No conversations matching search.'}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const otherUid = conv.participantUids?.find((u) => u !== currentUser.uid);
                const other = otherUid ? conv.participantDetails?.[otherUid] : null;
                const isSelected = conv.id === activeConvId;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setMobileView('chat');
                    }}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/80 border-r-4 border-indigo-600' : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <img
                      src={
                        other?.photoURL ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={other?.displayName || 'User'}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {other?.displayName || 'User'}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {conv.lastMessageTimestamp
                            ? new Date(conv.lastMessageTimestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>

                      {conv.relatedJobTitle && (
                        <span className="text-[10px] text-indigo-600 font-semibold block truncate">
                          Job: {conv.relatedJobTitle}
                        </span>
                      )}

                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessageSenderUid === currentUser.uid && 'You: '}
                        {conv.lastMessageText || 'Started conversation'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Chat Timeline */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation && otherParticipant ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <img
                    src={
                      otherParticipant.photoURL ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={otherParticipant.displayName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-100"
                  />

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {otherParticipant.displayName}
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    </h3>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {otherParticipant.role || 'Member'} · Active Now
                    </p>
                  </div>
                </div>

                {otherParticipantUid && (
                  <button
                    onClick={() => onSelectWorker(otherParticipantUid)}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {messages.length === 0 ? (
                  <div className="py-20 text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No messages in this chat yet</p>
                    <p className="text-[11px] text-slate-400">Say hello or ask questions regarding the project.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderUid === currentUser.uid;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={
                              msg.senderPhoto ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                            }
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                          />
                        )}

                        <div
                          className={`max-w-xs sm:max-w-md rounded-2xl p-3 shadow-xs text-xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          {/* Image Attachment */}
                          {msg.messageType === 'image' && msg.fileUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden max-h-60 bg-black/5">
                              <img
                                src={msg.fileUrl}
                                alt="Attachment"
                                className="w-full h-full object-cover cursor-pointer hover:opacity-95"
                                onClick={() => window.open(msg.fileUrl, '_blank')}
                              />
                            </div>
                          )}

                          {/* File / Doc Attachment */}
                          {msg.messageType === 'file' && msg.fileUrl && (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`mb-2 p-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                                isMe ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              <FileText className="w-5 h-5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate text-[11px]">{msg.fileName || 'Document'}</p>
                                <p className="text-[9px] opacity-75">
                                  {msg.fileSize ? `${Math.round(msg.fileSize / 1024)} KB` : 'Click to download'}
                                </p>
                              </div>
                              <Download className="w-4 h-4 shrink-0" />
                            </a>
                          )}

                          {/* Message Text */}
                          {msg.text && <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>}

                          {/* Timestamp */}
                          <div
                            className={`mt-1 text-[9px] flex items-center justify-end gap-1 ${
                              isMe ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && <CheckCheck className="w-3 h-3 text-indigo-300" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Upload Progress Indicator */}
              {uploading && (
                <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-150"
                      style={{ width: `${uploadProgress || 10}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700">Uploading attachment...</span>
                </div>
              )}

              {/* Attachment Preview Banner before send */}
              {selectedAttachment && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-700 truncate">
                    {attachmentPreview ? (
                      <img
                        src={attachmentPreview}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <File className="w-6 h-6 text-indigo-600" />
                    )}
                    <span className="truncate max-w-xs">{selectedAttachment.name}</span>
                  </div>
                  <button
                    onClick={clearAttachment}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSelectFile}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach photo, video or document"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message or paste a link..."
                  className="flex-1 py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />

                <button
                  type="submit"
                  disabled={uploading || (!inputText.trim() && !selectedAttachment)}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">Select a Conversation</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Pick a chat from the left or open a conversation from any job or freelancer profile.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Contact Details & Shared Media */}
        {activeConversation && otherParticipant && (
          <div className="hidden lg:flex w-72 border-l border-slate-200 flex-col bg-slate-50/30 p-4 space-y-6 overflow-y-auto">
            {/* User Profile Mini */}
            <div className="text-center pt-2">
              <img
                src={
                  otherParticipant.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                }
                alt={otherParticipant.displayName}
                className="w-16 h-16 rounded-2xl object-cover mx-auto ring-4 ring-white shadow-xs"
              />
              <h4 className="font-bold text-sm text-slate-900 mt-2">{otherParticipant.displayName}</h4>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase">
                {otherParticipant.role || 'Member'}
              </span>

              {otherParticipantUid && (
                <button
                  onClick={() => onSelectWorker(otherParticipantUid)}
                  className="mt-3 w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                >
                  View Full Profile
                </button>
              )}
            </div>

            {/* Related Job Context */}
            {activeConversation.relatedJobTitle && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Associated Project
                </span>
                <p className="text-xs font-bold text-slate-900 line-clamp-2">
                  {activeConversation.relatedJobTitle}
                </p>
              </div>
            )}

            {/* Shared Media Gallery */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Shared Files ({sharedMedia.length})</span>
              </h5>

              {sharedMedia.length === 0 ? (
                <p className="text-[11px] text-slate-400">No media or documents shared yet in this thread.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {sharedMedia.map((m) => (
                    <a
                      key={m.id}
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 transition-colors flex flex-col items-center justify-center text-center group"
                    >
                      {m.messageType === 'image' ? (
                        <img
                          src={m.fileUrl}
                          alt="preview"
                          className="w-full h-14 object-cover rounded-lg mb-1"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-indigo-500 mb-1" />
                      )}
                      <span className="text-[10px] text-slate-700 font-medium truncate w-full">
                        {m.fileName || 'Attachment'}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
