import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadCloud, CheckCircle2, Copy, Smartphone, Loader2, Zap, Shield, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please upload a valid video file (MP4, WebM, MOV, etc).');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError('File is too large. Maximum size is 500MB.');
      return;
    }

    setError(null);
    setUploading(true);
    setVideoUrl(null);
    setCopied(false);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const fullUrl = `${window.location.origin}${data.url}`;
      setVideoUrl(fullUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload video. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const onPaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('video') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  }, [handleFile]);

  useEffect(() => {
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('paste', onPaste);
    };
  }, [onPaste]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const copyToClipboard = () => {
    if (videoUrl) {
      navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-zinc-200/50 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-indigo-600/20">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight">Beam</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-zinc-500">
          <div className="hidden sm:flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span>Secure Transfer</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-2xl w-full">
          
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-zinc-900">
              Send videos to your phone, <span className="text-indigo-600">instantly.</span>
            </h1>
            <p className="text-lg text-zinc-500 max-w-lg mx-auto">
              No cables, no cloud storage limits, no messaging yourself. Just drop a video and scan.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/40 border border-zinc-200/60 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {!videoUrl && !uploading && (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className={`p-8 sm:p-16 text-center transition-all duration-300 ${
                    isDragging ? 'bg-indigo-50/50 scale-[0.99]' : ''
                  }`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  
                  <div 
                    className={`mx-auto w-20 h-20 mb-6 rounded-full flex items-center justify-center transition-colors duration-300 cursor-pointer ${
                      isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                    Click or drag video here
                  </h3>
                  <p className="text-zinc-500 mb-6">
                    Supports MP4, WebM, MOV up to 500MB.<br/>
                    You can also paste (Ctrl+V) anywhere.
                  </p>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl transition-colors"
                  >
                    Select Video
                  </button>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100"
                    >
                      {error}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {uploading && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="p-16 sm:p-24 flex flex-col items-center justify-center text-center"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-white rounded-full p-4 shadow-sm border border-zinc-100">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2">Beaming to server...</h3>
                  <p className="text-zinc-500">Preparing your secure QR code</p>
                </motion.div>
              )}

              {videoUrl && !uploading && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 sm:p-12 flex flex-col md:flex-row items-center gap-10"
                >
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mb-6">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-3 text-zinc-900">Ready to scan</h2>
                    <p className="text-lg text-zinc-500 mb-8">
                      Open your phone's camera and point it at the QR code to view and save the video.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={copyToClipboard}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium rounded-xl transition-colors"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => {
                          setVideoUrl(null);
                          setError(null);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-indigo-600/20"
                      >
                        <UploadCloud className="w-4 h-4" />
                        Send Another
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 bg-white p-6 rounded-3xl shadow-lg shadow-zinc-200/50 border border-zinc-100">
                    <QRCodeSVG 
                      value={videoUrl} 
                      size={220}
                      level="H"
                      includeMargin={false}
                      className="rounded-xl"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Features / Footer */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center px-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-zinc-900 mb-1">Lightning Fast</h4>
              <p className="text-sm text-zinc-500">Direct local network transfer when possible.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-zinc-900 mb-1">Auto-Deleting</h4>
              <p className="text-sm text-zinc-500">Files are permanently removed after 1 hour.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-zinc-900 mb-1">No App Needed</h4>
              <p className="text-sm text-zinc-500">Works with any standard smartphone camera.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
