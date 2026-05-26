"use client";

import React from "react";

export type PdfColumn = {
  key: string;
  label: string;
  width: number;
};

export type PdfExportOptions = {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  data: Record<string, unknown>[];
  filename: string;
};

export async function exportToPdf(options: PdfExportOptions): Promise<void> {
  const { pdf, Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");

  const styles = StyleSheet.create({
    page: {
      padding: 32,
      fontFamily: "Helvetica",
      fontSize: 9,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: "#0E4A8A",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 10,
      color: "#888888",
      marginBottom: 4,
    },
    date: {
      fontSize: 9,
      color: "#aaaaaa",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#0E4A8A",
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      color: "#ffffff",
      fontFamily: "Helvetica-Bold",
      fontSize: 8,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#eeeeee",
      paddingVertical: 5,
      paddingHorizontal: 8,
    },
    tableRowAlt: {
      backgroundColor: "#f9f9f9",
    },
    tableCell: {
      color: "#333333",
      fontSize: 8,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 32,
      right: 32,
      textAlign: "center",
      fontSize: 8,
      color: "#bbbbbb",
    },
  });

  const MyDoc = () => (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.header}>
          <Text style={styles.title}>{options.title}</Text>
          {options.subtitle ? <Text style={styles.subtitle}>{options.subtitle}</Text> : null}
          <Text style={styles.date}>
            Exporté le {new Date().toLocaleDateString("fr-FR")} • RemPres ERP
          </Text>
        </View>

        <View style={styles.tableHeader}>
          {options.columns.map((col) => (
            <Text key={col.key} style={[styles.tableHeaderCell, { width: col.width }]}>
              {col.label}
            </Text>
          ))}
        </View>

        {options.data.map((row, i) => (
          <View
            key={`row-${i}`}
            style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
          >
            {options.columns.map((col) => (
              <Text key={col.key} style={[styles.tableCell, { width: col.width }]}>
                {String(row[col.key] ?? "—")}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.footer}>
          RemPres ERP • {options.filename} • Page 1
        </Text>
      </Page>
    </Document>
  );

  const blob = await pdf(<MyDoc />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${options.filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
