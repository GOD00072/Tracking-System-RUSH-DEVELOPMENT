import { MessageCircle } from 'lucide-react';
import { BACKEND_URL } from '../utils/apiConfig';

interface LineLoginButtonProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LineLoginButton = ({ text = 'Login with LINE', size = 'md', className = '' }: LineLoginButtonProps) => {
  const handleLogin = () => {
    // Redirect to backend LINE auth endpoint
    window.location.href = `${BACKEND_URL}/auth/line`;
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={handleLogin}
      className={`
        bg-[#06C755] hover:bg-[#05B84D] text-white font-medium rounded-lg
        flex items-center justify-center gap-2 transition-colors
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <MessageCircle className={size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      {text}
    </button>
  );
};

export default LineLoginButton;
