/**
 * Renders one or more JSON-LD structured-data blocks.
 * Server-safe; emits a <script type="application/ld+json"> per object.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Structured data is trusted, server-generated content.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
