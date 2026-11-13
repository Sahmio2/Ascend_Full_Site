import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/demo/today",
        destination: "/demo/dashboard",
        permanent: false,
      },
      {
        source: "/client/today",
        destination: "/client/dashboard",
        permanent: false,
      },
      {
        source: "/demo/workouts",
        destination: "/demo/workout-logger",
        permanent: false,
      },
      {
        source: "/client/workouts",
        destination: "/client/workout-logger",
        permanent: false,
      },
      {
        source: "/demo/plan",
        destination: "/demo/workout-logger",
        permanent: false,
      },
      {
        source: "/client/plan",
        destination: "/client/workout-logger",
        permanent: false,
      },
      {
        source: "/demo/calculator",
        destination: "/demo/nutrition",
        permanent: false,
      },
      {
        source: "/client/calculator",
        destination: "/client/nutrition",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;


