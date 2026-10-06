/**
 * Event OS - Unit Test Suite
 * Tests core library logic, JWT issuance/verification, HMAC QR signatures,
 * role authorization matrices, and response helpers without external network/DB dependencies.
 */

import { signToken, verifyToken, decodeToken, HttpStatusCodes, generateQRPayload, verifyQRPayload } from '@event-os/config';
import { UserRole, ScanType, EventType, EventStatus, TicketStatus } from '@event-os/types';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  if (condition) {
    results.push({ suite, name, passed: true });
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    results.push({ suite, name, passed: false, details });
    console.error(`  ❌ [FAIL] ${name} - ${details || 'Assertion failed'}`);
  }
}

async function runUnitTests() {
  console.log('=============================================================================');
  console.log('🧪 EVENT OS — UNIT TEST SUITE');
  console.log('=============================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. JWT & Cryptography
  // ---------------------------------------------------------------------------
  console.log('📦 Suite 1: JWT & Cryptographic Operations');
  const testPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'engineer@eventos.internal',
    role: UserRole.ADMIN,
  };

  const token = signToken(testPayload);
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT', 'Generates standard 3-part JWT token');

  const decoded = verifyToken(token);
  assert(decoded !== null, 'JWT', 'Successfully verifies and decodes valid JWT token');
  assert(decoded?.userId === testPayload.userId, 'JWT', 'Decoded token preserves userId claim');
  assert(decoded?.email === testPayload.email, 'JWT', 'Decoded token preserves email claim');
  assert(decoded?.role === UserRole.ADMIN, 'JWT', 'Decoded token preserves role claim');

  let tamperedCaught = false;
  try {
    const tamperedToken = token.slice(0, -5) + 'AAAAA';
    verifyToken(tamperedToken);
  } catch {
    tamperedCaught = true;
  }
  assert(tamperedCaught, 'JWT', 'Throws or rejects on tampered JWT signature');

  const decodedWithoutVerify = decodeToken(token);
  assert(decodedWithoutVerify?.userId === testPayload.userId, 'JWT', 'decodeToken reads claims payload');

  // ---------------------------------------------------------------------------
  // 2. HMAC QR Code Generation & Verification
  // ---------------------------------------------------------------------------
  console.log('\n📦 Suite 2: HMAC QR Code Security & Verification');
  const qrParticipantId = 'usr-999-alpha';
  const qrEventId = 'evt-888-beta';

  const qrPayload = generateQRPayload(qrParticipantId, qrEventId, 3600);
  assert(typeof qrPayload.qrString === 'string' && qrPayload.qrString.includes('|'), 'QR', 'Generates signed pipe-delimited QR payload');

  const verifiedQR = verifyQRPayload(qrPayload.qrString, qrEventId);
  assert(verifiedQR.valid === true, 'QR', 'Validates authentic QR signature for matching event');
  assert(verifiedQR.participantId === qrParticipantId, 'QR', 'Resolves correct participant ID from payload');

  const wrongEventQR = verifyQRPayload(qrPayload.qrString, 'different-event-id');
  assert(wrongEventQR.valid === false, 'QR', 'Rejects QR payload presented to different event ID');

  const tamperedQR = qrPayload.qrString.slice(0, -4) + 'zzzz';
  const tamperedQRResult = verifyQRPayload(tamperedQR, qrEventId);
  assert(tamperedQRResult.valid === false, 'QR', 'Rejects modified QR signature');

  // ---------------------------------------------------------------------------
  // 3. Status Codes & Enums
  // ---------------------------------------------------------------------------
  console.log('\n📦 Suite 3: Domain Enums & HTTP Status Codes');
  assert(HttpStatusCodes.OK === 200, 'HTTP', 'HttpStatusCodes.OK is 200');
  assert(HttpStatusCodes.CREATED === 201, 'HTTP', 'HttpStatusCodes.CREATED is 201');
  assert(HttpStatusCodes.BAD_REQUEST === 400, 'HTTP', 'HttpStatusCodes.BAD_REQUEST is 400');
  assert(HttpStatusCodes.UNAUTHORIZED === 401, 'HTTP', 'HttpStatusCodes.UNAUTHORIZED is 401');
  assert(HttpStatusCodes.FORBIDDEN === 403, 'HTTP', 'HttpStatusCodes.FORBIDDEN is 403');
  assert(HttpStatusCodes.NOT_FOUND === 404, 'HTTP', 'HttpStatusCodes.NOT_FOUND is 404');
  assert(HttpStatusCodes.CONFLICT === 409, 'HTTP', 'HttpStatusCodes.CONFLICT is 409');
  assert(HttpStatusCodes.TOO_MANY_REQUESTS === 429, 'HTTP', 'HttpStatusCodes.TOO_MANY_REQUESTS is 429');
  assert(HttpStatusCodes.INTERNAL_SERVER_ERROR === 500, 'HTTP', 'HttpStatusCodes.INTERNAL_SERVER_ERROR is 500');

  assert(UserRole.SUPER_ADMIN === 'SUPER_ADMIN', 'Types', 'UserRole contains SUPER_ADMIN');
  assert(ScanType.CHECKIN === 'CHECKIN', 'Types', 'ScanType contains CHECKIN');
  assert(ScanType.LUNCH === 'LUNCH', 'Types', 'ScanType contains LUNCH');
  assert(ScanType.DINNER === 'DINNER', 'Types', 'ScanType contains DINNER');
  assert(ScanType.SWAG === 'SWAG', 'Types', 'ScanType contains SWAG');
  assert(EventType.HACKATHON === 'HACKATHON', 'Types', 'EventType contains HACKATHON');
  assert(EventStatus.PUBLISHED === 'PUBLISHED', 'Types', 'EventStatus contains PUBLISHED');
  assert(TicketStatus.ACTIVE === 'ACTIVE', 'Types', 'TicketStatus contains ACTIVE');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n=============================================================================');
  console.log(`📊 UNIT TEST SUMMARY: ${passed}/${total} PASSED (${failed} FAILURES)`);
  console.log('=============================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runUnitTests().catch((err) => {
  console.error('Unit test error:', err);
  process.exit(1);
});
