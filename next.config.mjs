/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/*': [
      './data/**/*',
      './content/**/*'
    ]
  }
};

export default nextConfig;
