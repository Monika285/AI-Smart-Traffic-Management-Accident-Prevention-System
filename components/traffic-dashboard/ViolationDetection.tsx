'use client';

import React, { useState } from 'react';
import { useTraffic } from '@/context/TrafficContext';
import { Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Violation {
  id: string;
  licensePlate: string;
  violationType: 'red-light' | 'speeding' | 'wrong-way';
  timestamp: string;
  location: string;
  status: 'recorded' | 'verified' | 'challan-issued';
}

export const ViolationDetection: React.FC = () => {
  const { addLog } = useTraffic();
  const [violations, setViolations] = useState<Violation[]>([
    {
      id: '1',
      licensePlate: 'WB06AB1234',
      violationType: 'red-light',
      timestamp: '14:32:45',
      location: 'Park Street Junction',
      status: 'challan-issued',
    },
  ]);

  const handleSimulateViolation = () => {
    const newPlate = `WB${Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0')}${String.fromCharCode(65 + Math.random() * 26)}${String.fromCharCode(65 + Math.random() * 26)}${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`;

    const newViolation: Violation = {
      id: Date.now().toString(),
      licensePlate: newPlate,
      violationType: 'red-light',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      location: 'Park Street Junction',
      status: 'recorded',
    };

    setViolations((prev) => [newViolation, ...prev].slice(0, 10));
    addLog(
      `Traffic violation recorded: Vehicle ${newPlate} crossed on red light`,
      'violation',
      { licensePlate: newPlate }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recorded':
        return 'bg-blue-900/30 text-blue-300 border-blue-700';
      case 'verified':
        return 'bg-amber-900/30 text-amber-300 border-amber-700';
      case 'challan-issued':
        return 'bg-red-900/30 text-red-300 border-red-700';
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold text-foreground">Traffic Violations</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSimulateViolation}
          className="text-xs"
        >
          Simulate Violation
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {violations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No violations detected</p>
          </div>
        ) : (
          violations.map((violation) => (
            <div
              key={violation.id}
              className="border border-border rounded-lg p-4 bg-secondary/20 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-mono text-lg font-bold text-cyan-400">
                    {violation.licensePlate}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{violation.location}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusColor(
                    violation.status
                  )}`}
                >
                  {violation.status === 'challan-issued'
                    ? 'Challan Issued'
                    : violation.status === 'verified'
                      ? 'Verified'
                      : 'Recorded'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">Violation Type</p>
                  <p className="font-semibold text-foreground uppercase">Red Light Jump</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground mb-1">Time</p>
                  <p className="font-mono text-foreground">{violation.timestamp}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
