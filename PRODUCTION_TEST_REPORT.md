# Production Test Report

**Generated**: 2025-07-03T22:40:01.777Z
**Total Duration**: 1601ms
**Base URL**: https://1cea5765.qwik-lit-builder-app-7b1.pages.dev

## Summary

- ✅ **Successful**: 4
- ❌ **Failed**: 3
- 📊 **Success Rate**: 57.1%

## Endpoint Results

✅ **GET /api/health**
  - Status: 200
  - Response Time: 70ms
  - Expected: 200
  - Response: `{"status":"ok","timestamp":"2025-07-03T22:40:00.195Z","message":"Health check successful"}...`

✅ **GET /api/auth/status**
  - Status: 200
  - Response Time: 14ms
  - Expected: 200
  - Response: `{"authenticated":false,"user":null,"message":"Not authenticated"}...`

✅ **GET /**
  - Status: 404
  - Response Time: 20ms
  - Expected: [200,404]

✅ **GET /login**
  - Status: 404
  - Response Time: 22ms
  - Expected: [200,404]

❌ **GET /api/content/pages**
  - Status: 404
  - Response Time: 30ms
  - Expected: [200,401]

❌ **GET /api/dashboard/stats**
  - Status: 404
  - Response Time: 21ms
  - Expected: [200,401]

❌ **POST /api/upload**
  - Status: 405
  - Response Time: 13ms
  - Expected: 401

## Performance Analysis

- **Average Response Time**: 27.1ms
- **Fastest Endpoint**: 13ms
- **Slowest Endpoint**: 70ms

