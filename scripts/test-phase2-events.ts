/**
 * Event OS — Phase 2 Final Event Service & Registration Test Suite
 */

import jwt from 'jsonwebtoken';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';

interface TestStep {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  problem?: string;
  fix?: string;
  details?: any;
}

const results: TestStep[] = [];

async function api(
  endpoint: string,
  method = 'GET',
  body?: any,
  token?: string
): Promise<{ status: number; ok: boolean; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = { raw: await res.text() };
  }

  return { status: res.status, ok: res.ok, data };
}

function logTest(
  name: string,
  expected: string,
  actual: string,
  passed: boolean,
  problem?: string,
  fix?: string,
  details?: any
) {
  const badge = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${badge} | ${name}`);
  console.log(`   Expected: ${expected}`);
  console.log(`   Actual:   ${actual}`);
  if (!passed && problem) {
    console.log(`   Problem:  ${problem}`);
    console.log(`   Fix:      ${fix}`);
  }
  console.log('-----------------------------------------------------------------------------');
  results.push({ name, expected, actual, passed, problem, fix, details });
}

async function runPhase2Tests() {
  console.log('=============================================================================');
  console.log('🚀 EVENT OS — PHASE 2 EVENT SERVICE & REGISTRATION TEST SUITE');
  console.log(`🎯 Target API Gateway: ${GATEWAY_URL}`);
  console.log('=============================================================================\n');

  const ts = Date.now();
  const adminEmail = `admin_p2_${ts}@eventos.test`;
  const user1Email = `participant1_${ts}@eventos.test`;
  const user2Email = `participant2_${ts}@eventos.test`;
  const pwd = 'Password123!';

  // 1. Setup Test Users
  const adminReg = await api('/api/auth/register', 'POST', {
    name: 'Admin Organizer',
    email: adminEmail,
    password: pwd,
    role: 'ADMIN',
  });
  const adminToken = adminReg.data?.data?.token;

  const user1Reg = await api('/api/auth/register', 'POST', {
    name: 'Alice Participant',
    email: user1Email,
    password: pwd,
    role: 'PARTICIPANT',
  });
  const user1Token = user1Reg.data?.data?.token;

  const user2Reg = await api('/api/auth/register', 'POST', {
    name: 'Bob Participant',
    email: user2Email,
    password: pwd,
    role: 'PARTICIPANT',
  });
  const user2Token = user2Reg.data?.data?.token;

  // ---------------------------------------------------------------------------
  // TEST 1: Service Setup & Health Check
  // ---------------------------------------------------------------------------
  const healthRes = await api('/health');
  const healthPassed = healthRes.status === 200 && healthRes.data?.data?.status === 'healthy';
  logTest(
    'Service Setup & Gateway Health',
    'Status 200 with status=healthy and services online',
    `Status ${healthRes.status}, data.status=${healthRes.data?.data?.status}`,
    healthPassed
  );

  // ---------------------------------------------------------------------------
  // TEST 2: Create Event as ADMIN
  // ---------------------------------------------------------------------------
  const createDraftRes = await api(
    '/api/events',
    'POST',
    {
      name: 'Global AI Hackathon 2026',
      description: '48-hour global AI competition.',
      eventType: 'HACKATHON',
      venue: 'Metropolis Convention Center',
      startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      registrationDeadline: new Date(Date.now() + 86400000 * 4).toISOString(),
      capacity: 100,
      status: 'DRAFT',
    },
    adminToken
  );

  const eventId = createDraftRes.data?.data?.id;
  const createPassed =
    createDraftRes.status === 201 &&
    createDraftRes.data?.data?.name === 'Global AI Hackathon 2026' &&
    createDraftRes.data?.data?.event_type === 'HACKATHON' &&
    createDraftRes.data?.data?.status === 'DRAFT';

  logTest(
    'Create Event as ADMIN (POST /api/events)',
    'Status 201 Created with status DRAFT and eventType HACKATHON',
    `Status ${createDraftRes.status}, id=${eventId}, status=${createDraftRes.data?.data?.status}`,
    createPassed,
    createPassed ? undefined : 'Failed to create event as admin',
    createPassed ? undefined : 'Check createEvent in event.service.ts',
    createDraftRes.data
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Create Event as PARTICIPANT (Must be 403 Forbidden)
  // ---------------------------------------------------------------------------
  const participantCreateRes = await api(
    '/api/events',
    'POST',
    {
      name: 'Unauthorized Event',
      venue: 'Secret Hall',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      capacity: 50,
    },
    user1Token
  );

  const participantBlocked = participantCreateRes.status === 403;
  logTest(
    'Create Event as PARTICIPANT (POST /api/events)',
    'Status 403 Forbidden',
    `Status ${participantCreateRes.status} (${participantCreateRes.data?.error || participantCreateRes.data?.message})`,
    participantBlocked,
    participantBlocked ? undefined : 'Participant was allowed to create an event',
    participantBlocked ? undefined : 'Check authorizeRoles on POST /api/events route'
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Create Invalid Event (Bad input validation)
  // ---------------------------------------------------------------------------
  const invalidDateRes = await api(
    '/api/events',
    'POST',
    {
      name: 'Invalid Event',
      venue: 'Hall',
      startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 2).toISOString(), // End before start
      capacity: 0, // Invalid capacity
      eventType: 'INVALID_TYPE', // Invalid eventType
    },
    adminToken
  );

  const invalidBlocked = invalidDateRes.status === 400;
  logTest(
    'Create Invalid Event Input Validation',
    'Status 400 Bad Request on invalid dates, negative capacity, or unknown eventType',
    `Status ${invalidDateRes.status} (${invalidDateRes.data?.error || invalidDateRes.data?.message})`,
    invalidBlocked
  );

  // ---------------------------------------------------------------------------
  // TEST 5: Get All Events & Filters
  // ---------------------------------------------------------------------------
  const getEventsRes = await api('/api/events?page=1&limit=10');
  const getEventsPassed =
    getEventsRes.status === 200 &&
    Array.isArray(getEventsRes.data?.data?.items) &&
    typeof getEventsRes.data?.data?.total === 'number';

  logTest(
    'Get Events List with Pagination (GET /api/events)',
    'Status 200 with paginated items array and total count',
    `Status ${getEventsRes.status}, itemsCount=${getEventsRes.data?.data?.items?.length}, total=${getEventsRes.data?.data?.total}`,
    getEventsPassed
  );

  // Filter by eventType
  const filterTypeRes = await api('/api/events?eventType=HACKATHON');
  const filterTypePassed =
    filterTypeRes.status === 200 &&
    filterTypeRes.data?.data?.items.every((e: any) => e.event_type === 'HACKATHON');

  logTest(
    'Filter Events by EventType (GET /api/events?eventType=HACKATHON)',
    'Status 200 with only matching event types returned',
    `Status ${filterTypeRes.status}, count=${filterTypeRes.data?.data?.items?.length}`,
    filterTypePassed
  );

  // ---------------------------------------------------------------------------
  // TEST 6: Get Event by ID
  // ---------------------------------------------------------------------------
  const getByIdRes = await api(`/api/events/${eventId}`, 'GET', undefined, user1Token);
  const getByIdPassed =
    getByIdRes.status === 200 &&
    getByIdRes.data?.data?.id === eventId &&
    typeof getByIdRes.data?.data?.registered_count === 'number' &&
    typeof getByIdRes.data?.data?.is_user_registered === 'boolean';

  logTest(
    'Get Event by ID (GET /api/events/:id)',
    'Status 200 with event details, registered_count and is_user_registered',
    `Status ${getByIdRes.status}, registered_count=${getByIdRes.data?.data?.registered_count}, is_user_registered=${getByIdRes.data?.data?.is_user_registered}`,
    getByIdPassed
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Get Invalid Event by ID
  // ---------------------------------------------------------------------------
  const notFoundRes = await api('/api/events/00000000-0000-0000-0000-000000000000');
  const notFoundPassed = notFoundRes.status === 404;
  logTest(
    'Get Non-Existent Event by ID',
    'Status 404 Not Found',
    `Status ${notFoundRes.status} (${notFoundRes.data?.error || notFoundRes.data?.message})`,
    notFoundPassed
  );

  // ---------------------------------------------------------------------------
  // TEST 8: Update Event as ADMIN & Reject Protected Fields
  // ---------------------------------------------------------------------------
  const updateRes = await api(
    `/api/events/${eventId}`,
    'PUT',
    {
      name: 'Global AI Hackathon 2026 (Updated)',
      capacity: 150,
    },
    adminToken
  );

  const updatePassed =
    updateRes.status === 200 &&
    updateRes.data?.data?.name === 'Global AI Hackathon 2026 (Updated)' &&
    updateRes.data?.data?.capacity === 150;

  // Test participant update (Forbidden)
  const participantUpdateRes = await api(
    `/api/events/${eventId}`,
    'PUT',
    { name: 'Hacked Name' },
    user1Token
  );
  const participantUpdateBlocked = participantUpdateRes.status === 403;

  logTest(
    'Update Event (PUT /api/events/:id)',
    'ADMIN update returns 200; PARTICIPANT update blocked with 403',
    `AdminStatus=${updateRes.status}, ParticipantStatus=${participantUpdateRes.status}`,
    updatePassed && participantUpdateBlocked
  );

  // ---------------------------------------------------------------------------
  // TEST 9: Publish Draft Event
  // ---------------------------------------------------------------------------
  const publishRes = await api(`/api/events/${eventId}/publish`, 'POST', {}, adminToken);
  const publishPassed =
    publishRes.status === 200 && publishRes.data?.data?.status === 'PUBLISHED';

  logTest(
    'Publish Draft Event (POST /api/events/:id/publish)',
    'Status 200, status changes from DRAFT to PUBLISHED',
    `Status ${publishRes.status}, newStatus=${publishRes.data?.data?.status}`,
    publishPassed
  );

  // Publish already published event should reject
  const rePublishRes = await api(`/api/events/${eventId}/publish`, 'POST', {}, adminToken);
  const rePublishRejected = rePublishRes.status === 400;

  logTest(
    'Reject Re-Publishing Already Published Event',
    'Status 400 Bad Request',
    `Status ${rePublishRes.status} (${rePublishRes.data?.error || rePublishRes.data?.message})`,
    rePublishRejected
  );

  // ---------------------------------------------------------------------------
  // TEST 10: Invalid Lifecycle Transition (e.g. PUBLISHED -> DRAFT)
  // ---------------------------------------------------------------------------
  const invalidTransitionRes = await api(
    `/api/events/${eventId}`,
    'PUT',
    { status: 'DRAFT' },
    adminToken
  );
  const transitionRejected = invalidTransitionRes.status === 400;

  logTest(
    'Reject Invalid Lifecycle Transition (PUBLISHED -> DRAFT)',
    'Status 400 Bad Request on illegal status transition',
    `Status ${invalidTransitionRes.status} (${invalidTransitionRes.data?.error || invalidTransitionRes.data?.message})`,
    transitionRejected
  );

  // ---------------------------------------------------------------------------
  // TEST 11: Participant Registration Flow
  // ---------------------------------------------------------------------------
  // 11a. User 1 registers for published event
  const reg1Res = await api(`/api/events/${eventId}/register`, 'POST', {}, user1Token);
  const reg1Passed = reg1Res.status === 201 && reg1Res.data?.data?.status === 'REGISTERED';

  logTest(
    'Participant Event Registration (POST /api/events/:id/register)',
    'Status 201 Created with status REGISTERED',
    `Status ${reg1Res.status}, regStatus=${reg1Res.data?.data?.status}`,
    reg1Passed
  );

  // 11b. Duplicate Registration check
  const dupRegRes = await api(`/api/events/${eventId}/register`, 'POST', {}, user1Token);
  const dupRegBlocked = dupRegRes.status === 409;

  logTest(
    'Duplicate Registration Prevention',
    'Status 409 Conflict when participant tries to register twice',
    `Status ${dupRegRes.status} (${dupRegRes.data?.error || dupRegRes.data?.message})`,
    dupRegBlocked
  );

  // 11c. User 1 views their registration
  const getRegRes = await api(`/api/events/${eventId}/registration`, 'GET', undefined, user1Token);
  const getRegPassed =
    getRegRes.status === 200 && getRegRes.data?.data?.isRegistered === true;

  logTest(
    'Get Own Registration Status (GET /api/events/:id/registration)',
    'Status 200 with isRegistered=true and registration details',
    `Status ${getRegRes.status}, isRegistered=${getRegRes.data?.data?.isRegistered}`,
    getRegPassed
  );

  // 11d. User 2 also registers
  const reg2Res = await api(`/api/events/${eventId}/register`, 'POST', {}, user2Token);
  const reg2Passed = reg2Res.status === 201;

  logTest(
    'Second Participant Registration',
    'Status 201 Created for different participant',
    `Status ${reg2Res.status}`,
    reg2Passed
  );

  // ---------------------------------------------------------------------------
  // TEST 12: Capacity & Registration Deadline Validation Tests
  // ---------------------------------------------------------------------------
  // Create a limited capacity event (capacity = 1)
  const fullCapEventRes = await api(
    '/api/events',
    'POST',
    {
      name: 'Micro Workshop (Capacity 1)',
      venue: 'Room 101',
      startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      capacity: 1,
      status: 'PUBLISHED',
    },
    adminToken
  );
  const fullCapEventId = fullCapEventRes.data?.data?.id;

  // User 1 takes the 1 spot
  await api(`/api/events/${fullCapEventId}/register`, 'POST', {}, user1Token);

  // User 2 attempts to register for full event
  const capExceededRes = await api(`/api/events/${fullCapEventId}/register`, 'POST', {}, user2Token);
  const capBlocked = capExceededRes.status === 409 || capExceededRes.status === 400;

  logTest(
    'Capacity Full Enforcement',
    'Reject registration when event capacity is reached (409 / 400)',
    `Status ${capExceededRes.status} (${capExceededRes.data?.error || capExceededRes.data?.message})`,
    capBlocked
  );

  // Create an event with expired registration deadline
  const expiredDeadlineEventRes = await api(
    '/api/events',
    'POST',
    {
      name: 'Past Deadline Conference',
      venue: 'Hall C',
      startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      registrationDeadline: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      capacity: 100,
      status: 'PUBLISHED',
    },
    adminToken
  );
  const expiredDeadlineEventId = expiredDeadlineEventRes.data?.data?.id;

  const expiredRegRes = await api(
    `/api/events/${expiredDeadlineEventId}/register`,
    'POST',
    {},
    user1Token
  );
  const deadlineBlocked = expiredRegRes.status === 400;

  logTest(
    'Registration Deadline Enforcement',
    'Status 400 Bad Request when registering after deadline has passed',
    `Status ${expiredRegRes.status} (${expiredRegRes.data?.error || expiredRegRes.data?.message})`,
    deadlineBlocked
  );

  // ---------------------------------------------------------------------------
  // TEST 13: View Participants List
  // ---------------------------------------------------------------------------
  const participantsRes = await api(
    `/api/events/${eventId}/participants`,
    'GET',
    undefined,
    adminToken
  );
  const participantsPassed =
    participantsRes.status === 200 &&
    Array.isArray(participantsRes.data?.data?.items) &&
    participantsRes.data?.data?.items.length >= 2 &&
    !('password' in (participantsRes.data?.data?.items[0]?.user || {}));

  // Non-admin participant should be 403 Forbidden
  const participantForbiddenRes = await api(
    `/api/events/${eventId}/participants`,
    'GET',
    undefined,
    user1Token
  );
  const participantParticipantsBlocked = participantForbiddenRes.status === 403;

  logTest(
    'View Event Participants (GET /api/events/:id/participants)',
    'ADMIN returns 200 with participant list; PARTICIPANT blocked with 403 Forbidden',
    `AdminStatus=${participantsRes.status}, Count=${participantsRes.data?.data?.items?.length}, ParticipantStatus=${participantForbiddenRes.status}`,
    participantsPassed && participantParticipantsBlocked
  );

  // ---------------------------------------------------------------------------
  // TEST 14: Cancel Registration Flow
  // ---------------------------------------------------------------------------
  const cancelRegRes = await api(`/api/events/${eventId}/register`, 'DELETE', {}, user1Token);
  const cancelRegPassed = cancelRegRes.status === 200 && cancelRegRes.data?.data?.cancelled === true;

  logTest(
    'Cancel Registration (DELETE /api/events/:id/register)',
    'Status 200 with cancelled=true',
    `Status ${cancelRegRes.status}, cancelled=${cancelRegRes.data?.data?.cancelled}`,
    cancelRegPassed
  );

  // ---------------------------------------------------------------------------
  // TEST 15: Event Cancellation & Registration Block on Cancelled Event
  // ---------------------------------------------------------------------------
  const cancelEventRes = await api(`/api/events/${eventId}`, 'DELETE', undefined, adminToken);
  const cancelEventPassed =
    cancelEventRes.status === 200 && cancelEventRes.data?.data?.cancelled === true;

  logTest(
    'Cancel Active Event (DELETE /api/events/:id)',
    'Status 200 with soft-cancellation when registrations exist',
    `Status ${cancelEventRes.status}, cancelled=${cancelEventRes.data?.data?.cancelled}`,
    cancelEventPassed
  );

  // Registration on cancelled event should reject with 400
  const regCancelledEventRes = await api(
    `/api/events/${eventId}/register`,
    'POST',
    {},
    user1Token
  );
  const regCancelledBlocked = regCancelledEventRes.status === 400;

  logTest(
    'Reject Registration on Cancelled Event',
    'Status 400 Bad Request',
    `Status ${regCancelledEventRes.status} (${regCancelledEventRes.data?.error || regCancelledEventRes.data?.message})`,
    regCancelledBlocked
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log('\n=============================================================================');
  console.log(`📊 PHASE 2 TEST SUMMARY: ${passedCount}/${total} PASSED (${failedCount} FAILURES)`);
  console.log('=============================================================================\n');

  return { passedCount, total, failedCount, results };
}

runPhase2Tests();
