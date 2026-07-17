import { FullItem } from "@/components/items";
import { data } from "@/data";

const experiences = data.career().career;

export default async function Career() {
  return (
    <ol className="me-list gap-4">
      {experiences.map((item) => {
        return (
          <FullItem
            key={`career-item-${item.id}`}
            date={{ from: item.from, to: item.to }}
            location={item.location}
            heading={item.name}
            subheading={item.title}
            description={item.description}
          />
        );
      })}
    </ol>
  );
}
