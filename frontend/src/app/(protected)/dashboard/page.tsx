"use client";

import React from "react";
import { Table, SimpleGrid } from "@mantine/core";
import styles from "./Dashboard.module.scss";

export default function DashboardPage() {
  const stats = [
    { label: "Total Chats", value: "24" },
    { label: "Active Documents", value: "18" },
    { label: "Avg. Accuracy", value: "92%" },
    { label: "Total Queries", value: "156" },
  ];

  const recentActivity = [
    { chat: "JWT Authentication", updated: "2 hours ago", status: "Completed", type: "ready" },
    { chat: "GraphQL Basics", updated: "5 hours ago", status: "Processing", type: "processing" },
    { chat: "NodeJS Security", updated: "Yesterday", status: "Completed", type: "ready" },
    { chat: "RAG Architecture", updated: "2 days ago", status: "Completed", type: "ready" },
  ];

  const topDocuments = [
    { document: "jwt.pdf", chats: 12, accuracy: "95%" },
    { document: "graphql.pdf", chats: 8, accuracy: "87%" },
    { document: "nodejs-security.pdf", chats: 6, accuracy: "91%" },
    { document: "rag-architecture.pdf", chats: 4, accuracy: "89%" },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.title}>Dashboard Overview</h1>
        <p className={styles.subtitle}>
          Analytics and insights for your document analysis
        </p>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" className={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div key={idx+stat.label} className={styles.statCard}>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Chat</Table.Th>
                <Table.Th>Last Updated</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentActivity.map((row, i) => (
                <Table.Tr key={i+'chat'}>
                  <Table.Td>{row.chat}</Table.Td>
                  <Table.Td>{row.updated}</Table.Td>
                  <Table.Td>
                    <span
                      className={`${styles.statusBadge} ${
                        row.type === "ready" ? styles.ready : styles.processing
                      }`}
                    >
                      {row.status}
                    </span>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Top Documents</h2>
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Document</Table.Th>
                <Table.Th>Chats</Table.Th>
                <Table.Th>Accuracy</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {topDocuments.map((row, i) => (
                <Table.Tr key={i+'doc'}>
                  <Table.Td>{row.document}</Table.Td>
                  <Table.Td>{row.chats}</Table.Td>
                  <Table.Td>{row.accuracy}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </SimpleGrid>
    </div>
  );
}