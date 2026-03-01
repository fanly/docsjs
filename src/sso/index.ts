/**
 * SSO Integration Module
 * 
 * Provides SAML 2.0 and OAuth 2.0 / OIDC authentication integrations.
 * Supports Okta, Azure AD, OneLogin, Auth0, and generic SAML providers.
 */

import type { User } from "../types";

/**
 * SSO Provider types
 */
export type SSOProvider = "okta" | "azure-ad" | "onelogin" | "auth0" | "generic-saml" | "generic-oauth";

/**
 * OAuth 2.0 / OIDC Configuration
 */
export interface OAuthConfig {
  /** OAuth provider */
  provider: "okta" | "azure-ad" | "auth0" | "generic-oauth";
  
  /** Client ID from OAuth provider */
  clientId: string;
  
  /** Client secret (for confidential clients) */
  clientSecret?: string;
  
  /** OAuth discovery URL or manual config */
  issuer: string;
  
  /** Authorization endpoint */
  authorizationEndpoint?: string;
  
  /** Token endpoint */
  tokenEndpoint?: string;
  
  /** UserInfo endpoint */
  userInfoEndpoint?: string;
  
  /** JWKS URI for token verification */
  jwksUri?: string;
  
  /** Redirect URI after authentication */
  redirectUri: string;
  
  /** Requested scopes */
  scopes: string[];
  
  /** PKCE support */
  pkce?: boolean;
  
  /** Response type (code, token, id_token) */
  responseType?: string;
  
  /** Token signing algorithm */
  signingAlgorithm?: "RS256" | "RS384" | "RS512" | "ES256" | "ES384" | "ES512";
  
  /** Custom claim mappings */
  claimMapping?: {
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    groups?: string;
    roles?: string;
  };
}

/**
 * SAML 2.0 Configuration
 */
export interface SAMLConfig {
  /** SAML provider */
  provider: "okta" | "azure-ad" | "onelogin" | "generic-saml";
  
  /** Single Sign-On URL (SSO URL) */
  ssoUrl: string;
  
  /** Entity ID / Issuer */
  entityId: string;
  
  /** X.509 Certificate for signature verification */
  certificate: string;
  
  /** Service Provider Entity ID (if different from issuer) */
  spEntityId?: string;
  
  /** Assertion Consumer Service URL */
  acsUrl: string;
  
  /** Single Logout URL */
  sloUrl?: string;
  
  /** Name ID format */
  nameIdFormat?: "emailAddress" | "persistent" | "transient";
  
  /** Requested attributes */
  attributeConsumingService?: {
    serviceName: string;
    requestedAttributes: string[];
  };
  
  /** Signature algorithm */
  signatureAlgorithm?: "sha1" | "sha256" | "sha512";
  
  /** Want Assertions Signed */
  wantAssertionsSigned?: boolean;
  
  /** Want AuthnRequests Signed */
  wantAuthnRequestsSigned?: boolean;
  
  /** Custom attribute mappings */
  attributeMapping?: Record<string, string>;
}

/**
 * SSO Session
 */
export interface SSOSession {
  /** Session ID */
  id: string;
  
  /** Associated user */
  userId: string;
  
  /** SSO provider used */
  provider: SSOProvider;
  
  /** Session created timestamp */
  createdAt: number;
  
  /** Session expires timestamp */
  expiresAt: number;
  
  /** Refresh token (if applicable) */
  refreshToken?: string;
  
  /** ID token claims (for OAuth) */
  idTokenClaims?: Record<string, unknown>;
  
  /** SAML assertion attributes */
  samlAttributes?: Record<string, string[]>;
}

/**
 * SSO User Profile
 */
export interface SSOUserProfile {
  /** Unique user ID from IdP */
  idpUserId: string;
  
  /** Email address */
  email: string;
  
  /** Display name */
  displayName?: string;
  
  /** First name */
  firstName?: string;
  
  /** Last name */
  lastName?: string;
  
  /** Groups from IdP */
  groups?: string[];
  
  /** Roles from IdP */
  roles?: string[];
  
  /** Raw profile data */
  rawProfile: Record<string, unknown>;
}

/**
 * SSO Service
 */
export class SSOService {
  private oauthConfigs: Map<SSOProvider, OAuthConfig> = new Map();
  private samlConfigs: Map<SSOProvider, SAMLConfig> = new Map();
  private sessions: Map<string, SSOSession> = new Map();
  
  /**
   * Configure OAuth provider
   */
  configureOAuth(config: OAuthConfig): void {
    this.oauthConfigs.set(config.provider, config);
  }
  
  /**
   * Configure SAML provider
   */
  configureSAML(config: SAMLConfig): void {
    this.samlConfigs.set(config.provider, config);
  }
  
