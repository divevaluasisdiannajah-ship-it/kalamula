import { redirect } from "next/navigation";

export const runtime = "edge";

export default function GuideRedirectPage() {
  redirect("/reports/rubric/guide");
}
