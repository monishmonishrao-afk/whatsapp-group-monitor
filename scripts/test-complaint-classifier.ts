
import { detectComplaint } from '../src/whatsapp/activity/complaint-detector.js'

const testMessages = [
  {
    message: 'Water is leaking from the ceiling in Flat A-302.',
    expected: true,
    description: 'Clear water leakage complaint',
  },
  {
    message: 'The lift has stopped working in Tower B.',
    expected: true,
    description: 'Lift breakdown',
  },
  {
    message: 'There is no water supply in our building since morning.',
    expected: true,
    description: 'Water supply problem',
  },
  {
    message: 'Could someone please fix the lift? It has been out of service since yesterday.',
    expected: true,
    description: 'Politely worded complaint',
  },
  {
    message: 'There is a burning smell coming from the electrical panel near the lobby.',
    expected: true,
    description: 'Urgent electrical safety issue',
  },
  {
    message: 'Water is overflowing from the common area pipe. Please attend to it.',
    expected: true,
    description: 'Common area maintenance complaint',
  },
  {
    message: 'The garbage has not been collected for three days.',
    expected: true,
    description: 'Housekeeping complaint without flat number',
  },
  {
    message: 'Good morning everyone!',
    expected: false,
    description: 'Greeting',
  },
  {
    message: 'Thank you for arranging the cleaning.',
    expected: false,
    description: 'Thank-you message',
  },
  {
    message: 'Happy Diwali to everyone!',
    expected: false,
    description: 'Festival greeting',
  },
  {
    message: 'Does anyone know what time the clubhouse closes?',
    expected: false,
    description: 'General question',
  },
  {
    message: 'My neighbour complained about the lift yesterday.',
    expected: false,
    description: 'Mention of another complaint without reporting a current problem',
  },
  {
    message: 'Please look into this.',
    expected: false,
    description: 'Vague message without a reported problem',
  },
]

async function main() {
  let passed = 0

  console.log('\nStarting complaint classifier tests...\n')

  for (const test of testMessages) {
    try {
      const result = await detectComplaint(test.message)
      const actual = result !== null
      const success = actual === test.expected

      if (success) passed++

      console.log(`${success ? 'PASS' : 'FAIL'}: ${test.description}`)
      console.log(`  Message: ${test.message}`)
      console.log(`  Expected complaint: ${test.expected}`)
      console.log(`  Actual complaint: ${actual}`)

      if (result) {
        console.log(`  Category: ${result.category}`)
        console.log(`  Priority: ${result.priority}`)
        console.log(`  Confidence: ${result.confidence}%`)
        console.log(`  Summary: ${result.summary}`)
      }

      console.log('')
    } catch (error) {
      console.log(`ERROR: ${test.description}`)
      console.error(error)
      console.log('')
    }
  }

  console.log('-----------------------------------')
  console.log(`RESULT: ${passed}/${testMessages.length} tests passed`)
  console.log('-----------------------------------')
}

main().catch(console.error)
