"use client";

import React from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GetUserProfileDocument, UserLogoutDocument } from "@/generated/graphql";
import {
  AppShell,
  Button,
  Center,
  Loader,
  TextInput,
  Avatar,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  Plus,
  Search,
  MessageSquare,
  FileText,
  LayoutDashboard,
  Settings,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./ProtectedLayout.module.scss";
import { notifications } from "@mantine/notifications";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [opened] = useDisclosure();
  const pathname = usePathname();

  const { data, loading, error } = useQuery(GetUserProfileDocument, {
    fetchPolicy: "network-only",
  });
  const[logoutUser,{loading:loadingLogout}] = useMutation(UserLogoutDocument,{
    onCompleted:()=>{
      notifications.show({
        message:"User Logged out successfully",
        title:"Success",
        color:"green"
      })
    },
    refetchQueries:[GetUserProfileDocument]
  })
  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error || !data?.getUserProfile) {
    return null;
  }

  const user = data.getUserProfile;
  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "KA";

  const userName = user.name || "User";

  return (
    <AppShell
      // header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="0"
    >
      <AppShell.Navbar>
        <div className={styles.sidebar}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>KA</div>
            <div className={styles.logoText}>Knowledge AI</div>
          </div>

          <Button
            leftSection={<Plus size={16} />}
            fullWidth
            radius="md"
            color="indigo"
            className={styles.newChatBtn}
          >
            New Chat
          </Button>

          <div className={styles.searchContainer}>
            <TextInput
              placeholder="Search..."
              leftSection={<Search size={16} />}
              radius="md"
              size="sm"
            />
          </div>

          <div className={styles.scrollSection}>
            {/* Recent Chats Section */}
            <div className={styles.sectionTitle}>Recent Chats</div>
            <div className={`${styles.navItem} ${pathname === "/chat/jwt" ? styles.active : ""}`}>
              <div className={styles.itemIcon}>
                <MessageSquare size={16} />
              </div>
              <span className={styles.itemText}>JWT Authentication</span>
            </div>
            <div className={`${styles.navItem} ${pathname === "/chat/graphql" ? styles.active : ""}`}>
              <div className={styles.itemIcon}>
                <MessageSquare size={16} />
              </div>
              <span className={styles.itemText}>GraphQL Basics</span>
            </div>
            <div className={`${styles.navItem} ${pathname === "/chat/nodejs" ? styles.active : ""}`}>
              <div className={styles.itemIcon}>
                <MessageSquare size={16} />
              </div>
              <span className={styles.itemText}>NodeJS Security</span>
            </div>
            <div className={`${styles.navItem} ${pathname === "/chat/rag" ? styles.active : ""}`}>
              <div className={styles.itemIcon}>
                <MessageSquare size={16} />
              </div>
              <span className={styles.itemText}>RAG Architecture</span>
            </div>

            {/* Documents Section */}
            <div className={styles.sectionTitle}>Documents</div>
            <div className={styles.navItem}>
              <div className={styles.itemIcon}>
                <FileText size={16} />
              </div>
              <span className={styles.itemText}>jwt.pdf</span>
            </div>
            <div className={styles.navItem}>
              <div className={styles.itemIcon}>
                <FileText size={16} />
              </div>
              <span className={styles.itemText}>graphql.pdf</span>
            </div>
            <div className={styles.navItem}>
              <div className={styles.itemIcon}>
                <FileText size={16} />
              </div>
              <span className={styles.itemText}>nodejs-security.pdf</span>
            </div>

            {/* Navigation Links */}
            <div className={styles.sectionTitle}>Dashboard</div>
            <Link href="/dashboard" passHref>
              <UnstyledButton
               w={"100%"}
                className={`${styles.navItem} ${
                  pathname === "/dashboard" ? styles.active : ""
                }`}
              >
                <div className={styles.itemIcon}>
                  <LayoutDashboard size={16} />
                </div>
                <span className={styles.itemText}>Overview</span>
              </UnstyledButton>
            </Link>

            <div className={styles.sectionTitle}>Settings</div>
            <div className={styles.navItem}>
              <div className={styles.itemIcon}>
                <Settings size={16} />
              </div>
              <span className={styles.itemText}>Settings</span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className={styles.userProfile}>
            <Avatar color="indigo" radius="xl">
              {userInitials}
            </Avatar>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
            <UnstyledButton
              onClick={() => logoutUser()}
              className={styles.logoutBtn}
              title="Logout"
              aria-label="Logout"
              disabled={loadingLogout}
            >
              <LogOut size={18} />
            </UnstyledButton>
          </div>
        </div>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
