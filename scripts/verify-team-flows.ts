import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const GATEWAY = process.env.API_GATEWAY_URL || 'http://localhost:8000';
  const ts = Date.now();

  console.log('--- Step 1: Register Team Lead & 2 Participants ---');
  // 1. Team Lead
  const leadRes: any = await fetch(GATEWAY + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Leader', email: 'lead_' + ts + '@example.com', password: 'Password123!' })
  }).then(r => r.json());
  const leadToken = leadRes.data.token;
  console.log('Registered Team Lead (Alice):', leadRes.data.user.email);

  // 2. Participant for Code join
  const codeUserRes: any = await fetch(GATEWAY + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob CodeJoiner', email: 'bob_code_' + ts + '@example.com', password: 'Password123!' })
  }).then(r => r.json());
  const codeUserToken = codeUserRes.data.token;
  console.log('Registered Participant (Bob):', codeUserRes.data.user.email);

  // 3. Participant for Link join
  const linkUserRes: any = await fetch(GATEWAY + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Charlie LinkJoiner', email: 'charlie_link_' + ts + '@example.com', password: 'Password123!' })
  }).then(r => r.json());
  const linkUserToken = linkUserRes.data.token;
  console.log('Registered Participant (Charlie):', linkUserRes.data.user.email);

  console.log('\n--- Step 2: Create & Publish Event as Admin ---');
  const adminRes: any = await fetch(GATEWAY + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Admin', email: 'admin_' + ts + '@example.com', password: 'Password123!', role: 'ADMIN' })
  }).then(r => r.json());

  const eventRes: any = await fetch(GATEWAY + '/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminRes.data.token },
    body: JSON.stringify({
      name: 'Hackathon 2026',
      venue: 'Online',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 2*86400000).toISOString(),
      capacity: 100,
      status: 'PUBLISHED'
    })
  }).then(r => r.json());
  const eventId = eventRes.data.id;
  console.log('Event created:', eventId);

  // Register all 3 users for the event
  await fetch(GATEWAY + '/api/events/' + eventId + '/register', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + leadToken }
  });
  await fetch(GATEWAY + '/api/events/' + eventId + '/register', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + codeUserToken }
  });
  await fetch(GATEWAY + '/api/events/' + eventId + '/register', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + linkUserToken }
  });
  console.log('All 3 participants successfully registered for event.\n');

  console.log('===========================================================');
  console.log('1️⃣ CHECK: CREATE TEAM');
  console.log('===========================================================');
  console.log('POST /api/teams');
  console.log('Payload:', { name: 'Code Wizards', description: 'Building the next big thing', eventId });
  const teamRes: any = await fetch(GATEWAY + '/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + leadToken },
    body: JSON.stringify({
      name: 'Code Wizards',
      description: 'Building the next big thing',
      eventId: eventId
    })
  }).then(r => r.json());
  console.log('Response:', JSON.stringify(teamRes, null, 2));

  const teamId = teamRes.data.id;
  const teamCode = teamRes.data.team_code;

  console.log('\n===========================================================');
  console.log('2️⃣ CHECK: JOIN TEAM THROUGH CODE');
  console.log('===========================================================');
  console.log('Step 2A: Bob submits join request using team code:', teamCode);
  console.log('POST /api/teams/join');
  console.log('Payload:', { teamCode });
  const codeJoinRes: any = await fetch(GATEWAY + '/api/teams/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + codeUserToken },
    body: JSON.stringify({ teamCode: teamCode })
  }).then(r => r.json());
  console.log('Join Request Response (Status PENDING):', JSON.stringify(codeJoinRes, null, 2));
  const codeReqId = codeJoinRes.data.request.id;

  console.log('\nStep 2B: Team Lead (Alice) views pending join requests');
  console.log('GET /api/teams/' + teamId + '/join-requests');
  const requestsList = await fetch(GATEWAY + '/api/teams/' + teamId + '/join-requests', {
    headers: { Authorization: 'Bearer ' + leadToken }
  }).then(r => r.json());
  console.log('Pending Requests List:', JSON.stringify(requestsList, null, 2));

  console.log('\nStep 2C: Team Lead accepts Bob join request');
  console.log('POST /api/teams/' + teamId + '/join-requests/' + codeReqId + '/accept');
  const acceptCodeRes = await fetch(GATEWAY + '/api/teams/' + teamId + '/join-requests/' + codeReqId + '/accept', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + leadToken }
  }).then(r => r.json());
  console.log('Accept Response (Bob is now MEMBER):', JSON.stringify(acceptCodeRes, null, 2));

  console.log('\n===========================================================');
  console.log('3️⃣ CHECK: JOIN TEAM THROUGH INVITATION LINK');
  console.log('===========================================================');
  console.log('Step 3A: Team Lead generates invite link');
  console.log('POST /api/teams/' + teamId + '/invite-link');
  console.log('Payload:', { expiresInHours: 24, maxUses: 5 });
  const inviteRes: any = await fetch(GATEWAY + '/api/teams/' + teamId + '/invite-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + leadToken },
    body: JSON.stringify({ expiresInHours: 24, maxUses: 5 })
  }).then(r => r.json());
  console.log('Invite Link Generated:', JSON.stringify(inviteRes, null, 2));
  const token = inviteRes.data.token;

  console.log('\nStep 3B: Charlie inspects invite link');
  console.log('GET /api/teams/invite/' + token);
  const inspectRes = await fetch(GATEWAY + '/api/teams/invite/' + token).then(r => r.json());
  console.log('Invite Details:', JSON.stringify(inspectRes, null, 2));

  console.log('\nStep 3C: Charlie submits join request via invite token');
  console.log('POST /api/teams/invite/' + token + '/join');
  const linkJoinRes: any = await fetch(GATEWAY + '/api/teams/invite/' + token + '/join', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + linkUserToken }
  }).then(r => r.json());
  console.log('Link Join Request Response (Status PENDING):', JSON.stringify(linkJoinRes, null, 2));
  const linkReqId = linkJoinRes.data.request.id;

  console.log('\nStep 3D: Team Lead accepts Charlie link join request');
  console.log('POST /api/teams/' + teamId + '/join-requests/' + linkReqId + '/accept');
  const acceptLinkRes = await fetch(GATEWAY + '/api/teams/' + teamId + '/join-requests/' + linkReqId + '/accept', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + leadToken }
  }).then(r => r.json());
  console.log('Accept Response (Charlie is now MEMBER):', JSON.stringify(acceptLinkRes, null, 2));

  console.log('\n===========================================================');
  console.log('4️⃣ FINAL VERIFICATION: TEAM DETAILS WITH ALL MEMBERS');
  console.log('===========================================================');
  console.log('GET /api/teams/' + teamId);
  const finalTeam = await fetch(GATEWAY + '/api/teams/' + teamId).then(r => r.json());
  console.log('Final Team with Members (Alice: LEAD, Bob: MEMBER, Charlie: MEMBER):');
  console.log(JSON.stringify(finalTeam, null, 2));
}

run().catch(console.error);
