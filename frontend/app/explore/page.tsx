// The Explore route: /explore
// LinkedIn-style warm-gray canvas; the interactive view is a client component.

import ExploreView from "../../components/Explore/ExploreView";

export default function ExplorePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#F4F2EE" }}>
      <ExploreView />
    </main>
  );
}
