interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  color: 'red' | 'orange' | 'yellow' | 'blue';
}

export default function StatsCard({ label, value, icon, color }: StatsCardProps) {
  const colorClasses = {
    red: {
      text: 'text-red-400',
      bg: 'bg-red-900/40',
      border: 'border-red-500',
    },
    orange: {
      text: 'text-orange-400',
      bg: 'bg-orange-900/40',
      border: 'border-orange-500',
    },
    yellow: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-900/40',
      border: 'border-yellow-500',
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-900/40',
      border: 'border-blue-500',
    },
  };

  const colors = colorClasses[color];

  return (
    <div 
      className={`${colors.bg} rounded-2xl p-4 md:p-6 border-2 ${colors.border} text-center transform hover:scale-105 transition-all duration-300 hover:shadow-2xl`}
    >
      <p className="text-base md:text-lg text-gray-200 mb-3 font-bold">
        {icon} {label}
      </p>
      <p className={`text-3xl md:text-4xl lg:text-5xl font-black ${colors.text}`}>
        {value}
      </p>
    </div>
  );
}
