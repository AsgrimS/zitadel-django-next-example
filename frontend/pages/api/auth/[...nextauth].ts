import NextAuth from "next-auth";
import ZitadelProvider from "next-auth/providers/zitadel";
import { JWT } from "next-auth/jwt";
import type { AuthOptions } from "next-auth";
import { Issuer } from "openid-client";

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const issuer = await Issuer.discover(process.env.ZITADEL_ISSUER ?? "");
    const client = new issuer.Client({
      client_id: process.env.ZITADEL_CLIENT_ID || "",
      token_endpoint_auth_method: "none",
    });

    const { refresh_token, access_token, expires_at } = await client.refresh(
      token.refreshToken as string
    );

    console.log("------------------------");
    console.log("Token refreshed", token);
    console.log("------------------------");

    return {
      ...token,
      accessToken: access_token,
      expiresAt: (expires_at ?? 0) * 1000,
      refreshToken: refresh_token, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Error during refreshAccessToken", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    ZitadelProvider({
      issuer: process.env.ZITADEL_ISSUER!,
      clientId: process.env.ZITADEL_CLIENT_ID!,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      token.user ??= user;
      token.accessToken ??= account?.access_token;
      token.refreshToken ??= account?.refresh_token;
      token.expiresAt ??= (account?.expires_at ?? 0) * 1000;
      token.error = undefined;
      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expiresAt as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      // console.log(session, token);
      session.user = {
        name: token?.name || "",
        email: token?.email || "",
        image: token?.picture || "",
        accessToken: token?.accessToken || "",
      };
      return session;
    },
  },
};

export default NextAuth(authOptions);
