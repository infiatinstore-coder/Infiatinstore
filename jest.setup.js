import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
