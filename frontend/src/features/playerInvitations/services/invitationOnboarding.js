// Called only from the explicit invitation signup/accept action. Normal Signup
// never imports this flow. Keep the bearer invitation context in memory.
export async function registerAndAcceptInvitation({ api, login, token, form, accepted, onRegistered }) {
  if (accepted !== true || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("Accept a valid invitation before registering to join.");
  const registration = await api.post(`/player-invitations/accept/${token}/register`, form);
  onRegistered?.();
  await login({ email: registration.data.data.email, password: form.password });
  const result = await api.post(`/player-invitations/accept/${token}`);
  return result.data;
}
