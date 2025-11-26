import { Check } from 'lucide-react';

type Status =
  | 'Review by Procurement'
  | 'Waiting PO'
  | 'On Process by Vendor'
  | 'Delivered';

const steps: Status[] = [
  'Review by Procurement',
  'Waiting PO',
  'On Process by Vendor',
  'Delivered'
];

interface StatusStepperProps {
  currentStatus: Status;
}

export default function StatusStepper({ currentStatus }: StatusStepperProps) {
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500'
                    : isCurrent
                    ? 'bg-[#ec2224] scale-110'
                    : 'bg-gray-300'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>
              <div
                className={`mt-2 text-sm text-center max-w-[120px] ${
                  isCurrent ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {step}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 relative top-[-20px]">
                <div
                  className={`h-full ${
                    index < currentIndex ? 'bg-green-500' : isCurrent ? 'bg-[#ec2224]' : 'bg-gray-300'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}