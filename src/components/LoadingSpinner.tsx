interface LoadingSpinnerProps {
  color?: string;
  text?: string;
}

export default function LoadingSpinner({ color = '#4F46E5', text = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: color, borderTopColor: 'transparent' }}
        />
        <p className="text-sm text-gray-500">{text}</p>
      </div>
    </div>
  );
}
