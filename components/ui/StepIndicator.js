export default function StepIndicator({ steps = [], currentStep = 0 }) {
  return (
    <div className="tf-stepper">
      {steps.map((step, i) => {
        const state = i < currentStep ? 'done' : i === currentStep ? 'active' : '';
        return (
          <div
            key={i}
            className={`tf-stepper-step ${state}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div className="tf-stepper-dot">
                {state === 'done' ? '✓' : i + 1}
              </div>
              {step && <div className="tf-stepper-label">{step}</div>}
            </div>
            {i < steps.length - 1 && <div className="tf-stepper-line" />}
          </div>
        );
      })}
    </div>
  );
}
