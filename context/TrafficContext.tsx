'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Direction = 'North' | 'South' | 'East' | 'West';
export type SignalStatus = 'RED' | 'GREEN' | 'YELLOW';

export interface SignalState {
  direction: Direction;
  status: SignalStatus;
  vehicleCount: number;
  density: 'Low' | 'Medium' | 'High';
  timeRemaining: number;
  isActive: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'signal' | 'ambulance' | 'accident' | 'violation' | 'sms' | 'general';
  metadata?: Record<string, any>;
}

export interface Hospital {
  id: string;
  name: string;
  phone: string;
  location: string;
  distance: number;
}

export interface SMSRecord {
  id: string;
  hospitalId: string;
  hospitalName: string;
  timestamp: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface TrafficContextType {
  signals: SignalState[];
  activityLogs: ActivityLog[];
  emergencyMode: boolean;
  ambulanceDetected: boolean;
  accidentDetected: boolean;
  selectedAmbulanceDirection: Direction | null;
  vehicleMetrics: Record<Direction, { count: number; density: string }>;
  addLog: (message: string, type: ActivityLog['type'], metadata?: Record<string, any>) => void;
  setAmbulanceDetected: (detected: boolean, direction?: Direction) => void;
  setAccidentDetected: (detected: boolean) => void;
  triggerSignalChange: (direction: Direction) => void;
  getSortedDirections: () => Direction[];
  hospitals: Hospital[];
  addHospital: (hospital: Omit<Hospital, 'id'>) => void;
  updateHospital: (id: string, hospital: Omit<Hospital, 'id'>) => void;
  deleteHospital: (id: string) => void;
  smsHistory: SMSRecord[];
  sendSMS: (hospitalId: string, message: string) => void;
}

const TrafficContext = createContext<TrafficContextType | undefined>(undefined);

export const TrafficProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const directions: Direction[] = ['North', 'South', 'East', 'West'];
  
