import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { signOut } from "next-auth/react";

import type { GetServerSideProps } from "next";
import type { Session } from "next-auth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
};

export default function Profile({ session }: { session: Session }) {
  console.log(session.user);
  return (
    <div>
      <h1>Profile</h1>
      <h2>
        Logged in as <code>{session.user?.name}</code>
      </h2>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
