export const metadata = {
  title: "Career Map — Comparison",
  description: "See how you fit a role and what to build next.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f1f5f9" }}>{children}</body>
    </html>
  );
}
