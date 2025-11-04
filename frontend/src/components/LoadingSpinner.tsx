import Lottie from 'lottie-react';
import shipAnimation from '../assets/Animation - ship.json';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

const LoadingSpinner = ({ size = 200, text = 'กำลังโหลด...' }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <Lottie
        animationData={shipAnimation}
        loop={true}
        autoplay={true}
        style={{ width: size, height: size }}
      />
      {text && (
        <p className="mt-4 text-gray-600 text-lg font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
