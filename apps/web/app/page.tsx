import { redirect } from "next/navigation";

// Kök URL → landing page (marketing group route)
export default function RootPage() {
  redirect("/home");
}
