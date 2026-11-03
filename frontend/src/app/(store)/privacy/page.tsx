import type { Metadata } from "next";
import { PolicyPage, type PolicySection } from "@/components/policy/PolicyPage";
import { getStoreSettings } from "@/lib/api/settings";

export const metadata: Metadata = {
  title: "Suvarna7 — Privacy Policy",
  description: "What personal information Suvarna7 collects, why, who it's shared with, and how to ask us to change or delete it.",
};

export default async function PrivacyPage() {
  const { whatsapp_number, whatsapp_display } = await getStoreSettings();
  const wa = `https://wa.me/${whatsapp_number}`;

  const sections: PolicySection[] = [
    {
      id: "collect",
      title: "What we collect",
      inShort: "What we need to run your account and deliver your orders, plus how you use our store.",
      body: (
        <>
          <ul>
            <li>
              <strong>Account details:</strong> your name, phone number, email (if you give one) and password. Passwords are stored
              encrypted — we can&rsquo;t read them.
            </li>
            <li>
              <strong>Delivery addresses</strong> you save, including the name and phone number for each.
            </li>
            <li>
              <strong>Orders:</strong> what you bought, prices, delivery instructions, and payment status and reference from Razorpay.
            </li>
            <li>
              <strong>Things you add:</strong> your cart, wishlist and any reviews you write.
            </li>
            <li>
              <strong>Messages:</strong> anything you send us on WhatsApp or by phone.
            </li>
            <li>
              <strong>How you use our store:</strong> where your visit came from (such as Google, Instagram or Facebook), the pages and
              products you open, what you search for, add to your cart or buy, and your type of device and browser. If you&rsquo;re signed
              in, this is linked to your account.
            </li>
          </ul>
          <p>We don&rsquo;t collect your card number, UPI PIN or bank login. Those go straight to Razorpay.</p>
        </>
      ),
    },
    {
      id: "use",
      title: "How we use it",
      inShort: "To process and deliver your orders, keep you updated, and help you when you contact us.",
      body: (
        <ul>
          <li>To create your account and keep you signed in.</li>
          <li>To take payment, pack and ship your order, and give you tracking updates and invoices.</li>
          <li>To answer your questions and handle returns or replacements.</li>
          <li>To show approved reviews with your first name.</li>
          <li>To understand how shoppers use our store, improve it, and measure and improve our advertising.</li>
          <li>To keep the site secure and prevent fraud.</li>
        </ul>
      ),
    },
    {
      id: "share",
      title: "Who we share it with",
      inShort: "With the companies that make your order happen, and with Meta to measure our ads — never sold, never rented.",
      body: (
        <>
          <ul>
            <li>
              <strong>Razorpay</strong> — to process your payment. Razorpay follows its own privacy policy and RBI rules.
            </li>
            <li>
              <strong>Our courier partners</strong> (such as Ekart) — your name, phone number and delivery address, to deliver your parcel.
            </li>
            <li>
              <strong>WhatsApp (Meta)</strong> — when you message us, and to send your order details and invoice to our own business number.
            </li>
            <li>
              <strong>Meta (Facebook and Instagram)</strong> — we use the Meta Pixel, which tells Meta the pages and products you view, what
              you add to your cart and buy, along with your browser details and IP address, so we can measure and improve our ads. Meta
              handles this under its own privacy policy.
            </li>
            <li>
              <strong>Hosting providers</strong> who store our website and database securely.
            </li>
            <li>Government or legal authorities, only when the law requires it.</li>
          </ul>
          <p>We never sell or rent your personal information.</p>
        </>
      ),
    },
    {
      id: "storage",
      title: "Cookies and your browser",
      inShort: "Your browser keeps your sign-in and a visitor ID, and Meta's Pixel sets advertising cookies.",
      body: (
        <>
          <p>
            The site saves a sign-in token and your name in your browser so you stay signed in. Your cart is kept with your account on our
            server, so it follows you across devices.
          </p>
          <p>
            We also save a random visitor ID in your browser so we can tell one visit from another, and the Meta Pixel sets its own cookies
            to measure our ads. You can clear all of these any time from your browser settings; you&rsquo;ll just be signed out.
          </p>
        </>
      ),
    },
    {
      id: "keep",
      title: "How long we keep it",
      inShort: "While your account is open, and order records for as long as tax law requires.",
      body: (
        <p>
          We keep your account details while your account is active. Order and invoice records are kept for as long as Indian tax and
          accounting laws require (usually up to 8 years), even if you close your account. Records of how you used our store are deleted
          after 90 days.
        </p>
      ),
    },
    {
      id: "rights",
      title: "Your choices",
      inShort: "You can see, correct or delete your details — just ask.",
      body: (
        <>
          <ul>
            <li>Update your saved addresses any time from My Addresses.</li>
            <li>Ask us for a copy of the information we hold about you, or to correct it.</li>
            <li>Ask us to close your account and delete your personal details, apart from records we must keep by law.</li>
          </ul>
          <p>
            To do any of this, <a href={wa}>message us on WhatsApp at {whatsapp_display}</a> from the phone number on your account. We reply
            within 7 working days.
          </p>
        </>
      ),
    },
    {
      id: "security",
      title: "Keeping it safe",
      inShort: "Your data travels encrypted and only our team can see it.",
      body: (
        <p>
          The website uses HTTPS, passwords are stored encrypted, and only authorised team members can open order and customer details. No
          system is perfectly secure, so please use a strong password and keep it private.
        </p>
      ),
    },
    {
      id: "children",
      title: "Children",
      inShort: "Accounts are for adults.",
      body: <p>You need to be 18 or older to create an account and buy from us. We don&rsquo;t knowingly collect information from children.</p>,
    },
    {
      id: "changes",
      title: "Changes and contact",
      inShort: "If this policy changes, the new version will be on this page.",
      body: (
        <p>
          We may update this policy as our services change; the date at the top shows the latest version. For any privacy question or
          complaint, <a href={wa}>contact us on WhatsApp at {whatsapp_display}</a>.
        </p>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Policies"
      title="Privacy Policy"
      updated="3 November 2026"
      intro={
        <p>
          Your trust matters as much as the quality of what we sell. Here&rsquo;s exactly what information we collect when you shop with
          Suvarna7, why we need it, and who else sees it.
        </p>
      }
      summary={[
        { label: "What we collect", text: "Name, phone, email, delivery addresses and your orders — nothing more." },
        { label: "Payments", text: "Handled by Razorpay. We never see or store card, UPI or bank details." },
        { label: "Shared with", text: "Razorpay, our courier partners and WhatsApp, only to complete your order. Never sold." },
        { label: "Your choices", text: "Ask us any time to see, correct or delete your information." },
      ]}
      sections={sections}
    />
  );
}
