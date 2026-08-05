export default function StepIndicator({ steps = [], currentStep = 0 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: '0' }}>
      {steps.map((step, i) => {
        const state = i < currentStep ? 'done' : i === currentStep ? 'active' : '';
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: i === steps.length - 1 ? 'none' : 1,
              minWidth: 0,
            }}
            className={`step-${state}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div className="step-dot">
                {state === 'done' ? '✓' : i + 1}
              </div>
              {step && <div className="step-label">{step}</div>}
            </div>
            {i < steps.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}
