import { redirect } from "next/navigation";

type ContactRedirectProps = {
  params: Promise<{ locale: string }>;
};

export default async function ContactRedirectPage({ params }: ContactRedirectProps) {
  const { locale } = await params;
  redirect(`/${locale}#contact`);
}
