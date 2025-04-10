import { DomainManager } from "@/components/domain-manager";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <img src="gfcorp.png" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Zarządzanie domenami</h1>
        <ThemeToggle />
      </div>
      <DomainManager />
    </main>
  );
}
