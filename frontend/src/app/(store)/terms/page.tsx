import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, type PolicySection } from "@/components/policy/PolicyPage";
import { getStoreSettings } from "@/lib/api/settings";

export const metadata: Metadata = {
  title: "Suvarna7 — Terms & Conditions",
  description: "The terms for using suvarna7.com and buying Suvarna7 saffron, honey, ghee and dry fruits.",
};

export default async function TermsPage() {
  const { whatsapp_number, whatsapp_display } = await getStoreSettings();
  const wa = `https://wa.me/${whatsapp_number}`;

  const sections: PolicySection[] = [
    {
      id: "about",
      title: "About these terms",
      inShort: "By using suvarna7.com or placing an order, you agree to these terms.",
      body: (
        <>
          <p>
            suvarna7.com is run by Suvarna7 (&ldquo;we&rdquo;, &ldquo;us&rdquo;). We sell saffron, honey, ghee, almonds, walnut kernels
            and gift boxes sourced directly from farmers. These terms apply whenever you browse the site, create an account or buy from us.
          </p>
          <p>
            Our <Link href="/privacy">Privacy Policy</Link> and <Link href="/refund-policy">Refund, Return &amp; Cancellation Policy</Link>{" "}
            are part of these terms.
          </p>
        </>
      ),
    },
    {
      id: "account",
      title: "Your account",
      inShort: "Keep your login details private and your contact details correct — you're responsible for orders placed from your account.",
      body: (
        <ul>
          <li>You need an account, with your name and a working phone number, to place an order.</li>
          <li>Keep your password to yourself. Orders placed from your account are treated as yours.</li>
          <li>Give us correct contact and delivery details — we use them to deliver your order and reach you about it.</li>
          <li>We may suspend an account that is misused, for example for fraud or abusive behaviour.</li>
        </ul>
      ),
    },
    {
      id: "products",
      title: "Products and prices",
      inShort: "Prices include GST; natural products vary a little from batch to batch and from their photos.",
      body: (
        <ul>
          <li>All prices are in Indian Rupees and include GST. Delivery charges, if any, are shown before you pay.</li>
          <li>Prices and stock can change without notice. The price you pay is the one shown at checkout.</li>
          <li>
            Our products are natural. Colour, aroma, size and texture vary between harvests and batches; honey may crystallise and ghee may
            turn grainy. Photos show the product but can&rsquo;t match every batch exactly.
          </li>
          <li>If a price or description is shown wrongly by mistake, we may cancel the affected order and refund you in full.</li>
        </ul>
      ),
    },
    {
      id: "orders",
      title: "Orders and payment",
      inShort: "Pay online through Razorpay; your order is confirmed once the payment succeeds. We don't offer Cash on Delivery.",
      body: (
        <>
          <ul>
            <li>Payments are handled securely by Razorpay — UPI, debit and credit cards, net banking and wallets.</li>
            <li>We don&rsquo;t offer Cash on Delivery.</li>
            <li>
              Your items are reserved when you place the order, and the order is confirmed once payment succeeds. You&rsquo;ll see it under{" "}
              <Link href="/orders">My Orders</Link>, where you can also download the invoice.
            </li>
            <li>We may refuse or cancel an order we can&rsquo;t fulfil, or one that looks fraudulent. If it was paid, we refund it in full.</li>
          </ul>
        </>
      ),
    },
    {
      id: "delivery",
      title: "Delivery",
      inShort: "We deliver across India, usually in 2–4 days; delivery dates are estimates, not promises.",
      body: (
        <ul>
          <li>We ship across India through our courier partners. Check your pincode on any product page for an estimate.</li>
          <li>Delivery times are estimates. Weather, holidays and courier delays can make an order arrive later.</li>
          <li>
            If a parcel comes back to us because the address was wrong or nobody was available after the courier&rsquo;s attempts, we&rsquo;ll
            contact you to arrange delivery again.
          </li>
          <li>Please check your parcel when it arrives — damage claims must reach us within 36 hours of delivery.</li>
        </ul>
      ),
    },
    {
      id: "returns",
      title: "Returns, refunds and cancellations",
      inShort: "No refunds; sealed products can be returned within 36 hours for a replacement; paid orders can't be cancelled.",
      body: (
        <p>
          These are covered in full in our <Link href="/refund-policy">Refund, Return &amp; Cancellation Policy</Link>.
        </p>
      ),
    },
    {
      id: "health",
      title: "Health and allergies",
      inShort: "Our products are food, not medicine — check labels if you have allergies, and don't give honey to babies under one.",
      body: (
        <ul>
          <li>
            Health information on this site is general and for interest only. It isn&rsquo;t medical advice and our products aren&rsquo;t
            meant to diagnose, treat or cure any condition.
          </li>
          <li>Almonds and walnuts are tree nuts, and ghee is a dairy product. Please check before buying if you have allergies.</li>
          <li>Honey is not suitable for infants under 1 year old.</li>
          <li>Store products as described on the pack and product page.</li>
        </ul>
      ),
    },
    {
      id: "reviews",
      title: "Reviews and what you post",
      inShort: "Reviews must be honest and your own; we check every review before it appears.",
      body: (
        <ul>
          <li>Reviews appear only after our team approves them. Reviews from customers who bought the product carry a Verified Buyer badge.</li>
          <li>Don&rsquo;t post anything false, offensive, or that belongs to someone else. We may edit out personal details or decline a review.</li>
          <li>By posting a review you allow us to show it on our website and social media.</li>
        </ul>
      ),
    },
    {
      id: "use",
      title: "Using the website",
      inShort: "Use the site normally — no scraping, hacking or reselling our content.",
      body: (
        <>
          <p>Please don&rsquo;t try to break, overload or gain unauthorised access to the site, copy it automatically, or use it for anything unlawful.</p>
          <p>
            The Suvarna7 name, logo, photos and text belong to us. You may share links to our pages, but please don&rsquo;t copy our content
            or images for commercial use without asking.
          </p>
        </>
      ),
    },
    {
      id: "liability",
      title: "Our responsibility",
      inShort: "If something goes wrong with an order, the most we're responsible for is the value of that order.",
      body: (
        <p>
          We take care to describe and deliver our products correctly. To the extent the law allows, our responsibility for any order is
          limited to the amount you paid for it, and we aren&rsquo;t responsible for indirect losses or for delays caused by events outside our
          control. Nothing here takes away your rights under Indian consumer law.
        </p>
      ),
    },
    {
      id: "law",
      title: "Governing law and changes",
      inShort: "Indian law applies; if we change these terms, the new version will be on this page.",
      body: (
        <>
          <p>
            These terms are governed by the laws of India. We&rsquo;ll always try to resolve a problem with you directly first — please{" "}
            <a href={wa}>message us on WhatsApp at {whatsapp_display}</a>.
          </p>
          <p>We may update these terms from time to time. The date at the top shows the latest version; orders follow the terms in force when they were placed.</p>
        </>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Policies"
      title="Terms & Conditions"
      updated="8 October 2026"
      intro={
        <p>
          These terms explain how buying from Suvarna7 works — your account, prices, payment, delivery and what we each promise. We&rsquo;ve
          kept them short and in plain words.
        </p>
      }
      summary={[
        { label: "Payment", text: "Online through Razorpay — UPI, cards, net banking or wallets. No Cash on Delivery." },
        { label: "Prices", text: "In rupees, GST included. Natural products vary a little from batch to batch." },
        { label: "Delivery", text: "Across India, usually in 2–4 days." },
        { label: "Returns", text: "No refunds. Sealed products can be returned within 36 hours for a replacement." },
        { label: "Cancellation", text: "Unpaid orders any time. Paid orders can't be cancelled." },
      ]}
      sections={sections}
    />
  );
}
