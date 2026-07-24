import React from 'react';
import { Upload } from 'lucide-react';
import Button from '../ui/Button';

export function AdminPageHero({
  eyebrow,
  title,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  primary: { label: string; action: () => void };
  secondary: { label: string; action: () => void };
}) {
  return (
    <section className="bg-surface border border-outline rounded-[18px] px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-primary tracking-widest">{eyebrow}</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-ink">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={primary.action} variant="primary" className="rounded-full px-7">
            {primary.label}
          </Button>
          <Button onClick={secondary.action} variant="secondary" className="rounded-full px-7">
            {secondary.label}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{label}</label>
      {children}
    </div>
  );
}

export function UploadField({
  label,
  value,
  onFileChange,
  accept,
}: {
  label: string;
  value?: string;
  onFileChange: (file?: File | null) => void;
  accept?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{label}</label>
      <div className="rounded-[18px] border border-dashed border-outline bg-surface-alt p-5 min-h-[148px] flex flex-col justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-muted break-all">{value || '未上传'}</p>
        </div>
        <label className="inline-flex items-center justify-center rounded-full border border-outline bg-surface hover:bg-surface-alt transition-colors px-5 py-2 text-sm font-bold text-ink cursor-pointer w-fit">
          <Upload className="w-4 h-4 mr-2" />
          上传文件
          <input type="file" accept={accept} className="hidden" onChange={(e) => onFileChange(e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}

export function AdminLoadingCard({ label }: { label: string }) {
  return (
    <div className="bg-surface border border-outline rounded-[18px] p-12 flex items-center justify-center">
      <div className="flex items-center gap-4 text-ink-muted font-medium">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-outline bg-surface p-10 text-center text-ink-muted font-medium">
      {text}
    </div>
  );
}
