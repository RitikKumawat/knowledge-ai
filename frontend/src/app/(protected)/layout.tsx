"use client";

import { useQuery } from "@apollo/client/react";
import { GetUserProfileDocument } from "@/generated/graphql";
import { Loader, Center } from "@mantine/core";
import React from "react";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data, loading, error } = useQuery(GetUserProfileDocument, {
    // network-only ensures we always check the server for the latest auth state
    // when navigating to a protected route
    fetchPolicy: "network-only",
  });

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader />
      </Center>
    );
  }

  // If there's an error (e.g. UNAUTHENTICATED), the global Apollo error link 
  // we set up in ApolloWrapper will automatically redirect the user to "/".
  // We return null here to avoid rendering any protected content during the redirect.
  if (error || !data?.getUserProfile) {
    return null;
  }

  return <>{children}</>;
}
