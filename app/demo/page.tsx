import { redirect } from "next/navigation";

export default function DemoPage() {
  redirect("/creator?demo=1&account=demo#home");
}