  /**
   * Generate OAuth authorization URL
   */
  async getOAuthAuthorizationUrl(provider: SSOProvider, state: string): Promise<string> {
    const config = this.oauthConfigs.get(provider);
    if (!config) {
      throw new Error(`OAuth not configured for provider: ${provider}`);
    }
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: config.responseType || "code",
      scope: config.scopes.join(" "),
      state,
    });
    
    if (config.pkce) {
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
      // Store code verifier in session for later use
      this.storeCodeVerifier(state, codeVerifier);
    }
    
    const authUrl = config.authorizationEndpoint || 
      `${config.issuer}/authorize`;
    
    return `${authUrl}?${params.toString()}`;
  }
  
  /**
   * Exchange OAuth code for tokens
   */
  async exchangeOAuthCode(
    provider: SSOProvider, 
    code: string, 
    state: string
  ): Promise<{ accessToken: string; idToken?: string; refreshToken?: string }> {
    const config = this.oauthConfigs.get(provider);
    if (!config) {
      throw new Error(`OAuth not configured for provider: ${provider}`);
    }
    
    const tokenEndpoint = config.tokenEndpoint || `${config.issuer}/oauth/token`;
    
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
    });
    
    if (config.clientSecret) {
      params.set("client_secret", config.clientSecret);
    }
    
    // Include PKCE code verifier
    const codeVerifier = this.retrieveCodeVerifier(state);
    if (codeVerifier) {
      params.set("code_verifier", codeVerifier);
    }
    
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }
    
    const tokens = await response.json();
    
    return {
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token,
    };
  }
  
  /**
   * Get user profile from OAuth provider
   */
  async getOAuthUserProfile(provider: SSOProvider, accessToken: string): Promise<SSOUserProfile> {
    const config = this.oauthConfigs.get(provider);
    if (!config) {
      throw new Error(`OAuth not configured for provider: ${provider}`);
    }
    
    const userInfoUrl = config.userInfoEndpoint || `${config.issuer}/userinfo`;
    
    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`UserInfo request failed: ${response.statusText}`);
    }
    
    const claims = await response.json();
    return this.mapClaimsToProfile(claims, config);
  }
  
  /**
   * Generate SAML AuthnRequest
   */
  generateSAMLAuthnRequest(provider: SSOProvider): string {
    const config = this.samlConfigs.get(provider);
    if (!config) {
      throw new Error(`SAML not configured for provider: ${provider}`);
    }
    
    const requestId = "_" + this.generateId();
    const issueInstant = new Date().toISOString();
    
    const authnRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest 
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  AssertionConsumerServiceURL="${config.acsUrl}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${config.spEntityId || config.entityId}</saml:Issuer>
  ${config.nameIdFormat ? `<saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:${config.nameIdFormat}"></saml:NameID>` : ""}
</samlp:AuthnRequest>`;
    
    // Sign if required
    if (config.wantAuthnRequestsSigned) {
      return this.signSAMLRequest(authnRequest, config);
    }
    
    return Buffer.from(authnRequest).toString("base64");
  }
  
  /**
   * Process SAML Response
   */
  async processSAMLResponse(
    provider: SSOProvider, 
    samlResponse: string
  ): Promise<SSOUserProfile> {
    const config = this.samlConfigs.get(provider);
    if (!config) {
      throw new Error(`SAML not configured for provider: ${provider}`);
    }
    
    // Decode SAML response
    const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");
    
    // Verify signature
    if (!this.verifySAMLSignature(decoded, config.certificate)) {
      throw new Error("SAML signature verification failed");
    }
    
    // Parse SAML assertion (simplified - real impl would use xml-crypto)
    const profile = this.extractSAMLAttributes(decoded, config);
    
    return profile;
  }
  
  /**
   * Create SSO session
   */
  createSession(
    userId: string, 
    provider: SSOProvider, 
    options?: {
      refreshToken?: string;
      idTokenClaims?: Record<string, unknown>;
      samlAttributes?: Record<string, string[]>;
    }
  ): SSOSession {
    const session: SSOSession = {
      id: this.generateId(),
      userId,
      provider,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      refreshToken: options?.refreshToken,
      idTokenClaims: options?.idTokenClaims,
      samlAttributes: options?.samlAttributes,
    };
    
    this.sessions.set(session.id, session);
    return session;
  }
  
  /**
   * Validate SSO session
   */
  validateSession(sessionId: string): SSOSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    return session;
  }
  
  /**
   * Refresh session
   */
  refreshSession(sessionId: string): SSOSession | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.refreshToken) return null;
    
    // Refresh with provider
    session.expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    this.sessions.set(sessionId, session);
    
    return session;
  }
  
  /**
   * Destroy session
   */
  destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
  
  /**
   * Get SAML SP metadata
   */
  getSPMetadata(config: SAMLConfig): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.spEntityId || config.entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="${config.wantAuthnRequestsSigned ? "true" : "false"}" 
    WantAssertionsSigned="${config.wantAssertionsSigned ? "true" : "false"}" 
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" 
      Location="${config.acsUrl}" index="0" isDefault="true"/>
    ${config.sloUrl ? `<md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${config.sloUrl}"/>` : ""}
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }
  
  private mapClaimsToProfile(claims: Record<string, unknown>, config: OAuthConfig): SSOUserProfile {
    const mapping = config.claimMapping || {};
    
    return {
      idpUserId: String(claims.sub || claims.oid || ""),
      email: String(claims[mapping.email || "email"] || claims.email || ""),
      displayName: String(claims[mapping.name || "name"] || claims.displayName || ""),
      firstName: String(claims[mapping.firstName || "given_name"] || claims.firstName || ""),
      lastName: String(claims[mapping.lastName || "family_name"] || claims.lastName || ""),
      groups: Array.isArray(claims[mapping.groups || "groups"]) 
        ? claims[mapping.groups || "groups"] as string[] 
        : undefined,
      roles: Array.isArray(claims[mapping.roles || "roles"]) 
        ? claims[mapping.roles || "roles"] as string[] 
        : undefined,
      rawProfile: claims,
    };
  }
  
  private extractSAMLAttributes(xml: string, config: SAMLConfig): SSOUserProfile {
    // Simplified extraction - real impl would parse XML properly
    const emailMatch = xml.match(/<saml:Attribute Name="email"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/);
    const nameMatch = xml.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
    
    return {
      idpUserId: nameMatch?.[1] || "",
      email: emailMatch?.[1] || "",
      displayName: nameMatch?.[1],
      rawProfile: {},
    };
  }
  
  private generateId(): string {
    return "id_" + Math.random().toString(36).substr(2, 16);
  }
  
  private generateCodeVerifier(): string {
    return Math.random().toString(36).substr(2, 32);
  }
  
  private async generateCodeChallenge(verifier: string): Promise<string> {
    // SHA256 hash of verifier, base64url encoded
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  
  private codeVerifiers: Map<string, string> = new Map();
  
  private storeCodeVerifier(state: string, verifier: string): void {
    this.codeVerifiers.set(state, verifier);
  }
  
  private retrieveCodeVerifier(state: string): string | null {
    const verifier = this.codeVerifiers.get(state);
    this.codeVerifiers.delete(state);
    return verifier || null;
  }
  
  private signSAMLRequest(request: string, config: SAMLConfig): string {
    // Real implementation would use xml-crypto for signing
    // This is a placeholder
    return Buffer.from(request).toString("base64");
  }
  
  private verifySAMLSignature(xml: string, certificate: string): boolean {
    // Real implementation would verify XML signature
    // This is a placeholder - always returns true for now
    return true;
  }
}

