import HomePageClient from "@/components/HomePageClient";
import { getInitialSaloons } from "@/lib/getInitialSaloons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialSaloons = await getInitialSaloons();
  return <HomePageClient initialSaloons={initialSaloons} />;
}
