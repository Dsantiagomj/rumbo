import { RiCheckLine } from '@remixicon/react';

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  steps: { label: string }[];
};

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden space-y-2">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Paso {currentStep + 1} de {totalSteps} — {steps[currentStep]?.label}
        </p>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-center gap-0">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                  index < currentStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : index === currentStep
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? <RiCheckLine className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`mt-1 text-xs ${
                  index <= currentStep ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-12 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
