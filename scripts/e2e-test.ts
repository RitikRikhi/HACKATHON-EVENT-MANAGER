/**
 * Event OS - Comprehensive Microservices End-to-End Integration Test Suite
 * Tests all 8 services via the API Gateway
 */

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';

interface TestResult {
  step: string;
  success: boolean;
  message?: string;
  data?: any;
}

const results: TestResult[] = [];

async function apiRequest(
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
    data = { rawText: await res.text() };
  }

  return { status: res.status, ok: res.ok, data };
}

function logStep(step: string, success: boolean, info?: any) {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} [${step}]`);
  if (info) {
    console.log(`   ${typeof info === 'object' ? JSON.stringify(info, null, 2) : info}`);
  }
  results.push({ step, success, data: info });
}

async function runE2ETests() {
  console.log('=============================================================================');
  console.log('🚀 Starting Event OS Microservices E2E Test Suite');
  console.log(`🌐 Target API Gateway: ${GATEWAY_URL}`);
  console.log('=============================================================================\n');

  try {
    // 1. Gateway Health Check
    console.log('--- Phase 1: Health & Service Discovery ---');
    const health = await apiRequest('/health');
    logStep('Gateway Health Check', health.ok && health.status === 200, health.data);

    const apiIndex = await apiRequest('/');
    logStep('API Discovery Endpoints', apiIndex.ok, apiIndex.data);

    // 2. Auth Flow (Admin Registration & Login)
    console.log('\n--- Phase 2: Authentication & Authorization ---');
    const adminEmail = `admin_${Date.now()}@eventos.test`;
    const userEmail = `attendee_${Date.now()}@eventos.test`;

    const adminReg = await apiRequest('/api/auth/register', 'POST', {
      name: 'Super Admin User',
      email: adminEmail,
      password: 'Password123!',
      role: 'ADMIN',
    });
    logStep('Register Admin User', adminReg.ok, adminReg.data?.message);
    const adminToken = adminReg.data?.data?.token;

    const userReg = await apiRequest('/api/auth/register', 'POST', {
      name: 'John Doe Attendee',
      email: userEmail,
      password: 'Password123!',
      role: 'USER',
    });
    logStep('Register Standard User', userReg.ok, userReg.data?.message);
    const userToken = userReg.data?.data?.token;
    const userId = userReg.data?.data?.user?.id;

    const meCheck = await apiRequest('/api/auth/me', 'GET', undefined, userToken);
    logStep('Verify User Profile (GET /api/auth/me)', meCheck.ok && meCheck.data?.data?.email === userEmail, meCheck.data?.data);

    // 3. Event Service Flow
    console.log('\n--- Phase 3: Event Management ---');
    const createEvent = await apiRequest(
      '/api/events',
      'POST',
      {
        name: 'Tech Horizon Summit 2026',
        description: 'The premier global technology conference.',
        venue: 'Grand Convention Center, Hall A',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        capacity: 500,
        status: 'UPCOMING',
      },
      adminToken
    );
    logStep('Create Event by Admin', createEvent.ok, createEvent.data?.message);
    const eventId = createEvent.data?.data?.id;

    const listEvents = await apiRequest('/api/events');
    logStep('List Events (GET /api/events)', listEvents.ok, `Total events: ${listEvents.data?.data?.total}`);

    // 4. Team Service Flow
    console.log('\n--- Phase 4: Team Operations ---');
    const createTeam = await apiRequest(
      '/api/teams',
      'POST',
      {
        name: 'Technical Operations Team',
        description: 'Manages audiovisuals and stage tech.',
        eventId,
      },
      adminToken
    );
    logStep('Create Event Team', createTeam.ok, createTeam.data?.message);
    const teamId = createTeam.data?.data?.id;

    if (teamId && userId) {
      const addMember = await apiRequest(
        `/api/teams/${teamId}/members`,
        'POST',
        {
          userId,
          role: 'MEMBER',
        },
        adminToken
      );
      logStep('Assign User to Team', addMember.ok, addMember.data?.message);
    }

    // 5. Ticket Service Flow
    console.log('\n--- Phase 5: Ticket Generation & Validation ---');
    const generateTicket = await apiRequest(
      '/api/tickets',
      'POST',
      {
        eventId,
        price: 99.0,
      },
      userToken
    );
    logStep('Generate Event Ticket for User', generateTicket.ok, generateTicket.data?.data?.ticket_code);
    const ticketId = generateTicket.data?.data?.id;
    const ticketCode = generateTicket.data?.data?.ticket_code;

    const validateTicket = await apiRequest(`/api/tickets/${ticketId}/validate`, 'POST');
    logStep('Validate Ticket via REST API', validateTicket.ok && validateTicket.data?.data?.valid === true, validateTicket.data?.message);

    // 6. Check-in Service Flow
    console.log('\n--- Phase 6: Check-in & Attendance ---');
    const checkin = await apiRequest(
      '/api/checkin',
      'POST',
      {
        ticketCode,
        eventId,
        notes: 'VIP attendee check-in at Gate 1',
      },
      adminToken
    );
    logStep('Process Attendee Check-in', checkin.ok, checkin.data?.message);

    // Duplicate Check-in Prevention test
    const duplicateCheckin = await apiRequest(
      '/api/checkin',
      'POST',
      {
        ticketCode,
        eventId,
      },
      adminToken
    );
    logStep('Duplicate Check-in Rejected as Expected', !duplicateCheckin.ok && duplicateCheckin.status === 409, duplicateCheckin.data?.message);

    const attendanceList = await apiRequest(`/api/checkin/event/${eventId}`, 'GET', undefined, adminToken);
    logStep('Retrieve Event Attendance List', attendanceList.ok, `Checked-in attendees: ${attendanceList.data?.data?.total}`);

    // 7. Announcement Service Flow
    console.log('\n--- Phase 7: Community Announcements ---');
    const announcement = await apiRequest(
      '/api/announcements',
      'POST',
      {
        eventId,
        title: 'Keynote Speaker Announced',
        content: 'We are thrilled to announce the keynote speakers for Tech Horizon 2026.',
        priority: 'HIGH',
      },
      adminToken
    );
    logStep('Create Broadcast Announcement by Admin', announcement.ok, announcement.data?.message);

    const listAnnouncements = await apiRequest('/api/announcements');
    logStep('List Announcements', listAnnouncements.ok, `Count: ${listAnnouncements.data?.data?.total}`);

    // 8. Notification Service Flow
    console.log('\n--- Phase 8: Notification Center ---');
    const userNotifications = await apiRequest('/api/notifications', 'GET', undefined, userToken);
    logStep('Retrieve User Notifications', userNotifications.ok, `Received: ${userNotifications.data?.data?.total}`);

    const unreadCount = await apiRequest('/api/notifications/unread-count', 'GET', undefined, userToken);
    logStep('Get Unread Notification Count', unreadCount.ok, unreadCount.data?.data);

    // Summary
    console.log('\n=============================================================================');
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.success).length;
    console.log(`📊 Test Summary: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('=============================================================================\n');
  } catch (error) {
    console.error('Fatal Error running E2E Test Suite:', error);
  }
}

runE2ETests();