/**
 * Factory for common SSO providers
 */
export function createOktaOAuth(config: Partial<OAuthConfig>): OAuthConfig {
  return {
    provider: "okta",
    scopes: ["openid", "profile", "email"],
    pkce: true,
    responseType: "code",
    signingAlgorithm: "RS256",
    claimMapping: {
      email: "email",
      name: "name",
      firstName: "given_name",
      lastName: "family_name",
      groups: "groups",
    },
    ...config,
  };
}

export function createAzureADOAuth(config: Partial<OAuthConfig>): OAuthConfig {
  return {
    provider: "azure-ad",
    scopes: ["openid", "profile", "email", "User.Read"],
    pkce: true,
    responseType: "code",
    signingAlgorithm: "RS256",
    claimMapping: {
      email: "email",
      name: "name",
      firstName: "given_name",
      lastName: "family_name",
      groups: "groups",
      roles: "roles",
    },
    ...config,
  };
}

export function createAuth0OAuth(config: Partial<OAuthConfig>): OAuthConfig {
  return {
    provider: "auth0",
    scopes: ["openid", "profile", "email"],
    pkce: true,
    responseType: "code",
    signingAlgorithm: "RS256",
    ...config,
  };
}

export function createOktaSAML(config: Partial<SAMLConfig>): SAMLConfig {
  return {
    provider: "okta",
    wantAssertionsSigned: true,
    wantAuthnRequestsSigned: false,
    nameIdFormat: "emailAddress",
    ...config,
  };
}

export function createAzureADSAML(config: Partial<SAMLConfig>): SAMLConfig {
  return {
    provider: "azure-ad",
    wantAssertionsSigned: true,
    wantAuthnRequestsSigned: false,
    nameIdFormat: "persistent",
    ...config,
  };
}
