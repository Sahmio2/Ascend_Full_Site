import ClientLoginForm from "@/features/ascend/access/ClientLoginForm";

export const metadata = {
  title: "ASCEND · Client Login",
  description: "Sign in to your private ASCEND coaching account.",
};

export default function LoginPage() {
  return <ClientLoginForm />;
}
