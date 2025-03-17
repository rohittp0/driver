import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"
import {AccelerometerData} from "@/hooks/useAccelerometer.tsx";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function calculateScore(accelerometerData: AccelerometerData): number {
    const {averageAcceleration} = accelerometerData;
    const vehicleAcceleration = Math.min(averageAcceleration * 100, 100);

    return Math.abs(100 - vehicleAcceleration);
}
