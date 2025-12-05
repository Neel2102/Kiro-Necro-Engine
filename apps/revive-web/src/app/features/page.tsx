'use client';

export default function FeaturesPage() {
  const features = [
    {
      icon: '🔍',
      title: 'Deep Code Analysis',
      description: 'Comprehensive scanning of your codebase to identify outdated patterns, dependencies, and potential issues.'
    },
    {
      icon: '⚡',
      title: 'Automated Refactoring',
      description: 'Automatically apply modern patterns and best practices to your code with AI-powered transformations.'
    },
    {
      icon: '🛡️',
      title: 'Safety First',
      description: 'All changes are non-destructive and reviewed before application, with comprehensive test coverage.'
    },
    {
      icon: '📊',
      title: 'Detailed Reporting',
      description: 'Get a complete breakdown of issues found and recommended fixes with clear explanations.'
    },
    {
      icon: '🔄',
      title: 'CI/CD Integration',
      description: 'Seamlessly integrate with your existing development workflow and CI/CD pipeline.'
    },
    {
      icon: '🔧',
      title: 'Custom Rules',
      description: 'Define custom modernization rules and patterns specific to your team and codebase.'
    }
  ];

  return (
    <div className="spooky-section flex items-center">
      <div className="spooky-container w-full">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h1 className="spooky-heading-xl spooky-text mb-6">
            🔮 Necromantic Powers 🔮
          </h1>
          <p className="spooky-subtitle text-orange-300">
            Unleash dark magic to transform your cursed codebase! 🧙‍♂️
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12 max-w-7xl mx-auto mb-16">
          {features.map((feature, index) => (
            <div key={index} className="spooky-card-feature text-center">
              <div className="text-6xl md:text-7xl mb-6 animate-float" style={{animationDelay: `${index * 0.2}s`}}>
                {feature.icon}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-spooky-orange">
                {feature.title}
              </h3>
              <p className="text-spooky-ghost text-base md:text-lg leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href="/" className="btn-primary text-lg md:text-xl px-10 py-4 md:py-5 inline-block">
            Start Resurrection 🎃
          </a>
        </div>
      </div>
    </div>
  );
}