  const [signals, setSignals] = useState<SignalState[]>([
    { direction: 'North', status: 'GREEN', vehicleCount: 12, density: 'Medium', timeRemaining: 20, isActive: true },
    { direction: 'South', status: 'RED', vehicleCount: 8, density: 'Low', timeRemaining: 50, isActive: false },
    { direction: 'East', status: 'RED', vehicleCount: 15, density: 'Medium', timeRemaining: 50, isActive: false },
    { direction: 'West', status: 'RED', vehicleCount: 6, density: 'Low', timeRemaining: 50, isActive: false },
  ]);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    {
      id: '1',
      timestamp: new Date().toISOString(),
      message: 'System initialized - Traffic monitoring active',
      type: 'general',
    },
  ]);

  const [emergencyMode, setEmergencyMode] = useState(false);
  const [ambulanceDetected, setAmbulanceDetectedState] = useState(false);
  const [accidentDetected, setAccidentDetectedState] = useState(false);
  const [selectedAmbulanceDirection, setSelectedAmbulanceDirection] = useState<Direction | null>(null);
  
  const [hospitals, setHospitals] = useState<Hospital[]>([
    { id: '1', name: 'Apollo Hospital', phone: '+91-98765-43210', location: '2 km away', distance: 2 },
    { id: '2', name: 'AMRI Hospital', phone: '+91-87654-32109', location: '3 km away', distance: 3 },
    { id: '3', name: 'Fortis Healthcare', phone: '+91-76543-21098', location: '4 km away', distance: 4 },
  ]);
  
  const [smsHistory, setSmsHistory] = useState<SMSRecord[]>([]);

  // Add log entry
  const addLog = useCallback((message: string, type: ActivityLog['type'], metadata?: Record<string, any>) => {
    setActivityLogs((prev) => {
      const newLogs = [
        {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          message,
          type,
          metadata,
        },
        ...prev,
      ];
      return newLogs.slice(0, 50); // Keep only 50 latest logs
    });
  }, []);

  // Set ambulance detection
  const setAmbulanceDetected = useCallback((detected: boolean, direction: Direction = 'North') => {
    setAmbulanceDetectedState(detected);
    setSelectedAmbulanceDirection(detected ? direction : null);
    setEmergencyMode(detected);
    
    if (detected) {
      addLog(`Ambulance detected on ${direction} direction - All signals set to GREEN`, 'ambulance', { direction });
    }
  }, [addLog]);

  // Set accident detection and auto-send SMS
  const setAccidentDetected = useCallback((detected: boolean) => {
    setAccidentDetectedState(detected);
    if (detected) {
      addLog('Accident detected at Park Street Junction - Emergency services notified', 'accident');
      // Auto-send SMS to all hospitals
      setHospitals((prev) => {
        prev.forEach((hospital) => {
          const message = `EMERGENCY ALERT: Accident detected at Park Street Junction, Kolkata. Emergency services dispatched. Response time: 5-8 minutes. Location: https://maps.google.com/?q=22.5726,88.3635`;
          // Use a small delay to ensure messages are staggered
          setTimeout(() => {
            setSmsHistory((prevSMS) => {
              const newSMS: SMSRecord = {
                id: Date.now().toString() + Math.random(),
                hospitalId: hospital.id,
                hospitalName: hospital.name,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                message,
                status: 'sent',
              };
              return [newSMS, ...prevSMS];
            });
            addLog(`Auto-SMS sent to ${hospital.name}`, 'sms', { hospitalId: hospital.id, hospitalName: hospital.name });
          }, Math.random() * 500);
        });
        return prev;
      });
    }
  }, [addLog]);

  // Trigger signal change
  const triggerSignalChange = useCallback((direction: Direction) => {
    setSignals((prev) => {
      const updated: SignalState[] = prev.map((signal) => ({
        ...signal,
        status: (signal.direction === direction ? 'GREEN' : 'RED') as SignalStatus,
        isActive: signal.direction === direction,
        timeRemaining: signal.direction === direction ? 25 : 50,
      }));
      return updated;
    });
    addLog(`Signal changed to GREEN (${direction})`, 'signal', { direction });
  }, [addLog]);

  // Get sorted directions by vehicle count (highest first)
  const getSortedDirections = useCallback((): Direction[] => {
    return [...signals].sort((a, b) => b.vehicleCount - a.vehicleCount).map((s) => s.direction);
  }, [signals]);

  // Add hospital
  const addHospital = useCallback((hospital: Omit<Hospital, 'id'>) => {
    const newHospital: Hospital = {
      ...hospital,
      id: Date.now().toString(),
    };
    setHospitals((prev) => [...prev, newHospital]);
    addLog(`Hospital added: ${hospital.name}`, 'general');
  }, [addLog]);

  // Update hospital
  const updateHospital = useCallback((id: string, hospital: Omit<Hospital, 'id'>) => {
    setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, ...hospital } : h)));
    addLog(`Hospital updated: ${hospital.name}`, 'general');
  }, [addLog]);

  // Delete hospital
  const deleteHospital = useCallback((id: string) => {
    const hospital = hospitals.find((h) => h.id === id);
    setHospitals((prev) => prev.filter((h) => h.id !== id));
    if (hospital) {
      addLog(`Hospital removed: ${hospital.name}`, 'general');
    }
  }, [hospitals, addLog]);

  // Send SMS to hospital
  const sendSMS = useCallback((hospitalId: string, message: string) => {
    const hospital = hospitals.find((h) => h.id === hospitalId);
    if (hospital) {
      const smsRecord: SMSRecord = {
        id: Date.now().toString(),
        hospitalId,
        hospitalName: hospital.name,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message,
        status: 'pending',
      };
      setSmsHistory((prev) => [smsRecord, ...prev]);
      addLog(`SMS sent to ${hospital.name}: ${message.substring(0, 50)}...`, 'sms', { hospitalId, hospitalName: hospital.name });

      // Simulate SMS delivery after 2-3 seconds
      setTimeout(() => {
        setSmsHistory((prev) =>
          prev.map((sms) =>
            sms.id === smsRecord.id ? { ...sms, status: 'delivered' as const } : sms
          )
        );
      }, 2000 + Math.random() * 1000);
    }
  }, [hospitals, addLog]);

  // Simulation loop - update vehicle counts and manage signals with ambulance override
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      setSignals((prev) => {
        // First, update vehicle counts
        let updated: SignalState[] = prev.map((signal) => {
          // Generate random vehicle count between 5 and 40
          const newCount = Math.floor(Math.random() * 35) + 5;
          
          // Determine density and green time based on vehicles
          // More vehicles = longer green time (up to 60 seconds)
          const greenTimeNeeded = Math.ceil((newCount / 40) * 60); // Scale 5-40 vehicles to 7.5-60 seconds
          
          const density: 'Low' | 'Medium' | 'High' = newCount <= 15 ? 'Low' : newCount <= 25 ? 'Medium' : 'High';
          
          // Update time remaining (decrease by 1 second each tick)
          let newTime = Math.max(0, signal.timeRemaining - 1);
          
          return {
            ...signal,
            vehicleCount: newCount,
            density,
            timeRemaining: newTime,
          };
        });

        // Check if ambulance mode - IMMEDIATE override to ambulance direction GREEN
        if (ambulanceDetected && selectedAmbulanceDirection) {
          updated = updated.map((signal) => ({
            ...signal,
            status: (signal.direction === selectedAmbulanceDirection ? 'GREEN' : 'RED') as SignalStatus,
            isActive: signal.direction === selectedAmbulanceDirection,
            timeRemaining: signal.direction === selectedAmbulanceDirection ? 60 : 0, // Ambulance gets full time
          }));
        } else {
          // Normal vehicle-based switching - DYNAMIC based on current traffic with MINIMUM 30s green
          // Find direction currently with GREEN light
          const currentGreen = updated.find((s) => s.isActive);
          
          // Find direction with most vehicles NOW
          const sorted = [...updated].sort((a, b) => b.vehicleCount - a.vehicleCount);
          const maxVehicleDirection = sorted[0].direction;
          const maxVehicleCount = sorted[0].vehicleCount;
          const greenTimeNeeded = Math.ceil((maxVehicleCount / 40) * 60); // 5 cars = ~7.5s, 40 cars = 60s
          
          // MINIMUM 30 seconds of green time before allowing switch to another direction
          const MIN_GREEN_TIME = 30;
          const currentGreenElapsedTime = currentGreen ? (greenTimeNeeded - currentGreen.timeRemaining) : 0;
          
          // Can only switch if: 
          // 1. No direction currently has green, OR
          // 2. Current green has been running for at least 30 seconds AND another direction has more vehicles, OR
          // 3. Current green time has completely expired
          const currentGreenVehicles = currentGreen?.vehicleCount || 0;
          const hasElapsedMinTime = currentGreenElapsedTime >= MIN_GREEN_TIME;
          const shouldSwitchToOtherDirection = currentGreen && hasElapsedMinTime && maxVehicleCount > currentGreenVehicles && currentGreen.direction !== maxVehicleDirection;
          
          const shouldSwitch = !currentGreen || shouldSwitchToOtherDirection || (currentGreen.timeRemaining <= 0);
          
          updated = updated.map((signal) => {
            const isCurrentlyGreen = signal.isActive;
            const shouldBeGreen = signal.direction === maxVehicleDirection;
            
            if (shouldSwitch && shouldBeGreen) {
              // This direction is taking the green light
              return {
                ...signal,
                status: 'GREEN' as SignalStatus,
                isActive: true,
                timeRemaining: greenTimeNeeded,
              };
            } else if (isCurrentlyGreen && !shouldSwitch) {
              // Keep current green light, just decrease time
              return {
                ...signal,
                status: 'GREEN' as SignalStatus,
                isActive: true,
                timeRemaining: signal.timeRemaining,
              };
            } else {
              // This direction is red
              return {
                ...signal,
                status: 'RED' as SignalStatus,
                isActive: false,
                timeRemaining: signal.timeRemaining,
              };
            }
          });
        }

        return updated;
      });
    }, 1000); // Update every 1 second for smooth countdown

    return () => clearInterval(simulationInterval);
  }, [ambulanceDetected, selectedAmbulanceDirection]);

  // Play continuous ambulance alarm sound while ambulance is detected
  useEffect(() => {
    let audioContext: (AudioContext | any) | null = null;
    let oscillators: OscillatorNode[] = [];
    let gainNodes: GainNode[] = [];
    let sirenInterval: NodeJS.Timeout | null = null;

    if (ambulanceDetected) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('[v0] Ambulance alarm started - continuous loop');

        // Create a pulsing siren effect that loops continuously
        const createSirenSound = () => {
          if (!audioContext) return;

          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.type = 'sine';
          oscillator.frequency.value = 800; // High pitch

          // Set initial volume
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

          // Start the oscillator
          oscillator.start(audioContext.currentTime);

          // Stop after 0.3 seconds to create pulsing effect
          oscillator.stop(audioContext.currentTime + 0.3);

          oscillators.push(oscillator);
          gainNodes.push(gainNode);
        };

        // Create pulsing siren sound every 0.5 seconds (creates alarm effect)
        createSirenSound(); // Start immediately
        sirenInterval = setInterval(createSirenSound, 500); // Repeat every 500ms
      } catch (error) {
        console.log('[v0] Audio context error:', error);
      }
    }

    // Cleanup when ambulance is no longer detected
    return () => {
      if (sirenInterval) {
        clearInterval(sirenInterval);
      }
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch (e) {
          // Already stopped
        }
      });
      console.log('[v0] Ambulance alarm stopped');
    };
  }, [ambulanceDetected]);

  // Auto-dismiss ambulance alert after 30 seconds
  useEffect(() => {
    if (ambulanceDetected) {
      const timer = setTimeout(() => {
        setAmbulanceDetectedState(false);
        setSelectedAmbulanceDirection(null);
        setEmergencyMode(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [ambulanceDetected]);

  // Auto-dismiss accident alert after 20 seconds
  useEffect(() => {
    if (accidentDetected) {
      const timer = setTimeout(() => {
        setAccidentDetectedState(false);
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [accidentDetected]);

  const vehicleMetrics = directions.reduce((acc, direction) => {
    const signal = signals.find((s) => s.direction === direction);
    if (signal) {
      acc[direction] = {
        count: signal.vehicleCount,
        density: signal.density,
      };
    }
    return acc;
  }, {} as Record<Direction, { count: number; density: string }>);

  return (
    <TrafficContext.Provider
      value={{
        signals,
        activityLogs,
        emergencyMode,
        ambulanceDetected,
        accidentDetected,
        selectedAmbulanceDirection,
        vehicleMetrics,
        addLog,
        setAmbulanceDetected,
        setAccidentDetected,
        triggerSignalChange,
        getSortedDirections,
        hospitals,
        addHospital,
        updateHospital,
        deleteHospital,
        smsHistory,
        sendSMS,
      }}
    >
      {children}
    </TrafficContext.Provider>
  );
};

export const useTraffic = () => {
  const context = useContext(TrafficContext);
  if (!context) {
    throw new Error('useTraffic must be used within TrafficProvider');
  }
  return context;
};
