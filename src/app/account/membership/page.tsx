import MembershipBilling from "@/features/ascend/access/MembershipBilling";

export const metadata = {
  title: "ASCEND · Membership & Billing",
  description: "Subscription details, renewals, and cancellation controls.",
};

export default function MembershipPage() {
  return <MembershipBilling />;
}
