// LogActivity.tsx

import type {
  ProcurementRequest,
  ActivityLog,
} from "../../data/mockData";

interface LogActivityProps {
  request: ProcurementRequest;
}

export default function LogActivity({
  request,
}: LogActivityProps) {
  // Use actual activity log from request, or empty array if undefined
  const activityLogs = request.activityLog || [];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Show message if no activity logs exist
  if (activityLogs.length === 0) {
    return (
      <div className="space-y-4">
        <h4 className="text-gray-900 mb-3 border-b border-gray-300 pb-2">
          LOG ACTIVITY
        </h4>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            No activity logs available for this request
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-gray-900 mb-3 border-b border-gray-300 pb-2">
        LOG ACTIVITY
      </h4>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-4">
          {activityLogs
            .slice()
            .reverse() // Show newest first
            .map((log, index) => {
              const { date, time } = formatTimestamp(
                log.timestamp,
              );
              const isLast = index === activityLogs.length - 1;

              return (
                <div key={log.id} className="flex gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-[#ec2224] rounded-full flex-shrink-0 mt-1" />
                    {!isLast && (
                      <div className="w-0.5 h-full bg-gray-300 mt-1" />
                    )}
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h5 className="text-gray-900 font-medium">
                          {log.action}
                        </h5>
                        <p className="text-gray-600 text-sm">
                          {log.user}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{date}</div>
                        <div>{time}</div>
                      </div>
                    </div>
                    {log.details && (
                      <p className="text-gray-700 text-sm mt-2 bg-white rounded px-3 py-2 border border-gray-200">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      <div className="text-center text-sm text-gray-500 pt-2">
        Showing {activityLogs.length}{" "}
        {activityLogs.length === 1 ? "activity" : "activities"}
      </div>
    </div>
  );
}