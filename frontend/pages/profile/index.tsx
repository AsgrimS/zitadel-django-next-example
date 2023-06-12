import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { signOut, getSession } from "next-auth/react";

import type { GetServerSideProps } from "next";
import type { Session } from "next-auth";
import { RequestOptions } from "https";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // const t = context.req
  const headers = context.req.headers;
  const options: RequestOptions = {
    method: context.req.method,
    credentials: "include",
    headers,
  };

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
    console.log("\nCalling public API");
    const start = performance.now();
    const helloWorld = await fetch(
      "http://localhost:8000/hello-world-public/",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );
    const end = performance.now();
    console.log(`API call took ${end - start} milliseconds.`);
    console.log(await helloWorld.json());
  };

  const fetchHelloWorldProtected = async () => {
    console.log("\nCalling protected API");
    const start = performance.now();
    const helloWorld = await fetch(
      "http://localhost:8000/hello-world-protected/",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );
    const end = performance.now();
    console.log(`API call took ${end - start} milliseconds.`);
    console.log(await helloWorld.json());
  };

  const fetchHelloWorldProtectedLocal = async () => {
    console.log("\nCalling locally protected API");
    const start = performance.now();
    const helloWorld = await fetch(
      "http://localhost:8000/hello-world-protected-local/",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );
    const end = performance.now();
    console.log(`API call took ${end - start} milliseconds.`);
    console.log(await helloWorld.json());
  };

  return (
    <div>
      <h1>Profile</h1>
      <h2>
        Logged in as <code>{session.user?.name}</code>
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button onClick={() => fetchHelloWorldPublic()}>Ping Public API</button>
        <button onClick={() => fetchHelloWorldProtected()}>
          Ping Protected API
        </button>
        <button onClick={() => fetchHelloWorldProtectedLocal()}>
          Ping Protected Local API
        </button>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    </div>
  );
}
