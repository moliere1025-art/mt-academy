import React from "react";
import { cn } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav className={cn("flex items-center justify-center gap-1", className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-muted hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPageNumbers().map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-[13px] text-ink-muted">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors",
              currentPage === page
                ? "bg-primary text-white"
                : "text-ink-muted hover:bg-black/5"
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-muted hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

export { Pagination };
