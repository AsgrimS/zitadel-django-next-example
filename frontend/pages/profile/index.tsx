import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { signOut, getSession } from "next-auth/react";

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

export default function Profile({ session }: { session: any }) {
  const fetchHelloWorldPublic = async () => {
    // console.log(session.user.accessToken);
    console.log("Calling public API");
    const helloWorld = await fetch(
      "http://localhost:8000/hello-world-public/",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );
    console.log(await helloWorld.json());
  };

  const fetchHelloWorldProtected = async () => {
    // console.log(session.user.accessToken);
    console.log("Calling protected API");
    const helloWorld = await fetch(
      "http://localhost:8000/hello-world-protected/",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );
    console.log(await helloWorld.json());
  };
  return (
    <div>
      <h1>Profile</h1>
      <h2>
        Logged in as <code>{session.user?.name}</code>
      </h2>
      <button onClick={() => signOut()}>Sign out</button>
      <button onClick={() => fetchHelloWorldPublic()}>Ping Public API</button>
      <button onClick={() => fetchHelloWorldProtected()}>
        Ping Protected API
      </button>
    </div>
  );
}
