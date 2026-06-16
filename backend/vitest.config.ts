import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['clover', 'text'],
      reportsDirectory: './coverage'
    },
    reporters: ['default', 'junit'],
    outputFile: 'coverage/junit.xml'
  }
})