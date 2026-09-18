import Link from "next/link";

export function Section({ title, eyebrow, href, children }: { title: string; eyebrow?: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="section-shell">
      <div className="section-heading">
        <div>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></div>
        {href && <Link href={href}>See all →</Link>}
      </div>
      {children}
    </section>
  );
}
