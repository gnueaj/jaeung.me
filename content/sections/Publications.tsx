import { PublicationItem } from "@/components/items";
import { data } from "@/data";

const publications = data.publications().publications;

export default async function Publications() {
  return (
    <ol className="me-list gap-4">
      {publications.map((item) => {
        return <PublicationItem key={`pubitem-${item.id}`} {...item} />;
      })}
    </ol>
  );
}
