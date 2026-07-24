import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { apiService } from '../../services/apiService';

interface FileUploadProps {
  onUploadSuccess?: (url: string) => void;
  accept?: string;
  maxSize?: number; // In MB
  label?: string;
  className?: string;
  type?: 'image' | 'video' | 'document' | 'all';
}

export default function FileUpload({ 
  onUploadSuccess, 
  accept = "image/*,video/*,.pdf,.doc,.docx", 
  maxSize = 10, 
  label = "上传文件",
  className,
  type = 'all'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`文件大小不能超过 ${maxSize}MB`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      const formData = new FormData();
      formData.append('file', file);

      const response = file.type.startsWith('video/')
        ? await apiService.uploadVideo(formData)
        : type === 'document'
          ? await apiService.uploadSubmission(formData)
          : await apiService.uploadImage(formData);

      clearInterval(interval);
      setProgress(100);

      if (onUploadSuccess) {
        const payload: any = response.data;
        onUploadSuccess(payload.url || payload.key || '');
      }
      
      toast.success('文件上传成功');
      setFile(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error('文件上传失败，请稍后重试');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-[18px] p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center group",
          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-outline/40 hover:border-primary/40 hover:bg-surface-light/30",
          file && "border-success/40 bg-success/5"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) handleFileSelect(selectedFile);
          }}
          accept={accept}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-ink">{label}</p>
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                最大 {maxSize}MB
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center gap-4"
            >
              {previewUrl ? (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-outline/20">
                  <img src={previewUrl} alt="预览" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
                  {file.type.startsWith('video/') ? (
                    <Video className="w-8 h-8 text-success" />
                  ) : file.type.includes('pdf') ? (
                    <FileText className="w-8 h-8 text-success" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-success" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-ink truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-surface-light hover:bg-danger/10 hover:text-danger transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {file && !uploading && progress === 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleUpload}
          className="w-full py-4 bg-primary text-white rounded-full font-black uppercase tracking-[0.2em] text-xs hover:bg-primary-dark transition-all"
        >
          开始上传文件
        </motion.button>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-ink-muted">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              正在上传...
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-light rounded-full overflow-hidden border border-outline/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary shadow-[0_0_10px_rgba(0,102,255,0.5)]"
            />
          </div>
        </div>
      )}

      {progress === 100 && !uploading && (
        <div className="flex items-center justify-center gap-2 text-success text-[10px] font-black uppercase tracking-widest">
          <CheckCircle2 className="w-4 h-4" />
          上传成功
        </div>
      )}
    </div>
  );
}
