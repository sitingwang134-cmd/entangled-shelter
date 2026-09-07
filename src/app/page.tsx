import { redirect } from "next/navigation";

const mirrorUrl = "/editions/winter2026";

export default function Home() {
  redirect(mirrorUrl);
}
