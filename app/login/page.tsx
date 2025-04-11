import { LoginForm } from "@/components/loginForm";
import { ThemeToggle } from "@/components/themeToggle";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Menadżer Domen</h1>
          <p className="text-muted-foreground mt-2">
            Zaloguj się aby zarządzać domenami
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
