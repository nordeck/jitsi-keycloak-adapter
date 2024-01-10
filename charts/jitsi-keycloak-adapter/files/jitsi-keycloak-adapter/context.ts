// -----------------------------------------------------------------------------
// This function creates the context inside JWT's payload. It gets userInfo
// (which comes from Keycloak) as parameter.
//
// Update the codes according to your requirements. Welcome to TypeScript :)
// -----------------------------------------------------------------------------

export function createContext(userInfo: Record<string, unknown>) {
  const context = {
    user: {
      id: userInfo.sub,
      name: userInfo.name || userInfo.preferred_username || "",
      email: userInfo.email || "",
      lobby_bypass: true,
      security_bypass: true,
    },
  };

  return context;
}
