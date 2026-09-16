
import { Loader2 } from 'lucide-react';

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500"
  };
  return (
    <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export const Badge = ({ children, color = 'blue', className = '' }: any) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color as keyof typeof colors]} ${className}`}>
      {children}
    </span>
  );
};

export const Input = ({ label, error, ...props }: any) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input 
      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 ${
        error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
      }`} 
      {...props} 
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export const Select = ({ label, error, options, ...props }: any) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select 
      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 bg-white ${
        error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
      }`} 
      {...props}
    >
      <option value="">Select...</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export const Spinner = ({ className = '' }: { className?: string }) => (
  <Loader2 className={`animate-spin text-blue-600 ${className}`} />
);

export const useToast = () => {
  return {
    success: (msg: string) => alert(`Success: ${msg}`),
    error: (msg: string) => alert(`Error: ${msg}`)
  };
};
