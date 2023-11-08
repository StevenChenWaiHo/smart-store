export default function isShaking (accelerometerData) {
    const threshold = 4.0;
    const { x, y, z } = accelerometerData;
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    return acceleration > threshold;
  };
