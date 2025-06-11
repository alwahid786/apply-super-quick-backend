// Store verification status
const verificationStore = new Map();
function markEmailVerified(sessionId, email, token) {
  const key = `${sessionId}_${token}`;

  if (!verificationStore.has(key)) {
    verificationStore.set(key, {
      sessionId,
      email,
      phone: null,
      emailVerified: false,
      phoneVerified: false,
      token,
      createdAt: new Date(),
    });
  }

  const verification = verificationStore.get(key);
  verification.emailVerified = true;
  verification.emailVerifiedAt = new Date();

  console.log(`Email verified for session: ${sessionId}`);
  return verification;
}
function markPhoneVerified(sessionId, phone, token) {
  const key = `${sessionId}_${token}`;

  if (!verificationStore.has(key)) {
    verificationStore.set(key, {
      sessionId,
      email: null,
      phone,
      emailVerified: false,
      phoneVerified: false,
      token,
      createdAt: new Date(),
    });
  }

  const verification = verificationStore.get(key);
  verification.phoneVerified = true;
  verification.phoneVerifiedAt = new Date();

  console.log(`Phone verified for session: ${sessionId}`);
  return verification;
}
function getVerificationStatus(sessionId, token) {
  const key = `${sessionId}_${token}`;
  return verificationStore.get(key) || null;
}

export { markEmailVerified, markPhoneVerified, getVerificationStatus };
