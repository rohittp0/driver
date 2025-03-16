
import { useState, useEffect, useRef, useCallback } from 'react';

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  totalAcceleration: number;
  accumulatedAcceleration: number;
  elapsedTime: number;
  averageAcceleration: number;
}

interface UseAccelerometerOptions {
  frequency?: number;
}

export function useAccelerometer(options: UseAccelerometerOptions = {}) {
  const { frequency = 60 } = options;
  
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AccelerometerData>({
    x: 0,
    y: 0,
    z: 0,
    totalAcceleration: 0,
    accumulatedAcceleration: 0,
    elapsedTime: 0,
    averageAcceleration: 0
  });
  
  const accumulatedAccelerationRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  
  // Check if Accelerometer API is available
  useEffect(() => {
    if ('Accelerometer' in window) {
      setIsAvailable(true);
    } else {
      setError('Accelerometer API is not supported in this browser');
      console.error('Accelerometer API is not supported');
    }
  }, []);

  const resetAccelerometer = useCallback(() => {
    accumulatedAccelerationRef.current = 0;
    startTimeRef.current = null;
    previousTimeRef.current = null;
    
    setData({
      x: 0,
      y: 0,
      z: 0,
      totalAcceleration: 0,
      accumulatedAcceleration: 0,
      elapsedTime: 0,
      averageAcceleration: 0
    });
  }, []);

  const startAccelerometer = useCallback(() => {
    if (!isAvailable) {
      setError('Accelerometer is not available');
      return;
    }

    resetAccelerometer();
    startTimeRef.current = Date.now();
    previousTimeRef.current = Date.now();
    setIsRunning(true);
  }, [isAvailable, resetAccelerometer]);

  const stopAccelerometer = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Mock accelerometer data for development/testing
  const mockAccelerometerData = useCallback(() => {
    if (!isRunning) return;
    
    const now = Date.now();
    const elapsedTime = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
    const deltaTime = previousTimeRef.current ? (now - previousTimeRef.current) / 1000 : 0;
    previousTimeRef.current = now;
    
    if (deltaTime <= 0) return;
    
    // Generate random acceleration values (for demo)
    const x = (Math.random() - 0.5) * 2;
    const y = (Math.random() - 0.5) * 2;
    const z = 9.8 + (Math.random() - 0.5);
    
    // Calculate total acceleration magnitude 
    // (subtracting gravity's 9.8m/s² from z for more realistic values)
    const totalAcc = Math.sqrt(x * x + y * y + Math.pow(z - 9.8, 2));
    
    // Accumulate acceleration over time
    accumulatedAccelerationRef.current += totalAcc * deltaTime;
    
    const averageAcc = elapsedTime > 0 
      ? accumulatedAccelerationRef.current / elapsedTime 
      : 0;
    
    setData({
      x,
      y,
      z,
      totalAcceleration: totalAcc,
      accumulatedAcceleration: accumulatedAccelerationRef.current,
      elapsedTime,
      averageAcceleration: averageAcc
    });
  }, [isRunning]);

  // Real accelerometer data handling
  const handleRealAccelerometerData = useCallback((event: DeviceMotionEvent) => {
    if (!isRunning || !event.accelerationIncludingGravity) return;
    
    const now = Date.now();
    const elapsedTime = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
    const deltaTime = previousTimeRef.current ? (now - previousTimeRef.current) / 1000 : 0;
    previousTimeRef.current = now;
    
    if (deltaTime <= 0) return;
    
    const x = event.accelerationIncludingGravity.x || 0;
    const y = event.accelerationIncludingGravity.y || 0;
    const z = event.accelerationIncludingGravity.z || 0;
    
    // Calculate total acceleration magnitude
    // We don't subtract gravity here because accelerationIncludingGravity 
    // already accounts for it in measurements
    const totalAcc = Math.sqrt(x * x + y * y + z * z);
    
    // Accumulate acceleration over time
    accumulatedAccelerationRef.current += totalAcc * deltaTime;
    
    const averageAcc = elapsedTime > 0 
      ? accumulatedAccelerationRef.current / elapsedTime 
      : 0;
    
    setData({
      x,
      y,
      z,
      totalAcceleration: totalAcc,
      accumulatedAcceleration: accumulatedAccelerationRef.current,
      elapsedTime,
      averageAcceleration: averageAcc
    });
  }, [isRunning]);

  // Set up event listeners and intervals
  useEffect(() => {
    let intervalId: number;

    if (isRunning) {
      // Try to use real accelerometer if available
      if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleRealAccelerometerData);
      } else {
        // Fall back to mock data for testing/development
        intervalId = window.setInterval(mockAccelerometerData, 1000 / frequency);
      }
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleRealAccelerometerData);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, frequency, handleRealAccelerometerData, mockAccelerometerData]);

  return {
    isAvailable,
    isRunning,
    error,
    data,
    startAccelerometer,
    stopAccelerometer,
    resetAccelerometer,
    toggleAccelerometer: () => isRunning ? stopAccelerometer() : startAccelerometer()
  };
}
