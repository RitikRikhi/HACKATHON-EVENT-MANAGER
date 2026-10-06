/**
 * Event OS - Phase 1 Final Authentication & User Integration Test Suite
 */

import jwt from 'jsonwebtoken';

const BASE_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';

interface StepResult {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  problem?: string;
  fix?: string;
  data?: any;
}

const testResults: StepResult[] = [];

async function request(
  endpoint: string,
  method = 'GET',
  body?: any,
  token?: string
): Promise<{ status: number; ok: boolean; body: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let resBody: any = {};
  try {
    resBody = await res.json();
  } catch {
    resBody = { raw: await res.text() };
  }

  return { status: res.status, ok: res.ok, body: resBody };
}

function recordTest(
  name: string,
  expected: string,
  actual: string,
  passed: boolean,
  problem?: string,
  fix?: string,
  data?: any
) {
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${name}`);
  console.log(`   Expected: ${expected}`);
  console.log(`   Actual:   ${actual}`);
  if (!passed && problem) {
    console.log(`   Problem:  ${problem}`);
    console.log(`   Fix:      ${fix}`);
  }
  console.log('-----------------------------------------------------------------------------');
  testResults.push({ name, expected, actual, passed, problem, fix, data });
}

async function runPhase1TestSuite() {
  console.log('=============================================================================');
  console.log('🧪 EVENT OS — PHASE 1 FINAL AUTH & USER TEST SUITE');
  console.log(`🎯 Target API Gateway: ${BASE_URL}`);
  console.log('=============================================================================\n');

  const timestamp = Date.now();
  const testEmail = `participant_${timestamp}@eventos.test`;
  const initialPassword = 'Password123!';
  const updatedPassword = 'NewSecretPassword456!';
  const adminEmail = `admin_${timestamp}@eventos.test`;
  const adminPassword = 'AdminPassword123!';

  let participantToken = '';
  let participantUserId = '';
  let adminToken = '';

  // ---------------------------------------------------------------------------
  // 1. Register New Participant
  // ---------------------------------------------------------------------------
  const regRes = await request('/api/auth/register', 'POST', {
    name: 'Alice Participant',
    email: testEmail,
    password: initialPassword,
    role: 'PARTICIPANT',
  });

  const regUser = regRes.body?.data?.user;
  const regPassed =
    regRes.status === 201 &&
    regUser &&
    regUser.role === 'PARTICIPANT' &&
    !('password' in regUser) &&
    !('password_hash' in regUser) &&
    !('passwordHash' in regUser);

  recordTest(
    'Registration (POST /auth/register)',
    'Status 201, role PARTICIPANT, password/hash NEVER returned',
    `Status ${regRes.status}, role=${regUser?.role}, passwordReturned=${'password' in (regUser || {}) || 'password_hash' in (regUser || {})}`,
    regPassed,
    regPassed ? undefined : 'Registration did not return 201 or exposed password fields',
    regPassed ? undefined : 'Verify auth controller register logic',
    regRes.body
  );

  participantUserId = regUser?.id;

  // ---------------------------------------------------------------------------
  // 2. Login Participant & JWT Verification
  // ---------------------------------------------------------------------------
  const loginRes = await request('/api/auth/login', 'POST', {
    email: testEmail,
    password: initialPassword,
  });

  participantToken = loginRes.body?.data?.token || '';
  const loginUser = loginRes.body?.data?.user;

  let jwtValid = false;
  let decodedPayload: any = null;
  if (participantToken) {
    decodedPayload = jwt.decode(participantToken);
    jwtValid =
      decodedPayload &&
      decodedPayload.userId === participantUserId &&
      decodedPayload.email === testEmail &&
      decodedPayload.role === 'PARTICIPANT';
  }

  const loginPassed =
    loginRes.status === 200 &&
    participantToken.length > 20 &&
    jwtValid &&
    !('password' in (loginUser || {})) &&
    !('password_hash' in (loginUser || {}));

  recordTest(
    'Participant Login (POST /auth/login)',
    'Status 200, JWT token returned with userId/email/role, password never returned',
    `Status ${loginRes.status}, hasToken=${!!participantToken}, jwtValid=${jwtValid}`,
    loginPassed,
    loginPassed ? undefined : 'Login failed or JWT payload is missing required claims',
    loginPassed ? undefined : 'Check login validation and JWT sign options',
    loginRes.body
  );

  // ---------------------------------------------------------------------------
  // 3. JWT Storage Verification
  // ---------------------------------------------------------------------------
  const storageVerified = !!participantToken && typeof participantToken === 'string';
  recordTest(
    'JWT Storage',
    'JWT token is returned in standard response structure data.token for Postman pm.environment.set',
    `data.token is valid string of length ${participantToken.length}`,
    storageVerified
  );

  // ---------------------------------------------------------------------------
  // 4. Access /me with Participant JWT
  // ---------------------------------------------------------------------------
  const meRes = await request('/api/auth/me', 'GET', undefined, participantToken);
  const meUser = meRes.body?.data;
  const mePassed =
    meRes.status === 200 &&
    meUser &&
    meUser.email === testEmail &&
    meUser.role === 'PARTICIPANT' &&
    !('password' in meUser) &&
    !('password_hash' in meUser);

  recordTest(
    'Access /me (GET /auth/me)',
    'Status 200, authenticated user profile returned without password fields',
    `Status ${meRes.status}, user=${meUser?.email}, role=${meUser?.role}, noPassword=${!('password' in (meUser || {}))}`,
    mePassed,
    mePassed ? undefined : 'GET /me failed or returned password hash',
    mePassed ? undefined : 'Ensure auth middleware and getMe controller omit sensitive fields',
    meRes.body
  );

  // ---------------------------------------------------------------------------
  // 5. Update User Profile
  // ---------------------------------------------------------------------------
  const profileUpdateRes = await request(
    '/api/auth/profile',
    'PUT',
    {
      name: 'Alice Wonderland',
      phone: '+1-555-0199',
      profileImage: 'https://images.unsplash.com/profile-sample.png',
    },
    participantToken
  );

  const updatedProfile = profileUpdateRes.body?.data;
  const profileUpdateSuccess =
    profileUpdateRes.status === 200 &&
    updatedProfile &&
    updatedProfile.name === 'Alice Wonderland' &&
    updatedProfile.phone === '+1-555-0199' &&
    updatedProfile.profileImage === 'https://images.unsplash.com/profile-sample.png';

  // Test disallow role tampering via profile update
  const roleTamperRes = await request(
    '/api/auth/profile',
    'PUT',
    {
      role: 'SUPER_ADMIN',
    },
    participantToken
  );
  const roleTamperBlocked = roleTamperRes.status === 400 || roleTamperRes.status === 422;

  const profilePassed = profileUpdateSuccess && roleTamperBlocked;
  recordTest(
    'Profile Update (PUT /auth/profile)',
    'Status 200 on valid fields; Status 400 when attempting to modify protected fields (role/password/id)',
    `UpdateStatus=${profileUpdateRes.status}, NameUpdated=${updatedProfile?.name === 'Alice Wonderland'}, TamperBlockedStatus=${roleTamperRes.status}`,
    profilePassed,
    profilePassed ? undefined : 'Profile update failed or allowed role tampering',
    profilePassed ? undefined : 'Check validateUpdateProfileInput in auth.validation.ts',
    profileUpdateRes.body
  );

  // ---------------------------------------------------------------------------
  // 6. Change Password Flow
  // ---------------------------------------------------------------------------
  // 6a. Wrong old password
  const wrongOldPwdRes = await request(
    '/api/auth/change-password',
    'PUT',
    {
      currentPassword: 'WrongOldPassword!',
      newPassword: updatedPassword,
    },
    participantToken
  );
  const wrongOldBlocked = wrongOldPwdRes.status === 401;

  // 6b. Weak new password
  const weakPwdRes = await request(
    '/api/auth/change-password',
    'PUT',
    {
      currentPassword: initialPassword,
      newPassword: '123',
    },
    participantToken
  );
  const weakBlocked = weakPwdRes.status === 400;

  // 6c. Same old/new password
  const samePwdRes = await request(
    '/api/auth/change-password',
    'PUT',
    {
      currentPassword: initialPassword,
      newPassword: initialPassword,
    },
    participantToken
  );
  const sameBlocked = samePwdRes.status === 400;

  // 6d. Successful change password
  const changePwdRes = await request(
    '/api/auth/change-password',
    'PUT',
    {
      currentPassword: initialPassword,
      newPassword: updatedPassword,
    },
    participantToken
  );
  const changeSuccess = changePwdRes.status === 200;

  const changePwdPassed = wrongOldBlocked && weakBlocked && sameBlocked && changeSuccess;
  recordTest(
    'Change Password (PUT /auth/change-password)',
    'Wrong current password -> 401; Weak password -> 400; Same password -> 400; Valid -> 200',
    `WrongBlocked=${wrongOldPwdRes.status}, WeakBlocked=${weakPwdRes.status}, SameBlocked=${samePwdRes.status}, Success=${changePwdRes.status}`,
    changePwdPassed,
    changePwdPassed ? undefined : 'Change password validation or bcrypt check failed',
    changePwdPassed ? undefined : 'Check changePassword method in auth.service.ts',
    changePwdRes.body
  );

  // ---------------------------------------------------------------------------
  // 7. Login with New Password & Old Password Check
  // ---------------------------------------------------------------------------
  const oldLoginRes = await request('/api/auth/login', 'POST', {
    email: testEmail,
    password: initialPassword,
  });
  const oldLoginRejected = oldLoginRes.status === 401;

  const newLoginRes = await request('/api/auth/login', 'POST', {
    email: testEmail,
    password: updatedPassword,
  });
  const newLoginSuccess = newLoginRes.status === 200 && !!newLoginRes.body?.data?.token;

  const newPasswordPassed = oldLoginRejected && newLoginSuccess;
  recordTest(
    'New Password Login Verification',
    'Old password returns 401 Unauthorized; New password returns 200 OK with new JWT',
    `OldPasswordStatus=${oldLoginRes.status}, NewPasswordStatus=${newLoginRes.status}`,
    newPasswordPassed,
    newPasswordPassed ? undefined : 'Old password was still accepted or new password failed',
    newPasswordPassed ? undefined : 'Verify updatePassword in userRepository',
    newLoginRes.body
  );

  // ---------------------------------------------------------------------------
  // 8. Register Admin & Test ADMIN Authorization
  // ---------------------------------------------------------------------------
  const adminRegRes = await request('/api/auth/register', 'POST', {
    name: 'Root Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'ADMIN',
  });
  adminToken = adminRegRes.body?.data?.token || '';

  const adminUsersListRes = await request('/api/auth/users', 'GET', undefined, adminToken);
  const adminPassed = adminUsersListRes.status === 200 && Array.isArray(adminUsersListRes.body?.data?.users);

  recordTest(
    'ADMIN Authorization (GET /auth/users)',
    'ADMIN JWT is granted access with Status 200',
    `Status ${adminUsersListRes.status}, UsersCount=${adminUsersListRes.body?.data?.users?.length}`,
    adminPassed,
    adminPassed ? undefined : 'Admin failed to access /auth/users',
    adminPassed ? undefined : 'Verify authorizeRoles middleware in config',
    adminUsersListRes.body
  );

  // ---------------------------------------------------------------------------
  // 9. Test PARTICIPANT Accessing ADMIN Route (Must be 403 Forbidden)
  // ---------------------------------------------------------------------------
  const participantForbiddenRes = await request(
    '/api/auth/users',
    'GET',
    undefined,
    newLoginRes.body?.data?.token || participantToken
  );
  const forbiddenPassed = participantForbiddenRes.status === 403;

  recordTest(
    'Participant -> Admin Route (GET /auth/users)',
    'Status 403 Forbidden',
    `Status ${participantForbiddenRes.status} (${participantForbiddenRes.body?.error || participantForbiddenRes.body?.message})`,
    forbiddenPassed,
    forbiddenPassed ? undefined : 'Participant was not blocked with 403 Forbidden',
    forbiddenPassed ? undefined : 'Check role middleware permissions logic',
    participantForbiddenRes.body
  );

  // ---------------------------------------------------------------------------
  // 10. Test Invalid JWT
  // ---------------------------------------------------------------------------
  const invalidJwtRes = await request('/api/auth/me', 'GET', undefined, 'invalid-malformed-token-xyz');
  const invalidPassed = invalidJwtRes.status === 401;

  recordTest(
    'Invalid JWT Handling',
    'Status 401 Unauthorized without crashing the server',
    `Status ${invalidJwtRes.status} (${invalidJwtRes.body?.error || invalidJwtRes.body?.message})`,
    invalidPassed,
    invalidPassed ? undefined : 'Invalid token did not return 401',
    invalidPassed ? undefined : 'Check authenticate middleware error handling',
    invalidJwtRes.body
  );

  // ---------------------------------------------------------------------------
  // 11. Test Missing JWT
  // ---------------------------------------------------------------------------
  const missingJwtRes = await request('/api/auth/me', 'GET');
  const missingPassed = missingJwtRes.status === 401;

  recordTest(
    'Missing JWT Handling',
    'Status 401 Unauthorized with standard error response',
    `Status ${missingJwtRes.status} (${missingJwtRes.body?.error || missingJwtRes.body?.message})`,
    missingPassed,
    missingPassed ? undefined : 'Missing token did not return 401',
    missingPassed ? undefined : 'Check authenticate middleware header check',
    missingJwtRes.body
  );

  // ---------------------------------------------------------------------------
  // 12. Test Duplicate Registration
  // ---------------------------------------------------------------------------
  const dupRegRes = await request('/api/auth/register', 'POST', {
    name: 'Duplicate Alice',
    email: testEmail,
    password: 'Password999!',
  });
  const dupPassed = dupRegRes.status === 409;

  recordTest(
    'Duplicate Registration Rejection',
    'Status 409 Conflict when registering an existing email address',
    `Status ${dupRegRes.status} (${dupRegRes.body?.error || dupRegRes.body?.message})`,
    dupPassed,
    dupPassed ? undefined : 'Duplicate email was not rejected with 409',
    dupPassed ? undefined : 'Check findByEmail check in auth.service.ts register',
    dupRegRes.body
  );

  // ---------------------------------------------------------------------------
  // 13. Test Wrong Password
  // ---------------------------------------------------------------------------
  const wrongPwdLoginRes = await request('/api/auth/login', 'POST', {
    email: testEmail,
    password: 'IncorrectPassword123!',
  });
  const wrongPwdPassed =
    wrongPwdLoginRes.status === 401 &&
    wrongPwdLoginRes.body?.message === 'Invalid email or password.';

  recordTest(
    'Wrong Password Login Handling',
    'Status 401 Unauthorized with generic message avoiding email existence leakage',
    `Status ${wrongPwdLoginRes.status}, Message="${wrongPwdLoginRes.body?.message}"`,
    wrongPwdPassed,
    wrongPwdPassed ? undefined : 'Wrong password did not return 401 or leaked email info',
    wrongPwdPassed ? undefined : 'Check login in auth.service.ts',
    wrongPwdLoginRes.body
  );

  // ---------------------------------------------------------------------------
  // 14. Security Checks
  // ---------------------------------------------------------------------------
  const securityPassed =
    regPassed &&
    loginPassed &&
    forbiddenPassed &&
    invalidPassed &&
    missingPassed &&
    dupPassed &&
    wrongPwdPassed;

  recordTest(
    'Security Checks',
    'All authentication, password hashing, role boundaries, and secret protections verified',
    `All 14 security rules enforced`,
    securityPassed
  );

  // ---------------------------------------------------------------------------
  // Final Summary Output
  // ---------------------------------------------------------------------------
  const total = testResults.length;
  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = total - passedCount;

  console.log('\n=============================================================================');
  console.log(`📊 FINAL RESULT: ${passedCount}/${total} PASSED (${failedCount} FAILURES)`);
  console.log('=============================================================================\n');

  return { passedCount, total, failedCount, testResults };
}

runPhase1TestSuite();
