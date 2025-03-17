
import { useState, useEffect, useRef, useCallback } from 'react';

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  totalAcceleration: number;
  accumulatedAcceleration: number;
  elapsedTime: number;
  averageAcceleration: number;
  currentSpeed: number;
  topSpeed: number;
  averageSpeed: number;
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
    averageAcceleration: 0,
    currentSpeed: 0,
    topSpeed: 0,
    averageSpeed: 0
  });

  const accumulatedAccelerationRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // Track speed metrics
  const currentSpeedRef = useRef<number>(0);
  const topSpeedRef = useRef<number>(0);
  const accumulatedSpeedRef = useRef<number>(0);
  const validSpeedReadingsRef = useRef<number>(0);

  // Check if Accelerometer and Geolocation APIs are available
  useEffect(() => {
    const checkAvailability = () => {
      const hasAccelerometer = 'Accelerometer' in window || 'DeviceMotionEvent' in window;
      const hasGeolocation = 'geolocation' in navigator;

      if (hasAccelerometer && hasGeolocation) {
        setIsAvailable(true);
      } else {
        setError('Required APIs (Accelerometer or Geolocation) are not supported in this browser');
        console.error('Required APIs are not supported');
      }
    };

    checkAvailability();
  }, []);

  const resetAccelerometer = useCallback(() => {
    accumulatedAccelerationRef.current = 0;
    startTimeRef.current = null;

    // Reset speed metrics
    currentSpeedRef.current = 0;
    topSpeedRef.current = 0;
    accumulatedSpeedRef.current = 0;
    validSpeedReadingsRef.current = 0;

    setData({
      x: 0,
      y: 0,
      z: 0,
      totalAcceleration: 0,
      accumulatedAcceleration: 0,
      elapsedTime: 0,
      averageAcceleration: 0,
      currentSpeed: 0,
      topSpeed: 0,
      averageSpeed: 0
    });
  }, []);

  const startAccelerometer = useCallback(() => {
    if (!isAvailable) {
      setError('Accelerometer is not available');
      return;
    }

    resetAccelerometer();
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, [isAvailable, resetAccelerometer]);

  const stopAccelerometer = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Filter speed values to only accept readings between 5 and 250 km/h
  const isValidSpeed = (speed: number): boolean => {
    return speed >= 5 && speed <= 250;
  };

  // Calculate speed using Geolocation API
  const trackSpeed = useCallback(() => {
    if (!isRunning) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const now = Date.now();
          // Convert to km/h for display
          const speedKmh = position.coords.speed * 3.6;

          // Only update metrics if speed is valid
          if (isValidSpeed(speedKmh)) {
            // Update speed metrics
            currentSpeedRef.current = speedKmh;
            if (speedKmh > topSpeedRef.current) {
              topSpeedRef.current = speedKmh;
            }

            // Accumulate for average
            accumulatedSpeedRef.current += speedKmh;
            validSpeedReadingsRef.current += 1;
          }

          // Update elapsedTime (in seconds) since start
          const elapsedTime = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;

          // Calculate average speed - only if we have valid readings
          const averageSpeed = validSpeedReadingsRef.current > 0
            ? accumulatedSpeedRef.current / validSpeedReadingsRef.current
            : 0;

          setData(prevData => ({
            ...prevData,
            currentSpeed: currentSpeedRef.current,
            topSpeed: topSpeedRef.current,
            averageSpeed: averageSpeed,
            elapsedTime
          }));
      },
      (err) => {
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true }
    );
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

    // Get speed data from reference (updated separately by Geolocation)
    const currentSpeed = currentSpeedRef.current;
    const topSpeed = topSpeedRef.current;
    const averageSpeed = validSpeedReadingsRef.current > 0
      ? accumulatedSpeedRef.current / validSpeedReadingsRef.current
      : 0;

    setData({
      x,
      y,
      z,
      totalAcceleration: totalAcc,
      accumulatedAcceleration: accumulatedAccelerationRef.current,
      elapsedTime,
      averageAcceleration: averageAcc,
      currentSpeed,
      topSpeed,
      averageSpeed
    });
  }, [isRunning]);

  // Set up event listeners and intervals
  useEffect(() => {
    let intervalId: number;
    let speedIntervalId: number;

    if (isRunning) {
      // Try to use real accelerometer if available
      if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleRealAccelerometerData);
      }

      // Set up speed tracking using Geolocation
      if ('geolocation' in navigator) {
        // Update speed every 2 seconds
        speedIntervalId = window.setInterval(trackSpeed, 2000);
      }
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleRealAccelerometerData);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (speedIntervalId) {
        clearInterval(speedIntervalId);
      }
    };
  }, [isRunning, frequency, handleRealAccelerometerData, trackSpeed]);

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
