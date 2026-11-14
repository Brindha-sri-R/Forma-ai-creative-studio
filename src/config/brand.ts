/**
 * Central brand and UX copy configuration.
 * Matches the AI Creative Studio product positioning and public/app IA.
 */
export const BRAND_CONFIG = {
  name: 'Forma',
  tagline: 'AI Creative Studio',
  heroHeadlineLine1: 'Create Stunning Images and Cinematic',
  heroHeadlineLine2: 'Videos From Your Wildest Ideas.',
  heroSubheadline:
    'Turn a simple prompt into stunning visuals and cinematic videos. Bring every creative vision to life with AI.',
  heroLeftBadge: '@stills.studio',
  heroRightBadge: '@motion.lab',
  primaryCtaLabel: 'Start Creating',
  secondaryCtaLabel: 'Explore Gallery',
  publicNavLinks: [
    { label: 'Home', href: '#top' },
    { label: 'Explore', href: '#explore' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ],
  sections: {
    possibilities: {
      eyebrow: 'Creative Possibilities',
      title: 'One Studio. Endless Possibilities.',
      subtitle:
        'Everything you need to turn ideas into visual experiences, all in one creative space.',
    },
    howItWorks: {
      eyebrow: 'How It Works',
      title: 'From Prompt to Creation.',
      subtitle: 'Three simple steps. One powerful creative process.',
    },
    showcase: {
      eyebrow: 'Showcase',
      title: 'Made with Imagination.',
      subtitle:
        'Explore what AI can create. Discover visuals and videos from the creative community.',
      cta: 'Explore All Creations',
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'Creativity Without Limits.',
      subtitle: 'Choose a plan that gives your ideas more room to grow.',
    },
    faq: {
      eyebrow: 'FAQ',
      title: "Got Questions? We've Got Answers.",
    },
    finalCta: {
      title: 'Your Next Creation Starts Here.',
      subtitle: 'Bring your ideas to life with just a few words.',
      cta: 'Start Creating',
    },
  },
  uxStates: {
    generating: 'Bringing your vision to life...',
    processing: 'Almost there. Creating your masterpiece.',
    success: 'Your creation is ready!',
    failed: "Something went wrong. Let's try again.",
    noCredits: "You're out of credits. Upgrade to continue.",
    uploading: 'Uploading your reference...',
    emptyHistory: 'Your creative journey starts here.',
  },
} as const;
