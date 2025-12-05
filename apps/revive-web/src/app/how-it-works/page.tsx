'use client';

export default function HowItWorksPage() {
  const steps = [
    {
      step: '1',
      title: 'Connect Your Repository',
      description: 'Provide a link to your GitHub repository or upload your code directly.',
      icon: '🔗'
    },
    {
      step: '2',
      title: 'Scan for Issues',
      description: 'Our AI analyzes your codebase for outdated patterns, dependencies, and potential improvements.',
      icon: '🔍'
    },
    {
      step: '3',
      title: 'Review Findings',
      description: 'Get a detailed report of all issues found, organized by severity and category.',
      icon: '📋'
    },
    {
      step: '4',
      title: 'Apply Modernizations',
      description: 'With a single click, apply all recommended modernizations or select specific ones to apply.',
      icon: '⚡'
    },
    {
      step: '5',
      title: 'Review & Commit',
      description: 'Review all changes in a pull request and merge when ready.',
      icon: '✅'
    }
  ];

  return (
    <div className="spooky-section flex items-center">
      <div className="spooky-container-narrow w-full">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h1 className="spooky-heading-xl spooky-text mb-6">
            🧪 The Resurrection Ritual 🧪
          </h1>
          <p className="spooky-subtitle text-orange-300">
            Follow these mystical steps to bring your code back to life! 🕯️
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 md:space-y-10 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="spooky-card-step">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-orange-600 to-purple-800 border-4 border-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/50 animate-spooky-glow">
                  <span className="text-5xl md:text-6xl">{step.icon}</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-3">
                    <span className="text-orange-500 font-black text-xl md:text-2xl">
                      Step {step.step}
                    </span>
                    <span className="text-purple-500 text-2xl hidden md:inline">•</span>
                    <h3 className="text-3xl md:text-4xl font-bold text-spooky-orange">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-spooky-ghost text-lg md:text-xl leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href="/" className="btn-primary text-lg md:text-xl px-10 py-4 md:py-5 inline-block">
            Begin the Ritual 🔮
          </a>
        </div>
      </div>
    </div>
  );
}
