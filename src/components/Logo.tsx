import { Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  clickable?: boolean;
}

const Logo = ({ size = "md", showText = true, className = "", clickable = true }: LogoProps) => {
  const navigate = useNavigate();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  const handleClick = () => {
    if (clickable) {
      navigate('/');
    }
  };

  return (
    <div 
      className={`flex items-center gap-2 ${clickable ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      <div className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg`}>
        <Stethoscope className={`${size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-6 w-6' : 'h-7 w-7'} text-white`} strokeWidth={2} />
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} text-foreground tracking-tight`}>
          FebreMed
        </span>
      )}
    </div>
  );
};

export default Logo;

