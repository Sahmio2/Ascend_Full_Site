import PaymentReturn from "@/features/ascend/access/PaymentReturn";

export const metadata = {
  title: "ASCEND · Confirm membership payment",
};

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { reference, trxref } = await searchParams;
  const value = typeof reference === "string" ? reference : trxref;
  return <PaymentReturn reference={typeof value === "string" ? value : undefined} />;
}
