// -----------------------------------------------------------------------------
// This function creates the context inside JWT's payload. It gets userInfo
// (which comes from Keycloak) as parameter.
//
// Update the codes according to your requirements. Welcome to TypeScript :)
// -----------------------------------------------------------------------------
export interface KeycloakUserInfo {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
}

export function createContext(userInfo: KeycloakUserInfo) {
  const context = {
    user: {
      id: userInfo.sub,
      name: userInfo.name?.trim() || userInfo.preferred_username?.trim() || "",
      email: userInfo.email?.trim() || "",
      lobby_bypass: true,
      security_bypass: true,
    },
  };

  return context;
}
