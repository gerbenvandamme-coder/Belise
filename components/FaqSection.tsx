import { FAQ } from '@/lib/faq';

/** Veelgestelde vragen als uitklapbare lijst. Werkt zonder JavaScript (details/summary). */
export default function FaqSection() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 lg:py-20" aria-labelledby="faq-titel">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
        Goed om te weten
      </p>
      <h2 id="faq-titel" className="mt-3 text-center font-serif text-3xl text-stone-900 sm:text-4xl">
        Veelgestelde <span className="italic text-accent">vragen</span>
      </h2>
      <div className="mt-10 divide-y divide-taupe/30 rounded-[1.75rem] bg-card px-6 ring-1 ring-taupe/25">
        {FAQ.map((item) => (
          <details key={item.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-stone-900 [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="text-accent transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-primary/75">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
