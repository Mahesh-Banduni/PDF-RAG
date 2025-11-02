'use client';
import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Send, Trash2, Edit2, Copy, Check, X, Loader2, MessageSquare, Sparkles, Plus, Menu, ChevronLeft, MoreVertical, Sidebar, Edit, Ellipsis, Search, Book, Eye, Square, File} from 'lucide-react';
import Header from './Header';
import { useSearchParams, useRouter } from 'next/navigation';
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from '@clerk/nextjs';
import PDFViewer from './PDFViewer';
import Image from "next/image";
import MainSidebar from './MainSidebar';

export default function PDFRAGChat({chatChannelId}) {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const clerkId = user.id;
  const router = useRouter();

  // Chat Channels
  const [chatChannels, setChatChannels] = useState([]);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [currentChatChannelId, setCurrentChatChannelId] = useState(chatChannelId || null);
  const [messages, setMessages] = useState([]);
  const [showChannelOptions, setShowChannelOptions] = useState(false);
  const [showChannelActionModal, setShowChannelActionModal] = useState(false);
  const [renamingChannelId, setRenamingChannelId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [channelOptionsModalOpen, setChannelOptionsModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [streamingContent, setStreamingContent] = useState(false);
  const [generativeClicked, setGenerativeClicked] = useState(false);
  const [isMdDown, setIsMdDown] = useState(false);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // PDF Management
  const [pdf, setPdf] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfCollection, setPdfCollection] = useState([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [ currentUser, setCurrentUser] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [loadingChannels, setLoadingChannels]=useState(false); 

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const renameInputRef = useRef(null);
  const channelButtonRefs = useRef({});

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMdDown(mq.matches);
    const handler = (e) => setIsMdDown(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

   useEffect(() => {
    // Check screen width on initial load
    const mq = window.matchMedia("(max-width: 768px)"); // mobile breakpoint
    setSidebarOpen(!mq.matches); // If mobile, close sidebar (false). If desktop, open (true).
  }, []);

  // Sidebar modal closes with backdrop or Esc (for mobile)
  useEffect(() => {
    if (!isMdDown || !sidebarOpen) return;
    const onKeyDown = e => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMdDown, sidebarOpen]);

  useEffect(() => {
    if (currentChatChannelId) {
      loadMessages(currentChatChannelId);
    }
  }, [currentChatChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [question]);

  // Focus rename input when renaming starts
  useEffect(() => {
    if (renamingChannelId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingChannelId]);

  const fetchUserData = async(clerkId) =>{
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        body: JSON.stringify({ clerkId }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    if (clerkId) {
      fetchUserData(clerkId);
    }
  }, [clerkId]);

  // Load all chat channels
  const loadChatChannels = async () => {
    setLoadingChannels(true);
    try {
      const result = await fetch(`/api/channel/list`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser.userId }),
        headers: { 'Content-Type': 'application/json' },
      });
      const loadedChatChannels = await result.json();
      if (Array.isArray(loadedChatChannels)) {
        loadedChatChannels.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        setChatChannels(loadedChatChannels.reverse());
      }
    } catch (error) {
      console.log('No chat channels found', error);
      setChatChannels([]);
    }
    finally{
      setLoadingChannels(false);
    }
  };

  // Load all chat messages
  const loadMessages = async (newChatChannelId) => {
    try {
      const result = await fetch(`/api/message/list`, {
        method: 'POST',
        body: JSON.stringify({ chatChannelId: newChatChannelId || currentChatChannelId }),
        headers: { 'Content-Type': 'application/json' },
      });
      const loadedMessages = await result.json();
    
      if (Array.isArray(loadedMessages)) {
        // Sort all messages by createdAt ascending (earliest first)
        loadedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
        // Separate user and assistant messages
        const userMessages = loadedMessages.filter(msg => msg.role === 'user');
        const assistantMessages = loadedMessages.filter(msg => msg.role === 'assistant');
      
        let count = 0;
        const pairedMessages = [];
      
        userMessages.forEach(userMsg => {
          pairedMessages.push({ ...userMsg, id: ++count });
          const assistantReply = assistantMessages.find(assistMsg => assistMsg.replyToMessageId === userMsg.messageId);
          if (assistantReply) {
            pairedMessages.push({ ...assistantReply, id: ++count });
          }
        });
      
        setMessages(pairedMessages);
      }
    } catch (error) {
      console.log('No messages found', error);
      setMessages([]);
    }
  };

  // Load PDFs
  const handleLoadPDFs = async (chatChannelId) => {
    try {
      const result = await fetch(`/api/pdf/list`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser.userId, chatChannelId: chatChannelId }),
        headers: { 'Content-Type': 'application/json' },
      });
      const loadedPdfs = await result.json();
      if (Array.isArray(loadedPdfs)) {
        setPdfCollection(loadedPdfs);
      }
    } catch (error) {
      console.log('No PDFs found', error);
      setPdfCollection([]);
    }
    finally{
      setShowChannelOptions(null);
      setShowPdfModal(true);
    }
  };

  // Upload PDF
  const uploadPdf = async (file, newChatChannelId) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatChannelId', newChatChannelId);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      const data = await res.json();

      if (data.chunksUploaded > 0) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        // handleLoadPDFs();
      }
      return data;
    } catch (error) {
      console.error('Failed to upload PDF:', error);
    } finally {
      setIsUploading(false);
      setPdf(null);
    }
  };

  // Remove PDF
  const removePdf = async (pdfId) => {
    try {
      await fetch('/api/pdf/remove', {
        method: 'DELETE',
        body: JSON.stringify({ pdfId }),
        headers: { 'Content-Type': 'application/json' },
      });
      await handleLoadPDFs(selectedChannel.chatChannelId);
      await loadMessages(selectedChannel.chatChannelId);
    } catch (error) {
      console.error('Failed to remove PDF:', error);
    }
  };

  // Ask Question
  const askQuestion = async (customQ = null) => {
    let messageContext = messages.length > 8 ? messages.slice(-8) : messages;
    messageContext = messageContext.map(m => ({ role: m.role, content: m.content }));

    let newChatChannelId = currentChatChannelId;
    let newChatChannel = null;
    const q = (customQ ?? question).trim();
    if (!q) return;
    let fileResponse = null;

    try {
      if (newChatChannelId === null && currentUser !== null) {
        const response = await fetch('/api/channel/create', {
          method: 'POST',
          body: JSON.stringify({ userId: currentUser.userId, q }),
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        newChatChannelId = result.chatChannelId;
        newChatChannel = result;
        await loadChatChannels();
        setCurrentChatChannelId(newChatChannelId);
      }

      if (newChatChannelId && pdf) {
        // selectedChannel(newChatChannel);
        const response= await uploadPdf(pdf, newChatChannelId);
        fileResponse=response.pdf;
      }

      setIsAsking(true);
      if (!customQ) {
        if(fileResponse !== null){
          setMessages((prev) => [...prev, { role: 'user', content: q, attachedPdf: fileResponse }]);
        }
        if(fileResponse == null){
          setMessages((prev) => [...prev, { role: 'user', content: q}]);
        }
        setQuestion('');
        setGenerativeClicked(false);
      }

      if (newChatChannelId !== null) {
        // Create user message record
        const resp = await fetch('/api/message/create', {
          method: 'POST',
          body: JSON.stringify({ role: 'user', content: q, chatChannelId: newChatChannelId, attachedPdfId: fileResponse?.pdfId }),
          headers: { 'Content-Type': 'application/json' },
        });
        const askedQuestion = await resp.json();

        // Fetch streaming response from server
        const res = await fetch('/api/query', {
          method: 'POST',
          body: JSON.stringify({ question: q, chatChannelId: newChatChannelId, messageContext }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.body) throw new Error('ReadableStream not supported');

        setStreamingContent(true);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
        
          buffer += decoder.decode(value, { stream: true });
        
          // Split by SSE message boundary
          const parts = buffer.split('\n\n');
        
          // Keep the last partial piece in buffer
          buffer = parts.pop();
        
          for (const part of parts) {
            const match = part.match(/^data: (.*)$/m);
            if (!match) continue;
          
            const textChunk = match[1].replace(/\\n/g, '\n');
            assistantContent += textChunk;
          
            setMessages(prev => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
            
              if (last?.role === 'assistant') {
                last.content = assistantContent;
              } else {
                copy.push({ role: 'assistant', content: assistantContent });
              }
              return copy;
            });
          }
        }

        // Save final assistant message to DB
        await fetch('/api/message/create', {
          method: 'POST',
          body: JSON.stringify({
            role: 'assistant',
            content: assistantContent,
            chatChannelId: newChatChannelId,
            replyToMessageId: askedQuestion.messageId,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err) {
      if (currentChatChannelId !== null) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
        ]);
      }
    } finally {
      setIsAsking(false);
      await loadMessages(newChatChannelId);
      if (currentChatChannelId === null) {
        router.replace(`/channel/${newChatChannelId}`);
      }
      setStreamingContent(false);
      fileResponse=null;
    }
  };

  // Edit Question
  const editQuestion = async (messageToEdit, assistantMessageToEdit) => {
    let messageContext = messages.length > 8 ? messages.slice(-8) : messages;
    messageContext = messageContext.map(m => ({ role: m.role, content: m.content }));
  
    const q = editedQuestion.trim();
    if (!q) return;
  
    setIsAsking(true);
  
    try {
      if (currentChatChannelId !== null) {
        // 1️⃣ Update user message in DB
        await fetch('/api/message/update', {
          method: 'PUT',
          body: JSON.stringify({ content: q, messageId: messageToEdit.messageId }),
          headers: { 'Content-Type': 'application/json' },
        });
      
        // 2️⃣ Remove old assistant message from UI first (keep user edited message)
        setMessages((prev) =>
          prev.map((m) =>
            m.messageId === assistantMessageToEdit.messageId
              ? { ...m, content: "" }
              : m
          )
        );
      
        // 3️⃣ Request streamed response
        const res = await fetch('/api/query', {
          method: 'POST',
          body: JSON.stringify({
            question: q,
            chatChannelId: currentChatChannelId,
            messageContext,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!res.body) throw new Error('ReadableStream not supported');
        setStreamingContent(true);
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        
        // Buffer to store partial chunks
        let buffer = '';
        let assistantContent = '';
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
        
          buffer += decoder.decode(value, { stream: true });
        
          // Split by SSE message boundary
          const parts = buffer.split('\n\n');
        
          // Save the last (possibly incomplete) chunk back to buffer
          buffer = parts.pop();
        
          for (const part of parts) {
            const match = part.match(/^data: (.*)$/m);
            if (!match) continue;
          
            const textChunk = match[1].replace(/\\n/g, '\n');
            assistantContent += textChunk;
          
            // 4️⃣ Update assistant message live during streaming
            setMessages(prev =>
              prev.map(m =>
                m.messageId === assistantMessageToEdit.messageId
                  ? { ...m, content: assistantContent }
                  : m
              )
            );
          }
        }
      
        // 5️⃣ Save final assistant answer to DB
        await fetch('/api/message/update', {
          method: 'PUT',
          body: JSON.stringify({
            content: assistantContent,
            messageId: assistantMessageToEdit.messageId,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong while editing. Please try again.' },
      ]);
    } finally {
      setIsAsking(false);
      setStreamingContent(false);
    }
  };

  const deleteInvalidMessages = async(messageIds) =>{
    if(messageIds.length === 0) return ;
    try{
      const response = await fetch('/api/message/delete',{
        method: 'DELETE',
          body: JSON.stringify({messageIds: messageIds }),
          headers: { 'Content-Type': 'application/json' },
      })
    }
    catch(err){
      console.error('Error deleting messages:', err);
    }
  }

  // Edit flow
  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedQuestion(messages[index].content);
  };

  const handleReAsk = async (index) => {
    const newQ = editedQuestion.trim();
    if (!newQ) return;

    const messageToEdit = messages.find((msg) => msg.id === (editingIndex+1));
    const assistantMessageToEdit = messages.find((msg) => msg.replyToMessageId === (messageToEdit.messageId));

    const truncated = messages.slice(0, index);
    truncated.push({ role: 'user', content: newQ });
    const invalidMessageIds = messages.slice(index+2).map(msg => msg.messageId);
    setMessages(truncated);
    setEditingIndex(null);
    setEditedQuestion('');

    await editQuestion(messageToEdit,assistantMessageToEdit);
    await deleteInvalidMessages(invalidMessageIds);
    await loadMessages();
  };

  // Copy
  const copyMessage = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      alert('Failed to copy.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  // Rename channel functions
  const handleStartRename = (chatChannelId, currentTitle) => {
    setRenamingChannelId(chatChannelId);
    setRenameValue(currentTitle);
    setShowChannelOptions(null);
  };

  const handleCancelRename = () => {
    setRenamingChannelId(null);
    setRenameValue('');
  };

  const handleSaveRename = async (chatChannelId) => {
    const newTitle = renameValue.trim();
    if (!newTitle || newTitle === chatChannels.find(c => c.chatChannelId === chatChannelId)?.title) {
      handleCancelRename();
      return;
    }

    try {
      const response = await fetch('/api/channel/rename', {
        method: 'PUT',
        body: JSON.stringify({ chatChannelId, title: newTitle }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        await loadChatChannels();
        handleCancelRename();
      }
    } catch (error) {
      console.error('Error renaming channel:', error);
    }
  };

  const handleRenameKeyDown = (e, chatChannelId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename(chatChannelId);
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  // Calculate modal position to keep it within screen
  const calculateModalPosition = (buttonElement) => {
    if (!buttonElement) return { top: 0, left: 0 };
    
    const rect = buttonElement.getBoundingClientRect();
    const modalWidth = 152; // w-38 = 152px
    const modalHeight = 120; // approx height for 3 buttons
    
    let left = rect.left;
    let top = rect.bottom + 8; // 8px gap below button
    
    // Check if modal would go off right edge of screen
    if (left + modalWidth > window.innerWidth) {
      left = window.innerWidth - modalWidth - 16; // 16px padding from edge
    }
    
    // Check if modal would go off bottom edge of screen
    if (top + modalHeight > window.innerHeight) {
      // Position above the button instead
      top = rect.top - modalHeight - 8;
    }
    
    // Ensure modal doesn't go off left edge
    if (left < 0) {
      left = 16; // 16px padding from edge
    }
    
    // Ensure modal doesn't go off top edge
    if (top < 0) {
      top = 16; // 16px padding from edge
    }
    
    return { top, left };
  };

  const handleChannelOptionsClick = (chatChannel, event) => {
    event.stopPropagation();
    setSelectedChannel(chatChannel);
    
    // Calculate position for the modal
    const buttonElement = event.currentTarget;
    const position = calculateModalPosition(buttonElement);
    setModalPosition(position);
    
    setChannelOptionsModalOpen(true);
  };

  const currentChatChannel = chatChannels.find(s => s.id === currentChatChannelId);

  // Load chatChannels and PDFs on mount
  useEffect(() => {
    loadChatChannels();
  }, [currentUser]);

  const handleChatChannelDelete = async(userId, chatChannelId) => {
    try{
      const response = await fetch('/api/channel/delete', {
        method: 'POST',
        body: JSON.stringify({userId, chatChannelId}),
        headers: {'Content-Type': 'application/json'}
      });
      const data = await response.json();
      setShowChannelActionModal(false);
      loadChatChannels();
      router.push(`/`);
    }
    catch(err){
      console.error('Error deleting chatChannel:', err);
    }
  };

  const fetchSignedUrl = async (pdf) => {
    console.log("PDF",pdf);
    let fileName = pdf.fileURL.split("/").pop();
    fileName = `documents/${fileName}`;
    const response = await fetch("/api/pdf/download", {
      method: "POST",
      body: JSON.stringify({ fileName }),
      headers: { "Content-Type": "application/json" },
    });
    const {signedUrl} = await response.json();
    setFileUrl(signedUrl);
  };

  const textInputAreaRef = useRef(null);

  const handleInput = (e) => {
    const textarea = textInputAreaRef.current;
    textarea.style.height = "auto"; // reset
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px"; // 160px ~ max-h-40
    setQuestion(e.target.value);
  };

  // Render chat channel item
  const renderChannelItem = (chatChannel) => {
    const isRenaming = renamingChannelId === chatChannel.chatChannelId;
    const isActive = currentChatChannelId === chatChannel.chatChannelId;

    return (
      <div key={chatChannel.chatChannelId} className='flex flex-col relative'>
        <div
          className={`group flex items-center gap-2 px-3 py-3 rounded-xl transition-colors ${
            isActive ? 'bg-slate-800' : 'hover:bg-slate-800/50'
          }`}
        >
          {isRenaming ? (
            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => handleRenameKeyDown(e, chatChannel.chatChannelId)}
                onBlur={() => handleSaveRename(chatChannel.chatChannelId)}
                className="flex-1 px-2 py-1 text-sm text-gray-900 bg-slate-100 border border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-slate-500"
                maxLength={100}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveRename(chatChannel.chatChannelId);
                }}
                className="p-1 rounded cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelRename();
                }}
                className="p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <>
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  if (isMdDown) setSidebarOpen(false);
                  router.replace(`/channel/${chatChannel.chatChannelId}`);
                }}
              >
                <p className="text-sm truncate">{chatChannel.title}</p>
              </div>
              
              <button
                onClick={(e) => handleChannelOptionsClick(chatChannel, e)}
                className="cursor-pointer p-1"
              >
                <Ellipsis className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // --- Begin Final Render ---
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar - modal or normal */}
      <MainSidebar loadingChannels={loadingChannels} isMdDown={isMdDown} sidebarOpen ={sidebarOpen} setSidebarOpen={setSidebarOpen} chatChannels={chatChannels} renderChannelItem={renderChannelItem} user={user} router={router}/>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} isMdDown={isMdDown}/>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 ">
          {messages.length === 0 && !isAsking ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                Start a New Conversation
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Ask questions about your uploaded PDFs
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Summarize this document', 'What are the key points?', 'Explain the main concepts'].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuestion(prompt);
                      setTimeout(() => textareaRef.current?.focus(), 100);
                    }}
                    className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'flex-col items-end justify-end gap-2' : 'justify-start'}`}
                >
                  <div className={`group ${isMdDown ? 'max-w-[75%]':'max-w-[55%]'}`}>
                    {msg.role === 'user' && msg.attachedPdf ? 
                      <>
                        <button onClick={() =>{
                          fetchSignedUrl(msg.attachedPdf);
                          setPdf(msg.attachedPdf);
                          setShowPDFViewer(true);}}
                          className='cursor-pointer'
                        >
                          <div className='p-2 flex border-1 bg-slate-100 border-slate-300 rounded-lg gap-2'>
                            <File className='min-w-9 min-h-9 p-1 bg-slate-900 text-white rounded-lg' />
                            <div className='flex flex-col justify-start items-start'>
                              <p className='text-sm line-clamp-1 w-fit text-left'>{msg.attachedPdf.title.trim()}</p>
                              <div className='text-sm text-slate-600'>PDF</div>
                            </div>
                          </div>
                        </button>
                      </>
                  :<></>
                  }
                  </div>
                  <div
                    className={`group max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                    } rounded-2xl shadow-sm`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${
                          msg.role === 'user' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {msg.role === 'user' ? 'You' : 'Assistant'}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.role === 'user' && editingIndex !== idx && (
                            <button
                              onClick={() => handleEdit(idx)}
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {msg.role === 'assistant' && (
                            <button
                              onClick={() => copyMessage(msg.content, idx)}
                              className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer ${
                                copiedIndex === idx ? 'text-green-600' : ''
                              }`}
                            >
                              {copiedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {editingIndex === idx ? (
                        <div className="space-y-3 text-sm">
                          <textarea
                            autoFocus
                            value={editedQuestion}
                            onChange={(e) => setEditedQuestion(e.target.value)}
                            className="w-full p-1.5 rounded-xl border-2 text-slate-900 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                            rows="3"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleReAsk(idx)}
                              className="px-1.5 py-1.5 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Ask
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="px-1.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isAsking && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-400 animate-spin" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 ${isMdDown ? "p-2" : "p-6 mb-6"} mx-auto flex justify-center bottom-0`}>
          <div className="flex flex-col max-w-2xl w-screen justify-center items-start">
            {pdf && (
              <div className="w-fit mb-3 flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg text-sm">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="flex-1 truncate">{pdf.name}</span>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                ) : (
                  <button onClick={() => setPdf(null)} className="hover:text-red-500 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-3 text-sm w-full justify-center">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setPdf(file);
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
                  title="Upload PDF"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
                
              <div className="flex-1 relative">
                <textarea
                  ref={textInputAreaRef}
                  value={question}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  disabled={generativeClicked}
                  placeholder="Ask a question..."
                  rows="1"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl
                              focus:outline-none focus:ring-1 focus:ring-slate-500
                              resize-none disabled:opacity-50
                              max-h-40 overflow-y-auto"
                />
              </div>
              <div className='relative'>
                <button
                  onClick={() => {setGenerativeClicked(true);askQuestion();}}
                  disabled={isAsking || isUploading || !question.trim()}
                  className="cursor-pointer p-3 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                >
                  {isAsking || isUploading || ( pdf && generativeClicked)? <Square className="w-5 h-5 fill-slate-700 animate-pulse" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Collection Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowPdfModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"  onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Manage PDFs</h3>
              <button onClick={() => setShowPdfModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                {pdfCollection.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No PDFs uploaded yet</p>
                ) : (
                  pdfCollection.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                      <button
                        onClick={() => {
                          fetchSignedUrl(doc);setPdf(doc);setShowPDFViewer(true);}}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-900/20 text-slate-900 rounded-lg transition-colors cursor-pointer"
                        title='View PDF'
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removePdf(doc.pdfId)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors cursor-pointer"
                        title='Delete PDF'
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Action Modal */}
      {showChannelActionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => {setShowChannelActionModal(false);setSelectedChannel(null);}}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Delete Channel</h3>
              <button onClick={() => {setShowChannelActionModal(false);setSelectedChannel(null);}} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <p className="text-md text-slate-900 dark:text-slate-300">
                  Are you sure you want to permanently delete this chat channel?
                </p>
              </div>
              <div className="flex flex-row justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowChannelActionModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleChatChannelDelete(currentUser.userId, selectedChannel.chatChannelId)}
                  tabIndex={-1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatChannelDelete(currentUser.userId, selectedChannel.chatChannelId);
                    }
                    if (e.key === 'Escape') {
                      setShowChannelActionModal(false);
                    }
                  }}
                  autoFocus
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Option Modal */}
      {channelOptionsModalOpen && (
        <div
          className="fixed inset-0 z-[2000]"
          onClick={() => {
            setChannelOptionsModalOpen(false);
            setSelectedChannel(null);
          }}
        >
          <div
            className="absolute bg-slate-900 border border-slate-700 rounded-xl w-38 p-1 space-y-2 text-sm shadow-lg"
            style={{
              top: `${modalPosition.top}px`,
              left: `${modalPosition.left}px`
            }}
            onClick={(e) => e.stopPropagation()} // <-- prevents closing when clicking inside modal
          >
            <button
              onClick={() => {
                setChannelOptionsModalOpen(false);
                handleStartRename(selectedChannel.chatChannelId, selectedChannel.title);
              }}
              className="cursor-pointer w-full text-left px-3 py-2 hover:bg-slate-800/60 rounded flex items-center gap-2 text-white"
            >
              <Edit2 className="w-4 h-4" /> Rename
            </button>
            
            <button
              onClick={() => {
                if (isMdDown) setSidebarOpen(false);
                setChannelOptionsModalOpen(false);
                handleLoadPDFs(selectedChannel.chatChannelId);
              }}
              className="cursor-pointer w-full text-left px-3 py-2 hover:bg-slate-800/60 rounded flex items-center gap-2 text-white"
            >
              <Book className="w-4 h-4" /> Manage PDFs
            </button>
            
            <button
              onClick={() => {
                setChannelOptionsModalOpen(false);
                setShowChannelActionModal(true);
              }}
              className="cursor-pointer w-full text-left px-3 py-2 hover:bg-slate-800/60 rounded flex items-center gap-2 text-white"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      )}

      {showPDFViewer && (
        <PDFViewer pdf={pdf} isMdDown={isMdDown} fileUrl={fileUrl} onClose={()=>{setShowPDFViewer(false); setPdf(null);}}/>
      )}
    </div>
  );
}