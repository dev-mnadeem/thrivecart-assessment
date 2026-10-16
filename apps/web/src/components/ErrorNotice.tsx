import { CircleAlert, RotateCw } from 'lucide-react';

interface ErrorNoticeProps {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

export function ErrorNotice({ message, onRetry, retryLabel = 'Try again' }: ErrorNoticeProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 font-medium underline underline-offset-2 hover:text-red-950"
        >
          <RotateCw aria-hidden="true" className="size-3.5" />
          {retryLabel}
        </button>
      </div>
    </div>
  );
}
