import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, type PolicySection } from "@/components/policy/PolicyPage";
import { getStoreSettings } from "@/lib/api/settings";

export const metadata: Metadata = {
  title: "Suvarna7 — Refund, Return & Cancellation Policy",
  description:
    "Suvarna7 does not offer refunds. Sealed, unopened products can be returned within 36 hours of delivery for a replacement, and damaged or wrong items are replaced. Paid orders cannot be cancelled.",
};

export default async function RefundPolicyPage() {
  const { whatsapp_number, whatsapp_display } = await getStoreSettings();
  const wa = `https://wa.me/${whatsapp_number}`;

  const sections: PolicySection[] = [
    {
      id: "no-refunds",
      title: "We don't offer refunds",
      inShort: "Once an order is paid, the money isn't returned — but you're covered by a replacement when something is wrong.",
      body: (
        <>
          <p>
            Saffron, honey, ghee and dry fruits are food. Once a pack has left us we can&rsquo;t know how it was stored or handled, so we
            can&rsquo;t resell it safely. That&rsquo;s why we don&rsquo;t give money back for delivered orders.
          </p>
          <p>
            Instead, we replace products that qualify under this policy. The only time we refund is when <strong>we</strong> cancel a paid
            order ourselves (see &ldquo;If we cancel your order&rdquo; below) or when a payment fails.
          </p>
        </>
      ),
    },
    {
      id: "returns",
      title: "Returning a sealed product",
      inShort: "Unopened, still-sealed products can be returned within 36 hours of delivery, and we'll send you a replacement.",
      body: (
        <>
          <p>You can return a product for a replacement or exchange when <strong>all</strong> of these are true:</p>
          <ul>
            <li>
              You contact us within <strong>36 hours of delivery</strong>, counted from the delivery time recorded by our courier partner.
            </li>
            <li>The packaging is unopened — the seal, lid and pouch are intact and the product hasn&rsquo;t been used.</li>
            <li>It&rsquo;s in its original box or pouch, with any labels still on.</li>
          </ul>
          <p>
            You can have the same product again, or exchange it for another product of the same value. Once we receive the sealed product
            and check it, we ship the replacement.
          </p>
        </>
      ),
    },
    {
      id: "damaged",
      title: "Damaged, wrong or missing items",
      inShort: "If something arrives broken, leaking, wrong or missing, tell us within 36 hours with photos and we'll replace it.",
      body: (
        <>
          <p>We replace an item free of charge if, when it reaches you:</p>
          <ul>
            <li>the jar, pouch or box is broken, leaking or torn, or the seal looks tampered with;</li>
            <li>you received a different product or pack size from the one you ordered;</li>
            <li>an item from your order is missing;</li>
            <li>the product is spoiled or has a clear quality defect.</li>
          </ul>
          <p>
            Send us clear photos of the product, the outer box and the shipping label within 36 hours of delivery. An unboxing video makes
            the check much faster. If the outer box looks badly damaged when the courier hands it over, please note it with the courier or
            refuse the parcel, and let us know.
          </p>
        </>
      ),
    },
    {
      id: "not-covered",
      title: "What can't be returned",
      inShort: "Opened products, requests after 36 hours and the natural look of pure food are not covered.",
      body: (
        <ul>
          <li>Any request made more than 36 hours after delivery.</li>
          <li>Products that have been opened, used or partly consumed, unless they arrived damaged or defective.</li>
          <li>Products stored incorrectly after delivery, or no longer in their original packaging.</li>
          <li>
            Natural variation in colour, aroma, texture, crystallisation of honey or the grain of ghee. These are signs of a pure product,
            not a defect.
          </li>
          <li>Damage or wrong-item claims without photos.</li>
        </ul>
      ),
    },
    {
      id: "how-to",
      title: "How to ask for a return or replacement",
      inShort: `Message us on WhatsApp at ${whatsapp_display} with your order number and photos — we reply within 24–48 hours.`,
      body: (
        <>
          <ol>
            <li>
              Within 36 hours of delivery, message us on <a href={wa}>WhatsApp at {whatsapp_display}</a> with your order number (it starts
              with ORD-) and what you&rsquo;d like to return or what went wrong.
            </li>
            <li>Attach photos of the product, the packaging and the shipping label — and the unboxing video if you have one.</li>
            <li>We check your request and reply within 24–48 hours with the next steps, including how to send a sealed product back.</li>
            <li>Once approved (and, for sealed returns, once we receive the product), we ship your replacement.</li>
          </ol>
          <p>
            If the product you want is out of stock, we&rsquo;ll offer another product of the same value. Each order can be returned or
            replaced once. Suvarna7 makes the final decision on whether a request qualifies.
          </p>
        </>
      ),
    },
    {
      id: "cancellation",
      title: "Cancelling an order",
      inShort: "An unpaid order can be cancelled any time; once you've paid, the order can't be cancelled.",
      body: (
        <>
          <p>
            <strong>Not paid yet?</strong> Cancel it yourself from <Link href="/orders">My Orders</Link> at any time. The items go back on
            sale and nothing is charged.
          </p>
          <p>
            <strong>Already paid?</strong> Paid orders can&rsquo;t be cancelled — we start packing them right away. If something goes wrong
            after delivery, the return and replacement rules above apply.
          </p>
        </>
      ),
    },
    {
      id: "we-cancel",
      title: "If we cancel your order",
      inShort: "If we ever have to cancel a paid order ourselves, you get every rupee back.",
      body: (
        <p>
          Rarely, we may have to cancel a paid order — for example if an item runs out, a price was shown wrongly, or our courier can&rsquo;t
          deliver to your pincode. We&rsquo;ll tell you, and refund the full amount to your original payment method. Banks usually show it
          within 5–7 working days.
        </p>
      ),
    },
    {
      id: "payment-issues",
      title: "Money deducted but no order confirmation",
      inShort: "Don't pay twice — we check with Razorpay and either confirm your order or the bank returns the money.",
      body: (
        <>
          <p>
            Sometimes, especially when paying by UPI in another app, money leaves your account but the website doesn&rsquo;t show the order
            as confirmed. Please don&rsquo;t pay again. Open the order from <Link href="/orders">My Orders</Link> — it checks the payment
            with Razorpay and confirms the order if it went through.
          </p>
          <p>
            If the payment failed, Razorpay and your bank return the money to your account automatically, usually within 5–7 working days.
            Still stuck? <a href={wa}>Message us on WhatsApp</a> with your order number and the UPI or bank reference.
          </p>
        </>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Policies"
      title="Refund, Return & Cancellation Policy"
      updated="8 October 2026"
      intro={
        <p>
          We want every jar and pouch to reach you exactly as it left our farms. This page explains, in plain words, what happens if
          something is wrong with your order, when you can return a product, and when an order can be cancelled.
        </p>
      }
      summary={[
        { label: "Refunds", text: "Not offered on orders." },
        { label: "Returns", text: "Sealed, unopened products — within 36 hours of delivery, for a replacement or exchange." },
        { label: "Damaged or wrong", text: "Replaced free if you tell us within 36 hours, with photos." },
        { label: "Cancellation", text: "Unpaid orders any time. Paid orders can't be cancelled." },
        { label: "How to ask", text: "WhatsApp us with your order number — we reply within 24–48 hours." },
      ]}
      sections={sections}
    />
  );
}
