import dotenv from 'dotenv';
dotenv.config();

const GATEWAY_URL = 'http://localhost:8000';

interface UserSession {
  id: string;
  name: string;
  email: string;
  token: string;
}

let adminUser: UserSession;
let leadUser: UserSession;
let member1User: UserSession;
let member2User: UserSession;
let eventId: string;
let teamId: string;
let teamCode: string;
let inviteToken: string;

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    if (details) console.error('   Details:', details);
    testsFailed++;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${GATEWAY_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  return { status: response.status, data: json };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING PHASE 3 — TEAM SERVICE AUTOMATED TESTS');
  console.log('======================================================\n');

  const ts = Date.now();

  // ---------------------------------------------------------------------------
  // 1. SETUP USERS
  // ---------------------------------------------------------------------------
  console.log('--- 1. Setting up Users ---');

  // Admin
  const adminRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Team Admin',
      email: `admin_team_${ts}@eventos.com`,
      password: 'AdminPassword123!',
      role: 'ADMIN',
    }),
  });
  assert(adminRes.status === 201 && adminRes.data.data.token, 'Register Admin User');
  adminUser = {
    id: adminRes.data.data.user.id,
    name: adminRes.data.data.user.name,
    email: adminRes.data.data.user.email,
    token: adminRes.data.data.token,
  };

  // Participant 1 (Team Lead)
  const leadRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Alice Leader',
      email: `alice_lead_${ts}@eventos.com`,
      password: 'LeadPassword123!',
    }),
  });
  assert(leadRes.status === 201 && leadRes.data.data.token, 'Register Lead User (Alice)');
  leadUser = {
    id: leadRes.data.data.user.id,
    name: leadRes.data.data.user.name,
    email: leadRes.data.data.user.email,
    token: leadRes.data.data.token,
  };

  // Participant 2 (Code Applicant)
  const mem1Res = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bob Joiner',
      email: `bob_join_${ts}@eventos.com`,
      password: 'BobPassword123!',
    }),
  });
  assert(mem1Res.status === 201 && mem1Res.data.data.token, 'Register Member 1 (Bob)');
  member1User = {
    id: mem1Res.data.data.user.id,
    name: mem1Res.data.data.user.name,
    email: mem1Res.data.data.user.email,
    token: mem1Res.data.data.token,
  };

  // Participant 3 (Invite Link Applicant)
  const mem2Res = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Charlie Invitee',
      email: `charlie_invite_${ts}@eventos.com`,
      password: 'CharliePassword123!',
    }),
  });
  assert(mem2Res.status === 201 && mem2Res.data.data.token, 'Register Member 2 (Charlie)');
  member2User = {
    id: mem2Res.data.data.user.id,
    name: mem2Res.data.data.user.name,
    email: mem2Res.data.data.user.email,
    token: mem2Res.data.data.token,
  };

  // ---------------------------------------------------------------------------
  // 2. CREATE EVENT & PUBLISH
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Setting up Event ---');
  const now = new Date();
  const startDate = new Date(now.getTime() + 7 * 86400000).toISOString();
  const endDate = new Date(now.getTime() + 9 * 86400000).toISOString();

  const eventRes = await request('/api/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminUser.token}` },
    body: JSON.stringify({
      name: `Hackathon Hack ${ts}`,
      description: 'Team Hackathon Event for Phase 3 Testing',
      eventType: 'HACKATHON',
      venue: 'Tech Auditorium',
      startDate,
      endDate,
      capacity: 50,
      status: 'PUBLISHED',
    }),
  });
  assert(eventRes.status === 201 && eventRes.data.data.id, 'Create & Publish Event', eventRes.data);
  eventId = eventRes.data.data.id;

  // ---------------------------------------------------------------------------
  // 3. TEAM CREATION & EVENT REGISTRATION REQUIREMENT
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Team Creation & Registration Requirement ---');

  // Attempt to create team BEFORE registering for event
  const unregTeamRes = await request('/api/teams', {
    method: 'POST',
    headers: { Authorization: `Bearer ${leadUser.token}` },
    body: JSON.stringify({
      name: 'Cyber Panthers',
      description: 'Unregistered attempt',
      eventId,
    }),
  });
  assert(
    unregTeamRes.status === 400,
    'Reject team creation if creator is not registered for event',
    unregTeamRes.data
  );

  // Register Alice (Team Lead) for the event
  const regLeadRes = await request(`/api/events/${eventId}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${leadUser.token}` },
  });
  assert(regLeadRes.status === 201, 'Alice registers for event', regLeadRes.data);

  // Create team successfully
  const createTeamRes = await request('/api/teams', {
    method: 'POST',
    headers: { Authorization: `Bearer ${leadUser.token}` },
    body: JSON.stringify({
      name: 'Cyber Panthers',
      description: 'The elite hackathon squad',
      eventId,
    }),
  });
  assert(
    createTeamRes.status === 201 && createTeamRes.data.data.team_code,
    'Create Team with auto-generated team_code & TEAM_LEAD role',
    createTeamRes.data
  );
  teamId = createTeamRes.data.data.id;
  teamCode = createTeamRes.data.data.team_code;
  console.log(`   Generated Team Code: ${teamCode}, Team ID: ${teamId}`);

  // Prevent multiple teams in same event
  const dupTeamRes = await request('/api/teams', {
    method: 'POST',
    headers: { Authorization: `Bearer ${leadUser.token}` },
    body: JSON.stringify({
      name: 'Cyber Panthers 2',
      eventId,
    }),
  });
  assert(dupTeamRes.status === 409, 'Reject creating duplicate team in same event', dupTeamRes.data);

  // ---------------------------------------------------------------------------
  // 4. METHOD 1: JOIN TEAM VIA TEAM CODE
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Method 1: Join Team via Team Code ---');

  // Bob attempts to join with code BEFORE registering for the event
  const bobUnregRes = await request('/api/teams/join', {
    method: 'POST',
    headers: { Authorization: `Bearer ${member1User.token}` },
    body: JSON.stringify({ teamCode }),
  });
  assert(
    bobUnregRes.status === 400,
    'Reject join by code if user is not registered for event',
    bobUnregRes.data
  );

  // Bob registers for the event
  const regBobRes = await request(`/api/events/${eventId}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${member1User.token}` },
  });
  assert(regBobRes.status === 201, 'Bob registers for event', regBobRes.data);

  // Bob requests to join via code
  const bobJoinRes = await request('/api/teams/join', {
    method: 'POST',
    headers: { Authorization: `Bearer ${member1User.token}` },
    body: JSON.stringify({ teamCode }),
  });
  assert(
    bobJoinRes.status === 200 && bobJoinRes.data.data.request.status === 'PENDING',
    'Submit Join Request via Team Code (status is PENDING)',
    bobJoinRes.data
  );
  const bobRequestId = bobJoinRes.data.data.request.id;

  // Verify Bob is NOT yet a member
  const checkTeamRes1 = await request(`/api/teams/${teamId}`);
  assert(
    checkTeamRes1.data.data.members.length === 1,
    'User is NOT a member before Team Lead approval',
    checkTeamRes1.data.data.members
  );

  // Alice (Team Lead) lists join requests
  const listRequestsRes = await request(`/api/teams/${teamId}/join-requests`, {
    headers: { Authorization: `Bearer ${leadUser.token}` },
  });
  assert(
    listRequestsRes.status === 200 && listRequestsRes.data.data.length >= 1,
    'Team Lead can view pending join requests',
    listRequestsRes.data
  );

  // Alice accepts Bob's request
  const acceptBobRes = await request(`/api/teams/${teamId}/join-requests/${bobRequestId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${leadUser.token}` },
  });
  assert(
    acceptBobRes.status === 200 && acceptBobRes.data.data.request.status === 'ACCEPTED',
    'Team Lead accepts Bob join request',
    acceptBobRes.data
  );

  // Verify Bob is NOW a member with role MEMBER
  const checkTeamRes2 = await request(`/api/teams/${teamId}`);
  const bobMember = checkTeamRes2.data.data.members.find((m: any) => m.user_id === member1User.id);
  assert(
    checkTeamRes2.data.data.members.length === 2 && bobMember && bobMember.role === 'MEMBER',
    'Bob is now an official team member with role MEMBER',
    checkTeamRes2.data.data.members
  );

  // ---------------------------------------------------------------------------
  // 5. METHOD 2: JOIN TEAM VIA INVITATION LINK
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Method 2: Join Team via Invitation Link ---');

  // Alice generates an invite link
  const inviteLinkRes = await request(`/api/teams/${teamId}/invite-link`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${leadUser.token}` },
    body: JSON.stringify({
      expiresInHours: 48,
      maxUses: 10,
    }),
  });
  assert(
    inviteLinkRes.status === 201 && inviteLinkRes.data.data.token,
    'Team Lead generates secure invitation link',
    inviteLinkRes.data
  );
  inviteToken = inviteLinkRes.data.data.token;
  console.log(`   Generated Invite Token: ${inviteToken}`);

  // Charlie inspects the invite link
  const inspectInviteRes = await request(`/api/teams/invite/${inviteToken}`);
  assert(
    inspectInviteRes.status === 200 && inspectInviteRes.data.data.teamName === 'Cyber Panthers',
    'Inspect invite link details publicly',
    inspectInviteRes.data
  );

  // Charlie registers for the event
  const regCharlieRes = await request(`/api/events/${eventId}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${member2User.token}` },
  });
  assert(regCharlieRes.status === 201, 'Charlie registers for event', regCharlieRes.data);

  // Charlie requests to join via invite token
  const charlieJoinRes = await request(`/api/teams/invite/${inviteToken}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${member2User.token}` },
  });
  assert(
    charlieJoinRes.status === 200 && charlieJoinRes.data.data.request.status === 'PENDING',
    'Submit Join Request via Invitation Link (status is PENDING)',
    charlieJoinRes.data
  );
  const charlieRequestId = charlieJoinRes.data.data.request.id;

  // Alice rejects Charlie's request first (to test REJECT flow)
  const rejectCharlieRes = await request(`/api/teams/${teamId}/join-requests/${charlieRequestId}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${leadUser.token}` },
  });
  assert(
    rejectCharlieRes.status === 200 && rejectCharlieRes.data.data.status === 'REJECTED',
    'Team Lead rejects join request',
    rejectCharlieRes.data
  );

  // Verify Charlie was NOT added
  const checkTeamRes3 = await request(`/api/teams/${teamId}`);
  assert(
    checkTeamRes3.data.data.members.length === 2,
    'Rejected applicant is not in team members',
    checkTeamRes3.data.data.members
  );

  // Charlie requests again
  const charlieJoinRes2 = await request(`/api/teams/invite/${inviteToken}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${member2User.token}` },
  });
  const charlieRequestId2 = charlieJoinRes2.data.data.request.id;

  // Alice accepts Charlie's second request
  const acceptCharlieRes = await request(`/api/teams/${teamId}/join-requests/${charlieRequestId2}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${leadUser.token}` },
  });
  assert(
    acceptCharlieRes.status === 200 && acceptCharlieRes.data.data.request.status === 'ACCEPTED',
    'Team Lead accepts Charlie second join request',
    acceptCharlieRes.data
  );

  // Verify Charlie is now in team (3 members total)
  const checkTeamRes4 = await request(`/api/teams/${teamId}`);
  assert(
    checkTeamRes4.data.data.members.length === 3,
    'Team now contains 3 members (Alice, Bob, Charlie)',
    checkTeamRes4.data.data.members
  );

  // ---------------------------------------------------------------------------
  // 6. USER TEAMS & DISCOVERY
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. User Teams & Listing ---');

  const myTeamsRes = await request('/api/teams/my', {
    headers: { Authorization: `Bearer ${member1User.token}` },
  });
  assert(
    myTeamsRes.status === 200 && myTeamsRes.data.data.length >= 1,
    'Bob can retrieve his teams via /api/teams/my',
    myTeamsRes.data
  );

  const eventTeamsRes = await request(`/api/teams?eventId=${eventId}`);
  assert(
    eventTeamsRes.status === 200 && eventTeamsRes.data.data.length >= 1,
    'List teams for an event via query param',
    eventTeamsRes.data
  );

  // ---------------------------------------------------------------------------
  // 7. LEADERSHIP TRANSFER
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Leadership Transfer ---');

  // Bob (MEMBER) attempts to transfer leadership -> Should be forbidden
  const badTransferRes = await request(`/api/teams/${teamId}/transfer-leadership`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${member1User.token}` },
    body: JSON.stringify({ newLeaderId: member2User.id }),
  });
  assert(badTransferRes.status === 403, 'Non-lead cannot transfer leadership', badTransferRes.data);

  // Alice transfers leadership to Bob
  const transferRes = await request(`/api/teams/${teamId}/transfer-leadership`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${leadUser.token}` },
    body: JSON.stringify({ newLeaderId: member1User.id }),
  });
  assert(transferRes.status === 200, 'Alice transfers leadership to Bob', transferRes.data);

  // Verify Bob is now TEAM_LEAD and Alice is MEMBER
  const checkTeamRes5 = await request(`/api/teams/${teamId}`);
  const bobRole = checkTeamRes5.data.data.members.find((m: any) => m.user_id === member1User.id)?.role;
  const aliceRole = checkTeamRes5.data.data.members.find((m: any) => m.user_id === leadUser.id)?.role;
  assert(
    bobRole === 'TEAM_LEAD' && aliceRole === 'MEMBER',
    'Bob is verified TEAM_LEAD and Alice is demoted to MEMBER',
    { bobRole, aliceRole }
  );

  // ---------------------------------------------------------------------------
  // 8. LEAVE TEAM & MEMBER REMOVAL
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Leave Team & Member Removal ---');

  // Bob (now TEAM_LEAD) tries to leave without transferring leadership -> Should fail
  const leadLeaveRes = await request(`/api/teams/${teamId}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${member1User.token}` },
  });
  assert(
    leadLeaveRes.status === 400,
    'Team Lead cannot leave team with active members without transferring leadership',
    leadLeaveRes.data
  );

  // Charlie (regular MEMBER) leaves team
  const memberLeaveRes = await request(`/api/teams/${teamId}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${member2User.token}` },
  });
  assert(memberLeaveRes.status === 200, 'Charlie leaves team successfully', memberLeaveRes.data);

  // Bob (TEAM_LEAD) removes Alice
  const removeAliceRes = await request(`/api/teams/${teamId}/members/${leadUser.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${member1User.token}` },
  });
  assert(removeAliceRes.status === 200, 'Bob removes Alice from team', removeAliceRes.data);

  // Verify team only has Bob remaining
  const checkTeamRes6 = await request(`/api/teams/${teamId}`);
  assert(
    checkTeamRes6.data.data.members.length === 1,
    'Team now has only 1 member (Bob)',
    checkTeamRes6.data.data.members
  );

  // Bob (sole remaining member) leaves team -> Team disbanded/deleted
  const soleLeaveRes = await request(`/api/teams/${teamId}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${member1User.token}` },
  });
  assert(
    soleLeaveRes.status === 200 && soleLeaveRes.data.data.teamDisbanded === true,
    'Sole member leaving automatically disbands/deletes the team',
    soleLeaveRes.data
  );

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n======================================================');
  console.log(`🏁 PHASE 3 TEAM SERVICE TEST RESULTS:`);
  console.log(`   Passed: ${testsPassed}`);
  console.log(`   Failed: ${testsFailed}`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
