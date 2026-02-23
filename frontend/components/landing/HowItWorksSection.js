/**
 * HowItWorksSection — Step-by-step explanation on landing page.
 */

const steps = [
  {
    number: "01",
    title: "Sign in & add App Password",
    description: "Sign in with Google, then add your Gmail App Password. It's encrypted with AES-256-GCM before storing.",
  },
  {
    number: "02",
    title: "Grab an API key",
    description: "Generate a key and add it to your app. Works with any language or framework.",
  },
  {
    number: "03",
    title: "Send through our API",
    description: "Your server calls our API with the API key. We deliver via Gmail SMTP.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20 border-t border-[#70012b]/5">
      <div className="mx-auto max-w-4xl">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-14">
          <p className="text-xs uppercase tracking-widest text-[#70012b] font-medium mb-3">
            How it works
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Start sending in three steps
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#70012b]/20 to-transparent" />
              )}

              <div className="text-3xl font-bold text-[#70012b] mb-3">
                {step.number}
              </div>
              <h3 className="text-base font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
