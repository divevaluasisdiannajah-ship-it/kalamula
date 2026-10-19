import { redirect } from "next/navigation";

export const runtime = "edge";

export default function RubricIndexPage() {
  redirect("/reports/rubric/1");
}
