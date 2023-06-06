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
    async session({ session, token }) {
      session.user = {
        name: token?.name || "",
        email: token?.email || "",
        image: token?.picture || "",
      };
      return session;
    },
  },
};

export default NextAuth(authOptions);
