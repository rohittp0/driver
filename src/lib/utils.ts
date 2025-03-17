import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {AccelerometerData} from "@/hooks/useAccelerometer.tsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateScore(accelerometerData:  AccelerometerData): number {
    const g = 9.8;
    const max_acceleration = 14.5 - g; // Tesla maxes at 13.4
    const {averageAcceleration, averageSpeed, topSpeed} = accelerometerData;
    const vehicleAcceleration = averageAcceleration - g;

    return 100 - (Math.abs(vehicleAcceleration) / max_acceleration) * 100;
}
