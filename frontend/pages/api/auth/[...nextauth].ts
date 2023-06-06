import NextAuth from "next-auth";
import ZitadelProvider from "next-auth/providers/zitadel";

import type { AuthOptions } from "next-auth";

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
    // async jwt({ token, user, account }) {
    //   token.user ??= user;
    //   token.accessToken ??= account?.access_token;
    //   token.refreshToken ??= account?.refresh_token;
    //   token.expiresAt ??= (account?.expires_at ?? 0) * 1000;
    //   token.error = undefined;
    //   // Return previous token if the access token has not expired yet
    //   if (Date.now() < (token.expiresAt as number)) {
    //     return token;
    //   }
    //
    //   // Access token has expired, try to update it
    //   console.log("Access token has expired!");
    //   return token;
    //   // return refreshAccessToken(token);
    // },

    async session({ session, token }) {
      console.log(session, token);
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
