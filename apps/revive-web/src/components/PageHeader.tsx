interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export default function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
  return (
    <div className="text-center mb-12 md:mb-16 lg:mb-20">
      {icon && (
        <div className="text-5xl md:text-6xl lg:text-7xl mb-5 animate-float">
          {icon}
        </div>
      )}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-5 spooky-text leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg md:text-xl lg:text-2xl text-orange-300 max-w-4xl mx-auto font-semibold leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
