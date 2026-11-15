/** Gestructureerde gegevens (schema.org) voor zoekmachines en AI-assistenten. Onzichtbaar op de pagina. */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify ontsnapt geen '<'; zo kan inhoud nooit uit de script-tag breken.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
