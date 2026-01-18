import React from 'react';

const LivePowerWidget: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="text-4xl font-bold text-green-600">
                127 W
            </div>
            <div className="text-sm text-gray-500 mt-2">
                Current Consumption
            </div>
            <div className="w-full mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[65%]"></div>
            </div>
        </div>
    );
};

export default LivePowerWidget;
