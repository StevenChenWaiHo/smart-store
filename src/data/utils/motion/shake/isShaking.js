export default function isShaking (accelerometerData) {
    // You can customize the shake detection criteria based on your needs.
    const threshold = 10.0; // Adjust this threshold as needed.
    const { x, y, z } = accelerometerData;
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    return acceleration > threshold;
  };
