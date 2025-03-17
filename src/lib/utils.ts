import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"
import {AccelerometerData} from "@/hooks/useAccelerometer.tsx";

const MIN_SPEED = 5;
const MAX_SPEED = 250;

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function calculateScore(accelerometerData: AccelerometerData): number {
    const {averageAcceleration} = accelerometerData;
    const vehicleAcceleration = Math.min(averageAcceleration, 100);

    if(vehicleAcceleration <= 0)
        return 0;

    return 100 - vehicleAcceleration;
}

export function isValidSpeed(speed: number) {
    return speed >= MIN_SPEED && speed <= MAX_SPEED;
}

export function normalizeSpeed(speed: number) {
    return (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
}
